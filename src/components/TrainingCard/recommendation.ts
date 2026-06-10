import type { LatencyBucket } from '@/types'
import { isPuppy as isPuppyAge } from '@/lib/dog/age'

export interface SessionGuard {
  consecutiveFails: number
  consecutiveSlow: number
}

export interface Recommendation {
  kind: 'keep' | 'raise' | 'lower' | 'stop'
  message: string
}

const MIN_ATTEMPTS_FOR_DECISION = 10
const ADVANCE_THRESHOLD = 0.8
const REGRESS_THRESHOLD = 0.6

/**
 * Per-rep recommendation engine — used in the dashboard exercise rows
 * to show "raise/lower/keep/stop" feedback based on today's metrics.
 *
 * Stop rule: 2 consecutive misses OR 2 consecutive slow reps → pause + back down.
 * Otherwise: ≥5 attempts evaluates success rate and latency.
 */
export function buildRecommendation(
  successCount: number,
  failCount: number,
  latencyBucket: LatencyBucket | null,
  ageWeeks: number,
  guard: SessionGuard,
): Recommendation | null {
  const attempts = successCount + failCount
  const isPuppy = isPuppyAge(ageWeeks)

  if (guard.consecutiveFails >= 2 || guard.consecutiveSlow >= 2) {
    return {
      kind: 'stop',
      message:
        'Pausa och backa nivån direkt — avsluta efter en lyckad rep. Om hunden inte tar belöning kan den vara stressad eller över tröskeln: gör lättare eller öka avstånd.',
    }
  }
  if (attempts < MIN_ATTEMPTS_FOR_DECISION) {
    return { kind: 'keep', message: 'Kör fler försök på samma nivå innan du höjer eller sänker kriteriet.' }
  }

  const rate = attempts > 0 ? successCount / attempts : 0
  if (rate >= ADVANCE_THRESHOLD && latencyBucket !== 'gt3s' && !isPuppy) {
    return { kind: 'raise', message: 'Höj kriteriet ett steg (lite svårare miljö/störning/avstånd).' }
  }
  if (rate <= REGRESS_THRESHOLD || latencyBucket === 'gt3s') {
    return {
      kind: 'lower',
      message:
        'Sänk kriteriet ett steg och höj belöningsvärdet. Många miss eller långsam svarstid betyder oftast att kraven är för höga just nu.',
    }
  }
  return { kind: 'keep', message: 'Behåll nivån och stabilisera (sikta på ≥80% och kort latens).' }
}
