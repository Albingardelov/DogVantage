import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withAuthAndDog } from '@/lib/api/with-auth'
import { apiError } from '@/lib/api/errors'
import { getSubscriptionState, hasFeature } from '@/lib/billing/subscription'
import {
  getAllCustomExercises,
  createCustomExercise,
  toggleCustomExercise,
  deleteCustomExercise,
} from '@/lib/supabase/custom-exercises'
import { getGeminiTextModel, jsonGenConfig } from '@/lib/ai/client'
import { aiErrorResponse } from '@/lib/ai/errors'
import { slugify, randomSuffix } from '@/lib/utils/slugify'
import type {
  ExerciseSpec,
  GuideStep,
  GuideVariant,
  HandlerGuide,
} from '@/lib/training/exercise-specs'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isStringArray(value: unknown, minLength = 1): value is string[] {
  if (!Array.isArray(value) || value.length < minLength) return false
  return value.every((item) => isNonEmptyString(item))
}

function validateGuideStep(value: unknown): value is GuideStep {
  if (!value || typeof value !== 'object') return false
  const step = value as Record<string, unknown>
  return isNonEmptyString(step.how) && isNonEmptyString(step.why)
}

function validateGuideVariant(value: unknown): value is GuideVariant {
  if (!value || typeof value !== 'object') return false
  const variant = value as Record<string, unknown>
  return (
    isNonEmptyString(variant.id) &&
    isNonEmptyString(variant.label) &&
    isNonEmptyString(variant.whenToUse) &&
    isStringArray(variant.how) &&
    isNonEmptyString(variant.why)
  )
}

function validateHandlerGuide(value: unknown): value is HandlerGuide {
  if (!value || typeof value !== 'object') return false
  const guide = value as Record<string, unknown>
  if (!isNonEmptyString(guide.todaySummary)) return false
  if (!isStringArray(guide.setup)) return false
  if (!Array.isArray(guide.steps) || guide.steps.length < 3) return false
  if (!guide.steps.every(validateGuideStep)) return false
  if (!isNonEmptyString(guide.successLooksLike)) return false
  if (!isStringArray(guide.whenItFails)) return false
  if (!isStringArray(guide.wrapUp)) return false
  if (guide.variants !== undefined) {
    if (!Array.isArray(guide.variants) || guide.variants.length === 0 || guide.variants.length > 2) {
      return false
    }
    if (!guide.variants.every(validateGuideVariant)) return false
  }
  return true
}

function validateCustomExerciseSpec(raw: unknown): (Omit<ExerciseSpec, 'exerciseId'> & { label: string }) | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (!isNonEmptyString(r.label)) return null
  if (!isNonEmptyString(r.definition)) return null
  if (!Array.isArray(r.ladder) || r.ladder.length < 2) return null
  if (!isStringArray(r.troubleshooting)) return null
  if (!validateHandlerGuide(r.guide)) return null
  return raw as Omit<ExerciseSpec, 'exerciseId'> & { label: string }
}

const SYSTEM_PROMPT = `Du är en hundträningsinstruktör. Generera ett JSON-objekt för en träningsövning. Svara ENBART med giltig JSON.

Fält:
- label: 2–3 ord på svenska
- definition: EN mening — vad räknas som en lyckad rep, konkret och mätbart
- ladder: 2–4 nivåer [{id:snake_case, label, criteria}], sorterat enklast→svårast; id = snake_case utan mellanslag
- troubleshooting: 3 råd på svenska (array av strängar), konkreta åtgärder om det kör ihop sig
- guide: objekt med exakt dessa fält:
  - todaySummary: EN mening som börjar med "Idag …" — vad ni tränar och varför det är värt det idag
  - setup: praktiska förberedelser innan passet startar (2–4 punkter)
  - steps: 3–5 objekt {how, why} — how = imperativ instruktion (kropp/röst/belöning synlig), why = EN mening om nyttan för ägaren
  - successLooksLike: EN mening — så ser en lyckad rep ut i praktiken
  - whenItFails: 1–3 konkreta åtgärder om det kör ihop sig (array av strängar)
  - wrapUp: 1–2 punkter om när och hur man avslutar passet (array av strängar)
  - variants (valfritt, max 2): [{id: snake_case, label, whenToUse, how: string[], why}] — alternativa grepp när standardmetoden inte biter

Exempel på rätt detaljnivå (guide.steps):
[
  {
    "how": "Stå några steg ifrån. Säg namnet en gång. När hunden tittar: säg signalen och backa två steg med glad kropp.",
    "why": "När du rör dig bakåt blir du mer intressant än det hunden höll på med."
  },
  {
    "how": "Belöna i samma ögonblick hunden vänder mot dig, och igen när nosen når dig.",
    "why": "Dubbel belöning lär att vända mot dig ger jackpot."
  },
  {
    "how": "Ge fri och låt hunden gå ifrån dig igen i några sekunder.",
    "why": "Annars lär sig hunden att signalen betyder att det roliga tar slut."
  }
]

Regler: allt på svenska · konkret och praktiskt, inte vagt · för fysiskt krävande övningar: lägg ålders-/hälsovarning i wrapUp`

export async function GET(req: NextRequest) {
  try {
    return withAuthAndDog(req, async ({ user, dog }) => {
      const subscription = await getSubscriptionState(user.id)
      if (!hasFeature(subscription, 'custom_exercises')) {
        return NextResponse.json({ error: 'payment_required', feature: 'custom_exercises' }, { status: 402 })
      }
      const exercises = await getAllCustomExercises(dog.id)
      return NextResponse.json(exercises)
    })
  } catch (err) {
    return apiError(err, 'failed_to_load_custom_exercises')
  }
}

export async function POST(req: NextRequest) {
  try {
    return withAuthAndDog(req, async ({ user, dog }) => {
      const subscription = await getSubscriptionState(user.id)
      if (!hasFeature(subscription, 'custom_exercises')) {
        return NextResponse.json({ error: 'payment_required', feature: 'custom_exercises' }, { status: 402 })
      }
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
        generationConfig: jsonGenConfig(0.4, 4096),
      })

      const rawText = aiResult.response.text()
      if (!rawText?.trim()) {
        console.error('[POST /api/training/custom] empty AI response')
        return NextResponse.json({ error: 'AI gav inget svar. Försök igen.' }, { status: 422 })
      }
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

      const exercise = await createCustomExercise(user.id, dog.id, exerciseId, validated.label, prompt.trim(), spec)
      return NextResponse.json(exercise, { status: 201 })
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/training/custom]', message)
    return aiErrorResponse(message) ?? apiError(err, 'failed_to_create_custom_exercise')
  }
}

export async function PATCH(req: NextRequest) {
  try {
    return withAuth(req, async ({ user }) => {
      const subscription = await getSubscriptionState(user.id)
      if (!hasFeature(subscription, 'custom_exercises')) {
        return NextResponse.json({ error: 'payment_required', feature: 'custom_exercises' }, { status: 402 })
      }
      const body = await req.json() as { id?: unknown; active?: unknown }
      if (typeof body.id !== 'string' || typeof body.active !== 'boolean') {
        return NextResponse.json({ error: 'id and active required' }, { status: 400 })
      }
      await toggleCustomExercise(body.id, body.active)
      return NextResponse.json({ ok: true })
    })
  } catch (err) {
    return apiError(err, 'failed_to_update_custom_exercise')
  }
}

export async function DELETE(req: NextRequest) {
  try {
    return withAuth(req, async ({ user }) => {
      const subscription = await getSubscriptionState(user.id)
      if (!hasFeature(subscription, 'custom_exercises')) {
        return NextResponse.json({ error: 'payment_required', feature: 'custom_exercises' }, { status: 402 })
      }
      const body = await req.json() as { id?: unknown }
      if (typeof body.id !== 'string') {
        return NextResponse.json({ error: 'id required' }, { status: 400 })
      }
      await deleteCustomExercise(body.id)
      return NextResponse.json({ ok: true })
    })
  } catch (err) {
    return apiError(err, 'failed_to_delete_custom_exercise')
  }
}
