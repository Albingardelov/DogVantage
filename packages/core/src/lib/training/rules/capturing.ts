import type { RuleBuilder } from './types'

export const capturingRule: RuleBuilder = (ctx) => {
  if (ctx.trainingWeek < 3) return null
  return 'Capturing vs. luring: för sitt/ligg/plats — inkludera laddertrappstegen "fasa ut locket" och "fånga erbjudet beteende" istället för att fastna i luring. Lure-beroende hund följer maten, inte signalen.'
}
