import { GOAL_LABELS, GOAL_RULES } from '@/lib/training/goal-exercises'
import type { RuleBuilder } from './types'

export const goalRule: RuleBuilder = (ctx) => {
  if (ctx.goals.length === 0) return null
  return ctx.goals
    .map((g) => GOAL_RULES[g] ? `Målregel (${GOAL_LABELS[g]}): ${GOAL_RULES[g]}` : null)
    .filter((v): v is string => Boolean(v))
    .join('\n')
}
