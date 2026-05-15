import { formatDevelopmentalContext } from '@/lib/training/developmental-context'
import type { RuleBuilder } from './types'

export const developmentalRule: RuleBuilder = (ctx) => {
  if (typeof ctx.ageWeeks !== 'number') return null
  return formatDevelopmentalContext(ctx.ageWeeks)
}
