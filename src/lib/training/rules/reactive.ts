import type { RuleBuilder } from './types'

export const reactiveRule: RuleBuilder = (ctx) => {
  if (!ctx.isReactive) return null
  return 'Reaktivitetsregel: hunden är reaktiv. (1) Inkludera "lat" (id: lat) på minst 2 träningsdagar — sätt desc med working distance som första anvisning ("LAT på 20 m, korta reps"). (2) Efter en LAT-dag MÅSTE följande dag vara lugn (rest:true ELLER bara sniff/hantering/namn — inga ytterligare trigger-pass). Trigger stacking höjer cortisol i dagar. (3) Inga möte-baserade övningar (socialisering med okända, etc.) två dagar i rad. (4) Skriv aldrig "passera möten" eller liknande tvångsexponering — exponering sker ALLTID under threshold.'
}
