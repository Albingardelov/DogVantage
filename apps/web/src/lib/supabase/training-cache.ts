import { getSupabaseAdmin } from './client'
import type { TrainingResult, Breed, WeekPlan } from '@dogvantage/core'
import { type Locale } from '@/i18n/config'
import { getLifeStage } from '@/lib/dog/age'
import { TrainingResultSchema, WeekPlanSchema } from '@dogvantage/core'

export async function getCachedTraining(
  breed: Breed,
  weekNumber: number
): Promise<TrainingResult | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('training_cache')
    .select('content, source')
    .eq('breed', breed)
    .eq('week_number', weekNumber)
    .single()

  if (error || !data) return null
  return { content: data.content, source: data.source, source_url: '' }
}

export async function setCachedTraining(
  breed: Breed,
  weekNumber: number,
  result: TrainingResult
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('training_cache')
    .upsert({
      breed,
      week_number: weekNumber,
      content: result.content,
      source: result.source,
    })

  if (error) throw new Error(`Cache write failed: ${error.message}`)
}

function ageBucket(ageWeeks?: number): string {
  return getLifeStage(ageWeeks)
}

function goalsBucket(goals?: string[]): string {
  if (!goals || goals.length === 0) return 'default'
  return [...goals].sort().join('+')
}

function shortHash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h).toString(36)
}

function resolveHashes(
  onboardingContext?: string,
  customIds?: string[],
  focusAreas?: string[],
  priorityExercises?: string[],
  progressionRule?: string | null,
) {
  return {
    onboardingHash: onboardingContext ? shortHash(onboardingContext) : undefined,
    customHash: customIds && customIds.length > 0 ? shortHash(customIds.sort().join(',')) : undefined,
    focusHash: focusAreas && focusAreas.length > 0 ? shortHash([...focusAreas].sort().join(',')) : undefined,
    priorityHash: priorityExercises && priorityExercises.length > 0
      ? shortHash([...priorityExercises].sort().join(','))
      : undefined,
    progressionHash: progressionRule ? shortHash(progressionRule) : undefined,
  }
}

function weekPlanCacheKey(
  breed: Breed,
  ageWeeks?: number,
  goals?: string[],
  dateKey?: string,
  dogId?: string,
  onboardingHash?: string,
  customHash?: string,
  planVersion?: string,
  focusHash?: string,
  priorityHash?: string,
  progressionHash?: string,
  projectId?: string,
): string {
  const parts = [`weekplan`, breed, ageBucket(ageWeeks), goalsBucket(goals)]
  if (dogId) parts.push(dogId)
  if (onboardingHash) parts.push(`o${onboardingHash}`)
  if (customHash) parts.push(`c${customHash}`)
  if (focusHash) parts.push(`f${focusHash}`)
  if (priorityHash) parts.push(`p${priorityHash}`)
  if (progressionHash) parts.push(`g${progressionHash}`)
  if (projectId) parts.push(`prj${shortHash(projectId)}`)
  if (planVersion) parts.push(planVersion)
  if (dateKey) parts.push(dateKey)
  return parts.join('_')
}

export async function getCachedWeekPlan(
  breed: Breed,
  weekNumber: number,
  ageWeeks?: number,
  goals?: string[],
  dateKey?: string,
  dogId?: string,
  onboardingContext?: string,
  customIds?: string[],
  planVersion?: string,
  focusAreas?: string[],
  priorityExercises?: string[],
  progressionRule?: string | null,
  projectId?: string,
): Promise<WeekPlan | null> {
  const { onboardingHash, customHash, focusHash, priorityHash, progressionHash } =
    resolveHashes(onboardingContext, customIds, focusAreas, priorityExercises, progressionRule)
  const cacheBreed = weekPlanCacheKey(
    breed,
    ageWeeks,
    goals,
    dateKey,
    dogId,
    onboardingHash,
    customHash,
    planVersion,
    focusHash,
    priorityHash,
    progressionHash,
    projectId,
  )
  let query = getSupabaseAdmin()
    .from('training_cache')
    .select('content')
    .eq('breed', cacheBreed)
    .eq('week_number', weekNumber)
  if (dogId) query = query.eq('dog_id', dogId)
  const { data, error } = await query.single()

  if (error || !data) return null
  let json: unknown
  try {
    json = JSON.parse(data.content)
  } catch {
    return null
  }
  const parsed = WeekPlanSchema.safeParse(json)
  if (!parsed.success) {
    return null
  }
  return parsed.data
}

const CHAT_CACHE_VERSION = 'v2'

function normalizeChatQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[?!.,;:]/g, '')
}

export function chatCacheKey(query: string, breed: Breed, locale: Locale, ageWeeks?: number): string {
  const hash = shortHash(`${normalizeChatQuery(query)}|${breed}|${locale}|${ageBucket(ageWeeks)}`)
  return `chatcache_${CHAT_CACHE_VERSION}_${hash}`
}

export async function getCachedChat(
  query: string,
  breed: Breed,
  locale: Locale,
  ageWeeks?: number,
): Promise<TrainingResult | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('training_cache')
    .select('content')
    .eq('breed', chatCacheKey(query, breed, locale, ageWeeks))
    .eq('week_number', 0)
    .single()

  if (error || !data) return null
  let json: unknown
  try {
    json = JSON.parse(data.content)
  } catch {
    return null
  }
  const parsed = TrainingResultSchema.safeParse(json)
  if (!parsed.success) {
    return null
  }
  return parsed.data
}

export async function setCachedChat(
  query: string,
  breed: Breed,
  locale: Locale,
  result: TrainingResult,
  ageWeeks?: number,
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('training_cache')
    .upsert({
      breed: chatCacheKey(query, breed, locale, ageWeeks),
      week_number: 0,
      content: JSON.stringify(result),
      source: 'chat',
    }, { onConflict: 'breed,week_number' })

  if (error) throw new Error(`Chat cache write failed: ${error.message}`)
}

export async function setCachedWeekPlan(
  breed: Breed,
  weekNumber: number,
  plan: WeekPlan,
  ageWeeks?: number,
  goals?: string[],
  dateKey?: string,
  dogId?: string,
  onboardingContext?: string,
  customIds?: string[],
  planVersion?: string,
  focusAreas?: string[],
  priorityExercises?: string[],
  progressionRule?: string | null,
  projectId?: string,
): Promise<void> {
  const { onboardingHash, customHash, focusHash, priorityHash, progressionHash } =
    resolveHashes(onboardingContext, customIds, focusAreas, priorityExercises, progressionRule)
  const { error } = await getSupabaseAdmin()
    .from('training_cache')
    .upsert({
      breed: weekPlanCacheKey(
        breed,
        ageWeeks,
        goals,
        dateKey,
        dogId,
        onboardingHash,
        customHash,
        planVersion,
        focusHash,
        priorityHash,
        progressionHash,
        projectId,
      ),
      week_number: weekNumber,
      content: JSON.stringify(plan),
      source: 'week_plan',
      ...(dogId ? { dog_id: dogId } : {}),
    }, { onConflict: 'breed,week_number' })

  if (error) throw new Error(`Week plan cache write failed: ${error.message}`)
}

export async function touchCacheEntry(
  query: string,
  breed: Breed,
  locale: Locale,
  ageWeeks?: number,
): Promise<void> {
  await ((getSupabaseAdmin().from('training_cache') as unknown as {
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string | number) => {
        eq: (column: string, value: string | number) => Promise<unknown>
      }
    }
  })
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('breed', chatCacheKey(query, breed, locale, ageWeeks))
    .eq('week_number', 0))
}
