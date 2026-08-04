import type { Exercise } from '@dogvantage/core'

export type PuppyZone = 'green' | 'yellow' | 'red'

export const CALM_EXERCISE_IDS = ['nosework', 'plats', 'ligg', 'fokus', 'stanna', 'namn'] as const
export type CalmExerciseId = (typeof CALM_EXERCISE_IDS)[number]

const CALM_EXERCISE_LABELS: Record<CalmExerciseId, string> = {
  nosework: 'Nosework',
  plats: 'Plats',
  ligg: 'Ligg',
  fokus: 'Fokus',
  stanna: 'Stanna',
  namn: 'Namn',
}

// Returns the first calm exercise in priority order that has more successes than failures.
// Falls back to 'nosework' when none qualify.
export function selectYellowExercise(
  metrics: Record<string, { success_count: number; fail_count: number }>,
): CalmExerciseId {
  const passing = CALM_EXERCISE_IDS.filter(
    (id) => (metrics[id]?.success_count ?? 0) > (metrics[id]?.fail_count ?? 0),
  )
  return passing[0] ?? 'nosework'
}

export function buildYellowExercise(id: CalmExerciseId): Exercise {
  return {
    id,
    label: CALM_EXERCISE_LABELS[id],
    desc: '3 repetitioner — fokus på lugn och enkla vinster.',
    reps: 3,
  }
}

export function getRecoveryTips(): string[] {
  return [
    'Sniffpromenad utan krav — låt hunden styra tempo och riktning.',
    'Vila i bur eller på plats — ge hunden tid att varva ner.',
    'Fri lek på säker plats utan prestationskrav.',
  ]
}
