import { getGroqClient, GROQ_MODEL } from './client'
import { embedText } from './embed'
import { searchBreedChunks } from '@/lib/supabase/breed-chunks'
import { formatBreedProfile, formatCurrentPhase } from './breed-profiles'
import { GOAL_EXERCISE_IDS, GOAL_LABELS, GOAL_RULES } from '@/lib/training/goal-exercises'
import type { Breed, TrainingGoal, WeekPlan } from '@/types'

function allowedExerciseIdsForBreed(breed: Breed, ageWeeks?: number): string[] {
  const isPuppy = typeof ageWeeks === 'number' && ageWeeks > 0 && ageWeeks < 16

  if (breed === 'braque_francais') {
    return [
      'namn', 'inkallning', 'stoppsignal', 'stanna', 'hantering', 'socialisering',
      'stadga', 'orientering', 'kontrollerat_sok', 'impulskontroll',
      'koppel', 'ligg', 'sitt',
      ...(isPuppy ? [] : ['apportering', 'vatten']),
    ]
  }

  if (breed === 'labrador') {
    return [
      'namn', 'inkallning', 'stoppsignal', 'stanna', 'sitt', 'ligg',
      'koppel', 'hantering', 'socialisering', 'fokus',
      'apportering', // central rasinstinkt — tillgänglig från start
      ...(isPuppy ? [] : ['vatten']),
    ]
  }

  if (breed === 'italian_greyhound') {
    return [
      'namn', 'inkallning', 'stanna', 'sitt', 'ligg',
      'koppel', 'hantering', 'socialisering',
      'fokus', 'impulskontroll',
      // Ingen hunting/pointing/herding — rasen är sällskap/lure coursing
    ]
  }

  if (breed === 'miniature_american_shepherd') {
    return [
      'namn', 'inkallning', 'stoppsignal', 'stanna', 'sitt', 'ligg',
      'koppel', 'hantering', 'socialisering',
      'fokus', 'impulskontroll', 'stadga', 'orientering',
      'nosework',
      ...(isPuppy ? [] : ['vallning']), // introduseras från ungdomsfas och framåt
    ]
  }

  // Fallback för okända raser
  return [
    'namn', 'inkallning', 'sitt', 'ligg', 'stanna',
    'koppel', 'hantering', 'socialisering', 'stoppsignal',
    'fokus', 'apportering', 'vatten',
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

export function buildFallbackPlan(): WeekPlan {
  return {
    days: [
      { day: 'Måndag', exercises: [{ id: 'inkallning', label: 'Inkallning', desc: 'Kalla med glad röst', reps: 3 }, { id: 'sitt', label: 'Sitt', desc: 'Håll godis över nosen', reps: 5 }] },
      { day: 'Tisdag', rest: true },
      { day: 'Onsdag', exercises: [{ id: 'ligg', label: 'Ligg', desc: 'Sjunk ner från sitt', reps: 3 }, { id: 'namn', label: 'Namnträning', desc: 'Säg namn, belöna blick', reps: 5 }] },
      { day: 'Torsdag', exercises: [{ id: 'inkallning', label: 'Inkallning', desc: 'Kalla med glad röst', reps: 3 }] },
      { day: 'Fredag', rest: true },
      { day: 'Lördag', exercises: [{ id: 'sitt', label: 'Sitt', desc: 'Håll godis över nosen', reps: 5 }, { id: 'ligg', label: 'Ligg', desc: 'Sjunk ner från sitt', reps: 3 }] },
      { day: 'Söndag', exercises: [{ id: 'inkallning', label: 'Inkallning', desc: 'Kalla med glad röst', reps: 3 }] },
    ],
  }
}

export async function generateWeekPlan(
  breed: Breed,
  trainingWeek: number,
  ageWeeks?: number,
  goals?: TrainingGoal[],
  onboardingContext?: string,
  performanceSummary?: string,
  customExercises?: Array<{ exercise_id: string; label: string }>
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
  const allowedIds = [...new Set([...breedIds, ...goalIds])]

  const isPuppy = typeof ageWeeks === 'number' && ageWeeks > 0 && ageWeeks < 16

  const goalContext = goals && goals.length > 0
    ? `\nÄgarens mål: ${goals.map((g) => GOAL_LABELS[g]).join(', ')}. Anpassa övningsvalet efter dessa mål.\n`
    : ''

  const goalRules = goals && goals.length > 0
    ? goals.map((g) => GOAL_RULES[g] ? `Målregel (${GOAL_LABELS[g]}): ${GOAL_RULES[g]}` : null).filter(Boolean).join('\n')
    : ''

  const isMasAdult = breed === 'miniature_american_shepherd' && !(typeof ageWeeks === 'number' && ageWeeks < 26)

  const breedSpecificRule = breed === 'braque_francais'
    ? 'Rasregel (stående fågelhund): inkludera minst 1 av: stadga, orientering, kontrollerat_sok, impulskontroll under veckan.'
    : isMasAdult
    ? 'Rasregel (vallhund, ungdom/vuxen): inkludera vallning minst 1 dag per vecka. Inkludera impulskontroll och/eller stoppsignal minst 2 dagar. Varva rörelse med lugn-övningar.'
    : breed === 'miniature_american_shepherd'
    ? 'Rasregel (vallhund, valp): inkludera impulskontroll och hantering varje vecka. Inga direkta vallningsövningar ännu — bygg grunden.'
    : null

  const idRules = [
    breedSpecificRule,
    isPuppy
      ? 'Valpregel: inkludera hantering och socialisering flera dagar. Inga "tunga" distans/störnings-ökningar.'
      : null,
    goalRules || null,
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

  const systemPrompt = `Du är DogVantage träningsassistent för rasen ${breed}. Returnera veckoschema som JSON: {"days":[{"day":"Måndag","rest":false,"exercises":[{"id":"...","label":"...","desc":"...","reps":3}]},{"day":"Tisdag","rest":true},...]}

${formatBreedProfile(breed)}
${ageInfo}${typeof ageWeeks === 'number' && Number.isFinite(ageWeeks) ? formatCurrentPhase(ageWeeks) : ''}${goalContext}${onboardingSection}${performanceSection}${customSection}${documentContext ? `\n=== KÄLLDOKUMENT ===\n${documentContext}\n` : ''}
Regler: exakt 7 dagar (Måndag–Söndag) · 1–2 vilodagar (rest:true, inga exercises) · träningsdagar 2–3 exercises, reps 1–5 · id lowercase utan mellanslag · tillåtna id: ${[...allowedIds, ...customIds].join(', ')} · desc max 12 ord inkl. hur länge · programvecka ${trainingWeek}${idRules ? ` · ${idRules.replace(/\n/g, ' · ')}` : ''}`

  const completion = await getGroqClient().chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Veckoschema JSON för ${breed}, programvecka ${trainingWeek}` },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
    max_tokens: 900,
  })

  const raw = completion.choices[0].message.content ?? '{}'
  return parseWeekPlan(raw) ?? buildFallbackPlan()
}
