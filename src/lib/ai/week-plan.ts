import { getGroqClient, GROQ_MODEL } from './client'
import { embedText } from './embed'
import { searchBreedChunks } from '@/lib/supabase/breed-chunks'
import type { Breed, WeekPlan } from '@/types'
import { buildWeekPromptParts } from './week-plan-prompt'
import { parseWeekPlan } from './week-plan-parse'
import type { WeekPlanInput } from '@/lib/training/week-context'

// Bump this when plan generation logic changes significantly — forces cache invalidation
export const PLAN_VERSION = 'v8'

export { parseWeekPlan }

export async function generateWeekPlan(input: WeekPlanInput): Promise<WeekPlan> {
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
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Veckoschema JSON för ${input.breed}, programvecka ${input.trainingWeek}` },
    ],
    temperature: 0.3,
    max_tokens: 2048,
    response_format: { type: 'json_object' },
  })

  const usage = completion.usage
  if (usage) {
    console.log(`[groq:week-plan] tokens in=${usage.prompt_tokens} out=${usage.completion_tokens} total=${usage.total_tokens} breed=${input.breed} week=${input.trainingWeek}`)
  }

  const raw = completion.choices[0]?.message?.content ?? '{}'
  const plan = parseWeekPlan(raw)
  if (!plan) {
    console.error('[generateWeekPlan] AI returned unparseable plan:', raw.slice(0, 300))
    throw new Error('AI returned invalid plan structure')
  }
  return plan
}
