import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import {
  getAllCustomExercises,
  createCustomExercise,
  toggleCustomExercise,
  deleteCustomExercise,
} from '@/lib/supabase/custom-exercises'
import { getGeminiTextModel } from '@/lib/ai/client'
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

Fält: label (2–3 ord, svenska) · definition (en mening: vad är en lyckad rep) · ladder (2–4 nivåer [{id:snake_case, label, criteria}], enklast→svårast) · troubleshooting (2–3 råd, array av strängar) · guide{setup[],steps[],logging[],commonMistakes[],stopRules[]}

Regler: allt på svenska · id i ladder: snake_case · för fysiskt krävande övningar: lägg ålders-/hälsovarning i stopRules`

export async function GET() {
  try {
    const exercises = await getAllCustomExercises()
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

    const body = await req.json() as { prompt?: unknown }
    const prompt = body.prompt
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 })
    }
    if (prompt.length > 300) {
      return NextResponse.json({ error: 'prompt max 300 chars' }, { status: 400 })
    }

    const aiResult = await getGeminiTextModel().generateContent({
      contents: [{ role: 'user', parts: [{ text: `Skapa en träningsövningsspec för: ${prompt}` }] }],
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1200,
        responseMimeType: 'application/json',
      },
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

    const exercise = await createCustomExercise(user.id, exerciseId, validated.label, prompt.trim(), spec)
    return NextResponse.json(exercise, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('rate_limit') || message.includes('429') || message.includes('quota')) {
      return NextResponse.json({ error: 'AI-tjänsten är tillfälligt otillgänglig. Försök igen om en stund.' }, { status: 429 })
    }
    console.error('[POST /api/training/custom]', message)
    return NextResponse.json({ error: message }, { status: 500 })
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
