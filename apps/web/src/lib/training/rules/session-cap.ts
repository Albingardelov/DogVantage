import { getMaxSessionMinutes } from '@/lib/training/developmental-context'
import type { RuleBuilder } from './types'

export const sessionCapRule: RuleBuilder = (ctx) => {
  if (typeof ctx.ageWeeks !== 'number') return null
  return `Passlängdsregel (ålder ${ctx.ageWeeks} v): MAX ${getMaxSessionMinutes(ctx.ageWeeks)} min per pass i desc-fältet. Korta micro-sessions för valpar under 12 v.`
}
