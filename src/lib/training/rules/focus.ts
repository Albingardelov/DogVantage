import { focusPromptRule } from '@/lib/training/weekly-focus'
import type { RuleBuilder } from './types'

export const focusRule: RuleBuilder = (ctx) => {
  if (ctx.weeklyFocus.length === 0) return null
  return focusPromptRule(ctx.weeklyFocus)
}
