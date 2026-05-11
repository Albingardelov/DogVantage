import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import {
  getAllCustomExercises,
  createCustomExercise,
  toggleCustomExercise,
  deleteCustomExercise,
} from '@/lib/supabase/custom-exercises'
import { getGeminiTextModel, jsonGenConfig } from '@/lib/ai/client'
import { aiErrorResponse } from '@/lib/ai/errors'
import { slugify, randomSuffix } from '@/lib/utils/slugify'
import type { ExerciseSpec } from '@/lib/training/exercise-specs'

function validateCustomExerciseSpec(raw: unknown): (Omit<ExerciseSpec, 'exerciseId'> & { label: string }) | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.label !== 'string' || !r.label.trim()) return null
  if (typeof r.definition !== 'string' || !r.definition.trim()) return null
  if (!Array.isArray(r.ladder) || r.ladder.length < 2) return null
  if (!Array.isArray(r.troubleshooting) || r.troubleshooting.length < 1) return null
  if (!r.guide || typeof r.guide !== 'object') return null
  const g = r.guide as Record<string, unknown>
  if (!Array.isArray(g.setup) || !Array.isArray(g.steps) || !Array.isArray(g.logging) || !Array.isArray(g.commonMistakes) || !Array.isArray(g.stopRules)) return null
  return raw as Omit<ExerciseSpec, 'exerciseId'> & { label: string }
}

const SYSTEM_PROMPT = `Du är en hundträningsinstruktör. Generera ett JSON-objekt för en träningsövning. Svara ENBART med giltig JSON.

Fält:
- label: 2–3 ord på svenska
- definition: EN mening — vad räknas som en lyckad rep, konkret och mätbart
- ladder: 2–4 nivåer [{id:snake_case, label, criteria}], sorterat enklast→svårast; id = snake_case utan mellanslag
- troubleshooting: 3 råd på svenska (array av strängar), konkreta åtgärder om det kör ihop sig
- guide: objekt med exakt dessa fält (alla arrays, minst 3 poster vardera):
  - setup: praktiska förberedelser innan passet startar (3–4 punkter)
  - steps: numrerade steg-för-steg-instruktioner för föraren (4–5 punkter, exakt timing/teknik)
  - logging: hur man loggar i appen — förklara Lyckad, Miss och Latens (3 punkter)
  - commonMistakes: vanliga handlermisstag och hur man undviker dem (3–4 punkter)
  - stopRules: tydliga stopp-kriterier med konkreta trösklar, t.ex. "Tre miss i rad → ..." (1–2 punkter)

Exempel på rätt detaljnivå (guide.steps):
["Be om sitt. Vänta 1s. Ge 'fri' med glad ton → uppmuntra att hunden rör sig.",
 "Be om ligg. Vänta 3s. Ge 'fri' → belöna friheten.",
 "Öka väntetiden gradvis: 1s → 3s → 5s → 10s → 30s.",
 "Variera varaktigheten inom passet — ibland kort, ibland lång."]

Regler: allt på svenska · konkret och praktiskt, inte vagt · för fysiskt krävande övningar: lägg ålders-/hälsovarning i stopRules`

async function assertDogOwnership(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  dogId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('dog_profiles')
    .select('id')
    .eq('id', dogId)
    .eq('user_id', userId)
    .single()
  return Boolean(data)
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const dogId = req.nextUrl.searchParams.get('dogId')
    if (!dogId) return NextResponse.json({ error: 'dogId required' }, { status: 400 })
    if (!(await assertDogOwnership(supabase, dogId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const exercises = await getAllCustomExercises(dogId)
    return NextResponse.json(exercises)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

    const body = await req.json() as { prompt?: unknown; dogId?: unknown }
    const prompt = body.prompt
    const dogId = body.dogId
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 })
    }
    if (prompt.length > 300) {
      return NextResponse.json({ error: 'prompt max 300 chars' }, { status: 400 })
    }
    if (typeof dogId !== 'string' || !dogId) {
      return NextResponse.json({ error: 'dogId required' }, { status: 400 })
    }
    if (!(await assertDogOwnership(supabase, dogId, user.id))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const aiResult = await getGeminiTextModel().generateContent({
      contents: [{ role: 'user', parts: [{ text: `Skapa en träningsövningsspec för: ${prompt}` }] }],
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: jsonGenConfig(0.4, 4096),
    })

    const rawText = aiResult.response.text()
    if (!rawText?.trim()) {
      console.error('[POST /api/training/custom] empty AI response')
      return NextResponse.json({ error: 'AI gav inget svar. Försök igen.' }, { status: 422 })
    }
    // Strip markdown code fences if model wraps response despite responseMimeType
    const raw = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      console.error('[POST /api/training/custom] invalid JSON:', raw.slice(0, 200))
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 422 })
    }

    const validated = validateCustomExerciseSpec(parsed)
    if (!validated) {
      return NextResponse.json({ error: 'AI response missing required fields' }, { status: 422 })
    }

    const exerciseId = `custom_${slugify(validated.label)}_${randomSuffix()}`
    const spec: ExerciseSpec = { ...validated, exerciseId }

    const exercise = await createCustomExercise(user.id, dogId, exerciseId, validated.label, prompt.trim(), spec)
    return NextResponse.json(exercise, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/training/custom]', message)
    return aiErrorResponse(message) ?? NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { id?: unknown; active?: unknown }
    if (typeof body.id !== 'string' || typeof body.active !== 'boolean') {
      return NextResponse.json({ error: 'id and active required' }, { status: 400 })
    }
    await toggleCustomExercise(body.id, body.active)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as { id?: unknown }
    if (typeof body.id !== 'string') {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }
    await deleteCustomExercise(body.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
