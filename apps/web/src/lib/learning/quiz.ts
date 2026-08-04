import { AI_TIMEOUTS, getGroqClient, GROQ_MODEL } from '@/lib/ai/client'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import {
  getDueQuizCount,
  getQuizCard,
  listQuizCardsForContext,
  updateQuizCard,
  upsertQuizCard,
} from '@/lib/supabase/learning-progress'
import { formatChunksForPrompt, retrieveDocumentChunks } from '@/lib/learning/doc-retrieval'
import type { ChunkTopic } from '@/lib/learning/chunk-metadata'
import type { Breed } from '@/types'

export interface QuizQuestion {
  cardKey: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface QuizSession {
  contextKey: string
  title: string
  questions: QuizQuestion[]
}

export interface QuizGradeInput {
  cardKey: string
  selectedIndex: number
}

export interface QuizGradeResult {
  cardKey: string
  correct: boolean
  correctIndex: number
  explanation: string
  nextReviewDays: number
}

const REVIEW_DAYS = [1, 3, 7, 14] as const

/** Generate (or load cached) quiz questions for a lesson/module context. */
export async function buildQuizSession(
  breed: Breed,
  contextKey: string,
  title: string,
  lessonBody: string,
  topic?: ChunkTopic,
): Promise<QuizSession | null> {
  const cacheKey = `quizz_gen_v1_${contextKey}`
  const cached = await readGlobalCache<QuizQuestion[]>(cacheKey)
  if (cached && cached.length > 0) {
    return { contextKey, title, questions: cached }
  }

  const chunks = topic
    ? await retrieveDocumentChunks(breed, `${title}. ${lessonBody.slice(0, 200)}`, 2, { topic })
    : []

  const docCtx = chunks.length > 0 ? formatChunksForPrompt(chunks) : lessonBody.slice(0, 400)

  const generated = await generateJson<{ questions?: Array<{
    question?: string
    options?: string[]
    correctIndex?: number
    explanation?: string
  }> }>([
    {
      role: 'system',
      content: [
        `Skapa exakt 2 flervalsgsfrågor på svenska om "${title}" för en ny hundägare.`,
        'Frågorna ska testa förståelse av hundträning — inte trivia.',
        'Basera på texten nedan. Varje fråga: 3 alternativ, ett rätt svar, kort förklaring.',
        'Returnera JSON: {"questions":[{"question":"...","options":["A","B","C"],"correctIndex":0,"explanation":"varför"}]}',
        `\n=== UNDERLAG ===\n${docCtx}`,
      ].join('\n'),
    },
    { role: 'user', content: `Skapa 2 quizfrågor om ${title}.` },
  ], 700)

  const raw = generated?.questions ?? []
  const questions: QuizQuestion[] = []
  for (let i = 0; i < Math.min(2, raw.length); i++) {
    const q = raw[i]
    if (!q?.question || !Array.isArray(q.options) || q.options.length < 2) continue
    if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex >= q.options.length) continue
    questions.push({
      cardKey: `${contextKey}_q${i}`,
      question: q.question,
      options: q.options.slice(0, 4),
      correctIndex: q.correctIndex,
      explanation: q.explanation?.trim() || 'Se övningsplanen och mikrolektionen för mer kontext.',
    })
  }

  if (questions.length === 0) return null
  await writeGlobalCache(cacheKey, 'quiz_gen', questions)
  return { contextKey, title, questions }
}

/** Load due review cards + merge any new cards into user progress table. */
export async function ensureQuizCards(
  userId: string,
  dogId: string,
  session: QuizSession,
): Promise<QuizQuestion[]> {
  for (const q of session.questions) {
    await upsertQuizCard({
      user_id: userId,
      dog_id: dogId,
      card_key: q.cardKey,
      context_key: session.contextKey,
      question: q.question,
      options: q.options,
      correct_index: q.correctIndex,
      explanation: q.explanation,
      next_review_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  const rows = await listQuizCardsForContext(userId, dogId, session.contextKey)
  return rows.map((row) => ({
    cardKey: String(row.card_key),
    question: String(row.question),
    options: row.options as string[],
    correctIndex: Number(row.correct_index),
    explanation: String(row.explanation ?? ''),
  }))
}

export async function gradeQuizAnswers(
  userId: string,
  dogId: string,
  answers: QuizGradeInput[],
): Promise<QuizGradeResult[]> {
  const results: QuizGradeResult[] = []

  for (const answer of answers) {
    const row = await getQuizCard(userId, dogId, answer.cardKey)
    if (!row) continue
    const correctIndex = Number(row.correct_index)
    const correct = answer.selectedIndex === correctIndex
    const prevInterval = Number(row.interval_days ?? 1)
    const prevStreak = Number(row.consecutive_correct ?? 0)

    let intervalDays: number
    let consecutiveCorrect: number
    if (correct) {
      consecutiveCorrect = prevStreak + 1
      intervalDays = REVIEW_DAYS[Math.min(consecutiveCorrect, REVIEW_DAYS.length - 1)]
    } else {
      consecutiveCorrect = 0
      intervalDays = REVIEW_DAYS[0]
    }

    const nextReview = new Date()
    nextReview.setUTCDate(nextReview.getUTCDate() + intervalDays)

    await updateQuizCard(userId, dogId, answer.cardKey, {
      last_result: correct,
      consecutive_correct: consecutiveCorrect,
      interval_days: intervalDays,
      next_review_at: nextReview.toISOString(),
      updated_at: new Date().toISOString(),
    })

    results.push({
      cardKey: answer.cardKey,
      correct,
      correctIndex,
      explanation: String(row.explanation ?? ''),
      nextReviewDays: intervalDays,
    })
  }

  return results
}

export { getDueQuizCount } from '@/lib/supabase/learning-progress'

// ─── helpers ────────────────────────────────────────────────────────────────

 async function generateJson<T>(
  messages: Array<{ role: 'system' | 'user'; content: string }>,
  maxTokens: number,
): Promise<T | null> {
  try {
    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature: 0.35,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }, { timeout: AI_TIMEOUTS.chat })
    return JSON.parse(completion.choices[0]?.message?.content ?? '{}') as T
  } catch {
    return null
  }
}

 async function readGlobalCache<T>(key: string): Promise<T | null> {
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

 async function writeGlobalCache(key: string, source: string, value: unknown): Promise<void> {
  try {
    await getSupabaseAdmin().from('training_cache').upsert({
      breed: key,
      week_number: 0,
      content: JSON.stringify(value),
      source,
    }, { onConflict: 'breed,week_number' })
  } catch { /* best-effort */ }
}
