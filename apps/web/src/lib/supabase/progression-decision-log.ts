import { getSupabaseAdmin } from './client'
import type { ExerciseProgressionDecision } from '@/lib/training/progression-rules'
import type {
  DecisionEvaluation,
  PendingDecisionRow,
  AdvanceOutcomeRow,
  DecisionOutcome,
} from '@/lib/training/decision-calibration'

// Must cover HISTORY_WINDOW (10, decision-calibration.ts) rows per actively
// trained exercise — a smaller global limit silently drops the exercises with
// the oldest outcomes from calibration.
const OUTCOME_HISTORY_LIMIT = 200

export async function logProgressionDecisions(
  dogId: string,
  decisions: ExerciseProgressionDecision[],
): Promise<void> {
  if (decisions.length === 0) return
  const rows = decisions.map((d) => ({
    dog_id: dogId,
    exercise_id: d.exercise_id,
    decision: d.decision,
    success_rate: d.success_rate,
    criteria_level_id: d.criteria_level_id,
  }))
  const { error } = await getSupabaseAdmin().from('progression_decision_log').insert(rows)
  if (error) throw new Error(`decision log insert failed: ${error.message}`)
}

export async function getPendingDecisions(dogId: string): Promise<PendingDecisionRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('progression_decision_log')
    .select('id, exercise_id, decision, created_at')
    .eq('dog_id', dogId)
    .is('evaluated_at', null)
    .order('created_at', { ascending: true })
  if (error) throw new Error(`pending decisions fetch failed: ${error.message}`)
  return (data ?? []) as PendingDecisionRow[]
}

export async function markDecisionsEvaluated(
  evaluations: DecisionEvaluation[],
): Promise<void> {
  const evaluatedAt = new Date().toISOString()
  const byOutcome = new Map<DecisionOutcome, string[]>()
  for (const e of evaluations) {
    const ids = byOutcome.get(e.outcome) ?? []
    ids.push(e.id)
    byOutcome.set(e.outcome, ids)
  }
  for (const [outcome, ids] of byOutcome) {
    const { error } = await getSupabaseAdmin()
      .from('progression_decision_log')
      .update({ outcome, evaluated_at: evaluatedAt })
      .in('id', ids)
    if (error) throw new Error(`decision evaluation update failed: ${error.message}`)
  }
}

export async function getRecentAdvanceOutcomes(dogId: string): Promise<AdvanceOutcomeRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('progression_decision_log')
    .select('exercise_id, outcome, created_at')
    .eq('dog_id', dogId)
    .eq('decision', 'advance')
    .not('outcome', 'is', null)
    .order('created_at', { ascending: false })
    .limit(OUTCOME_HISTORY_LIMIT)
  if (error) throw new Error(`advance outcomes fetch failed: ${error.message}`)
  return (data ?? []) as AdvanceOutcomeRow[]
}
