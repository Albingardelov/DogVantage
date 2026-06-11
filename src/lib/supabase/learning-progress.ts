import { getSupabaseAdmin } from './client'

type Row = Record<string, unknown>

type QueryResult = { data: Row[] | null; error: { message: string } | null; count?: number | null }
type SingleResult = { data: Row | null; error: { message: string } | null }
type CountResult = { count: number | null; error: { message: string } | null }

type EqChain = {
  eq: (col: string, val: string) => EqChain
  in: (col: string, vals: string[]) => Promise<QueryResult>
} & Promise<QueryResult>

type QuizEqChain = {
  eq: (col: string, val: string) => QuizEqChain
  lte: (col: string, val: string) => Promise<CountResult>
  maybeSingle: () => Promise<SingleResult>
} & Promise<QueryResult>

type AdminClient = {
  from: (table: string) => {
    select: (cols: string, opts?: Record<string, unknown>) => EqChain | QuizEqChain
    upsert: (row: Row, opts: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
    update: (patch: Row) => EqChain
  }
}

function admin(): AdminClient {
  return getSupabaseAdmin() as unknown as AdminClient
}

export async function listCompletedModules(userId: string, dogId: string): Promise<string[]> {
  const { data, error } = await admin()
    .from('curriculum_progress')
    .select('module_id')
    .eq('user_id', userId)
    .eq('dog_id', dogId)
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => String(r.module_id))
}

export async function listCompletedAmong(
  userId: string,
  dogId: string,
  moduleIds: string[],
): Promise<string[]> {
  const chain = admin()
    .from('curriculum_progress')
    .select('module_id') as EqChain
  const { data, error } = await chain
    .eq('user_id', userId)
    .eq('dog_id', dogId)
    .in('module_id', moduleIds)
  if (error) throw new Error(error.message)
  return (data ?? []).map((r: Row) => String(r.module_id))
}

export async function markModuleComplete(
  userId: string,
  dogId: string,
  moduleId: string,
): Promise<void> {
  const { error } = await admin().from('curriculum_progress').upsert({
    user_id: userId,
    dog_id: dogId,
    module_id: moduleId,
    completed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,dog_id,module_id' })
  if (error) throw new Error(error.message)
}

export async function upsertQuizCard(row: Row): Promise<void> {
  const { error } = await admin().from('quiz_cards').upsert(row, {
    onConflict: 'user_id,dog_id,card_key',
    ignoreDuplicates: true,
  })
  if (error) throw new Error(error.message)
}

export async function listQuizCardsForContext(
  userId: string,
  dogId: string,
  contextKey: string,
): Promise<Row[]> {
  const { data, error } = await admin()
    .from('quiz_cards')
    .select('card_key, question, options, correct_index, explanation')
    .eq('user_id', userId)
    .eq('dog_id', dogId)
    .eq('context_key', contextKey)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getQuizCard(
  userId: string,
  dogId: string,
  cardKey: string,
): Promise<Row | null> {
  const chain = admin()
    .from('quiz_cards')
    .select('correct_index, explanation, consecutive_correct, interval_days') as QuizEqChain
  const { data, error } = await chain
    .eq('user_id', userId)
    .eq('dog_id', dogId)
    .eq('card_key', cardKey)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function updateQuizCard(
  userId: string,
  dogId: string,
  cardKey: string,
  patch: Row,
): Promise<void> {
  const { error } = await admin()
    .from('quiz_cards')
    .update(patch)
    .eq('user_id', userId)
    .eq('dog_id', dogId)
    .eq('card_key', cardKey)
  if (error) throw new Error(error.message)
}

export async function getDueQuizCount(userId: string, dogId: string): Promise<number> {
  const chain = admin()
    .from('quiz_cards')
    .select('*', { count: 'exact', head: true }) as QuizEqChain
  const { count, error } = await chain
    .eq('user_id', userId)
    .eq('dog_id', dogId)
    .lte('next_review_at', new Date().toISOString())
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function getRecentQuizStats(
  userId: string,
  dogId: string,
  limit = 10,
): Promise<{ answered: number; correct: number } | null> {
  const chain = admin()
    .from('quiz_cards')
    .select('last_result') as unknown as {
      eq(col: string, val: string): typeof chain
      not(col: string, op: string, val: unknown): typeof chain
      order(col: string, opts: { ascending: boolean }): typeof chain
      limit(n: number): Promise<{ data: Array<{ last_result: boolean | null }> | null; error: { message: string } | null }>
    }
  const { data, error } = await chain
    .eq('user_id', userId)
    .eq('dog_id', dogId)
    .not('last_result', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error || !data || data.length === 0) return null
  return {
    answered: data.length,
    correct: data.filter((r) => r.last_result === true).length,
  }
}

export async function listFailedQuizModuleIds(
  userId: string,
  dogId: string,
): Promise<string[]> {
  const chain = admin()
    .from('quiz_cards')
    .select('context_key') as EqChain
  const { data, error } = await chain
    .eq('user_id', userId)
    .eq('dog_id', dogId)
    .eq('last_result', false as unknown as string)
  if (error || !data) return []
  const ids = new Set<string>()
  for (const row of data) {
    const key = String(row['context_key'])
    if (key.startsWith('curr_')) ids.add(key.slice('curr_'.length))
  }
  return [...ids]
}
