import { embedText } from './embed'
import { getGeminiTextModel } from './client'
import { searchBreedChunks } from '@/lib/supabase/breed-chunks'
import { formatBreedProfileShort, formatCurrentPhaseShort } from './breed-profiles'
import {
  detectHealthIssue,
  detectBehaviorEmergency,
  VET_RESPONSE,
  BEHAVIOR_RESPONSE,
} from './safety-guards'
import type { Breed, ChunkMatch, TrainingResult, TrainingSourceRef } from '@/types'

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

  // 1. Embed the query and retrieve breed-specific document chunks (best-effort)
  // If the embedding API is unavailable (rate limit, quota), we fall back
  // gracefully to breed-profile-only answers — which are already very good.
  const matchCount = query.length > 80 ? 6 : 3
  let chunks: ChunkMatch[] = []
  try {
    const embedding = await embedText(query)
    chunks = await searchBreedChunks(embedding, breed, matchCount)
  } catch {
    // Embedding failed — continue with breed profile only
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

  const systemPrompt = `Du är DogVantage träningsassistent för rasen ${breed}. Metod: R+, shaping, laddad markörsignal (event marker — "ja!" eller klick som förutsäger belöning), capturing där det går (vänta in beteendet istället för att locka), inga korrektioner, korta pass — anpassat till rasens känslighet i profilen nedan. Förstärkningsschema: CRF (varje rep) tills beteendet är stabilt → variabel (2 av 3) på pålitlig nivå → jackpot vid genombrott.

=== RASPROFIL ===
${breedProfile}
${phaseInfo}
${documentContext ? `\n=== KÄLLDOKUMENT ===\n${documentContext}\n` : ''}${onboardingSection}${metricsSection}${logsSection}
Regler: svara på svenska, anpassa till hundens ålder i veckor. Var koncis — 60–150 ord för enkla frågor, max 250 för komplexa. Använd punktlistor när det passar. Nämn källnamn om KÄLLDOKUMENT finns — annars påstå inte att du citerar ett dokument.`

  const generationConfig = {
    temperature: 0.4,
    maxOutputTokens: 700,
    thinkingConfig: { thinkingBudget: 0 },
  }

  const result = await getGeminiTextModel().generateContent({
    contents: [{ role: 'user', parts: [{ text: query }] }],
    systemInstruction: systemPrompt,
    generationConfig,
  })

  const raw = result.response.text()?.trim() ?? ''
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
