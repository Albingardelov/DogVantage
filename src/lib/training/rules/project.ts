import { exerciseLabel } from '@/lib/training/exercise-label'
import type { RuleBuilder } from './types'

export const projectRule: RuleBuilder = (ctx) => {
  if (!ctx.project) return null
  const { label, primaryExerciseId, supportExerciseIds } = ctx.project
  return [
    `AKTIVT TRÄNINGSPROJEKT: "${label}".`,
    `Övningen ${primaryExerciseId} (${exerciseLabel(primaryExerciseId)}) ingår VARJE träningsdag som kort mikropass — medvetet undantag från variationsregeln.`,
    `Stödövningar som viktas upp: ${supportExerciseIds.join(', ')}.`,
    `Gör desc för projektövningarna extra konkreta och kopplade till projektets mål.`,
  ].join(' ')
}

export const skipRule: RuleBuilder = (ctx) => {
  const entries = Object.entries(ctx.recentSkips).filter(([, count]) => count > 0)
  if (entries.length === 0) return null
  const summary = entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => `${id} (${count} ggr)`)
    .join(', ')
  return `Föraren har nyligen valt bort dessa övningar ur dagens pass: ${summary}. De är nedviktade i planen — undvik att lyfta fram dem om de inte ingår i projektet.`
}
