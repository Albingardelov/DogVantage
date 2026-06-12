# Chat-minne + Veckans insikt — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DB-persistent chat-historik + dog_state i chat-prompten (Spår 1), därefter deterministiskt miljögap-insiktskort på dashboarden (Spår 2).

**Architecture:** Server-authoritative historik i ny `chat_messages`-tabell (RLS owner-only); chat-routen hämtar själv de senaste turerna och dog-state-payloaden och matar `queryRAG`. Insikten beräknas av rena funktioner från ett nytt additivt `environmentByExercise`-fält i `dog_state`-payloaden och renderas av en klientkomponent som läser befintliga `GET /api/training/dog-state`.

**Tech Stack:** Next.js App Router (OBS: versionen i repot har breaking changes — läs `node_modules/next/dist/docs/01-app/` innan route-/page-kod skrivs), Supabase (RLS), Groq via `queryRAG`, zod, vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-06-12-chat-memory-insight-card-design.md`

**Viktiga repo-regler:**
- Inga emojis i UI — ikoner från `src/components/icons`.
- Inga kommentarer som förklarar vad koden gör.
- Inga `Co-Authored-By`-rader i commits.
- Enhetstester mockar aldrig Supabase — datarader skickas in som argument (mönstret från `progression-rules.test.ts`).
- Migrationer körs INTE av agenten — projektet är inte CLI-länkat; migrationsfilen skapas och appliceras manuellt av ägaren (Task 11).

---

## Spår 1 — Chat-minne + dog_state-kontext

### Task 1: Migration + DB-typer för `chat_messages`

**Files:**
- Create: `supabase/migrations/025_chat_messages.sql`
- Modify: `src/types/database.ts` (lägg `chat_messages`-blocket alfabetiskt före `chat_topics`, ca rad 61)

- [ ] **Step 1: Skapa migrationsfilen**

```sql
create table public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  dog_id     uuid not null references public.dog_profiles(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index chat_messages_dog_idx on public.chat_messages (dog_id, created_at desc);

alter table public.chat_messages enable row level security;

create policy "owner_only" on public.chat_messages
  for all
  using (
    dog_id in (
      select id from public.dog_profiles where user_id = auth.uid()
    )
  )
  with check (
    dog_id in (
      select id from public.dog_profiles where user_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Lägg till tabelltyperna i `src/types/database.ts`**

Hitta `chat_topics`-blocket (börjar ca rad 61) och lägg detta block direkt FÖRE det (alfabetisk ordning):

```ts
      chat_messages: {
        Row: {
          id: string
          dog_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          dog_id: string
          role: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          dog_id?: string
          role?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dog_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
```

- [ ] **Step 3: Verifiera att typerna kompilerar**

Run: `npx tsc --noEmit`
Expected: inga fel (samma utgångsläge som innan ändringen).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/025_chat_messages.sql src/types/database.ts
git commit -m "feat(chat): chat_messages table migration and db types"
```

---

### Task 2: Supabase-lib `chat-messages.ts`

Tunna Supabase-wrappers — enligt repo-mönstret (jfr `chat-topics.ts`) har dessa inga enhetstester. Funktionerna tar den user-scopade klienten som argument så RLS gäller.

**Files:**
- Create: `src/lib/supabase/chat-messages.ts`

- [ ] **Step 1: Skriv libben**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface ChatHistoryRow {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export async function getChatMessages(
  supabase: SupabaseClient<Database>,
  dogId: string,
  limit: number,
): Promise<ChatHistoryRow[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('dog_id', dogId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return (data as ChatHistoryRow[]).reverse()
}

export async function appendChatExchange(
  supabase: SupabaseClient<Database>,
  dogId: string,
  query: string,
  answer: string,
): Promise<void> {
  const userInsert = await supabase
    .from('chat_messages')
    .insert({ dog_id: dogId, role: 'user', content: query })
  if (userInsert.error) throw new Error(`chat message insert failed: ${userInsert.error.message}`)

  const assistantInsert = await supabase
    .from('chat_messages')
    .insert({ dog_id: dogId, role: 'assistant', content: answer })
  if (assistantInsert.error) throw new Error(`chat message insert failed: ${assistantInsert.error.message}`)
}
```

OBS: två sekventiella inserts (inte en batch) — `created_at default now()` är transaktionstidsstämpeln, och batch-insert skulle ge identiska tidsstämplar så att user/assistant-ordningen blir odefinierad vid sortering.

- [ ] **Step 2: Verifiera kompilering**

Run: `npx tsc --noEmit`
Expected: inga fel.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/chat-messages.ts
git commit -m "feat(chat): chat message read/append supabase lib"
```

---

### Task 3: `formatDogStateForPrompt` (TDD) + optionalt payload-fält

`environmentByExercise` BERÄKNAS först i Task 8, men typen och zod-fältet läggs till redan här (optionalt) så formatteraren kan vara tolerant från start.

**Files:**
- Modify: `src/lib/training/dog-state.ts` (typ-tillägg)
- Modify: `src/types/api/schemas.ts` (zod-tillägg, ca rad 161)
- Create: `src/lib/ai/dog-state-context.ts`
- Test: `src/lib/ai/dog-state-context.test.ts`

- [ ] **Step 1: Lägg till typerna i `src/lib/training/dog-state.ts`**

Efter `DogStateExerciseStat`-interfacet (rad 14–18), lägg till:

```ts
export interface DogStateEnvExerciseStat {
  exerciseId: string
  environment: SkillEnvironment
  successRate: number
  attempts: number
}
```

I `DogStatePayload`-interfacet, efter `environmentDifficulty`-raden:

```ts
  environmentByExercise?: DogStateEnvExerciseStat[]
```

- [ ] **Step 2: Lägg till zod-schemat i `src/types/api/schemas.ts`**

Före `DogStatePayloadSchema` (ca rad 167):

```ts
export const DogStateEnvExerciseStatSchema = z.object({
  exerciseId: z.string(),
  environment: z.enum(['home', 'outdoor', 'park', 'mixed']),
  successRate: z.number(),
  attempts: z.number(),
})
```

I `DogStatePayloadSchema`, efter `environmentDifficulty`-raden:

```ts
  environmentByExercise: z.array(DogStateEnvExerciseStatSchema).optional(),
```

- [ ] **Step 3: Skriv det fallerande testet**

`src/lib/ai/dog-state-context.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatDogStateForPrompt } from './dog-state-context'
import type { DogStatePayload } from '@/lib/training/dog-state'

function emptyPayload(): DogStatePayload {
  return {
    version: 1,
    weakExercises: [],
    strongExercises: [],
    environmentDifficulty: {},
    handler: { timing: null, consistency: null, reading: null, sampleSize: 0 },
    zoneSummary: { greenDays: 0, yellowDays: 0, redDays: 0, window: 14 },
    thresholdAdjustments: {},
  }
}

describe('formatDogStateForPrompt', () => {
  it('returns null for a dog without signal', () => {
    expect(formatDogStateForPrompt(emptyPayload())).toBeNull()
  })

  it('lists weak and strong exercises with swedish labels and percentages', () => {
    const out = formatDogStateForPrompt({
      ...emptyPayload(),
      weakExercises: [{ exerciseId: 'inkallning', successRate: 0.4, attempts: 20 }],
      strongExercises: [{ exerciseId: 'sitt', successRate: 0.9, attempts: 30 }],
    })
    expect(out).toContain('Inkallning 40 % (20 försök)')
    expect(out).toContain('Sitt 90 %')
  })

  it('prefers per-exercise environment stats when present', () => {
    const out = formatDogStateForPrompt({
      ...emptyPayload(),
      environmentDifficulty: { home: 0.9 },
      environmentByExercise: [
        { exerciseId: 'sitt', environment: 'park', successRate: 0.4, attempts: 10 },
      ],
    })
    expect(out).toContain('Sitt i parken 40 %')
    expect(out).not.toContain('Miljösvårighet')
  })

  it('falls back to aggregated environment difficulty', () => {
    const out = formatDogStateForPrompt({
      ...emptyPayload(),
      environmentDifficulty: { home: 0.85, outdoor: 0.55 },
    })
    expect(out).toContain('Miljösvårighet')
    expect(out).toContain('hemma 85 %')
    expect(out).toContain('utomhus 55 %')
  })

  it('includes handler ratings only with >= 3 samples', () => {
    const base = {
      ...emptyPayload(),
      handler: { timing: 2.5, consistency: 4.0, reading: null, sampleSize: 2 },
    }
    expect(formatDogStateForPrompt(base)).toBeNull()

    const out = formatDogStateForPrompt({
      ...base,
      handler: { ...base.handler, sampleSize: 5 },
    })
    expect(out).toContain('timing 2.5/5')
    expect(out).toContain('konsekvens 4.0/5')
    expect(out).not.toContain('läsning')
  })

  it('summarizes check-in zones', () => {
    const out = formatDogStateForPrompt({
      ...emptyPayload(),
      zoneSummary: { greenDays: 8, yellowDays: 2, redDays: 1, window: 14 },
    })
    expect(out).toContain('8 gröna, 2 gula, 1 röda dagar')
  })
})
```

- [ ] **Step 4: Kör testet — ska faila**

Run: `npx vitest run src/lib/ai/dog-state-context.test.ts`
Expected: FAIL — modulen finns inte.

- [ ] **Step 5: Implementera `src/lib/ai/dog-state-context.ts`**

```ts
import type { DogStatePayload } from '@/lib/training/dog-state'
import type { SkillEnvironment } from '@/lib/training/skill-progress'
import { exerciseLabel } from '@/lib/training/exercise-label'

const ENV_LABELS: Record<SkillEnvironment, string> = {
  home: 'hemma',
  outdoor: 'utomhus',
  park: 'i parken',
  mixed: 'i blandad miljö',
}

const MIN_HANDLER_SAMPLES = 3

function pct(rate: number): string {
  return `${Math.round(rate * 100)} %`
}

export function formatDogStateForPrompt(payload: DogStatePayload): string | null {
  const lines: string[] = []

  if (payload.weakExercises.length > 0) {
    const items = payload.weakExercises
      .map((e) => `${exerciseLabel(e.exerciseId)} ${pct(e.successRate)} (${e.attempts} försök)`)
      .join(', ')
    lines.push(`Svaga övningar (senaste 28 d): ${items}`)
  }

  if (payload.strongExercises.length > 0) {
    const items = payload.strongExercises
      .map((e) => `${exerciseLabel(e.exerciseId)} ${pct(e.successRate)}`)
      .join(', ')
    lines.push(`Starka övningar: ${items}`)
  }

  const envEntries = payload.environmentByExercise ?? []
  if (envEntries.length > 0) {
    const items = envEntries
      .map((e) => `${exerciseLabel(e.exerciseId)} ${ENV_LABELS[e.environment]} ${pct(e.successRate)}`)
      .join(', ')
    lines.push(`Per miljö: ${items}`)
  } else {
    const envs = Object.entries(payload.environmentDifficulty) as [SkillEnvironment, number][]
    if (envs.length > 0) {
      const items = envs.map(([env, rate]) => `${ENV_LABELS[env]} ${pct(rate)}`).join(', ')
      lines.push(`Miljösvårighet: ${items}`)
    }
  }

  const h = payload.handler
  const hasHandlerSignal = h.timing != null || h.consistency != null || h.reading != null
  if (h.sampleSize >= MIN_HANDLER_SAMPLES && hasHandlerSignal) {
    const dims = [
      h.timing != null ? `timing ${h.timing.toFixed(1)}/5` : null,
      h.consistency != null ? `konsekvens ${h.consistency.toFixed(1)}/5` : null,
      h.reading != null ? `läsning ${h.reading.toFixed(1)}/5` : null,
    ].filter(Boolean)
    lines.push(`Förarens självskattning (${h.sampleSize} pass): ${dims.join(', ')}`)
  }

  const z = payload.zoneSummary
  if (z.greenDays + z.yellowDays + z.redDays > 0) {
    lines.push(`Dagsform senaste 14 d: ${z.greenDays} gröna, ${z.yellowDays} gula, ${z.redDays} röda dagar`)
  }

  return lines.length > 0 ? lines.join('\n') : null
}
```

- [ ] **Step 6: Kör testet — ska passera**

Run: `npx vitest run src/lib/ai/dog-state-context.test.ts`
Expected: PASS (6 tester).

- [ ] **Step 7: Kör hela sviten + typer**

Run: `npx tsc --noEmit && npm run test`
Expected: grönt. (`dog-state.test.ts` påverkas inte — fältet är optionalt.)

- [ ] **Step 8: Commit**

```bash
git add src/lib/training/dog-state.ts src/types/api/schemas.ts src/lib/ai/dog-state-context.ts src/lib/ai/dog-state-context.test.ts
git commit -m "feat(chat): dog-state prompt formatter and optional environment-by-exercise field"
```

---

### Task 4: `queryRAG` — historik + hundprofil-sektion (TDD)

**Files:**
- Modify: `src/lib/ai/rag.ts:104-199`
- Test: `src/lib/ai/rag.test.ts` (följ filens befintliga mock- och importmönster)

- [ ] **Step 1: Skriv de fallerande testerna**

Lägg till sist i `describe('queryRAG', ...)` i `src/lib/ai/rag.test.ts`. Filens mönster är dynamiska imports per test + `vi.mocked(client.chat.completions.create)` — följ det exakt:

```ts
  it('includes prior conversation turns as chat messages', async () => {
    const { getGroqClient } = await import('@/lib/ai/client')
    const client = getGroqClient()
    const { queryRAG } = await import('./rag')
    await queryRAG('Och hur går jag vidare?', 'labrador', [], 12, [], undefined, {
      history: [
        { role: 'user', content: 'Hur tränar jag inkallning?' },
        { role: 'assistant', content: 'Börja inomhus med kort avstånd.' },
      ],
    })
    const call = vi.mocked(client.chat.completions.create).mock.calls[0][0] as { messages: { role: string; content: string }[] }
    expect(call.messages).toHaveLength(4)
    expect(call.messages[1]).toEqual({ role: 'user', content: 'Hur tränar jag inkallning?' })
    expect(call.messages[2]).toEqual({ role: 'assistant', content: 'Börja inomhus med kort avstånd.' })
    expect(call.messages[3]).toEqual({ role: 'user', content: 'Och hur går jag vidare?' })
  })

  it('includes dog state section in system prompt when provided', async () => {
    const { getGroqClient } = await import('@/lib/ai/client')
    const client = getGroqClient()
    const { queryRAG } = await import('./rag')
    await queryRAG('Hur går vi vidare med sitt?', 'labrador', [], 12, [], undefined, {
      dogStateContext: 'Svaga övningar (senaste 28 d): Inkallning 40 % (20 försök)',
    })
    const call = vi.mocked(client.chat.completions.create).mock.calls[0][0] as { messages: { role: string; content: string }[] }
    const systemMsg = call.messages.find((m) => m.role === 'system')?.content ?? ''
    expect(systemMsg).toContain('=== HUNDPROFIL (DATA) ===')
    expect(systemMsg).toContain('Inkallning 40 % (20 försök)')
  })

  it('omits dog state section without context', async () => {
    const { getGroqClient } = await import('@/lib/ai/client')
    const client = getGroqClient()
    const { queryRAG } = await import('./rag')
    await queryRAG('Hur går vi vidare med sitt?', 'labrador', [], 12, [])
    const call = vi.mocked(client.chat.completions.create).mock.calls[0][0] as { messages: { role: string; content: string }[] }
    const systemMsg = call.messages.find((m) => m.role === 'system')?.content ?? ''
    expect(systemMsg).not.toContain('HUNDPROFIL')
  })
```

- [ ] **Step 2: Kör testerna — ska faila**

Run: `npx vitest run src/lib/ai/rag.test.ts`
Expected: de tre nya FAIL (okänt 7:e argument / saknad sektion), befintliga PASS.

- [ ] **Step 3: Implementera i `src/lib/ai/rag.ts`**

Före `queryRAG` (ca rad 103), lägg till:

```ts
export interface ChatHistoryEntry {
  role: 'user' | 'assistant'
  content: string
}

export interface QueryRAGOptions {
  history?: ChatHistoryEntry[]
  dogStateContext?: string | null
}
```

Utöka signaturen (rad 104–111):

```ts
export async function queryRAG(
  query: string,
  breed: Breed,
  recentLogs: string[] = [],
  weekAge?: number,
  todayMetrics: string[] = [],
  onboardingContext?: string,
  opts: QueryRAGOptions = {}
): Promise<TrainingResult> {
```

Efter `onboardingSection`-deklarationen (ca rad 172–174), lägg till:

```ts
  const dogStateSection = opts.dogStateContext
    ? `\n=== HUNDPROFIL (DATA) ===\n${opts.dogStateContext}\nAnvänd datan ovan för individanpassade råd — referera till hundens faktiska siffror när det är relevant.\n`
    : ''
```

I `systemPrompt`-template-strängen (rad 188), ändra raden

```
${documentContext ? `\n=== KÄLLDOKUMENT ===\n${documentContext}\n` : ''}${onboardingSection}${metricsSection}${logsSection}
```

till

```
${documentContext ? `\n=== KÄLLDOKUMENT ===\n${documentContext}\n` : ''}${onboardingSection}${dogStateSection}${metricsSection}${logsSection}
```

Ändra `messages` i Groq-anropet (rad 193–196) till:

```ts
    messages: [
      { role: 'system', content: systemPrompt },
      ...(opts.history ?? []).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: query },
    ],
```

- [ ] **Step 4: Kör testerna — ska passera**

Run: `npx vitest run src/lib/ai/rag.test.ts`
Expected: PASS, inklusive alla befintliga.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/rag.ts src/lib/ai/rag.test.ts
git commit -m "feat(chat): conversation history and dog-state section in rag prompt"
```

---

### Task 5: zod-scheman + `GET /api/chat/history`

Läs `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` innan route-koden skrivs.

**Files:**
- Modify: `src/types/api/schemas.ts`
- Create: `src/app/api/chat/history/route.ts`

- [ ] **Step 1: Lägg till scheman i `src/types/api/schemas.ts`**

```ts
export const ChatHistoryMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  created_at: z.string(),
})

export const ChatHistoryResponseSchema = z.object({
  messages: z.array(ChatHistoryMessageSchema),
})

export const WeeklyFocusResponseSchema = z.object({
  isoWeek: z.string(),
  areas: z.array(z.string()),
  exerciseIds: z.array(z.string()),
})
```

(`WeeklyFocusResponseSchema` används av InsightCard i Task 10 — läggs här för att slippa röra filen två gånger.)

- [ ] **Step 2: Skapa routen `src/app/api/chat/history/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { getChatMessages } from '@/lib/supabase/chat-messages'

const HISTORY_FETCH_LIMIT = 30

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog, supabase }) => {
    const messages = await getChatMessages(supabase, dog.id, HISTORY_FETCH_LIMIT)
    return NextResponse.json({ messages })
  })
}
```

- [ ] **Step 3: Verifiera bygge**

Run: `npx tsc --noEmit && npm run build`
Expected: grönt; `/api/chat/history` syns i route-listan.

- [ ] **Step 4: Commit**

```bash
git add src/types/api/schemas.ts src/app/api/chat/history/route.ts
git commit -m "feat(chat): chat history endpoint and response schemas"
```

---

### Task 6: `POST /api/chat` — historik, dog-state och persistens

**Files:**
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Lägg till imports och konstanter**

Efter befintliga imports:

```ts
import { getChatMessages, appendChatExchange } from '@/lib/supabase/chat-messages'
import { getDogState } from '@/lib/supabase/dog-state'
import { formatDogStateForPrompt } from '@/lib/ai/dog-state-context'
import type { ChatHistoryEntry } from '@/lib/ai/rag'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
```

Efter `todayDateString` (rad 19–21):

```ts
const PROMPT_HISTORY_LIMIT = 8
const HISTORY_CHAR_LIMIT = 1000

async function persistExchange(
  supabase: SupabaseClient<Database>,
  dogId: string,
  query: string,
  answer: string,
): Promise<void> {
  try {
    await appendChatExchange(supabase, dogId, query, answer)
  } catch (e) {
    console.warn('[/api/chat] history persist failed:', e instanceof Error ? e.message : String(e))
  }
}
```

- [ ] **Step 2: Hämta historik + dog-state parallellt**

Utöka `Promise.all`-blocket (rad 99–109) med två poster:

```ts
      const [logStrings, metricsStrings, cached, historyRows, dogStateContext] = await Promise.all([
        shouldFetchLogs
          ? getRecentLogs(dog.id, logsWeek!).then((logs) => formatLogsForPrompt(logs))
          : Promise.resolve([]),
        shouldFetchMetrics
          ? getMetrics(breed, todayDateString(), dog.id)
            .then((metrics) => formatMetricsForPrompt(metrics))
            .catch(() => [])
          : Promise.resolve([]),
        getCachedChat(query, breed, ageWeeks).catch(() => null),
        getChatMessages(supabase, dog.id, PROMPT_HISTORY_LIMIT).catch(() => []),
        getDogState(dog.id)
          .then((state) => formatDogStateForPrompt(state))
          .catch(() => null),
      ])

      const history: ChatHistoryEntry[] = historyRows.map((m) => ({
        role: m.role,
        content: m.content.slice(0, HISTORY_CHAR_LIMIT),
      }))
```

- [ ] **Step 3: Utöka personaliserings-villkoret och cache-vägen**

Ändra `isPersonalized` (rad 111–112) till:

```ts
      const isPersonalized =
        logStrings.length > 0 || metricsStrings.length > 0 || !!chatContext ||
        history.length > 0 || !!dogStateContext
```

I cache-träffen (rad 113–119), persistera innan retur:

```ts
      if (!isPersonalized) {
        if (cached) {
          void touchCacheEntry(query, breed, ageWeeks).catch(() => {})
          await persistExchange(supabase, dog.id, query, cached.content)
          return NextResponse.json(cached)
        }
      }
```

- [ ] **Step 4: Skicka opts till `queryRAG` och persistera svaret**

Ändra anropet (rad 132):

```ts
      const result = await queryRAG(query, breed, logStrings, ageWeeks, metricsStrings, chatContext, {
        history,
        dogStateContext,
      })

      await persistExchange(supabase, dog.id, query, result.content)
```

(Persistensen täcker även guard-svaren VET/BEHAVIOR — de returneras som vanliga `TrainingResult` från `queryRAG`. `detectSecretExposure`-/limit-/betalvägar returnerar fel före denna punkt och persisteras inte, vilket är avsikten.)

- [ ] **Step 5: Verifiera**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: grönt.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat(chat): wire history, dog-state context and persistence into chat route"
```

---

### Task 7: `ChatInterface` — ladda historik vid mount

**Files:**
- Modify: `src/components/ChatInterface.tsx`

- [ ] **Step 1: Implementera historik-laddning**

Lägg till import:

```ts
import { TrainingResultSchema, ChatHistoryResponseSchema } from '@/types/api/schemas'
```

(ersätter den befintliga `TrainingResultSchema`-importen på rad 7).

Bryt ut hälsningen till en konstant ovanför komponenten och lägg till `historyLoaded`-state (ersätter rad 17–19):

```ts
const GREETING: ChatMessage = {
  role: 'model',
  content: 'Hej! Jag är din träningsassistent. För bäst hjälp: skriv övning + hur det gick idag, så får du en konkret plan för nästa reps.',
}

export default function ChatInterface({ trainingWeek, initialQuestion, dogId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [hasHistory, setHasHistory] = useState(false)
```

Lägg till en mount-effekt direkt efter scroll-effekten (efter rad 28):

```ts
  useEffect(() => {
    let cancelled = false
    apiFetch(`/api/chat/history?dogId=${dogId}`, ChatHistoryResponseSchema)
      .then((data) => {
        if (cancelled || data.messages.length === 0) return
        setHasHistory(true)
        setMessages(
          data.messages.map((m) => ({
            role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
            content: m.content,
          })),
        )
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setHistoryLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [dogId])
```

- [ ] **Step 2: Gata auto-send och chips på `historyLoaded`**

I auto-send-effekten (rad 76–84), ersätt villkoret `if (messages.length !== 1) return` med:

```ts
    if (!historyLoaded) return
```

och lägg till `historyLoaded` i dependency-arrayen.

Quick-chips (rad 171): ändra `{messages.length < 6 && (` till `{historyLoaded && !hasHistory && messages.length < 6 && (` — specen säger att chipsen bara visas när historiken är tom.

Input + send-knapp: ändra `disabled={loading}` på textarean (rad 196) till `disabled={loading || !historyLoaded}` och send-knappens `disabled={!input.trim() || loading}` (rad 202) till `disabled={!input.trim() || loading || !historyLoaded}` — annars kan ett snabbt skickat meddelande skrivas över när historiken landar.

- [ ] **Step 3: Verifiera**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: grönt (chat-sidans test mockar hela `ChatInterface` och påverkas inte).

- [ ] **Step 4: Commit**

```bash
git add src/components/ChatInterface.tsx
git commit -m "feat(chat): load persisted conversation history on mount"
```

---

## Spår 2 — Veckans insikt: miljögap

### Task 8: `computeDogState` — `environmentByExercise` (TDD)

**Files:**
- Modify: `src/lib/training/dog-state.ts:49-119`
- Test: `src/lib/training/dog-state.test.ts`

- [ ] **Step 1: Skriv de fallerande testerna**

Lägg till sist i `describe('computeDogState', ...)` i `src/lib/training/dog-state.test.ts` (använder filens befintliga `metricRow`-helper och `EMPTY`-konstant):

```ts
  it('aggregates per exercise and environment with >= 8 attempts', () => {
    const state = computeDogState({
      ...EMPTY,
      metrics: [
        metricRow('sitt', 9, 1, 'home_quiet'),
        metricRow('sitt', 4, 6, 'park_distractions'),
        metricRow('sitt', 3, 2, 'outdoor_garden'),
      ],
    })
    expect(state.environmentByExercise).toEqual([
      { exerciseId: 'sitt', environment: 'home', successRate: 0.9, attempts: 10 },
      { exerciseId: 'sitt', environment: 'park', successRate: 0.4, attempts: 10 },
    ])
  })

  it('sums multiple rows for the same exercise-environment pair', () => {
    const state = computeDogState({
      ...EMPTY,
      metrics: [
        metricRow('plats', 3, 2, 'home_quiet', '2026-06-09'),
        metricRow('plats', 4, 1, 'home_quiet', '2026-06-10'),
      ],
    })
    expect(state.environmentByExercise).toEqual([
      { exerciseId: 'plats', environment: 'home', successRate: 0.7, attempts: 10 },
    ])
  })

  it('returns empty environmentByExercise without data', () => {
    expect(computeDogState(EMPTY).environmentByExercise).toEqual([])
  })
```

(`inferEnvironment` mappar `home_quiet` → `home`, `park_distractions` → `park`, `outdoor_garden` → `outdoor` — det tredje sitt-paret har 5 försök < 8 och ska exkluderas.)

- [ ] **Step 2: Kör testerna — ska faila**

Run: `npx vitest run src/lib/training/dog-state.test.ts`
Expected: de tre nya FAIL (`environmentByExercise` är `undefined`).

- [ ] **Step 3: Implementera i `computeDogState`**

Efter `MAX_LISTED`-konstanten (rad 47):

```ts
const MIN_ENV_ATTEMPTS = 8
```

I aggregeringsloopen (rad 53–67), lägg till en tredje map. Deklarera före loopen:

```ts
  const byExerciseEnv = new Map<string, { exerciseId: string; environment: SkillEnvironment; success: number; attempts: number }>()
```

och inne i loopen, efter `byEnvironment.set(env, envAgg)`:

```ts
    const pairKey = `${row.exercise_id}|${env}`
    const pair = byExerciseEnv.get(pairKey) ?? { exerciseId: row.exercise_id, environment: env, success: 0, attempts: 0 }
    pair.success += row.success_count
    pair.attempts += attempts
    byExerciseEnv.set(pairKey, pair)
```

Före `return`-satsen:

```ts
  const environmentByExercise: DogStateEnvExerciseStat[] = [...byExerciseEnv.values()]
    .filter((e) => e.attempts >= MIN_ENV_ATTEMPTS)
    .map((e) => ({
      exerciseId: e.exerciseId,
      environment: e.environment,
      successRate: e.success / e.attempts,
      attempts: e.attempts,
    }))
    .sort((a, b) => a.exerciseId.localeCompare(b.exerciseId) || a.environment.localeCompare(b.environment))
```

och lägg `environmentByExercise,` i return-objektet efter `environmentDifficulty,`.

- [ ] **Step 4: Kör testerna — ska passera**

Run: `npx vitest run src/lib/training/dog-state.test.ts`
Expected: PASS, inklusive alla befintliga.

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/dog-state.ts src/lib/training/dog-state.test.ts
git commit -m "feat(dog-state): per-exercise environment success aggregation"
```

---

### Task 9: `insights.ts` — gap-detektering + copy (TDD)

**Files:**
- Create: `src/lib/training/insights.ts`
- Test: `src/lib/training/insights.test.ts`

- [ ] **Step 1: Skriv de fallerande testerna**

`src/lib/training/insights.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { findEnvironmentGapInsight, formatInsightCopy } from './insights'
import type { DogStatePayload, DogStateEnvExerciseStat } from './dog-state'

function payloadWith(entries: DogStateEnvExerciseStat[]): DogStatePayload {
  return {
    version: 1,
    weakExercises: [],
    strongExercises: [],
    environmentDifficulty: {},
    environmentByExercise: entries,
    handler: { timing: null, consistency: null, reading: null, sampleSize: 0 },
    zoneSummary: { greenDays: 0, yellowDays: 0, redDays: 0, window: 14 },
    thresholdAdjustments: {},
  }
}

function stat(
  exerciseId: string,
  environment: DogStateEnvExerciseStat['environment'],
  successRate: number,
  attempts = 10,
): DogStateEnvExerciseStat {
  return { exerciseId, environment, successRate, attempts }
}

describe('findEnvironmentGapInsight', () => {
  it('returns null when the field is missing (old cached payload)', () => {
    const payload = payloadWith([])
    delete payload.environmentByExercise
    expect(findEnvironmentGapInsight(payload)).toBeNull()
  })

  it('finds a gap between an easy and a harder environment', () => {
    const insight = findEnvironmentGapInsight(payloadWith([
      stat('sitt', 'home', 0.9),
      stat('sitt', 'park', 0.4),
    ]))
    expect(insight).toEqual({
      exerciseId: 'sitt',
      easyEnv: 'home',
      hardEnv: 'park',
      easyRate: 0.9,
      hardRate: 0.4,
    })
  })

  it('requires easy >= 0.75 and hard <= 0.5', () => {
    expect(findEnvironmentGapInsight(payloadWith([
      stat('sitt', 'home', 0.74),
      stat('sitt', 'park', 0.4),
    ]))).toBeNull()
    expect(findEnvironmentGapInsight(payloadWith([
      stat('sitt', 'home', 0.9),
      stat('sitt', 'park', 0.51),
    ]))).toBeNull()
  })

  it('requires >= 8 attempts in both environments', () => {
    expect(findEnvironmentGapInsight(payloadWith([
      stat('sitt', 'home', 0.9, 7),
      stat('sitt', 'park', 0.4),
    ]))).toBeNull()
  })

  it('ignores mixed environment and inverted gaps', () => {
    expect(findEnvironmentGapInsight(payloadWith([
      stat('sitt', 'mixed', 0.9),
      stat('sitt', 'park', 0.4),
    ]))).toBeNull()
    expect(findEnvironmentGapInsight(payloadWith([
      stat('sitt', 'park', 0.9),
      stat('sitt', 'home', 0.4),
    ]))).toBeNull()
  })

  it('picks the largest gap among candidates', () => {
    const insight = findEnvironmentGapInsight(payloadWith([
      stat('sitt', 'home', 0.8),
      stat('sitt', 'outdoor', 0.5),
      stat('inkallning', 'home', 0.95),
      stat('inkallning', 'park', 0.3),
    ]))
    expect(insight?.exerciseId).toBe('inkallning')
  })
})

describe('formatInsightCopy', () => {
  it('builds swedish copy with label and percentages', () => {
    const copy = formatInsightCopy({
      exerciseId: 'sitt',
      easyEnv: 'home',
      hardEnv: 'park',
      easyRate: 0.9,
      hardRate: 0.4,
    })
    expect(copy.title).toBe('Sitt sitter hemma — men inte i parken')
    expect(copy.body).toContain('90 % hemma')
    expect(copy.body).toContain('40 % i parken')
    expect(copy.body).toContain('inte trots')
  })
})
```

- [ ] **Step 2: Kör testerna — ska faila**

Run: `npx vitest run src/lib/training/insights.test.ts`
Expected: FAIL — modulen finns inte.

- [ ] **Step 3: Implementera `src/lib/training/insights.ts`**

```ts
import type { DogStatePayload, DogStateEnvExerciseStat } from './dog-state'
import type { SkillEnvironment } from './skill-progress'
import { exerciseLabel } from './exercise-label'

const ENV_ORDER: SkillEnvironment[] = ['home', 'outdoor', 'park']
const EASY_MIN_RATE = 0.75
const HARD_MAX_RATE = 0.5
const MIN_ATTEMPTS = 8

export interface EnvironmentGapInsight {
  exerciseId: string
  easyEnv: SkillEnvironment
  hardEnv: SkillEnvironment
  easyRate: number
  hardRate: number
}

export function findEnvironmentGapInsight(payload: DogStatePayload): EnvironmentGapInsight | null {
  const byExercise = new Map<string, DogStateEnvExerciseStat[]>()
  for (const entry of payload.environmentByExercise ?? []) {
    if (!ENV_ORDER.includes(entry.environment)) continue
    if (entry.attempts < MIN_ATTEMPTS) continue
    const list = byExercise.get(entry.exerciseId) ?? []
    list.push(entry)
    byExercise.set(entry.exerciseId, list)
  }

  let best: EnvironmentGapInsight | null = null
  for (const [exerciseId, stats] of byExercise) {
    for (const easy of stats) {
      for (const hard of stats) {
        if (ENV_ORDER.indexOf(easy.environment) >= ENV_ORDER.indexOf(hard.environment)) continue
        if (easy.successRate < EASY_MIN_RATE || hard.successRate > HARD_MAX_RATE) continue
        if (!best || easy.successRate - hard.successRate > best.easyRate - best.hardRate) {
          best = {
            exerciseId,
            easyEnv: easy.environment,
            hardEnv: hard.environment,
            easyRate: easy.successRate,
            hardRate: hard.successRate,
          }
        }
      }
    }
  }
  return best
}

const ENV_PHRASE: Record<SkillEnvironment, string> = {
  home: 'hemma',
  outdoor: 'utomhus',
  park: 'i parken',
  mixed: 'i blandad miljö',
}

export interface InsightCopy {
  title: string
  body: string
}

export function formatInsightCopy(insight: EnvironmentGapInsight): InsightCopy {
  const label = exerciseLabel(insight.exerciseId)
  const easyPct = Math.round(insight.easyRate * 100)
  const hardPct = Math.round(insight.hardRate * 100)
  return {
    title: `${label} sitter ${ENV_PHRASE[insight.easyEnv]} — men inte ${ENV_PHRASE[insight.hardEnv]}`,
    body: `${label} lyckas ${easyPct} % ${ENV_PHRASE[insight.easyEnv]} men bara ${hardPct} % ${ENV_PHRASE[insight.hardEnv]}. Det är inte trots — hunden har inte generaliserat beteendet än. Träna mellansteget ${ENV_PHRASE[insight.hardEnv]}: kortare avstånd, färre störningar och högre belöning.`,
  }
}
```

- [ ] **Step 4: Kör testerna — ska passera**

Run: `npx vitest run src/lib/training/insights.test.ts`
Expected: PASS (7 tester).

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/insights.ts src/lib/training/insights.test.ts
git commit -m "feat(insights): environment gap detection and deterministic copy"
```

---

### Task 10: `InsightCard` + dashboard-koppling

**Files:**
- Create: `src/components/InsightCard/InsightCard.tsx`
- Create: `src/components/InsightCard/InsightCard.module.css`
- Create: `src/components/InsightCard/InsightCard.test.tsx`
- Modify: `src/app/dashboard/page.tsx` (efter `#today-training`-diven, före `progressionHints`-kortet, ca rad 577)

- [ ] **Step 1: Skriv det fallerande komponenttestet**

`src/components/InsightCard/InsightCard.test.tsx`:

```tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFetch = vi.fn()
vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  ApiError: class extends Error {},
}))

import InsightCard from './InsightCard'

function payloadWith(entries: unknown[]) {
  return {
    version: 1,
    weakExercises: [],
    strongExercises: [],
    environmentDifficulty: {},
    environmentByExercise: entries,
    handler: { timing: null, consistency: null, reading: null, sampleSize: 0 },
    zoneSummary: { greenDays: 0, yellowDays: 0, redDays: 0, window: 14 },
    thresholdAdjustments: {},
  }
}

describe('InsightCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders nothing without a significant gap', async () => {
    mockApiFetch.mockResolvedValue(payloadWith([]))
    const { container } = render(<InsightCard dogId="dog-1" />)
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('renders insight copy when a gap exists', async () => {
    mockApiFetch.mockResolvedValue(payloadWith([
      { exerciseId: 'sitt', environment: 'home', successRate: 0.9, attempts: 10 },
      { exerciseId: 'sitt', environment: 'park', successRate: 0.4, attempts: 10 },
    ]))
    render(<InsightCard dogId="dog-1" />)
    expect(await screen.findByText('Sitt sitter hemma — men inte i parken')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gör till veckans prioritet' })).toBeInTheDocument()
  })

  it('dismisses and persists a 14-day silence window', async () => {
    mockApiFetch.mockResolvedValue(payloadWith([
      { exerciseId: 'sitt', environment: 'home', successRate: 0.9, attempts: 10 },
      { exerciseId: 'sitt', environment: 'park', successRate: 0.4, attempts: 10 },
    ]))
    const { container } = render(<InsightCard dogId="dog-1" />)
    await screen.findByText('Sitt sitter hemma — men inte i parken')
    fireEvent.click(screen.getByRole('button', { name: 'Stäng insikt' }))
    expect(container).toBeEmptyDOMElement()
    expect(localStorage.getItem('insight-dismissed:dog-1:sitt:park')).toBeTruthy()
  })

  it('does not render a dismissed insight within the window', async () => {
    localStorage.setItem('insight-dismissed:dog-1:sitt:park', new Date().toISOString())
    mockApiFetch.mockResolvedValue(payloadWith([
      { exerciseId: 'sitt', environment: 'home', successRate: 0.9, attempts: 10 },
      { exerciseId: 'sitt', environment: 'park', successRate: 0.4, attempts: 10 },
    ]))
    const { container } = render(<InsightCard dogId="dog-1" />)
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('adds the exercise as weekly priority on cta click', async () => {
    mockApiFetch
      .mockResolvedValueOnce(payloadWith([
        { exerciseId: 'sitt', environment: 'home', successRate: 0.9, attempts: 10 },
        { exerciseId: 'sitt', environment: 'park', successRate: 0.4, attempts: 10 },
      ]))
      .mockResolvedValueOnce({ isoWeek: '2026-W24', areas: [], exerciseIds: ['plats'] })
      .mockResolvedValueOnce({ isoWeek: '2026-W24', areas: [], exerciseIds: ['plats', 'sitt'] })
    render(<InsightCard dogId="dog-1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Gör till veckans prioritet' }))
    await screen.findByText('Tillagd som veckans prioritet')
    const putCall = mockApiFetch.mock.calls[2]
    expect(putCall[0]).toBe('/api/training/focus?dogId=dog-1')
    expect(JSON.parse((putCall[2] as RequestInit).body as string)).toEqual({
      exerciseIds: ['plats', 'sitt'],
    })
  })
})
```

- [ ] **Step 2: Kör testet — ska faila**

Run: `npx vitest run src/components/InsightCard/InsightCard.test.tsx`
Expected: FAIL — komponenten finns inte.

- [ ] **Step 3: Implementera `src/components/InsightCard/InsightCard.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/fetch'
import { DogStatePayloadSchema, WeeklyFocusResponseSchema } from '@/types/api/schemas'
import {
  findEnvironmentGapInsight,
  formatInsightCopy,
  type EnvironmentGapInsight,
} from '@/lib/training/insights'
import { IconTarget, IconClose, IconCheck } from '@/components/icons'
import styles from './InsightCard.module.css'

interface Props {
  dogId: string
}

const DISMISS_WINDOW_MS = 14 * 24 * 60 * 60 * 1000

function dismissKey(dogId: string, insight: EnvironmentGapInsight): string {
  return `insight-dismissed:${dogId}:${insight.exerciseId}:${insight.hardEnv}`
}

function isDismissed(key: string): boolean {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return false
    return Date.now() - new Date(stored).getTime() < DISMISS_WINDOW_MS
  } catch {
    return false
  }
}

function markDismissed(key: string): void {
  try {
    localStorage.setItem(key, new Date().toISOString())
  } catch {
    // localStorage kan vara blockerad — insikten återkommer då nästa besök.
  }
}

export default function InsightCard({ dogId }: Props) {
  const [insight, setInsight] = useState<EnvironmentGapInsight | null>(null)
  const [prioritized, setPrioritized] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiFetch(`/api/training/dog-state?dogId=${dogId}`, DogStatePayloadSchema)
      .then((payload) => {
        if (cancelled) return
        const found = findEnvironmentGapInsight(payload)
        if (found && !isDismissed(dismissKey(dogId, found))) setInsight(found)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [dogId])

  if (!insight) return null
  const current = insight
  const copy = formatInsightCopy(current)

  function dismiss() {
    markDismissed(dismissKey(dogId, current))
    setInsight(null)
  }

  async function makePriority() {
    if (saving) return
    setSaving(true)
    try {
      const focus = await apiFetch(`/api/training/focus?dogId=${dogId}`, WeeklyFocusResponseSchema)
      if (!focus.exerciseIds.includes(current.exerciseId)) {
        await apiFetch(`/api/training/focus?dogId=${dogId}`, WeeklyFocusResponseSchema, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exerciseIds: [...focus.exerciseIds, current.exerciseId] }),
        })
      }
      markDismissed(dismissKey(dogId, current))
      setPrioritized(true)
    } catch {
      // Behåll kortet så föraren kan försöka igen.
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.iconWrap}>
        <IconTarget size="md" />
      </div>
      <div className={styles.content}>
        <p className={styles.kicker}>Veckans insikt</p>
        <p className={styles.title}>{copy.title}</p>
        <p className={styles.body}>{copy.body}</p>
        {prioritized ? (
          <p className={styles.confirmation}>
            <IconCheck size="sm" /> Tillagd som veckans prioritet
          </p>
        ) : (
          <button type="button" className={styles.cta} onClick={makePriority} disabled={saving}>
            Gör till veckans prioritet
          </button>
        )}
      </div>
      <button type="button" className={styles.dismiss} onClick={dismiss} aria-label="Stäng insikt">
        <IconClose size="sm" />
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Skapa `src/components/InsightCard/InsightCard.module.css`**

Följ dashboardens kortspråk (jfr `tipCard` i `src/app/dashboard/page.module.css` — kontrollera variabelnamn där och återanvänd samma tokens):

```css
.card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: var(--surface, #fff);
  border: 1px solid var(--border, #e5e1d8);
  border-radius: 16px;
  padding: 16px;
  position: relative;
}

.iconWrap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--accent-soft, #f0ece2);
  color: var(--accent, #6b8e23);
}

.content {
  flex: 1;
  min-width: 0;
}

.kicker {
  margin: 0 0 2px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted, #8a8577);
}

.title {
  margin: 0 0 4px;
  font-weight: 600;
}

.body {
  margin: 0 0 10px;
  font-size: 0.9rem;
  color: var(--text-secondary, #5c574b);
  line-height: 1.45;
}

.cta {
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  background: var(--accent, #6b8e23);
  color: #fff;
  cursor: pointer;
}

.cta:disabled {
  opacity: 0.6;
  cursor: default;
}

.confirmation {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent, #6b8e23);
}

.dismiss {
  position: absolute;
  top: 10px;
  right: 10px;
  border: none;
  background: none;
  color: var(--text-muted, #8a8577);
  cursor: pointer;
  padding: 4px;
}
```

- [ ] **Step 5: Kör komponenttestet — ska passera**

Run: `npx vitest run src/components/InsightCard/InsightCard.test.tsx`
Expected: PASS (5 tester).

- [ ] **Step 6: Koppla in på dashboarden**

I `src/app/dashboard/page.tsx`: lägg till importen

```ts
import InsightCard from '@/components/InsightCard/InsightCard'
```

och direkt efter den stängande `</div>` för `#today-training` (rad 576), före `progressionHints`-blocket:

```tsx
        {profile?.id && !beforeHomecoming && <InsightCard dogId={profile.id} />}
```

- [ ] **Step 7: Verifiera**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: grönt.

- [ ] **Step 8: Commit**

```bash
git add src/components/InsightCard/ src/app/dashboard/page.tsx
git commit -m "feat(dashboard): environment-gap insight card with weekly priority cta"
```

---

### Task 11: Migration, slutverifiering och smoke test

- [ ] **Step 1: Full verifiering**

Run: `npm run lint && npm run test && npm run build`
Expected: allt grönt.

- [ ] **Step 2: Applicera migrationen (ägar-steg — agenten kör INTE detta)**

Be ägaren köra innehållet i `supabase/migrations/025_chat_messages.sql` i Supabase SQL Editor. Pausa tills det är bekräftat.

- [ ] **Step 3: Verifiera mot live-DB via REST-probe**

Lärdomen från migration 015: anta aldrig att migrationen är applicerad. Proba med service-role-nyckeln (finns i `.env.local`):

```bash
source .env.local 2>/dev/null || true
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/chat_messages?select=id&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Expected: `[]` (tom array = tabellen finns). Ett felobjekt med `"relation ... does not exist"` betyder att migrationen inte är applicerad.

- [ ] **Step 4: Manuellt smoke test**

Med `npm run dev`:
1. Öppna chatten, ställ en fråga, få svar — ladda om sidan → konversationen ska vara kvar.
2. Ställ en följdfråga som bara funkar med minne ("och hur går jag vidare med det?") → svaret ska referera till föregående ämne.
3. För en hund med metrics i olika miljöer: dashboarden ska visa insiktskortet; "Gör till veckans prioritet" ska lägga övningen i veckofokus (verifiera under fokusvalen); stäng-knappen ska dölja kortet även efter reload.

- [ ] **Step 5: Slutcommit om något justerats**

```bash
git status
```

Committa eventuella justeringar med beskrivande meddelande.
