import { getExerciseSpec } from './exercise-specs'
import type { DailyExerciseMetrics } from '@/types'

/**
 * Computes an appropriate starting program week from biological age
 * and assessment results.
 *
 * Two inputs:
 *   ageBase  = biological age → rough program depth (1 week per 8 bio-weeks)
 *   skillBonus = how well the dog performed in the assessment
 *                (ladder position × success rate × latency factor), scaled to 0–12 weeks
 *
 * Examples:
 *   8-week puppy, no assessment       → week 1
 *   26-week pup, decent skills        → week ~5
 *   2-year-old, very skilled          → week ~22
 *   2-year-old, rusty/low success     → week ~14
 */
export function computeStartingWeek(
  ageWeeks: number,
  metrics: Record<string, DailyExerciseMetrics>
): number {
  const ageBase = Math.max(1, Math.floor(ageWeeks / 8))

  const exerciseIds = Object.keys(metrics)
  if (exerciseIds.length === 0) return ageBase

  let totalSkill = 0
  let counted = 0

  for (const id of exerciseIds) {
    const m = metrics[id]
    const attempts = (m.success_count ?? 0) + (m.fail_count ?? 0)
    if (attempts < 3) continue

    const spec = getExerciseSpec(id)
    if (!spec || spec.ladder.length === 0) continue

    const ladderIdx = spec.ladder.findIndex((l) => l.id === m.criteria_level_id)
    const ladderMax = spec.ladder.length - 1
    const normalizedLadder = ladderMax > 0 ? Math.max(0, ladderIdx) / ladderMax : 0

    const successRate = m.success_count / attempts

    const latencyMultiplier =
      m.latency_bucket === 'lt1s' ? 1.2
      : m.latency_bucket === '1to3s' ? 1.0
      : 0.8

    totalSkill += normalizedLadder * successRate * latencyMultiplier
    counted++
  }

  if (counted === 0) return ageBase

  // avgSkill is roughly 0–1 (can slightly exceed 1 with lt1s bonus)
  // Scale to max 12 bonus program weeks for an expert dog
  const avgSkill = totalSkill / counted
  const skillBonus = Math.round(Math.min(avgSkill, 1) * 12)

  return Math.max(1, ageBase + skillBonus)
}
