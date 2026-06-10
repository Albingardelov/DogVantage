import { embedText } from './embed'
import { getGroqClient, GROQ_MODEL } from './client'
import { searchBreedChunks } from '@/lib/supabase/breed-chunks'
import { formatBreedProfileShort, formatCurrentPhaseShort } from './breed-profiles'
import {
  detectHealthIssue,
  detectBehaviorEmergency,
  VET_RESPONSE,
  BEHAVIOR_RESPONSE,
} from './safety-guards'
import type { Breed, ChunkMatch, TrainingResult, TrainingSourceRef } from '@/types'

const MIN_DOCUMENT_SIMILARITY = 0.72

const FOUNDATIONAL_OBEDIENCE_TERMS = [
  'sitt',
  'ligg',
  'stanna',
  'plats',
  'inkallning',
  'kom',
  'kom hit',
  'gående i koppel',
  'gå fint',
  'vardagslydnad',
  'lydnad',
  'sit',
  'down',
  'stay',
  'recall',
  'heel',
  'loose leash',
] as const

const FOUNDATIONAL_OBEDIENCE_SOURCES = new Set<string>([
  'avsab-humane-dog-training-2021.pdf',
  'avsab-puppy-socialization-2024.pdf',
  'rspca-basic-commands.pdf',
  'rspca-recall.pdf',
  'akc-star-puppy-6-weeks.pdf',
])

function isFoundationalObedienceQuery(query: string): boolean {
  const normalized = query.toLowerCase()
  return FOUNDATIONAL_OBEDIENCE_TERMS.some((term) => normalized.includes(term))
}

function priorityScoreForChunk(chunk: ChunkMatch): number {
  if (FOUNDATIONAL_OBEDIENCE_SOURCES.has(chunk.source)) return 3

  const url = (chunk.source_url ?? '').toLowerCase()
  if (url.includes('avsab.org') || url.includes('rspca.org.uk') || url.includes('images.akc.org/pdf/star_puppy/')) {
    return 3
  }

  return 0
}

function rankChunksForQuery(chunks: ChunkMatch[], query: string): ChunkMatch[] {
  if (!isFoundationalObedienceQuery(query)) {
    return chunks
  }

  // For obedience questions, favor curated beginner-obedience sources while
  // keeping semantic similarity as the dominant ranking factor.
  return [...chunks].sort((a, b) => {
    const weightedA = a.similarity + priorityScoreForChunk(a) * 0.1
    const weightedB = b.similarity + priorityScoreForChunk(b) * 0.1
    return weightedB - weightedA
  })
}

function hasReliableSimilarity(chunk: ChunkMatch): boolean {
  return Number.isFinite(chunk.similarity) && chunk.similarity >= MIN_DOCUMENT_SIMILARITY
}

function isHowToQuery(query: string): boolean {
  const normalized = query.toLowerCase()
  const cues = ['hur', 'steg', 'plan', 'träna', 'övning', 'hjälp', 'fixa']
  return cues.some((cue) => normalized.includes(cue))
}

function chunksToSourceRefs(chunks: ChunkMatch[]): TrainingSourceRef[] {
  const seen = new Set<string>()
  const out: TrainingSourceRef[] = []
  for (const c of chunks) {
    const key =
      c.source_url && c.source_url.length > 0
        ? c.source_url
        : `${c.source}|${c.doc_version}|${c.page_ref}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      source: c.source,
      source_url: c.source_url ?? '',
      doc_version: c.doc_version,
      page_ref: c.page_ref,
    })
  }
  return out
}

// ─── Main RAG query ───────────────────────────────────────────────────────────
export async function queryRAG(
  query: string,
  breed: Breed,
  recentLogs: string[] = [],
  weekAge?: number,
  todayMetrics: string[] = [],
  onboardingContext?: string
): Promise<TrainingResult> {
  if (detectHealthIssue(query)) return VET_RESPONSE
  // Behaviour-emergency check: short-circuit if either the query OR the
  // owner-supplied profile context (ownerNotes / problemNotes baked into
  // onboardingContext) describes a case that needs a professional.
  if (detectBehaviorEmergency(query) || detectBehaviorEmergency(onboardingContext)) {
    return BEHAVIOR_RESPONSE
  }

  // 1. Embed the query and retrieve breed-specific document chunks.
  // We only return training guidance when the query has reliable document support.
  const matchCount = query.length > 80 ? 6 : 3
  const obedienceQuery = isFoundationalObedienceQuery(query)
  const retrievalCount = obedienceQuery ? Math.max(matchCount * 4, 12) : matchCount
  let chunks: ChunkMatch[] = []
  try {
    const embedding = await embedText(query)
    const retrieved = await searchBreedChunks(embedding, breed, retrievalCount)
    const ranked = rankChunksForQuery(retrieved, query)
    chunks = ranked.filter(hasReliableSimilarity).slice(0, matchCount)
  } catch {
    // If we cannot retrieve evidence, we do not generate unsupported guidance.
  }

  // 2. Build the "ritning" (blueprint) — breed profile + training phase
  const breedProfile = formatBreedProfileShort(breed)
  const phaseInfo = weekAge != null ? `\n${formatCurrentPhaseShort(weekAge)}` : ''

  // 3. Build the document context from RAG (when available)
  const hasChunks = chunks.length > 0
  const documentContext = hasChunks
    ? chunks
        .map((c) => {
          const ref = [c.doc_version, c.page_ref].filter(Boolean).join(', ')
          return `${c.content}\n[Källa: ${c.source}${ref ? ` (${ref})` : ''}${c.source_url ? ` — ${c.source_url}` : ''}]`
        })
        .join('\n\n')
    : ''

  // 4. Build the logs section — personalise based on recent sessions
  const logsSection =
    recentLogs.length > 0
      ? `\n=== SENASTE TRÄNINGSPASS ===\n${recentLogs.map((l) => `• ${l}`).join('\n')}\nAnpassa rekommendationerna utifrån hundens faktiska prestation ovan.\n`
      : ''

  const metricsSection =
    todayMetrics.length > 0
      ? `\n=== DAGENS TRÄNINGSMETRIK ===\n${todayMetrics.map((m) => `• ${m}`).join('\n')}\nAnvänd metrik för att föreslå om kriteriet ska höjas/sänkas.\n`
      : ''

  // 5. Compose the two-layer prompt
  //
  //    Layer A — "Verktyget" (the method): general, evidence-based training
  //              methodology. The model uses its own knowledge here — we do NOT
  //              restrict to only the documents, because general puppy training
  //              methodology (positive reinforcement, shaping, timing etc.) is
  //              well-established and doesn't need to come from breed club PDFs.
  //
  //    Layer B — "Ritningen" (the blueprint): breed-specific expectations from
  //              standards and tradition. This comes from our curated profile and
  //              from any retrieved document chunks.
  const onboardingSection = onboardingContext
    ? `\n=== TRÄNARKONTEXT ===\n${onboardingContext}\nAnpassa råden (träningsmetod, belöningsval, miljö) utifrån ovanstående.\n`
    : ''
  const howToQuery = isHowToQuery(query)
  const responseFormat = howToQuery
    ? 'Svarsmall för momentfrågor: 1) Mål 2) Setup nu 3) Nästa 3–5 reps (numrerat) 4) När höja/sänka kriteriet 5) Stoppsignal 6) Vad som ska loggas i appen 7) En kort följdfråga till föraren.'
    : 'Använd punktlistor när det passar.'
  const lengthRule = howToQuery
    ? 'Var koncis men praktisk — 120–280 ord.'
    : 'Var koncis — 60–150 ord för enkla frågor, max 250 för komplexa.'

  const systemPrompt = `Du är DogVantage träningsassistent för rasen ${breed}. Metod: R+, shaping, laddad markörsignal (event marker — "ja!" eller klick som förutsäger belöning), capturing där det går (vänta in beteendet istället för att locka), inga korrektioner, korta pass — anpassat till rasens känslighet i profilen nedan. Förstärkningsschema: CRF (varje rep) tills beteendet är stabilt → variabel (2 av 3) på pålitlig nivå → jackpot vid genombrott.

=== RASPROFIL ===
${breedProfile}
${phaseInfo}
${documentContext ? `\n=== KÄLLDOKUMENT ===\n${documentContext}\n` : ''}${onboardingSection}${metricsSection}${logsSection}
Regler: svara på svenska, anpassa till hundens ålder i veckor. ${lengthRule} ${responseFormat} Nämn källnamn om KÄLLDOKUMENT finns — annars påstå inte att du citerar ett dokument.`

  const completion = await getGroqClient().chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ],
    temperature: 0.4,
    max_tokens: 700,
  })

  const usage = completion.usage
  if (usage) {
    console.log(`[groq:chat] tokens in=${usage.prompt_tokens} out=${usage.completion_tokens} total=${usage.total_tokens} breed=${breed}`)
  }

  const raw = completion.choices[0]?.message?.content?.trim() ?? ''
  const content = raw ||
    'Jag kunde inte generera ett svar på den frågan. Prova att ställa en mer specifik träningsfråga, till exempel: "Hur tränar jag inkallning?" eller "Hur länge bör ett pass vara?"'

  const sourceRefs = chunksToSourceRefs(chunks)
  const primaryChunk = chunks[0]
  const primarySource = primaryChunk
    ? `${primaryChunk.source}${primaryChunk.doc_version ? ` (${primaryChunk.doc_version})` : ''}`
    : ''
  const primarySourceUrl = primaryChunk?.source_url ?? ''

  const attributionNote =
    chunks.length === 0
      ? 'Inget material från uppladdade dokument användes för den här frågan (ingen nära träff i kunskapsbasen). Svaret bygger på allmän träningsmetodik och DogVantages rasprofil.'
      : undefined

  return {
    content,
    source: primarySource,
    source_url: primarySourceUrl,
    sources: sourceRefs.length > 0 ? sourceRefs : undefined,
    attributionNote,
  }
}
