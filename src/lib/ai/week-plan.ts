import { getGroqClient, GROQ_MODEL } from './client'
import { embedText } from './embed'
import { searchBreedChunks } from '@/lib/supabase/breed-chunks'
import { formatBreedProfile, formatCurrentPhase } from './breed-profiles'
import type { Breed, TrainingGoal, WeekPlan } from '@/types'

const GOAL_EXERCISE_IDS: Record<TrainingGoal, string[]> = {
  everyday_obedience: ['namn', 'inkallning', 'koppel', 'stanna', 'hantering', 'socialisering'],
  sport: ['namn', 'stanna', 'sitt', 'ligg', 'inkallning', 'fokus', 'apportering'],
  hunting: ['inkallning', 'stoppsignal', 'stadga', 'orientering', 'kontrollerat_sok', 'apportering', 'vatten'],
  problem_solving: ['koppel', 'inkallning', 'stadga', 'impulskontroll', 'orientering', 'fokus'],
}

const GOAL_LABELS: Record<TrainingGoal, string> = {
  everyday_obedience: 'Vardagslydnad',
  sport: 'Sport / tävling',
  hunting: 'Jakt / bruk',
  problem_solving: 'Lösa problem (koppel/inkallning)',
}

const GOAL_RULES: Record<TrainingGoal, string> = {
  everyday_obedience: 'Inkludera vardagsrelevanta övningar som koppel, inkallning, hantering.',
  sport: 'Prioritera precision och snabbhet: sitt, ligg, fokus, inkallning med hög kriterienivå.',
  hunting: 'Inkludera minst en av: stadga, orientering, kontrollerat_sok, stoppsignal per träningsdag.',
  problem_solving: 'Fokusera på impulskontroll, koppelgång och inkallning i utmanande miljöer.',
}

function allowedExerciseIdsForBreed(breed: Breed, ageWeeks?: number): string[] {
  if (breed === 'braque_francais') {
    const isPuppy = typeof ageWeeks === 'number' && ageWeeks > 0 && ageWeeks < 16
    return [
      // foundation
      'namn',
      'inkallning',
      'stoppsignal',
      'stanna',
      'hantering',
      'socialisering',
      // gundog/pointing-specific blocks (curated)
      'stadga',
      'orientering',
      'kontrollerat_sok',
      'impulskontroll',
      // misc/common
      'koppel',
      'ligg',
      'sitt',
      ...(isPuppy ? [] : ['apportering', 'vatten']),
    ]
  }

  return [
    'namn',
    'inkallning',
    'sitt',
    'ligg',
    'stanna',
    'koppel',
    'hantering',
    'socialisering',
    'stoppsignal',
    'fokus',
    'apportering',
    'vatten',
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
  goals?: TrainingGoal[]
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
    ? goals.map((g) => `Målregel (${GOAL_LABELS[g]}): ${GOAL_RULES[g]}`).join('\n')
    : ''

  const idRules = [
    breed === 'braque_francais'
      ? 'Rasregel (stående fågelhund): inkludera minst 1 av: stadga, orientering, kontrollerat_sok, impulskontroll under veckan.'
      : null,
    isPuppy
      ? 'Valpregel: inkludera hantering och socialisering flera dagar. Inga “tunga” distans/störnings-ökningar.'
      : null,
    goalRules || null,
  ].filter(Boolean).join('\n')

  const ageInfo = typeof ageWeeks === 'number' && Number.isFinite(ageWeeks)
    ? `\nBiologisk ålder: ${ageWeeks} veckor. Anpassa belastning, passlängd och förväntningar efter detta.\n`
    : ''

  const systemPrompt = `Du är DogVantage träningsassistent för rasen ${breed}. Returnera ett veckoschema som giltig JSON.

${formatBreedProfile(breed)}
${ageInfo}${typeof ageWeeks === 'number' && Number.isFinite(ageWeeks) ? formatCurrentPhase(ageWeeks) : ''}${goalContext}
${documentContext ? `\n=== KÄLLDOKUMENT ===\n${documentContext}\n` : ''}
Returnera ENBART detta JSON-schema (inga förklaringar, inga kommentarer):
{
  "days": [
    { "day": "Måndag", "rest": false, "exercises": [
      { "id": "inkallning", "label": "Inkallning", "desc": "Kalla med glad röst", "reps": 3 }
    ]},
    { "day": "Tisdag", "rest": true }
  ]
}

Regler:
- Exakt 7 dagar i ordning: Måndag, Tisdag, Onsdag, Torsdag, Fredag, Lördag, Söndag
- Träningsdagar: 2–3 exercises, reps 1–5
- Vilodagar: rest: true, utelämna exercises
- Minst 1 och max 2 vilodagar per vecka
- id: lowercase, inga mellanslag, inga specialtecken (t.ex. "inkallning", "apportering")
- Tillåtna id för rasen ${breed}: ${allowedIds.join(', ')}
- Använd bara id från listan ovan (om osäker: välj "inkallning", "namn", "stoppsignal", "stadga")
- desc: max 12 ord på svenska — inkludera ALLTID hur länge (t.ex. "5 min per gång", "3 × 1 min", "10–15 min")
- Detta är programvecka ${trainingWeek}. Anpassa fokus och progression till programveckan, men låt biologisk ålder styra belastning.\n- Anpassa övningarna till rasens egenskaper${idRules ? `\n${idRules}\n` : ''}`

  const completion = await getGroqClient().chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Veckoschema JSON för ${breed}, programvecka ${trainingWeek}` },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0].message.content ?? '{}'
  return parseWeekPlan(raw) ?? buildFallbackPlan()
}
