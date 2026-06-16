import { AI_TIMEOUTS, getGroqClient, GROQ_MODEL } from './client'
import { chunksToSourceRefs } from './rag'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { getExerciseSpec } from '@/lib/training/exercise-specs'
import { exerciseLabel } from '@/lib/training/exercise-label'
import { retrieveDocumentChunks, formatChunksForPrompt } from '@/lib/learning/doc-retrieval'
import { topicForExerciseId, type LifeStageFilter, type ChunkTopic } from '@/lib/learning/chunk-metadata'
import { languageDirective } from '@/i18n/language-directive'
import type { Locale } from '@/i18n/config'
import type { Breed, TrainingSourceRef } from '@/types'

// Behaviour-emergency / clinical welfare topics must never ground a daily
// training schedule — they describe problems that need professional help, not
// a rep to run today. Filtered out of week-plan grounding (see getExerciseDocContext).
const SCHEDULE_EXCLUDED_TOPICS = new Set<ChunkTopic>([
  'separation', 'fear', 'resource_guarding', 'senior', 'body_language',
])

// Proactive learning features built on the document knowledge base:
// - "Läs mer" source links per exercise
// - Daily micro-lessons matched to the dog's weakest skill
// - Source-cited coaching advice after a struggling session
//
// Everything is cached globally per (breed, exercise) in training_cache —
// content is user-independent, so cost is one embed + one Groq call per
// unique key, shared across all users.

// Lower than chat's 0.72: supplementary links/lessons use doc-retrieval MIN_SIMILARITY.

export interface MicroLesson {
  title: string
  body: string
  exerciseId: string
  exerciseLabel: string
  sources: TrainingSourceRef[]
}

export interface CoachTip {
  exerciseId: string
  exerciseLabel: string
  advice: string
  sources: TrainingSourceRef[]
}

// ─── Feature 1: "Läs mer" sources per exercise ────────────────────────────────

export async function getExerciseSources(
  breed: Breed,
  exerciseId: string,
): Promise<TrainingSourceRef[]> {
  const cacheKey = `exsrc_v1_${breed}_${exerciseId}`
  const cached = await readCache<TrainingSourceRef[]>(cacheKey)
  if (cached) return cached

  const chunks = await retrieveDocumentChunks(breed, retrievalQuery(exerciseId), 4, {
    topic: topicForExerciseId(exerciseId),
  })
  const sources = chunksToSourceRefs(chunks).slice(0, 2)
  await writeCache(cacheKey, 'exercise_sources', sources)
  return sources
}

// ─── Exercise-scoped document grounding for the weekly schedule ───────────────

export interface ExerciseDocContext {
  /** Formatted source chunks for prompt grounding, '' when nothing relevant. */
  context: string
  /** Citations to surface in the UI ("Läs mer"). */
  sources: TrainingSourceRef[]
}

/**
 * Retrieve topic- and life-stage-filtered document chunks for a single exercise.
 * Used to ground week-plan descriptions and attach "read more" sources per
 * exercise. Cached globally per (breed, exercise, lifeStage) — content is
 * user-independent, so cost is one embed per unique key, shared across users.
 *
 * Safety: applies a similarity floor (via retrieveDocumentChunks) and drops any
 * behaviour-emergency / clinical topics so a schedule never grounds itself in
 * content that calls for a professional referral.
 */
export async function getExerciseDocContext(
  breed: Breed,
  exerciseId: string,
  lifeStage: LifeStageFilter,
): Promise<ExerciseDocContext> {
  const cacheKey = `exdoc_v1_${breed}_${exerciseId}_${lifeStage}`
  const cached = await readCache<ExerciseDocContext>(cacheKey)
  if (cached) return cached

  const retrieved = await retrieveDocumentChunks(breed, retrievalQuery(exerciseId), 4, {
    topic: topicForExerciseId(exerciseId),
    lifeStage,
  })
  const chunks = retrieved.filter(
    (c) => !c.topic || !SCHEDULE_EXCLUDED_TOPICS.has(c.topic as ChunkTopic),
  )
  const result: ExerciseDocContext = {
    context: chunks.length > 0 ? formatChunksForPrompt(chunks.slice(0, 2)) : '',
    sources: chunksToSourceRefs(chunks).slice(0, 2),
  }
  await writeCache(cacheKey, 'exercise_doc_context', result)
  return result
}

// ─── Feature 2: Daily micro-lesson ────────────────────────────────────────────

export function microLessonCacheKey(locale: Locale, breed: Breed, lifeStage: string, exerciseId: string): string {
  return `mlesson_v2_${locale}_${breed}_${lifeStage}_${exerciseId}`
}

export function struggleAdviceCacheKey(locale: Locale, breed: Breed, exerciseId: string): string {
  return `coach_v2_${locale}_${breed}_${exerciseId}`
}

export async function getMicroLesson(
  breed: Breed,
  lifeStage: string,
  exerciseId: string,
  locale: Locale,
): Promise<MicroLesson | null> {
  const label = exerciseLabel(exerciseId)
  const cacheKey = microLessonCacheKey(locale, breed, lifeStage, exerciseId)
  const cached = await readCache<MicroLesson>(cacheKey)
  if (cached) return cached

  const chunks = await retrieveDocumentChunks(breed, retrievalQuery(exerciseId), 3, {
    topic: topicForExerciseId(exerciseId),
    lifeStage: lifeStage as LifeStageFilter,
  })
  if (chunks.length === 0) return null

  const documentContext = formatChunksForPrompt(chunks)
  const generated = await generateJson<{ title?: string; body?: string }>([
    {
      role: 'system',
      content: [
        `Du är en hundträningslärare. ${languageDirective(locale)} Skriv en mikrolektion om "${label}" för en ${breed} (${lifeStage}).`,
        'Basera dig ENDAST på källdokumenten nedan. Nämn källnamnet i texten.',
        '60–90 sekunders läsning (100–160 ord). Konkret och praktiskt, ingen utfyllnad.',
        'Returnera JSON: {"title":"kort rubrik max 8 ord","body":"lektionstexten"}',
        '',
        '=== KÄLLDOKUMENT ===',
        documentContext,
      ].join('\n'),
    },
    { role: 'user', content: `Skriv dagens mikrolektion om ${label}.` },
  ], 500)

  if (!generated?.title || !generated?.body) return null

  const lesson: MicroLesson = {
    title: generated.title,
    body: generated.body,
    exerciseId,
    exerciseLabel: label,
    sources: chunksToSourceRefs(chunks).slice(0, 2),
  }
  await writeCache(cacheKey, 'micro_lesson', lesson)
  return lesson
}

// ─── Feature 3: Coach advice after a struggling session ──────────────────────

export async function getStruggleAdvice(
  breed: Breed,
  exerciseId: string,
  locale: Locale,
): Promise<CoachTip | null> {
  const label = exerciseLabel(exerciseId)
  const cacheKey = struggleAdviceCacheKey(locale, breed, exerciseId)
  const cached = await readCache<CoachTip>(cacheKey)
  if (cached) return cached

  const spec = getExerciseSpec(exerciseId)
  const chunks = await retrieveDocumentChunks(
    breed,
    `${label} vanliga problem, hunden misslyckas, sänka kriteriet, felsökning`,
    3,
    { topic: topicForExerciseId(exerciseId) },
  )
  if (chunks.length === 0 && !spec) return null

  const troubleshooting = spec?.troubleshooting?.length
    ? `\n=== FELSÖKNING (appens övningsguide) ===\n${spec.troubleshooting.map((t) => `• ${t}`).join('\n')}`
    : ''
  const documentContext = chunks.length > 0
    ? `\n=== KÄLLDOKUMENT ===\n${formatChunksForPrompt(chunks)}`
    : ''

  const generated = await generateJson<{ advice?: string }>([
    {
      role: 'system',
      content: [
        `Du är en hundtränarcoach. Föraren har precis loggat ett pass där hunden hade låg träffsäkerhet på "${label}" (${breed}).`,
        `${languageDirective(locale)} Skriv 2–3 meningar: varför det troligen händer och EN konkret justering till nästa pass.`,
        'Var varm men rak. Nämn källnamnet om du använder källdokument. Inga generella plattityder.',
        'Returnera JSON: {"advice":"texten"}',
        troubleshooting,
        documentContext,
      ].join('\n'),
    },
    { role: 'user', content: `Ge råd för nästa pass med ${label}.` },
  ], 300)

  if (!generated?.advice) return null

  const tip: CoachTip = {
    exerciseId,
    exerciseLabel: label,
    advice: generated.advice,
    sources: chunksToSourceRefs(chunks).slice(0, 1),
  }
  await writeCache(cacheKey, 'coach_tip', tip)
  return tip
}

// ─── Shared internals ─────────────────────────────────────────────────────────

function retrievalQuery(exerciseId: string): string {
  const spec = getExerciseSpec(exerciseId)
  const label = exerciseLabel(exerciseId)
  return spec?.definition ? `${label}. ${spec.definition}` : `hundträning ${label}`
}

 async function generateJson<T>(
  messages: Array<{ role: 'system' | 'user'; content: string }>,
  maxTokens: number,
): Promise<T | null> {
  try {
    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature: 0.4,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }, { timeout: AI_TIMEOUTS.chat })
    const raw = completion.choices[0]?.message?.content ?? ''
    return JSON.parse(raw) as T
  } catch (err) {
    console.error('[doc-learning] generation failed:', err instanceof Error ? err.message : String(err))
    return null
  }
}

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const { data } = await getSupabaseAdmin()
      .from('training_cache')
      .select('content')
      .eq('breed', key)
      .eq('week_number', 0)
      .single()
    if (!data) return null
    return JSON.parse(data.content) as T
  } catch {
    return null
  }
}

async function writeCache(key: string, source: string, value: unknown): Promise<void> {
  try {
    await getSupabaseAdmin()
      .from('training_cache')
      .upsert({
        breed: key,
        week_number: 0,
        content: JSON.stringify(value),
        source,
      }, { onConflict: 'breed,week_number' })
  } catch (err) {
    console.error('[doc-learning] cache write failed:', err instanceof Error ? err.message : String(err))
  }
}
