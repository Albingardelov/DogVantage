# Adaptiv intelligens — app, AI, hund och förare i en loop

**Datum:** 2026-06-11
**Status:** Godkänd riktning (ägaren: "bygg alla"), ordning C → A → B → D → E → F

## Mål

Appen ska kännas som att den lär känna ekipaget. Tre brister åtgärdas:

1. **Loopen är en vecka lång** — adaptivitet sker bara vid plangenerering.
2. **Hund och förare behandlas separat** — förarens skattningar och quizresultat påverkar varken plan eller kurs.
3. **Ingen individuell hundmodell** — appen lär sig inte vad som faktiskt funkar för just den här hunden.

## Arkitekturprinciper

- **Deterministiskt först.** Ingen LLM i rep- eller dagsloopen. All adaptivitet är rena
  TS-funktioner i `src/lib/training/` med enhetstester (TDD). LLM används bara där den
  redan används (vecko-prompt, micro-lessons, quiz-generering).
- **Server-authoritative state, ren lib-logik.** Beräkningar är rena funktioner som även
  RN-appen kan importera; persistens går via befintliga API-routes med `withAuthAndDog`.
  Inga nya klient-beroenden som inte överlever RN-migrationen.
- **RLS på alla nya tabeller**, owner-only via `dog_profiles.user_id = auth.uid()` —
  samma mönster som `daily_check_ins`/`curriculum_progress`.
- **Bygg vidare, duplicera inte.** Per-rep-motorn finns redan
  (`TrainingCard/recommendation.ts` + `SessionGuard`), progressionsregler finns
  (`progression-rules.ts`), check-ins finns (`daily_check_ins`), miljö-buckets finns
  (`skill-progress.ts`). Delprojekten kopplar ihop och flyttar upp dessa.

## Nuläge (det som redan adapterar)

| Signal | Var | Påverkar idag |
|---|---|---|
| success/fail/latens per rep | `daily_exercise_metrics` (dog_id, date, exercise_id) | progression-beslut per vecka + klientrekommendation |
| kriterienivå (`ladder` i `exercise-specs.ts`) | metrics.criteria_level_id | manuell växling i UI |
| valpzon grön/gul/röd | `daily_check_ins` | dagens pass för valpar |
| förar-självskattning (timing/konsekvens/läsning) | `session_logs.handler_*` | endast tips (`handler-feedback.ts`) |
| quizresultat (spaced repetition) | `quiz_cards` | endast quizets egen intervallschemaläggning |
| veckofokus, prioriterade övningar, löp, reaktivitet | diverse | veckoplanen |

---

## Delprojekt C — Dog State-substrat (först: allt annat läser härifrån)

En per-hund härledd profil, deterministiskt beräknad från befintlig data, cachad i DB.

### Tabell

```sql
create table public.dog_state (
  dog_id      uuid primary key references public.dog_profiles(id) on delete cascade,
  payload     jsonb not null,
  computed_at timestamptz not null default now()
);
-- RLS owner-only via dog_profiles, samma mönster som daily_check_ins.
```

### Payload v1 (zod-schema i `src/types/api/schemas.ts`)

```ts
interface DogStatePayload {
  version: 1
  weakExercises:   Array<{ exerciseId: string; successRate: number; attempts: number }>
  strongExercises: Array<{ exerciseId: string; successRate: number; attempts: number }>
  environmentDifficulty: Partial<Record<SkillEnvironment, number>> // success rate per miljö
  handler: { timing: number | null; consistency: number | null; reading: number | null; sampleSize: number }
  zoneSummary: { greenDays: number; yellowDays: number; redDays: number; window: 14 }
  thresholdAdjustments: Record<string, number> // exercise_id → delta på advance-tröskel (sätts av E, tom i C)
}
```

### Lib

- `src/lib/training/dog-state.ts`:
  - `computeDogState(inputs): DogStatePayload` — ren funktion. Inputs: metrics-rader
    (28 d), session_logs (10 senaste), check-ins (14 d), quiz-statistik. Återanvänder
    aggregationslogik från `skill-progress.ts` och `handler-feedback.ts` (extrahera
    gemensamma hjälpfunktioner i stället för att duplicera).
  - `src/lib/supabase/dog-state.ts`: `getDogState(dogId)` med stale-while-revalidate —
    läs cachad rad; om `computed_at` äldre än 6 h, räkna om och upsert:a. Skrivning sker
    server-side med admin-klient efter ägarverifiering (mönstret från `training-cache`).
- `GET /api/training/dog-state?dogId=` via `withAuthAndDog`, returnerar payload.
  Veckoorkestratorn och övriga delprojekt läser via lib-funktionen direkt (inte HTTP).

### Telemetri

`trackTelemetry('dog_state_computed', { dogId, durationMs, sampleSizes })`.

---

## Delprojekt A — Adaptivt pass (in-session coach)

Evolvera `TrainingCard/recommendation.ts` till `src/lib/training/session-coach.ts` (ren lib,
flyttas till `lib` så RN kan dela den). Klienten behåller sin optimistiska state; ingen
server-rundresa per rep (offline-vänligt, i linje med RN-SCALE-2).

### Beteende

Input: dagens metrics + `SessionGuard` + övningens `ladder` + aktuell kriterienivå +
dog-state (trösklar) + dagens check-in (zon/energi, från B — tills B finns: valpzonen).

Output utökas från dagens `Recommendation` till en handlingsbar `CoachAction`:

```ts
interface CoachAction {
  kind: 'keep' | 'raise' | 'lower' | 'stop' | 'end_on_success'
  message: string
  suggestedLevelId: string | null  // nästa/föregående steg i ladder, null om oförändrad
}
```

- **`lower`/`stop`**: föreslår konkret nivå (steget under i `ladder`). UI visar en
  one-tap-knapp "Sänk till {label}" som applicerar via befintliga metrics-PATCH
  (`criteria_level_id`). Ingen auto-apply — föraren bekräftar med ett tryck.
- **`raise`**: motsvarande "Höj till {label}" (ej för valpar, som idag).
- **`end_on_success`**: nytt. När stop-regeln slagit till och nästa rep är lyckad →
  "Avsluta här — du slutade på topp." Avslutar övningen i förtid: markerar övningen
  klar i progress (befintlig PATCH med `count = reps`).
- Trösklar: läs per-övnings-delta från dog-state `thresholdAdjustments` (no-op tills E).

### UI

`ExerciseRow` byter `recommendation: string` mot `CoachAction` och renderar knappen.
Kriteriechipen behåller manuell växling. Befintlig `buildRecommendation`-logik och
tester migreras till `session-coach.test.ts` och utökas.

---

## Delprojekt B — Dags-checkin för hela ekipaget

### Migration

```sql
alter table daily_check_ins
  add column if not exists handler_energy text check (handler_energy in ('low','ok','high')),
  add column if not exists minutes_available int check (minutes_available between 0 and 120);
```

Zonen generaliseras till alla hundar (grön/gul/röd = hundens dagsform, inte bara valp).

### Lib

`src/lib/training/day-scaler.ts`: `scaleDayPlan(exercises, checkin): Exercise[]` — ren funktion.

- `red` zon → vilodag med återhämtningstips (återanvänd `getRecoveryTips`).
- `yellow` zon → 1 lugn övning (återanvänd `selectYellowExercise` — generalisera ut ur
  `puppy-zone.ts` så valp-flödet och detta delar implementation).
- `handler_energy = 'low'` eller `minutes_available < 10` → behåll 1 övning
  (prioriterad > fokus > första), reps oförändrade.
- Annars oförändrat. Veckoplanen i DB rörs inte — skalning är en dagsvy.

### API & UI

- `checkin`-routen utökas att ta emot/returnera de nya fälten (zod-validering).
- Dashboard: kompakt morgonprompt för alla hundar ("Hur är formen idag? Hur mycket tid
  har du?") — `PuppyDayCard` generaliseras till `DayCheckInCard`; valp-copyn behålls
  för valpar. Svar är frivilligt; utan svar gäller planen som den är.
- `useTodayExercises` applicerar `scaleDayPlan`.

---

## Delprojekt D — Ekipage-koppling (föraren påverkar plan och kurs)

### Handler-signal

`src/lib/training/handler-state.ts`: `computeHandlerStruggle(dogState, quizStats)` →
`{ struggling: boolean; dimensions: HandlerDimension[]; reason: string }`.
Struggling = någon handler-dimension < 3.0 (≥3 samples, samma trösklar som
`handler-feedback.ts`) ELLER quiz-träffsäkerhet < 50 % — mätt som andelen
`last_result = false` bland de 10 senast besvarade korten i `quiz_cards`
(sorterat på `updated_at`, kort med `last_result is null` exkluderas).

### Plan-påverkan (deterministisk)

I `computeProgressionDecisions`-konsumtionen (orkestratorn): om handler struggling →
dämpa alla `advance` till `hold` med reason "Vi stabiliserar en vecka — fokus på din
{timing/konsekvens}". Syns som befintliga reason-badges. Ingen ny UI.

### Kurs-påverkan

- Moduler i `curriculum-def.ts` taggas med `dimension?: HandlerDimension` och
  `exerciseIds?: string[]`.
- `getCurriculumOverview` tar dog-state + handler-state: moduler som matchar svaga
  dimensioner/övningar sorteras före (inom samma fas-grupp; basordningen är fallback)
  och får flaggan `recommended: true` med motivering ("Din timing-skattning är låg").
- Quiz-fel på en modulkopplad fråga (`context_key = curr_<moduleId>`) → modulen får
  `reviewSuggested: true` även om den är klarmarkerad ("Repetera").
- `CurriculumView` renderar "Rekommenderad för dig"- och "Repetera"-chips.

---

## Delprojekt E — Stängd beslutslopp + per-hund-kalibrering

### Migration

```sql
create table public.progression_decision_log (
  id                uuid primary key default gen_random_uuid(),
  dog_id            uuid not null references public.dog_profiles(id) on delete cascade,
  exercise_id       text not null,
  decision          text not null check (decision in ('advance','hold','regress')),
  success_rate      numeric not null,
  criteria_level_id text,
  created_at        timestamptz not null default now(),
  evaluated_at      timestamptz,
  outcome           text check (outcome in ('good','bad','neutral'))
);
create index on public.progression_decision_log (dog_id, exercise_id, created_at desc);
-- RLS owner-only via dog_profiles.
```

### Flöde

1. **Logga**: orkestratorn skriver varje beslut vid plangenerering (admin-klient,
   fire-and-forget — får aldrig blockera planen).
2. **Utvärdera**: vid nästa plangenerering utvärderas oevaluerade beslut äldre än 7 d:
   `advance` följt av `regress` på samma övning inom 14 d → `bad`; `advance` följt av
   fortsatt ≥ advance-tröskel → `good`; annars `neutral`. Ren funktion
   `evaluateDecisions(log, metricsWindow)` i `src/lib/training/decision-calibration.ts`.
3. **Kalibrera**: ≥ 2 `bad` advances på samma övning (senaste 10 beslut) → höj
   advance-tröskeln +0.05 för den övningen (tak 0.90); ≥ 5 `good` i rad → återställ mot
   0.80. Skrivs till dog-state `thresholdAdjustments`.
4. **Använd**: `computeProgressionDecisions` får `thresholdOverrides?: Record<string, number>`;
   session-coach (A) läser samma värden.

Telemetri: `progression_decision_evaluated` med utfall — ger mätbar beslutskvalitet.

---

## Delprojekt F — Gemensam händelseström (sist, minimal)

- `src/lib/dog/timeline.ts`: `getDogTimeline(dogId, days)` — läser befintliga tabeller
  (session_logs, daily_check_ins, quiz_cards, heat_cycles, progression_decision_log)
  och returnerar en kronologisk händelselista. Ingen ny tabell för v1 utom chatämnen:

```sql
create table public.chat_topics (
  id         uuid primary key default gen_random_uuid(),
  dog_id     uuid not null references public.dog_profiles(id) on delete cascade,
  topic      text not null,
  created_at timestamptz not null default now()
);
```

- Chat-routen extraherar ämne deterministiskt (matchning mot övnings-/problemlexikon,
  ingen extra LLM-call) och loggar.
- Konsumtion: (1) chat-systemkontext får en kort timeline-sammanfattning; (2) vecko-
  orkestratorns `onboardingContext` får "Föraren har nyligen frågat om: X" så planen
  och chatten delar bild.

---

## Testning & verifiering

- All lib-logik (dog-state, session-coach, day-scaler, handler-state,
  decision-calibration, timeline) byggs med TDD — rena funktioner, inga mocks av Supabase
  i enhetstester (datarader skickas in som argument, mönstret från `progression-rules.test.ts`).
- API-routes verifieras med befintligt mönster (`withAuthAndDog`, zod-scheman).
- `npm run lint && npm run test && npm run build` grönt per delprojekt; varje delprojekt
  är en egen commit-serie och lämnar appen i releasbart skick.

## Risker & avgränsningar

- **Datavolym**: nya hundar saknar signal — alla funktioner ska degradera till dagens
  beteende när sample-storlek < minimum (samma filosofi som `MIN_ATTEMPTS`).
- **Schemafilen `docs/supabase-schema.sql` är delvis inaktuell** — nya migrationer läggs
  i `supabase/migrations/` (021+), schemafilen rör vi inte.
- **Belöningseffektivitet per belöningstyp** (idé från analysen) kräver ny loggning per
  rep — medvetet utelämnad ur v1 (YAGNI tills loggfriktionen är utvärderad).
- **Next.js**: versionen i repot har breaking changes — läs relevanta guider i
  `node_modules/next/dist/docs/` innan route-/page-kod skrivs (gäller alla utförare).
