import { embedText } from './embed'
import { getGroqClient, GROQ_MODEL } from './client'
import { searchBreedChunks } from '@/lib/supabase/breed-chunks'
import { formatBreedProfile, formatCurrentPhase } from './breed-profiles'
import type { Breed, ChunkMatch, TrainingResult, TrainingSourceRef } from '@/types'

// ─── Vet-guard ────────────────────────────────────────────────────────────────
const VET_KEYWORDS = [
  'haltar', 'kräks', 'äter inte', 'blöder', 'veterinär',
  'sjuk', 'ont', 'skada', 'hälta', 'kräkningar', 'diarré',
  'feber', 'sår', 'svullen',
]

const VET_RESPONSE: TrainingResult = {
  content:
    'Det verkar handla om ett hälsoproblem. DogVantage ger inte medicinska råd — kontakta din veterinär.',
  source: '',
  source_url: '',
  attributionNote: 'Fast svar vid hälsoindikation — inte från dina dokument.',
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

function isHealthQuery(query: string): boolean {
  const lower = query.toLowerCase()
  return VET_KEYWORDS.some((kw) => lower.includes(kw))
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
  if (isHealthQuery(query)) return VET_RESPONSE

  // 1. Embed the query and retrieve breed-specific document chunks (best-effort)
  // If the embedding API is unavailable (rate limit, quota), we fall back
  // gracefully to breed-profile-only answers — which are already very good.
  let chunks: ChunkMatch[] = []
  try {
    const embedding = await embedText(query)
    chunks = await searchBreedChunks(embedding, breed)
  } catch {
    // Embedding failed — continue with breed profile only
  }

  // 2. Build the "ritning" (blueprint) — breed profile + training phase
  const breedProfile = formatBreedProfile(breed)
  const phaseInfo = weekAge != null ? `\n${formatCurrentPhase(weekAge)}` : ''

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

  const systemPrompt = `Du är DogVantage träningsassistent — en kunnig hundtränare specialiserad på rasen ${breed}.

Du arbetar med ett tydligt tvålagerssystem:

LAGER 1 – METODEN (Allmän träningsmetodik)
Använd evidensbaserade hundträningstekiker:
• Positiv förstärkning (R+): belöna önskat beteende direkt (inom 0,5 sek)
• Formning (shaping): dela upp komplexa beteenden i små steg
• Timing och markering: klicker eller markörord ("bra!") precis när beteendet sker
• Undvika tvång: rasen reagerar bättre på uppmuntran än på korrektioner
• Korta pass: max 5–15 min beroende på ålder, avsluta alltid i framgång

LAGER 2 – RASRITNINGEN (Vad just denna ras förväntas kunna)
Här applicerar du rasspecifika krav. Se rasprofilen nedan och eventuella källdokument.
Rasens temperament avgör HUR du applicerar metoderna — en mjuk ras kräver mjukare metoder.

=== RASPROFIL ===
${breedProfile}
${phaseInfo}
${documentContext ? `\n=== KÄLLDOKUMENT (rasspecifikt material) ===\n${documentContext}\n` : ''}${onboardingSection}${metricsSection}${logsSection}
INSTRUKTIONER:
• Svara direkt på frågan — ge inte hela veckoschemat om det inte efterfrågas
• Kombinera metodiken (lager 1) med rasspecifika krav (lager 2)
• Anpassa svaret till hundens exakta ålder i veckor — inte generiska råd
• Om källdokument finns i prompten — du kan nämna källans namn kort om det stärker svaret
• Om avsnittet KÄLLDOKUMENT saknas eller är tomt: påstå INTE att du citerar ett specifikt uppladdat dokument — utgå då från metod (lager 1) och rasprofilen (lager 2)
• Svara alltid på svenska, kortfattat och konkret
• Max 150 ord om inte frågan kräver längre svar`

  const completion = await getGroqClient().chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ],
    temperature: 0.4,
  })

  const raw = completion.choices[0].message.content?.trim() ?? ''
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
