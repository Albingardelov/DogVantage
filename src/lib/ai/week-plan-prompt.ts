import { formatCurrentPhase, formatBreedProfileShort } from './breed-profiles'
import { GOAL_EXERCISE_IDS, GOAL_LABELS } from '@/lib/training/goal-exercises'
import { focusExerciseIds } from '@/lib/training/weekly-focus'
import { isPuppy as isPuppyAge } from '@/lib/dog/age'
import { composeRules, ALL_RULES } from '@/lib/training/rules'
import { buildWeekContext, type WeekPlanInput } from '@/lib/training/week-context'

const FOUNDATION_EXERCISES = ['marker']
const PUPPY_FUNDAMENTALS = ['rastning', 'bett_inhibition', 'box_traning', 'ensam_traning']
const REACTIVE_EXERCISES = ['lat']

export function buildWeekPromptParts(input: WeekPlanInput & { documentContext?: string }) {
  const ctx = buildWeekContext(input)
  const isPuppy = isPuppyAge(input.ageWeeks)
  const breedIds = allowedExerciseIdsForBreed(input.breed, input.ageWeeks)
  const goalIds = ctx.goals.length > 0 ? ctx.goals.flatMap((g) => GOAL_EXERCISE_IDS[g] ?? []) : []
  const petIds = ctx.householdPets.length > 0 ? ['socialisering', 'impulskontroll', 'fokus', 'plats'] : []
  const focusIds = ctx.weeklyFocus.length > 0 ? focusExerciseIds(ctx.weeklyFocus) : []
  const reactiveIds = ctx.isReactive ? REACTIVE_EXERCISES : []
  const allowedIds = [...new Set([...breedIds, ...goalIds, ...petIds, ...focusIds, ...reactiveIds])]

  const goalContext = ctx.goals.length > 0
    ? `\nÄgarens mål: ${ctx.goals.map((g) => GOAL_LABELS[g]).join(', ')}. Anpassa övningsvalet efter dessa mål.\n`
    : ''
  const idRules = composeRules(ctx, ALL_RULES)
  const customIds = ctx.customExercises.map((e) => e.exercise_id)
  const customSection = ctx.customExercises.length > 0
    ? `\n=== EGNA ÖVNINGAR (inkludera om lämpligt, max 1 per dag) ===\n${ctx.customExercises.map((e) => `- ${e.exercise_id}: ${e.label}`).join('\n')}\n`
    : ''
  const ageInfo = typeof input.ageWeeks === 'number' && Number.isFinite(input.ageWeeks)
    ? `\nBiologisk ålder: ${input.ageWeeks} veckor. Anpassa belastning, passlängd och förväntningar efter detta.\n`
    : ''
  const onboardingSection = input.onboardingContext
    ? `\n=== TRÄNARKONTEXT ===\n${input.onboardingContext}\n`
    : ''
  const performanceSection = input.performanceSummary
    ? `\n=== SENASTE PRESTATION (anpassa nästkommande vecka efter detta) ===\n${input.performanceSummary}\nJustera svårighetsgrad och val av övningar baserat på ovanstående.\n`
    : ''
  const systemPrompt = `Du är DogVantage träningsassistent för rasen ${input.breed}. Returnera ett veckoschema som giltig JSON.

${formatBreedProfileShort(input.breed)}
${ageInfo}${typeof input.ageWeeks === 'number' && Number.isFinite(input.ageWeeks) ? formatCurrentPhase(input.ageWeeks) : ''}${goalContext}${onboardingSection}${performanceSection}${customSection}${input.documentContext ? `\n=== KÄLLDOKUMENT ===\n${input.documentContext}\n` : ''}
Returnera ENBART JSON i detta format (inga förklaringar):
{"days":[
  {"day":"Måndag","rest":false,"exercises":[{"id":"inkallning","label":"Inkallning","desc":"Kalla med glad röst, 3 min","reps":3}]},
  {"day":"Tisdag","rest":true},
  {"day":"Onsdag","rest":false,"exercises":[{"id":"sitt","label":"Sitt","desc":"Håll godis över nosen, 5 min","reps":5}]},
  {"day":"Torsdag","rest":false,"exercises":[{"id":"namn","label":"Namnkontakt","desc":"Säg namn, belöna blick, 3 min","reps":5}]},
  {"day":"Fredag","rest":true},
  {"day":"Lördag","rest":false,"exercises":[{"id":"stanna","label":"Stanna","desc":"En hand upp, 1–2 min","reps":3}]},
  {"day":"Söndag","rest":false,"exercises":[{"id":"inkallning","label":"Inkallning","desc":"Öka avstånd, 5 min","reps":3}]}
]}

Regler:
- Exakt 7 dagar i ordning: Måndag–Söndag
- 1–2 vilodagar: rest:true, utelämna exercises
- Träningsdagar: 2–3 exercises, reps 1–5
- id lowercase, inga mellanslag; tillåtna id: ${[...allowedIds, ...customIds].join(', ')}
- desc max 12 ord på svenska, inkludera hur länge
- VARIATION: samma id max 2 gånger per vecka — sprid ut övningarna, undvik att upprepa samma kombination två dagar i rad
- FRI-SIGNAL: varje dag som innehåller sitt, ligg, stanna eller plats MÅSTE också innehålla fri (id: fri) som sista eller näst sista exercise — de tränas alltid ihop
- Programvecka ${input.trainingWeek}; anpassa övningar till rasens egenskaper${idRules ? `\n- ${idRules.replace(/\n/g, '\n- ')}` : ''}`

  return { systemPrompt, isPuppy }
}

function allowedExerciseIdsForBreed(breed: string, ageWeeks?: number): string[] {
  const isPuppy = isPuppyAge(ageWeeks)
  const puppyExtras = isPuppy ? PUPPY_FUNDAMENTALS : []

  if (breed === 'braque_francais') return [
    ...FOUNDATION_EXERCISES, 'namn', 'inkallning', 'stoppsignal', 'stanna', 'hantering', 'socialisering',
    'stadga', 'orientering', 'kontrollerat_sok', 'impulskontroll', 'koppel', 'ligg', 'sitt', 'plats', 'fri',
    ...puppyExtras, ...(isPuppy ? [] : ['apportering', 'vatten', 'fot']),
  ]
  if (breed === 'labrador') return [
    ...FOUNDATION_EXERCISES, 'namn', 'inkallning', 'stoppsignal', 'stanna', 'sitt', 'ligg', 'koppel', 'hantering',
    'socialisering', 'fokus', 'apportering', 'plats', 'fri', 'impulskontroll', ...puppyExtras, ...(isPuppy ? [] : ['vatten', 'fot']),
  ]
  if (breed === 'italian_greyhound') return [
    ...FOUNDATION_EXERCISES, 'namn', 'inkallning', 'stanna', 'sitt', 'ligg', 'koppel', 'hantering',
    'socialisering', 'fokus', 'impulskontroll', 'plats', 'fri', ...puppyExtras,
  ]
  if (breed === 'miniature_american_shepherd') return [
    ...FOUNDATION_EXERCISES, 'namn', 'inkallning', 'stoppsignal', 'stanna', 'sitt', 'ligg', 'koppel', 'hantering',
    'socialisering', 'fokus', 'impulskontroll', 'stadga', 'orientering', 'nosework', 'plats', 'fri',
    ...puppyExtras, ...(isPuppy ? [] : ['vallning', 'fot']),
  ]
  return [
    ...FOUNDATION_EXERCISES, 'namn', 'inkallning', 'sitt', 'ligg', 'stanna', 'koppel', 'hantering', 'socialisering',
    'stoppsignal', 'fokus', 'apportering', 'vatten', 'fot', 'plats', 'fri', 'impulskontroll', ...puppyExtras,
  ]
}
