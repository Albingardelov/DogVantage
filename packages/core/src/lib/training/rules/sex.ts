import type { RuleBuilder } from './types'

export const sexRule: RuleBuilder = (ctx) => {
  if (ctx.isInHeat) {
    return 'Könsregel (tik i löp): förkorta alla pass till max 5 min, undvik socialisering med okända hundar, prioritera impulskontroll och lugna inomhusövningar. Skriv "löp" i desc för berörda övningar.'
  }
  if (ctx.skenfasActive) {
    return 'Könsregel (skenfas-fönster): tiken kan visa beteendeförändringar (ökad distraktion, mild agitation). Håll lågstimulans-träning, prioritera plats och impulskontroll. Undvik att introducera nya svåra övningar.'
  }
  if (ctx.isIntactMaleAdolescent) {
    return 'Könsmognadsregel (intakt hane, 7–18 mån): ökad hormonstimulans kan ge distraktion och rivalitet. Inkludera impulskontroll minst 3 dagar. Håll pass korta (5–8 min). Öka inte kriterier snabbt — konsolidera befintliga beteenden.'
  }
  return null
}
