import { priorityPromptRule } from '../../../lib/training/weekly-focus'
import type { RuleBuilder } from './types'

export const priorityRule: RuleBuilder = (ctx) => {
  if (ctx.priorityExercises.length === 0) return null
  return priorityPromptRule(ctx.priorityExercises)
}
