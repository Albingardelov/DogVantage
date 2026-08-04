import type { RuleBuilder } from './types'

export const markerRule: RuleBuilder = (ctx) => {
  if (ctx.trainingWeek > 3) return null
  return `R+-grundregel (programvecka ${ctx.trainingWeek}): inkludera "marker" (id: marker) som första övning på MINST 3 av veckans träningsdagar. Mål: ladda markören innan hunden förväntas svara på signaler. Utan laddad markör är all annan markering meningslös.`
}
