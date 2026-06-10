import { getGroqClient, GROQ_MODEL } from './client'
import { embedText } from './embed'
import { searchBreedChunks } from '@/lib/supabase/breed-chunks'
import type { Breed, WeekPlan } from '@/types'
import { buildWeekPromptParts } from './week-plan-prompt'
import type { WeekPlanInput } from '@/lib/training/week-context'
import { buildDeterministicWeekPlan } from '@/lib/training/deterministic-week-planner'
import { validateWeekPlan } from '@/lib/training/week-plan-validator'

// Bump this when plan generation logic changes significantly — forces cache invalidation
export const PLAN_VERSION = 'v9'

export { parseWeekPlan } from './week-plan-parse'

export async function generateWeekPlan(input: WeekPlanInput): Promise<WeekPlan> {
  const deterministic = buildDeterministicWeekPlan(input)
  const fallbackPlan = deterministic.plan

  const { breed, trainingWeek } = input
  let chunks: import('@/types').ChunkMatch[] = []
  try {
    const embedding = await embedText(`träning programvecka ${trainingWeek} ${breed}`)
    chunks = await searchBreedChunks(embedding, breed, 3)
  } catch {
    // Continue without RAG chunks if embedding fails
  }

  const documentContext = chunks.length > 0
    ? chunks.map((c) => `${c.content}\n[Källa: ${c.source}]`).join('\n\n')
    : ''
  const { systemPrompt } = buildWeekPromptParts({
    ...input,
    documentContext,
  })

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
  })

  const usage = completion.usage
  if (usage) {
    console.log(`[groq:week-plan] tokens in=${usage.prompt_tokens} out=${usage.completion_tokens} total=${usage.total_tokens} breed=${input.breed} week=${input.trainingWeek}`)
  }

  const raw = completion.choices[0]?.message?.content ?? '{}'
  const plan = applyDescriptionsFromAI(raw, fallbackPlan)
  const validation = validateWeekPlan(plan, input, input.progressionDecisions ?? [])
  const validationCounts = summarizeViolations(validation.violations)

  console.log(
    '[telemetry:plan-validator]',
    JSON.stringify({
      breed: input.breed,
      trainingWeek: input.trainingWeek,
      ok: validation.ok,
      violationCount: validation.violations.length,
      violationCodes: validationCounts,
      usedFallback: !validation.ok,
    }),
  )
  if (!validation.ok) {
    console.warn('[generateWeekPlan] explanation output failed validation, using deterministic fallback:', validation.reasons.join(' | '))
    return fallbackPlan
  }
  return plan
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
