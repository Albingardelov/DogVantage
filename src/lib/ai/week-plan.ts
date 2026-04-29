import { groq, GROQ_MODEL } from './client'
import { embedText } from './embed'
import { searchBreedChunks } from '@/lib/supabase/breed-chunks'
import { formatBreedProfile, formatCurrentPhase } from './breed-profiles'
import type { Breed, WeekPlan } from '@/types'

export function parseWeekPlan(raw: string): WeekPlan | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!Array.isArray(parsed.days) || parsed.days.length !== 7) return null
    return parsed as unknown as WeekPlan
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

export async function generateWeekPlan(breed: Breed, weekNumber: number): Promise<WeekPlan> {
  let chunks: import('@/types').ChunkMatch[] = []
  try {
    const embedding = await embedText(`träning vecka ${weekNumber} ${breed}`)
    chunks = await searchBreedChunks(embedding, breed)
  } catch {
    // Continue without RAG chunks if embedding fails
  }

  const documentContext = chunks.length > 0
    ? chunks.map((c) => `${c.content}\n[Källa: ${c.source}]`).join('\n\n')
    : ''

  const systemPrompt = `Du är DogVantage träningsassistent för rasen ${breed}. Returnera ett veckoschema som giltig JSON.

${formatBreedProfile(breed)}
${formatCurrentPhase(weekNumber)}
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
- desc: max 8 ord på svenska
- Anpassa övningarna till hundens vecka ${weekNumber} och rasens egenskaper`

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Veckoschema JSON för ${breed}, vecka ${weekNumber}` },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0].message.content ?? '{}'
  return parseWeekPlan(raw) ?? buildFallbackPlan()
}
