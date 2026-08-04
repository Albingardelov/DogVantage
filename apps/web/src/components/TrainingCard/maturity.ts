export type ExerciseMaturity = 'new' | 'practiced'

export function exerciseMaturity(
  exerciseId: string,
  practiced: Set<string>,
): ExerciseMaturity {
  return practiced.has(exerciseId) ? 'practiced' : 'new'
}
