import type { RuleBuilder } from './types'

export const breedSpecificRule: RuleBuilder = (ctx) => {
  if (ctx.breed === 'braque_francais') {
    return 'Rasregel (stående fågelhund): inkludera minst 1 av: stadga, orientering, kontrollerat_sok, impulskontroll under veckan.'
  }
  if (ctx.isMasAdult) {
    return 'Rasregel (vallhund, ungdom/vuxen): inkludera vallning minst 1 dag per vecka. Inkludera impulskontroll och/eller stoppsignal minst 2 dagar. Varva rörelse med lugn-övningar.'
  }
  if (ctx.breed === 'miniature_american_shepherd') {
    return 'Rasregel (vallhund, valp): inkludera impulskontroll och hantering varje vecka. Inga direkta vallningsövningar ännu — bygg grunden.'
  }
  return null
}
