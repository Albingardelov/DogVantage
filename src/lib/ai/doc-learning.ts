import { embedText } from './embed'
import { AI_TIMEOUTS, getGroqClient, GROQ_MODEL } from './client'
import { chunksToSourceRefs } from './rag'
import { searchBreedChunks } from '@/lib/supabase/breed-chunks'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { getExerciseSpec } from '@/lib/training/exercise-specs'
import { exerciseLabel } from '@/lib/training/exercise-label'
import type { Breed, ChunkMatch, TrainingSourceRef } from '@/types'

// Proactive learning features built on the document knowledge base:
// - "Läs mer" source links per exercise
// - Daily micro-lessons matched to the dog's weakest skill
// - Source-cited coaching advice after a struggling session
//
// Everything is cached globally per (breed, exercise) in training_cache —
// content is user-independent, so cost is one embed + one Groq call per
// unique key, shared across all users.

// Lower than chat's 0.72: these are supplementary links/lessons, not
// generated answers that must be strictly grounded.
const MIN_SOURCE_SIMILARITY = 0.66

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

  const chunks = await retrieveChunks(breed, retrievalQuery(exerciseId), 4)
  const sources = chunksToSourceRefs(chunks).slice(0, 2)
  await writeCache(cacheKey, 'exercise_sources', sources)
  return sources
}

// ─── Feature 2: Daily micro-lesson ────────────────────────────────────────────

export async function getMicroLesson(
  breed: Breed,
  lifeStage: string,
  exerciseId: string,
): Promise<MicroLesson | null> {
  const label = exerciseLabel(exerciseId)
  const cacheKey = `mlesson_v1_${breed}_${lifeStage}_${exerciseId}`
  const cached = await readCache<MicroLesson>(cacheKey)
  if (cached) return cached

  const chunks = await retrieveChunks(breed, retrievalQuery(exerciseId), 3)
  if (chunks.length === 0) return null

  const documentContext = formatChunks(chunks)
  const generated = await generateJson<{ title?: string; body?: string }>([
    {
      role: 'system',
      content: [
        `Du är en hundträningslärare. Skriv en mikrolektion på svenska om "${label}" för en ${breed} (${lifeStage}).`,
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
): Promise<CoachTip | null> {
  const label = exerciseLabel(exerciseId)
  const cacheKey = `coach_v1_${breed}_${exerciseId}`
  const cached = await readCache<CoachTip>(cacheKey)
  if (cached) return cached

  const spec = getExerciseSpec(exerciseId)
  const chunks = await retrieveChunks(
    breed,
    `${label} vanliga problem, hunden misslyckas, sänka kriteriet, felsökning`,
    3,
  )
  if (chunks.length === 0 && !spec) return null

  const troubleshooting = spec?.troubleshooting?.length
    ? `\n=== FELSÖKNING (appens övningsguide) ===\n${spec.troubleshooting.map((t) => `• ${t}`).join('\n')}`
    : ''
  const documentContext = chunks.length > 0
    ? `\n=== KÄLLDOKUMENT ===\n${formatChunks(chunks)}`
    : ''

  const generated = await generateJson<{ advice?: string }>([
    {
      role: 'system',
      content: [
        `Du är en hundtränarcoach. Föraren har precis loggat ett pass där hunden hade låg träffsäkerhet på "${label}" (${breed}).`,
        'Skriv 2–3 meningar på svenska: varför det troligen händer och EN konkret justering till nästa pass.',
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

async function retrieveChunks(breed: Breed, query: string, count: number): Promise<ChunkMatch[]> {
  try {
    const embedding = await embedText(query)
    const retrieved = await searchBreedChunks(embedding, breed, count * 2)
    return retrieved
      .filter((c) => Number.isFinite(c.similarity) && c.similarity >= MIN_SOURCE_SIMILARITY)
      .slice(0, count)
  } catch (err) {
    console.error('[doc-learning] retrieval failed:', err instanceof Error ? err.message : String(err))
    return []
  }
}

function formatChunks(chunks: ChunkMatch[]): string {
  return chunks
    .map((c) => `${c.content}\n[Källa: ${c.source}${c.source_url ? ` — ${c.source_url}` : ''}]`)
    .join('\n\n')
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
