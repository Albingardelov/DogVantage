import { embedText } from './embed'
import { groq, GROQ_MODEL } from './client'
import { searchBreedChunks } from '@/lib/supabase/breed-chunks'
import type { Breed, TrainingResult } from '@/types'

const VET_KEYWORDS = [
  'haltar', 'kräks', 'äter inte', 'blöder', 'veterinär',
  'sjuk', 'ont', 'skada', 'hälta', 'kräkningar', 'diarré',
]

const VET_RESPONSE: TrainingResult = {
  content:
    'Det verkar handla om ett hälsoproblem. DogVantage ger inte medicinska råd — kontakta din veterinär.',
  source: '',
  source_url: '',
}

function isHealthQuery(query: string): boolean {
  const lower = query.toLowerCase()
  return VET_KEYWORDS.some((kw) => lower.includes(kw))
}

export async function queryRAG(
  query: string,
  breed: Breed,
  recentLogs: string[] = []
): Promise<TrainingResult> {
  if (isHealthQuery(query)) return VET_RESPONSE

  const embedding = await embedText(query)
  const chunks = await searchBreedChunks(embedding, breed)

  const context = chunks
    .map((c) => {
      const ref = [c.doc_version, c.page_ref].filter(Boolean).join(', ')
      return `${c.content}\n[Källa: ${c.source}${ref ? ` (${ref})` : ''}${c.source_url ? ` — ${c.source_url}` : ''}]`
    })
    .join('\n\n')

  const primaryChunk = chunks[0]
  const primarySource = primaryChunk
    ? `${primaryChunk.source}${primaryChunk.doc_version ? ` (${primaryChunk.doc_version})` : ''}`
    : 'okänd källa'
  const primarySourceUrl = primaryChunk?.source_url ?? ''

  const logsSection =
    recentLogs.length > 0
      ? `\nSenaste träningspass:\n${recentLogs.map((l) => `- ${l}`).join('\n')}\n\nAnpassa rekommendationen utifrån hundens faktiska prestation ovan.`
      : ''

  const prompt = `Du är en expert på hundträning specialiserad på ${breed}.
Basera ditt svar ENBART på följande källdokument från rasklubben.
Om svaret inte finns i källorna, säg det tydligt.
Citera källan (dokumentnamn, version, sida) i ditt svar.
Svara på svenska.

Källdokument:
${context}
${logsSection}
Fråga: ${query}`

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
  })
  const content = completion.choices[0].message.content ?? ''

  return { content, source: primarySource, source_url: primarySourceUrl }
}
