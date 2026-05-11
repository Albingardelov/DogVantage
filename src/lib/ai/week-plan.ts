import { getGeminiTextModel, jsonGenConfig } from './client'
import { embedText } from './embed'
import { searchBreedChunks } from '@/lib/supabase/breed-chunks'
import { formatBreedProfile, formatCurrentPhase } from './breed-profiles'
import { formatDevelopmentalContext, getMaxSessionMinutes } from '@/lib/training/developmental-context'
import { GOAL_EXERCISE_IDS, GOAL_LABELS, GOAL_RULES } from '@/lib/training/goal-exercises'
import {
  focusExerciseIds,
  focusPromptRule,
  type WeeklyFocusArea,
} from '@/lib/training/weekly-focus'
import type { Breed, DogSex, CastrationStatus, TrainingGoal, WeekPlan, HouseholdPet } from '@/types'

// Bump this when plan generation logic changes significantly — forces cache invalidation
export const PLAN_VERSION = 'v7'

/**
 * R+ foundation exercises that should be available for every breed and age.
 * marker = lärs ut innan luring så hunden förstår markörsignalen
 * Puppy fundamentals (rastning/bett/box/ensam) tas direkt av nybörjarägaren
 * och AI:n kan inkludera dem för valpar.
 */
const FOUNDATION_EXERCISES = ['marker']
const PUPPY_FUNDAMENTALS = ['rastning', 'bett_inhibition', 'box_traning', 'ensam_traning']

function allowedExerciseIdsForBreed(breed: Breed, ageWeeks?: number): string[] {
  const isPuppy = typeof ageWeeks === 'number' && ageWeeks > 0 && ageWeeks < 16
  const puppyExtras = isPuppy ? PUPPY_FUNDAMENTALS : []

  if (breed === 'braque_francais') {
    return [
      ...FOUNDATION_EXERCISES,
      'namn', 'inkallning', 'stoppsignal', 'stanna', 'hantering', 'socialisering',
      'stadga', 'orientering', 'kontrollerat_sok', 'impulskontroll',
      'koppel', 'ligg', 'sitt', 'plats', 'fri',
      ...puppyExtras,
      ...(isPuppy ? [] : ['apportering', 'vatten', 'fot']),
    ]
  }

  if (breed === 'labrador') {
    return [
      ...FOUNDATION_EXERCISES,
      'namn', 'inkallning', 'stoppsignal', 'stanna', 'sitt', 'ligg',
      'koppel', 'hantering', 'socialisering', 'fokus',
      'apportering', 'plats', 'fri', 'impulskontroll',
      ...puppyExtras,
      ...(isPuppy ? [] : ['vatten', 'fot']),
    ]
  }

  if (breed === 'italian_greyhound') {
    return [
      ...FOUNDATION_EXERCISES,
      'namn', 'inkallning', 'stanna', 'sitt', 'ligg',
      'koppel', 'hantering', 'socialisering',
      'fokus', 'impulskontroll', 'plats', 'fri',
      ...puppyExtras,
    ]
  }

  if (breed === 'miniature_american_shepherd') {
    return [
      ...FOUNDATION_EXERCISES,
      'namn', 'inkallning', 'stoppsignal', 'stanna', 'sitt', 'ligg',
      'koppel', 'hantering', 'socialisering',
      'fokus', 'impulskontroll', 'stadga', 'orientering',
      'nosework', 'plats', 'fri',
      ...puppyExtras,
      ...(isPuppy ? [] : ['vallning', 'fot']),
    ]
  }

  // Fallback för okända raser
  return [
    ...FOUNDATION_EXERCISES,
    'namn', 'inkallning', 'sitt', 'ligg', 'stanna',
    'koppel', 'hantering', 'socialisering', 'stoppsignal',
    'fokus', 'apportering', 'vatten', 'fot', 'plats', 'fri', 'impulskontroll',
    ...puppyExtras,
  ]
}

function syncRepsFromDesc(exercise: import('@/types').Exercise): import('@/types').Exercise {
  const match = exercise.desc?.match(/^(\d+)\s*[×x]/i)
  if (match) return { ...exercise, reps: Number(match[1]) }
  return exercise
}

export function parseWeekPlan(raw: string): WeekPlan | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!Array.isArray(parsed.days) || parsed.days.length !== 7) return null
    const plan = parsed as unknown as WeekPlan
    plan.days = plan.days.map((d) => ({
      ...d,
      exercises: d.exercises?.map(syncRepsFromDesc),
    }))
    return plan
  } catch {
    return null
  }
}


export async function generateWeekPlan(
  breed: Breed,
  trainingWeek: number,
  ageWeeks?: number,
  goals?: TrainingGoal[],
  onboardingContext?: string,
  performanceSummary?: string,
  customExercises?: Array<{ exercise_id: string; label: string }>,
  householdPets?: HouseholdPet[],
  weeklyFocus?: WeeklyFocusArea[],
  dogSex?: DogSex,
  castrationStatus?: CastrationStatus,
  isInHeat?: boolean,
  skenfasActive?: boolean,
  progressionRule?: string | null,
): Promise<WeekPlan> {
  let chunks: import('@/types').ChunkMatch[] = []
  try {
    const embedding = await embedText(`träning programvecka ${trainingWeek} ${breed}`)
    chunks = await searchBreedChunks(embedding, breed)
  } catch {
    // Continue without RAG chunks if embedding fails
  }

  const documentContext = chunks.length > 0
    ? chunks.map((c) => `${c.content}\n[Källa: ${c.source}]`).join('\n\n')
    : ''

  const breedIds = allowedExerciseIdsForBreed(breed, ageWeeks)
  const goalIds = goals && goals.length > 0
    ? goals.flatMap((g) => GOAL_EXERCISE_IDS[g] ?? [])
    : []
  // Always unlock pet-relevant exercises so the pet rule never contradicts allowedIds
  const petIds = householdPets && householdPets.length > 0
    ? ['socialisering', 'impulskontroll', 'fokus', 'plats']
    : []
  const focusIds = weeklyFocus && weeklyFocus.length > 0 ? focusExerciseIds(weeklyFocus) : []
  const allowedIds = [...new Set([...breedIds, ...goalIds, ...petIds, ...focusIds])]

  const isPuppy = typeof ageWeeks === 'number' && ageWeeks > 0 && ageWeeks < 16

  const goalContext = goals && goals.length > 0
    ? `\nÄgarens mål: ${goals.map((g) => GOAL_LABELS[g]).join(', ')}. Anpassa övningsvalet efter dessa mål.\n`
    : ''

  const goalRules = goals && goals.length > 0
    ? goals.map((g) => GOAL_RULES[g] ? `Målregel (${GOAL_LABELS[g]}): ${GOAL_RULES[g]}` : null).filter(Boolean).join('\n')
    : ''

  const isMasAdult = breed === 'miniature_american_shepherd' && !(typeof ageWeeks === 'number' && ageWeeks < 26)

  const isIntactMaleAdolescent =
    dogSex === 'male' &&
    castrationStatus === 'intact' &&
    typeof ageWeeks === 'number' &&
    ageWeeks >= 28 && ageWeeks <= 78 // ~7–18 månader

  const breedSpecificRule = breed === 'braque_francais'
    ? 'Rasregel (stående fågelhund): inkludera minst 1 av: stadga, orientering, kontrollerat_sok, impulskontroll under veckan.'
    : isMasAdult
    ? 'Rasregel (vallhund, ungdom/vuxen): inkludera vallning minst 1 dag per vecka. Inkludera impulskontroll och/eller stoppsignal minst 2 dagar. Varva rörelse med lugn-övningar.'
    : breed === 'miniature_american_shepherd'
    ? 'Rasregel (vallhund, valp): inkludera impulskontroll och hantering varje vecka. Inga direkta vallningsövningar ännu — bygg grunden.'
    : null

  const hasCats = householdPets?.some((p) => p === 'cats_indoor' || p === 'cats_outdoor')
  const hasOutdoorCats = householdPets?.includes('cats_outdoor')
  const hasSmallAnimals = householdPets?.includes('small_animals')
  const hasLivestock = householdPets?.includes('livestock')

  const petRule = hasCats
    ? `Husdjursregel (katter i hemmet): inkludera socialisering OCH impulskontroll varje träningsdag (båda är tillåtna id). Lägg in plats minst 2 dagar. Skriv "katt" i desc för dessa övningar, t.ex. "Socialisering: lugn katt synlig, 3 min". Mål: valpen lär sig att katter är neutrala.${hasOutdoorCats ? ' Inkludera dessutom stoppsignal varje träningsdag.' : ''}`
    : hasSmallAnimals
    ? 'Husdjursregel (smådjur): inkludera impulskontroll och fokus varje träningsdag (båda är tillåtna id). Skriv "smådjur" i desc. Bygg artfrid.'
    : hasLivestock
    ? 'Husdjursregel (gårdsdjur): inkludera stoppsignal och impulskontroll varje träningsdag (båda är tillåtna id). Introduktion till boskap sker kontrollerat.'
    : null

  const focusRule = weeklyFocus && weeklyFocus.length > 0 ? focusPromptRule(weeklyFocus) : null

  const sexRule = isInHeat
    ? 'Könsregel (tik i löp): förkorta alla pass till max 5 min, undvik socialisering med okända hundar, prioritera impulskontroll och lugna inomhusövningar. Skriv "löp" i desc för berörda övningar.'
    : skenfasActive
    ? 'Könsregel (skenfas-fönster): tiken kan visa beteendeförändringar (ökad distraktion, mild agitation). Håll lågstimulans-träning, prioritera plats och impulskontroll. Undvik att introducera nya svåra övningar.'
    : isIntactMaleAdolescent
    ? 'Könsmognadsregel (intakt hane, 7–18 mån): ökad hormonstimulans kan ge distraktion och rivalitet. Inkludera impulskontroll minst 3 dagar. Håll pass korta (5–8 min). Öka inte kriterier snabbt — konsolidera befintliga beteenden.'
    : null

  // R+-grundregler: marker måste laddas innan andra övningar bygger på den.
  // Vecka 1–3 är "foundation phase" där hunden lär sig markörsignalen.
  const markerRule = trainingWeek <= 3
    ? `R+-grundregel (programvecka ${trainingWeek}): inkludera "marker" (id: marker) som första övning på MINST 3 av veckans träningsdagar. Mål: ladda markören innan hunden förväntas svara på signaler. Utan laddad markör är all annan markering meningslös.`
    : null

  // Förstärkningsschema: byt från CRF (kontinuerlig) till variabel under konsolideringsfasen.
  const scheduleRule = trainingWeek >= 4
    ? 'Förstärkningsschema: när ett beteende är pålitligt på en kriterienivå (~80% lyckade reps över 3 pass) — börja belöna ungefär 2 av 3 reps istället för varje. Hög motivation utan att hunden tappar engagemanget. Vid stort genombrott (första gången på svår nivå): jackpot — 5 godis i rad. Förklara detta i desc där det är relevant ("varje annan rep" / "jackpot på första lyckad").'
    : 'Förstärkningsschema (vecka 1–3): belöna VARJE lyckad rep (CRF, continuous reinforcement). Du bygger associationen mellan beteendet och belöningen — variabel förstärkning kommer senare.'

  // Capturing vs. luring: när luring sitter, fasa ut till capturing/handsignal.
  const capturingRule = trainingWeek >= 3
    ? 'Capturing vs. luring: för sitt/ligg/plats — inkludera laddertrappstegen "fasa ut locket" och "fånga erbjudet beteende" istället för att fastna i luring. Lure-beroende hund följer maten, inte signalen.'
    : null

  // Developmental window: fear periods, teething, adolescent regression
  const developmentalRule = typeof ageWeeks === 'number'
    ? formatDevelopmentalContext(ageWeeks)
    : null

  // Hard session-length cap for very young puppies (under 12 weeks: 60–90 sec micro-sessions)
  const sessionCap = typeof ageWeeks === 'number'
    ? `Passlängdsregel (ålder ${ageWeeks} v): MAX ${getMaxSessionMinutes(ageWeeks)} min per pass i desc-fältet. Korta micro-sessions för valpar under 12 v.`
    : null

  const idRules = [
    progressionRule,    // deterministic advance/hold/regress decisions
    developmentalRule,  // fear periods + adolescence
    sessionCap,
    markerRule,
    scheduleRule,
    capturingRule,
    breedSpecificRule,
    isPuppy
      ? 'Valpregel: inkludera hantering och socialisering flera dagar. Inga "tunga" distans/störnings-ökningar.'
      : null,
    goalRules || null,
    petRule,
    focusRule,
    sexRule,
  ].filter(Boolean).join('\n')

  const customSection = customExercises && customExercises.length > 0
    ? `\n=== EGNA ÖVNINGAR (inkludera om lämpligt, max 1 per dag) ===\n${customExercises.map((e) => `- ${e.exercise_id}: ${e.label}`).join('\n')}\n`
    : ''

  const customIds = customExercises?.map((e) => e.exercise_id) ?? []

  const ageInfo = typeof ageWeeks === 'number' && Number.isFinite(ageWeeks)
    ? `\nBiologisk ålder: ${ageWeeks} veckor. Anpassa belastning, passlängd och förväntningar efter detta.\n`
    : ''

  const onboardingSection = onboardingContext
    ? `\n=== TRÄNARKONTEXT ===\n${onboardingContext}\n`
    : ''

  const performanceSection = performanceSummary
    ? `\n=== SENASTE PRESTATION (anpassa nästkommande vecka efter detta) ===\n${performanceSummary}\nJustera svårighetsgrad och val av övningar baserat på ovanstående.\n`
    : ''

  const systemPrompt = `Du är DogVantage träningsassistent för rasen ${breed}. Returnera ett veckoschema som giltig JSON.

${formatBreedProfile(breed)}
${ageInfo}${typeof ageWeeks === 'number' && Number.isFinite(ageWeeks) ? formatCurrentPhase(ageWeeks) : ''}${goalContext}${onboardingSection}${performanceSection}${customSection}${documentContext ? `\n=== KÄLLDOKUMENT ===\n${documentContext}\n` : ''}
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
- Programvecka ${trainingWeek}; anpassa övningar till rasens egenskaper${idRules ? `\n- ${idRules.replace(/\n/g, '\n- ')}` : ''}`

  const result = await getGeminiTextModel().generateContent({
    contents: [{ role: 'user', parts: [{ text: `Veckoschema JSON för ${breed}, programvecka ${trainingWeek}` }] }],
    systemInstruction: systemPrompt,
    generationConfig: jsonGenConfig(0.3, 8192),
  })

  const raw = result.response.text() ?? '{}'
  const plan = parseWeekPlan(raw)
  if (!plan) {
    console.error('[generateWeekPlan] AI returned unparseable plan:', raw.slice(0, 300))
    throw new Error('AI returned invalid plan structure')
  }
  return plan
}
