import { AI_TIMEOUTS, getGroqClient, GROQ_MODEL } from './client'
import type { TrainingSourceRef, WeekPlan } from '@/types'
import { buildWeekPromptParts } from './week-plan-prompt'
import type { WeekPlanInput } from '@/lib/training/week-context'
import { buildDeterministicWeekPlan } from '@/lib/training/deterministic-week-planner'
import { validateWeekPlan } from '@/lib/training/week-plan-validator'
import { getExerciseDocContext } from './doc-learning'
import { exerciseLabel } from '@/lib/training/exercise-label'
import { getLifeStage } from '@/lib/dog/age'
import { trackTelemetry } from '@/lib/telemetry'

// Bump this when plan generation logic changes significantly — forces cache invalidation
export const PLAN_VERSION = 'v10'

export { parseWeekPlan } from './week-plan-parse'

export async function generateWeekPlan(input: WeekPlanInput): Promise<WeekPlan> {
  const deterministic = buildDeterministicWeekPlan(input)
  const fallbackPlan = deterministic.plan

  const { breed } = input

  // Per-exercise document grounding: retrieve topic- and life-stage-filtered
  // chunks for each exercise the deterministic planner actually scheduled.
  // Replaces the old generic 3-chunk query — better targeted, similarity-gated,
  // and clinical/behaviour-emergency topics are excluded (see getExerciseDocContext).
  // Each lookup is globally cached, so this is cheap once warm.
  const lifeStage = getLifeStage(input.ageWeeks)
  const uniqueExerciseIds = [
    ...new Set(fallbackPlan.days.flatMap((day) => day.exercises?.map((ex) => ex.id) ?? [])),
  ]
  const docContexts = await Promise.all(
    uniqueExerciseIds.map(async (id) => ({
      id,
      doc: await getExerciseDocContext(breed, id, lifeStage),
    })),
  )
  const sourcesByExercise = new Map<string, TrainingSourceRef[]>()
  const contextBlocks: string[] = []
  for (const { id, doc } of docContexts) {
    if (doc.sources.length > 0) sourcesByExercise.set(id, doc.sources)
    if (doc.context) contextBlocks.push(`# ${exerciseLabel(id)}\n${doc.context}`)
  }
  const documentContext = contextBlocks.join('\n\n')
  const { systemPrompt } = buildWeekPromptParts({
    ...input,
    documentContext,
  })

  let raw = '{}'
  try {
    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: [
            systemPrompt,
            '',
            'Du får nu en FÄRDIG deterministisk plan. Du får ENDAST förbättra "desc"-texterna.',
            'Du får aldrig ändra id, day, rest, antal övningar eller lägga till/ta bort övningar.',
            'Behåll reps oförändrat.',
            'Returnera JSON i formatet {"descriptions":[{"day":"Måndag","id":"inkallning","desc":"..."}]}',
            'Desc ska vara kort svenska, konkret och förenlig med progression/säkerhetsregler.',
            'Behåll riktningen: börjar desc med "Lättare", "Höj" eller "Håll", behåll den innebörden.',
            'Använd KÄLLDOKUMENT för konkreta detaljer när de matchar övningen.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: `Deterministisk plan (ändra ENDAST desc):\n${JSON.stringify(fallbackPlan)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    }, { timeout: AI_TIMEOUTS.weekPlan })

    const usage = completion.usage
    if (usage) {
      console.log(`[groq:week-plan] tokens in=${usage.prompt_tokens} out=${usage.completion_tokens} total=${usage.total_tokens} breed=${input.breed} week=${input.trainingWeek}`)
    }
    raw = completion.choices[0]?.message?.content ?? '{}'
  } catch (err) {
    // AI is only decorating descriptions — a timeout or provider outage must
    // never fail the request when we already hold a valid deterministic plan.
    trackTelemetry('plan-ai-error', {
      breed: input.breed,
      trainingWeek: input.trainingWeek,
      error: err instanceof Error ? err.message : String(err),
    })
    return attachSources(fallbackPlan, sourcesByExercise)
  }
  const plan = applyDescriptionsFromAI(raw, fallbackPlan)
  const validation = validateWeekPlan(plan, input, input.progressionDecisions ?? [])
  const validationCounts = summarizeViolations(validation.violations)

  trackTelemetry('plan-validator', {
    breed: input.breed,
    trainingWeek: input.trainingWeek,
    ok: validation.ok,
    violationCount: validation.violations.length,
    violationCodes: validationCounts,
    usedFallback: !validation.ok,
  })
  if (!validation.ok) {
    console.warn('[generateWeekPlan] explanation output failed validation, using deterministic fallback:', validation.reasons.join(' | '))
    return attachSources(fallbackPlan, sourcesByExercise)
  }
  return attachSources(plan, sourcesByExercise)
}

function attachSources(
  plan: WeekPlan,
  sourcesByExercise: Map<string, TrainingSourceRef[]>,
): WeekPlan {
  if (sourcesByExercise.size === 0) return plan
  return {
    days: plan.days.map((day) => ({
      ...day,
      exercises: day.exercises?.map((exercise) => {
        const sources = sourcesByExercise.get(exercise.id)
        return sources && sources.length > 0 ? { ...exercise, sources } : exercise
      }),
    })),
  }
}

function summarizeViolations(
  violations: Array<{ code: string }>,
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const violation of violations) {
    counts[violation.code] = (counts[violation.code] ?? 0) + 1
  }
  return counts
}

function applyDescriptionsFromAI(raw: string, basePlan: WeekPlan): WeekPlan {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as { descriptions?: Array<{ day?: string; id?: string; desc?: string }> }
  } catch {
    return basePlan
  }

  const descriptions = Array.isArray((parsed as { descriptions?: unknown }).descriptions)
    ? ((parsed as { descriptions: Array<{ day?: string; id?: string; desc?: string }> }).descriptions)
    : []

  const descMap = new Map<string, string>()
  for (const row of descriptions) {
    if (typeof row.day !== 'string' || typeof row.id !== 'string' || typeof row.desc !== 'string') continue
    const cleaned = row.desc.trim()
    if (!cleaned) continue
    descMap.set(`${row.day}::${row.id}`, cleaned)
  }

  return {
    days: basePlan.days.map((day) => ({
      ...day,
      exercises: day.exercises?.map((exercise) => ({
        ...exercise,
        desc: descMap.get(`${day.day}::${exercise.id}`) ?? exercise.desc,
      })),
    })),
  }
}
