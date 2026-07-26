import type { DailyExerciseMetrics, LatencyBucket } from '@/types'
import { isPuppy as isPuppyAge } from '@/lib/dog/age'
import type { CriteriaLevel } from '@/lib/training/exercise-specs'

export interface SessionGuard {
  consecutiveFails: number
  consecutiveSlow: number
  stopTriggered: boolean
}

export const EMPTY_GUARD: SessionGuard = {
  consecutiveFails: 0,
  consecutiveSlow: 0,
  stopTriggered: false,
}

export interface CoachAction {
  kind: 'keep' | 'raise' | 'lower' | 'stop' | 'end_on_success'
  message: string
  suggestedLevelId: string | null
}

export interface CoachInput {
  successCount: number
  failCount: number
  latencyBucket: LatencyBucket | null
  ageWeeks?: number
  guard: SessionGuard
  ladder: CriteriaLevel[] | null
  currentLevelId: string | null
  advanceThresholdDelta?: number
}

const MIN_ATTEMPTS_FOR_DECISION = 10
const ADVANCE_THRESHOLD = 0.8
const REGRESS_THRESHOLD = 0.6
const MAX_ADVANCE_THRESHOLD = 0.9

const GUIDE_FAIL_HINT =
  'Se felsökningen under kortet, eller öppna guiden för mer.'

function withGuideFailHint(message: string): string {
  return `${message} ${GUIDE_FAIL_HINT}`
}

export function advanceGuard(
  guard: SessionGuard,
  patch: Partial<DailyExerciseMetrics>,
): SessionGuard {
  let next = guard
  if ('fail_count' in patch) {
    next = { ...next, consecutiveFails: next.consecutiveFails + 1 }
  }
  if (patch.latency_bucket === 'gt3s') {
    next = { ...next, consecutiveSlow: next.consecutiveSlow + 1 }
  }
  if ('success_count' in patch) {
    next = { ...next, consecutiveFails: 0, consecutiveSlow: 0 }
  }
  if (next.consecutiveFails >= 2 || next.consecutiveSlow >= 2) {
    next = { ...next, stopTriggered: true }
  }
  return next
}

function stepFrom(
  ladder: CriteriaLevel[] | null,
  currentLevelId: string | null,
  delta: number,
): string | null {
  if (!ladder || ladder.length === 0) return null
  const idx = ladder.findIndex((l) => l.id === currentLevelId)
  const base = idx >= 0 ? idx : 0
  const target = base + delta
  if (target < 0 || target >= ladder.length) return null
  return ladder[target].id
}

export function buildCoachAction(input: CoachInput): CoachAction | null {
  const { guard, ladder, currentLevelId } = input
  const attempts = input.successCount + input.failCount
  const isPuppy = isPuppyAge(input.ageWeeks)
  const lowerLevelId = stepFrom(ladder, currentLevelId, -1)

  if (guard.consecutiveFails >= 2 || guard.consecutiveSlow >= 2) {
    return {
      kind: 'stop',
      suggestedLevelId: lowerLevelId,
      message: withGuideFailHint(
        'Pausa och backa nivån direkt — avsluta efter en lyckad rep. Om hunden inte tar belöning kan den vara stressad eller över tröskeln: gör lättare eller öka avstånd.',
      ),
    }
  }
  if (guard.stopTriggered && input.successCount > 0) {
    return {
      kind: 'end_on_success',
      suggestedLevelId: null,
      message: 'Snyggt — ni vände det. Avsluta övningen här, på topp.',
    }
  }
  if (attempts < MIN_ATTEMPTS_FOR_DECISION) {
    return {
      kind: 'keep',
      suggestedLevelId: null,
      message: 'Kör fler försök på samma nivå innan du höjer eller sänker kriteriet.',
    }
  }

  const rate = input.successCount / attempts
  const advanceThreshold = Math.min(
    ADVANCE_THRESHOLD + (input.advanceThresholdDelta ?? 0),
    MAX_ADVANCE_THRESHOLD,
  )

  if (rate >= advanceThreshold && input.latencyBucket !== 'gt3s' && !isPuppy) {
    const raiseLevelId = stepFrom(ladder, currentLevelId, 1)
    if (raiseLevelId) {
      return {
        kind: 'raise',
        suggestedLevelId: raiseLevelId,
        message: 'Höj kriteriet ett steg (lite svårare miljö/störning/avstånd).',
      }
    }
    return {
      kind: 'keep',
      suggestedLevelId: null,
      message: 'Högsta nivån avklarad — stabilisera och generalisera i nya miljöer.',
    }
  }
  if (rate <= REGRESS_THRESHOLD || input.latencyBucket === 'gt3s') {
    return {
      kind: 'lower',
      suggestedLevelId: lowerLevelId,
      message: withGuideFailHint(
        'Träffsäkerheten är under 80 %, så vi sänker ett steg och höjer belöningsvärdet. Det är inte ett misslyckande — under 80 % betyder bara att kraven är för höga just nu.',
      ),
    }
  }
  return {
    kind: 'keep',
    suggestedLevelId: null,
    message: 'Behåll nivån och stabilisera. Målet är ≥80 % lyckade med kort svarstid innan vi höjer — så ska inlärning gå till.',
  }
}

export function latencyMeaning(bucket: LatencyBucket | null): string {
  switch (bucket) {
    case 'lt1s':
      return 'Under 1 sek — hunden svarar snabbt. Bra timing och rätt svårighet.'
    case '1to3s':
      return '1–3 sek — okej, men håll koll. Tvekar hunden ofta kan kriteriet vara lite för svårt.'
    case 'gt3s':
      return 'Över 3 sek — oftast för svårt just nu, inte olydnad. Sänk kriteriet eller höj belöningen.'
    default:
      return ''
  }
}
