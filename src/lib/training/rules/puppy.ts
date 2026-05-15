import type { RuleBuilder } from './types'

export const puppyRule: RuleBuilder = (ctx) => (
  ctx.lifeStage === 'puppy'
    ? 'Valpregel: inkludera hantering och socialisering flera dagar. Inga "tunga" distans/störnings-ökningar.'
    : null
)
