import type { RuleBuilder } from './types'

export const petRule: RuleBuilder = (ctx) => {
  if (ctx.hasCats) {
    return `Husdjursregel (katter i hemmet): inkludera socialisering OCH impulskontroll varje träningsdag (båda är tillåtna id). Lägg in plats minst 2 dagar. Skriv "katt" i desc för dessa övningar, t.ex. "Socialisering: lugn katt synlig, 3 min". Mål: valpen lär sig att katter är neutrala.${ctx.hasOutdoorCats ? ' Inkludera dessutom stoppsignal varje träningsdag.' : ''}`
  }
  if (ctx.hasSmallAnimals) {
    return 'Husdjursregel (smådjur): inkludera impulskontroll och fokus varje träningsdag (båda är tillåtna id). Skriv "smådjur" i desc. Bygg artfrid.'
  }
  if (ctx.hasLivestock) {
    return 'Husdjursregel (gårdsdjur): inkludera stoppsignal och impulskontroll varje träningsdag (båda är tillåtna id). Introduktion till boskap sker kontrollerat.'
  }
  return null
}
