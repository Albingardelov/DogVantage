# Chat-minne + dog_state-kontext & Veckans insikt (miljögap)

**Datum:** 2026-06-12
**Status:** Godkänd design, ordning Spår 1 → Spår 2

## Mål

Två spår ur smartness-analysen, valda för hög effekt/låg insats:

1. **Chat-minne + full kontext** — chatten är idag en engångsfråga: `ChatInterface`
   skickar bara `{ query, dogId }`, modellen ser aldrig tidigare turer, historiken bor
   enbart i klient-state och försvinner vid reload. Dessutom får chatten inte
   `dog_state` (svaga/starka övningar, miljösvårighet, handler-dimensioner) trots att
   payloaden finns färdigberäknad och cachad.
2. **Veckans insikt: miljögap** — motorns intelligens är osynlig. Ett deterministiskt
   dashboard-kort som visar per-övning-miljögap ("Sitt: 90 % hemma, 40 % i parken —
   generaliseringssteg, inte trots") gör den synlig.

## Arkitekturprinciper (ärvda från adaptivitetsinitiativet)

- **Deterministiskt först.** Insiktslogiken är rena TS-funktioner med TDD — ingen LLM.
  LLM används bara där den redan används (chat-svaret).
- **Server-authoritative state, ren lib-logik.** Historiken läses server-side; klienten
  kan inte spoofa/trimma prompt-input. Rena funktioner som RN-appen kan importera.
- **RLS på alla nya tabeller**, owner-only via `dog_profiles.user_id = auth.uid()`.
- **Bygg vidare, duplicera inte.** Allt läser från `dog_state`-substratet; insiktskortet
  använder befintliga `GET /api/training/dog-state` och `PUT /api/training/focus`.

---

## Spår 1 — Chat-minne + dog_state i kontexten

### Vald arkitektur

Server-authoritative (alternativ B — klient-skickad historik — förkastades: historiken
blir klientstyrd prompt-input och RN måste bygga om logiken).

### Migration `025_chat_messages.sql`

```sql
create table public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  dog_id     uuid not null references public.dog_profiles(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);
create index on public.chat_messages (dog_id, created_at desc);
-- RLS owner-only via dog_profiles.user_id = auth.uid(),
-- samma mönster som daily_check_ins.
```

Körs manuellt i SQL Editor (projektet är inte CLI-länkat). **Verifiera mot live-DB
efteråt via REST-probe** — lärdomen från migration 015.

### API

- **`GET /api/chat/history?dogId=`** (ny route, `withAuthAndDog`): returnerar de
  senaste 30 meddelandena i stigande tidsordning (`{ messages: Array<{ role, content,
  created_at }> }`).
- **`POST /api/chat`** (befintlig route utökas):
  1. Hämtar de senaste 8 meddelandena för hunden; varje meddelande kapas till
     1 000 tecken (tokenbudget).
  2. Hämtar `getDogState(dog.id)` (redan stale-while-revalidate 6 h).
  3. Skickar historik + dog-state till `queryRAG`.
  4. Persisterar user-frågan och assistentsvaret efter lyckat svar — **även när
     safety-guards kortsluter** (VET_RESPONSE/BEHAVIOR_RESPONSE), så tråden renderas
     konsekvent vid reload. Skrivningar via user-klienten så RLS gäller.
  5. Misslyckad persistens får aldrig fälla chatsvaret (warn + fortsätt).

### `queryRAG`-ändringar

- Ny parameter `history: Array<{ role: 'user' | 'assistant'; content: string }>` —
  läggs som meddelanden mellan system-prompten och den nya user-frågan i Groq-anropet
  (assistant-rollen mappas till modellens assistant-roll).
- Ny prompt-sektion `=== HUNDPROFIL (DATA) ===` byggd från `DogStatePayload`:
  - svaga/starka övningar med svenska etiketter via `exerciseLabel` + success-procent
  - miljösvårighet inkl. nya `environmentByExercise` (från Spår 2; sektionen byggs
    tolerant så den funkar utan fältet tills Spår 2 landat)
  - handler-dimensioner (timing/konsekvens/läsning, endast när `sampleSize >= 3`)
  - zonsummering (gröna/gula/röda dagar, 14 d)
  - Sektionen utelämnas helt när payloaden saknar signal (ny hund) — graceful
    degradation.
- Formateringen är en ren funktion `formatDogStateForPrompt(payload): string | null`
  i `src/lib/ai/` med enhetstester.

### Cache-interaktion

Så fort historik finns räknas frågan som personaliserad — `isPersonalized` utökas med
`history.length > 0`. Svarscachen används därmed bara för första meddelandet från
ekipage utan personlig data, precis som idag. Cachade svar persisteras också till
historiken.

### Klient (`ChatInterface`)

- Vid mount: hämta `GET /api/chat/history`; när historik finns ersätter den dagens
  hårdkodade hälsningsmeddelande, annars visas hälsningen som idag.
- Skickar fortsatt bara `{ query, dogId }` — servern äger historiken.
- Förslagschips (`messages.length < 6`-logiken) visas bara när historiken är tom.
- Dagsgränsen (`DAILY_CHAT_LIMIT`) orörd.

### Retention

Ingen aktiv gallring i v1 — `GET` läser bara senaste 30, `POST` bara senaste 8.
Tabellen växer långsamt (dagsgräns finns). Gallring är ett senare optimeringsbeslut.

---

## Spår 2 — Veckans insikt: miljögap

### Datagrund: utöka `computeDogState`

Dagens `environmentDifficulty` är aggregerad över alla övningar och kan bara säga "ute
är svårare än hemma" — det vet varje förare redan. Den träffsäkra insikten kräver
**per övning × miljö**. Additivt fält i `DogStatePayload` (ingen versionsbump,
zod-schemat uppdateras):

```ts
environmentByExercise: Array<{
  exerciseId: string
  environment: SkillEnvironment   // 'home' | 'outdoor' | 'park' | 'mixed'
  successRate: number
  attempts: number
}>  // endast kombinationer med >= 8 försök
```

Aggregationen återanvänder `inferEnvironment(criteria_level_id)` från
`skill-progress.ts`. Bonus: eftersom Spår 1 matar hela payloaden till chatten får
AI-coachen miljögapet gratis.

### Ren funktion `findEnvironmentGapInsight`

`src/lib/training/insights.ts` (TDD):

```ts
interface EnvironmentGapInsight {
  exerciseId: string
  easyEnv: SkillEnvironment
  hardEnv: SkillEnvironment
  easyRate: number
  hardRate: number
}

function findEnvironmentGapInsight(payload: DogStatePayload): EnvironmentGapInsight | null
```

- Miljöordning: `home < outdoor < park`; `mixed` exkluderas.
- Kandidat: samma övning har lättare miljö med success ≥ 0,75 och svårare miljö med
  success ≤ 0,50, båda med ≥ 8 försök.
- Vid flera kandidater väljs störst gap (`easyRate - hardRate`).
- Saknas `environmentByExercise` (gammal cachad payload) → `null`.
- Copy byggs deterministiskt i en separat funktion (`formatInsightCopy`) med
  `exerciseLabel` och svenska miljönamn: mål-mönstret är
  *"Sitt sitter på 90 % hemma men 40 % i parken. Det är inte trots — hunden har inte
  generaliserat beteendet än. Träna mellansteget: kortare avstånd, färre störningar,
  högre belöning."*

### UI — `InsightCard` på dashboarden

- **Visas endast när insikt finns** och inte är avfärdad — inga utfyllnadsbudskap.
- Avfärdning lagras i `localStorage` per `dogId + exerciseId + hardEnv` med 14 dagars
  tystnadsfönster — ingen ny tabell. Samma insikt (samma nyckel) återkommer inte inom
  fönstret; en ny insikt (annan övning/miljö) får visas direkt.
- Data via befintliga `GET /api/training/dog-state` — ingen ny endpoint.
- Ikon från eget ikonpaket (`src/components/icons`), **inga emojis**.
- **One-tap-åtgärd:** "Gör till veckans prioritet" → `PUT /api/training/focus` med
  övningens id tillagt i befintliga `exerciseIds` (läs nuvarande prioriteringar först
  så inget skrivs över). Veckoplanering och dags-skalning tar då hänsyn direkt.
  Knappstil och bekräftelsemönster följer CoachAction-knapparna i träningskortet.
- Placering: under check-in-/träningskortet, ovanför statistiken.

---

## Testning & verifiering

- TDD för all ren logik: `insights.test.ts` (nya), `dog-state.test.ts` (utökas med
  `environmentByExercise`), `formatDogStateForPrompt`-tester, prompt-snapshot för
  `queryRAG`-sektionerna enligt befintligt mönster
  (`week-plan-prompt.snapshot.test.ts`).
- Datarader skickas in som argument — inga Supabase-mocks i enhetstester (mönstret
  från `progression-rules.test.ts`).
- API-routes: `withAuthAndDog` + zod-validering enligt befintligt mönster.
- `npm run lint && npm run test && npm run build` grönt per spår; varje spår är en
  egen commit-serie och lämnar appen i releasbart skick.
- **Next.js i repot har breaking changes** — läs relevanta guider i
  `node_modules/next/dist/docs/` innan route-/page-kod skrivs (gäller alla utförare).

## Risker & avgränsningar

- **Nya hundar utan data:** insiktskortet visas inte; chatten funkar som idag utan
  HUNDPROFIL-sektion — graceful degradation enligt `MIN_ATTEMPTS`-filosofin.
- **Migrationsrisk:** 025 körs manuellt; verifiera mot live-DB efteråt.
- **Tokenkostnad:** 8 historikmeddelanden × 1 000 tecken + dog-state-sektionen ryms
  gott i Groq-modellens kontext; `max_tokens` för svaret orörd.
- **Stale cachade payloads:** `dog_state`-rader äldre än 6 h räknas om automatiskt och
  får då `environmentByExercise`; insiktsfunktionen hanterar avsaknad tolerant.
- **Utelämnat (YAGNI):** historik-gallring, fler insiktstyper (trend, kalibrering,
  utvecklingsfönster — kandidater för v2), server-lagrad avfärdning, flertråds-chat.
