# Gemensam händelseström (Delprojekt F) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chat, plan och kurs delar bild av ekipaget: chattfrågors ämnen loggas deterministiskt (`chat_topics`), chatten får en kort dagsform-/ämnessammanfattning i sin kontext, och veckoplanens `onboardingContext` får "Föraren har nyligen frågat om: X".

**Architecture:** Migration 024 (`chat_topics`, RLS owner-only). Ren lib `src/lib/dog/chat-topics.ts` (lexikonmatchning, ingen extra LLM-call) + `src/lib/dog/timeline.ts` (ren sammanfattning) — båda TDD. Persistens `src/lib/supabase/chat-topics.ts`. Wiring i chat-routen och veckoorkestratorn, failure-tolerant.

**Tech Stack:** vitest, Supabase, Next.js App Router (läs `node_modules/next/dist/docs/` före route-ändringar).

**Spec:** `docs/superpowers/specs/2026-06-11-adaptive-intelligence-design.md` (avsnitt "Delprojekt F").

---

### Task 1: Migration 024 + databastyper

**Files:**
- Create: `supabase/migrations/024_chat_topics.sql`
- Modify: `src/types/database.ts` (alfabetiskt i `Tables`; mellan `breed_chunks`-gruppens grannar — korrekt bokstavsordning gäller)

- [ ] **Step 1: Migrationen**

```sql
create table public.chat_topics (
  id         uuid primary key default gen_random_uuid(),
  dog_id     uuid not null references public.dog_profiles(id) on delete cascade,
  topic      text not null,
  created_at timestamptz not null default now()
);

create index chat_topics_dog_idx on public.chat_topics (dog_id, created_at desc);

alter table public.chat_topics enable row level security;

create policy "owner_only" on public.chat_topics
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

- [ ] **Step 2: Databastyper**

```ts
      chat_topics: {
        Row: {
          id: string
          dog_id: string
          topic: string
          created_at: string
        }
        Insert: {
          id?: string
          dog_id: string
          topic: string
          created_at?: string
        }
        Update: {
          id?: string
          dog_id?: string
          topic?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_topics_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dog_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
```

- [ ] **Step 3: Verifiera + commit**

Run: `npx tsc --noEmit`

```bash
git add supabase/migrations/024_chat_topics.sql src/types/database.ts
git commit -m "feat(timeline): chat_topics table and types"
```

**OBS till ägaren (skriv i rapporten, kör inte):** migration 024 måste appliceras i Supabase.

---

### Task 2: Ämnesextraktion (TDD)

**Files:**
- Create: `src/lib/dog/chat-topics.ts`
- Test: `src/lib/dog/chat-topics.test.ts`

- [ ] **Step 1: Failande tester**

```ts
import { describe, it, expect } from 'vitest'
import { extractChatTopic } from './chat-topics'

describe('extractChatTopic', () => {
  it.each([
    ['Min hund skäller på allt som rör sig', 'skällande'],
    ['Hon drar i kopplet hela promenaden', 'koppeldragande'],
    ['Han kommer inte när jag ropar', 'inkallning'],
    ['Hur länge kan jag lämna honom ensam hemma?', 'ensamhet'],
    ['Valpen bits när vi leker', 'bitande'],
    ['Hon är rädd för smällar och fyrverkerier', 'rädsla'],
    ['Han gör utfall mot andra hundar i kopplet', 'reaktivitet'],
    ['Hunden verkar stressad efter träningen', 'stress'],
    ['Valpen kissar inne fast vi varit ute', 'rumsrenhet'],
  ])('extracts %s → %s', (query, topic) => {
    expect(extractChatTopic(query)).toBe(topic)
  })

  it('returns null when no topic matches', () => {
    expect(extractChatTopic('Vilket foder rekommenderar du?')).toBeNull()
  })

  it('is case-insensitive', () => {
    expect(extractChatTopic('SKÄLLER PÅ BREVBÄRAREN')).toBe('skällande')
  })

  it('matches reactivity before generic leash topics for utfall queries', () => {
    expect(extractChatTopic('utfall mot hundar när han drar i kopplet')).toBe('reaktivitet')
  })
})
```

- [ ] **Step 2: Kör, verifiera FAIL**

- [ ] **Step 3: Implementera**

```ts
const TOPIC_LEXICON: Array<{ topic: string; pattern: RegExp }> = [
  { topic: 'reaktivitet', pattern: /reaktiv|utfall mot/i },
  { topic: 'skällande', pattern: /skäll|bjäbb/i },
  { topic: 'koppeldragande', pattern: /drar i koppl|koppeldrag/i },
  { topic: 'inkallning', pattern: /inkallning|kommer inte när|springer iväg/i },
  { topic: 'ensamhet', pattern: /ensam hemma|separationsångest|lämna.{0,20}ensam/i },
  { topic: 'bitande', pattern: /\bbits\b|biter|nafsar/i },
  { topic: 'rädsla', pattern: /rädd|rädsla|skotträdd/i },
  { topic: 'stress', pattern: /stressad|\bstress\b|varva ner/i },
  { topic: 'rumsrenhet', pattern: /kissar inne|bajsar inne|rumsren/i },
  { topic: 'matvägran', pattern: /äter inte|matvägran/i },
]

export function extractChatTopic(query: string): string | null {
  for (const { topic, pattern } of TOPIC_LEXICON) {
    if (pattern.test(query)) return topic
  }
  return null
}
```

(Ordningen är prioritetsordning — reaktivitet före skällande/koppel med flit.)

- [ ] **Step 4: Kör (12 PASS) + commit**

```bash
git add src/lib/dog/chat-topics.ts src/lib/dog/chat-topics.test.ts
git commit -m "feat(timeline): deterministic chat topic extraction"
```

---

### Task 3: Timeline-sammanfattning (TDD)

**Files:**
- Create: `src/lib/dog/timeline.ts`
- Test: `src/lib/dog/timeline.test.ts`

- [ ] **Step 1: Failande tester**

```ts
import { describe, it, expect } from 'vitest'
import { summarizeDogTimeline } from './timeline'

describe('summarizeDogTimeline', () => {
  it('returns null without any data', () => {
    expect(summarizeDogTimeline({ checkIns: {}, recentTopics: [] })).toBeNull()
  })

  it('summarizes check-in zones', () => {
    const result = summarizeDogTimeline({
      checkIns: { '2026-06-09': 'green', '2026-06-10': 'green', '2026-06-11': 'red' },
      recentTopics: [],
    })
    expect(result).toContain('2 gröna')
    expect(result).toContain('1 röd')
  })

  it('lists recent chat topics', () => {
    const result = summarizeDogTimeline({
      checkIns: {},
      recentTopics: ['skällande', 'inkallning'],
    })
    expect(result).toContain('skällande')
    expect(result).toContain('inkallning')
  })

  it('combines zones and topics on separate lines', () => {
    const result = summarizeDogTimeline({
      checkIns: { '2026-06-11': 'yellow' },
      recentTopics: ['stress'],
    })
    expect(result?.split('\n')).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Kör, verifiera FAIL**

- [ ] **Step 3: Implementera**

```ts
import type { PuppyZone } from '@/lib/training/puppy-zone'

export interface TimelineInputs {
  /** daily_check_ins som datum → zon, senaste 14 dagarna */
  checkIns: Record<string, PuppyZone>
  /** distinkta chatämnen, nyast först */
  recentTopics: string[]
}

export function summarizeDogTimeline(inputs: TimelineInputs): string | null {
  const lines: string[] = []

  const zones = Object.values(inputs.checkIns)
  if (zones.length > 0) {
    const green = zones.filter((z) => z === 'green').length
    const yellow = zones.filter((z) => z === 'yellow').length
    const red = zones.filter((z) => z === 'red').length
    const parts = [
      green > 0 ? `${green} ${green === 1 ? 'grön' : 'gröna'}` : null,
      yellow > 0 ? `${yellow} ${yellow === 1 ? 'gul' : 'gula'}` : null,
      red > 0 ? `${red} ${red === 1 ? 'röd' : 'röda'}` : null,
    ].filter(Boolean)
    lines.push(`Dagsform senaste 14 dagarna: ${parts.join(', ')} dagar.`)
  }

  if (inputs.recentTopics.length > 0) {
    lines.push(`Föraren har nyligen frågat om: ${inputs.recentTopics.join(', ')}.`)
  }

  return lines.length > 0 ? lines.join('\n') : null
}
```

- [ ] **Step 4: Kör (4 PASS) + hela sviten + commit**

```bash
git add src/lib/dog/timeline.ts src/lib/dog/timeline.test.ts
git commit -m "feat(timeline): pure dog timeline summary"
```

---

### Task 4: Persistens + wiring i chat och orkestrator

**Files:**
- Create: `src/lib/supabase/chat-topics.ts`
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/lib/training/week-orchestrator.ts`

- [ ] **Step 1: `src/lib/supabase/chat-topics.ts`**

```ts
import { getSupabaseAdmin } from './client'

const TOPIC_WINDOW_DAYS = 14
const MAX_TOPICS = 3

export async function logChatTopic(dogId: string, topic: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('chat_topics')
    .insert({ dog_id: dogId, topic })
  if (error) throw new Error(`chat topic insert failed: ${error.message}`)
}

export async function getRecentChatTopics(dogId: string): Promise<string[]> {
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - TOPIC_WINDOW_DAYS)
  const { data, error } = await getSupabaseAdmin()
    .from('chat_topics')
    .select('topic, created_at')
    .eq('dog_id', dogId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(30)
  if (error || !data) return []
  const seen = new Set<string>()
  for (const row of data) {
    seen.add(row.topic)
    if (seen.size >= MAX_TOPICS) break
  }
  return [...seen]
}
```

- [ ] **Step 2: Chat-routen**

Läs först route-handler-docs i `node_modules/next/dist/docs/`. Ändringar i
`src/app/api/chat/route.ts`:

Imports:

```ts
import { extractChatTopic } from '@/lib/dog/chat-topics'
import { summarizeDogTimeline } from '@/lib/dog/timeline'
import { logChatTopic, getRecentChatTopics } from '@/lib/supabase/chat-topics'
import { getCheckIns } from '@/lib/supabase/daily-check-ins'
```

Direkt efter raden
`const { context: onboardingContext } = await getBehaviorContextPayloadFromDb(supabase, dog.id)`:

```ts
      const timelineContext = await (async () => {
        try {
          const since = new Date()
          since.setUTCDate(since.getUTCDate() - 14)
          const [checkIns, recentTopics] = await Promise.all([
            getCheckIns(dog.id, since.toISOString().slice(0, 10), todayDateString()),
            getRecentChatTopics(dog.id),
          ])
          return summarizeDogTimeline({ checkIns, recentTopics })
        } catch {
          return null
        }
      })()
      const chatContext = [onboardingContext, timelineContext].filter(Boolean).join('\n') || undefined
```

Byt sedan användningen:
- `isPersonalized`-raden: `|| !!onboardingContext` blir `|| !!chatContext`.
- `queryRAG(...)`-anropet: sista argumentet `onboardingContext ?? undefined` blir `chatContext`.
- `detectSecretExposure(onboardingContext)`-raden lämnas som den är (timeline-texten
  är systemgenererad och kan inte innehålla användarhemligheter).

Sist i handlern, direkt FÖRE `return NextResponse.json(result)` (den lyckade vägen):

```ts
      const topic = extractChatTopic(query)
      if (topic) {
        void logChatTopic(dog.id, topic).catch(() => {
          // Ämnesloggning är telemetri — får aldrig fälla chatsvaret.
        })
      }
```

- [ ] **Step 3: Orkestratorn**

I `buildWeekContextFromRequest` i `src/lib/training/week-orchestrator.ts`:

Import: `import { getRecentChatTopics } from '@/lib/supabase/chat-topics'`.

Leta upp blocket som bygger `onboardingContext` av `sexLines` (raderna med
`const sexLines: string[] = []` ... `const onboardingContext = ...`). Ändra så att
chatämnena vävs in:

```ts
  const recentTopics = await getRecentChatTopics(dog.id).catch(() => [] as string[])
  const topicLine = recentTopics.length > 0
    ? `Föraren har nyligen frågat AI-coachen om: ${recentTopics.join(', ')}`
    : null
  const onboardingContext = [baseOnboardingContext, sexLines.length > 0 ? sexLines.join('\n') : null, topicLine]
    .filter(Boolean)
    .join('\n')
```

(Ersätter den befintliga ternären — verifiera att tom sträng-beteendet bevaras:
`[].join` på tom lista ger `''`, vilket matchar dagens `baseOnboardingContext`-fallback
när allt annat saknas. `onboardingContext` används också i cache-nyckeln
(`ctx.onboardingContext`), så ett nytt chatämne invaliderar veckoplanscachen — det är
avsikten: planen ska reagera på vad föraren oroar sig för.)

- [ ] **Step 4: Full verifiering**

Run: `npx tsc --noEmit && npm run test && npm run build` — allt grönt.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/chat-topics.ts src/app/api/chat/route.ts src/lib/training/week-orchestrator.ts
git commit -m "feat(timeline): chat topics feed both chat context and week planning"
```

---

## Slutkriterier

- 12 + 4 nya tester gröna; hela sviten + build grönt.
- Chattfrågor med igenkänt ämne loggas (fire-and-forget); okända ämnen loggas inte.
- Chatten ser dagsform + senaste ämnen; veckoplanen ser senaste ämnen.
- Allt failure-tolerant: timeline/ämnen som inte går att hämta ⇒ exakt dagens beteende.
