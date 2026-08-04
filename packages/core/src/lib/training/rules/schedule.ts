import type { RuleBuilder } from './types'

export const scheduleRule: RuleBuilder = (ctx) => {
  if (ctx.trainingWeek >= 4) {
    return 'Förstärkningsschema: när ett beteende är pålitligt på en kriterienivå (~80% lyckade reps över 3 pass) — börja belöna ungefär 2 av 3 reps istället för varje. Hög motivation utan att hunden tappar engagemanget. Vid stort genombrott (första gången på svår nivå): jackpot — 5 godis i rad. Förklara detta i desc där det är relevant ("varje annan rep" / "jackpot på första lyckad").'
  }
  return 'Förstärkningsschema (vecka 1–3): belöna VARJE lyckad rep (CRF, continuous reinforcement). Du bygger associationen mellan beteendet och belöningen — variabel förstärkning kommer senare.'
}
