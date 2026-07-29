# Progression kernel + live coach under få reps — design

**Datum:** 2026-07-29  
**Status:** approved for implementation planning  
**Scope:** Tema 1 + 2 från “oslagbar”-roadmapen: gemensam progression-kernel över pass/vecka/projekt/dog-state, plus failTips efter första miss i live-passet. Bygger på live-coach (2026-07-26).

## Problem

Samma R+-regler (≈80 % advance / ≈60 % regress) är duplicerade i `session-coach`, `progression-rules`, `training-projects`, `dog-state` (och delvis `insights`) med **olika min-försök** och ibland **vilseledande copy** (regress säger “under 80 %” medan tröskeln är 60 %).

Live-passet kräver ofta 10 reps innan raise/lower — för sent för korta övningar. FailTips visas först vid `lower`/`stop` (efter 2 fails), inte vid första miss.

## Mål

- En **progression-kernel** som äger rate-trösklar och beslutslogik (`advance` | `hold` | `regress`).
- Samma **procentsatser** överallt; olika **min attempts / min sessions** per horisont.
- Live-coach kan ge raise/lower efter ~5 reps; valp får beslut efter ~3 reps men **raise blockeras fortfarande** (befintligt produktskydd).
- FailTips syns efter **första** consecutive miss och försvinner vid lyckad rep.
- Copy speglar verkliga trösklar (regress ≤60 %; 80 % är advance-mål).
- Callers delegerar — ingen lokal magisk siffra kvar i de berörda modulerna.

## Icke-mål

- Persist “officiell pinne” till DB / profil (ingen migration).
- Full rewrite av week-orchestrator / AI-planner-pipeline.
- Tema 3 (AI förklarar specs) eller tema 4–6 (projekt-hero, personalisering, offline-PWA).
- Ändra stop-guard (2 consecutive fails / 2 slow → stop) — den ligger *ovanpå* rate-beslut.

## Beslut (låsta)

| Fråga | Val |
|-------|-----|
| Scope | Full kernel: pass + vecka + projekt + dog-state (+ insights-konstanter om trivialt) |
| Trösklar | Samma %; olika min-försök per horisont |
| SSOT | Shared resolver i kod (`resolveProgressionState`) — ingen ny DB |
| Arkitektur | Approach 2: `evaluateRate` + horizon presets; callers delegerar |
| FailTips | Efter 1 consecutive fail; döljs vid success (`consecutiveFails >= 1`) |
| Stop-guard | Oförändrad (2 fails / 2 slow) |

## Arkitektur

Ny modul: `src/lib/training/progression-kernel.ts`.

```
daily_exercise_metrics / live counts
            │
            ▼
   resolveProgressionState / evaluateRate
            │
   ┌────────┼────────┬──────────────┐
   ▼        ▼        ▼              ▼
session-  progression- training-   dog-state
coach     rules        projects    (+ insights)
   │
   ▼
live-coach (showFailTips) → ExerciseRow
```

### Konstanter

```ts
ADVANCE_THRESHOLD = 0.80
REGRESS_THRESHOLD = 0.60
MAX_ADVANCE_THRESHOLD = 0.90
```

### Horizons

| Horizon | minAttempts | minSessions | Används av |
|---------|-------------|-------------|------------|
| `session` | 5 (valp: 3) | 1 | `session-coach` — valp: lower/hold tidigare; raise fortfarande blockerad |
| `week` | 10 | 2 | `progression-rules`, dog-state-liknande fönster |
| `project` | 6 | 1 | `training-projects` rung-klar |

Latency-tiebreaker behålls som idag: `lt1s` +0.05, `gt3s` −0.05 på justerad rate. `advanceThresholdDelta` / per-övning overrides behålls och caps till `MAX_ADVANCE_THRESHOLD`.

### API

```ts
type ProgressionDecision = 'advance' | 'hold' | 'regress'
type ProgressionHorizon = 'session' | 'week' | 'project'

function evaluateRate(input: {
  success: number
  fail: number
  latencyBucket?: LatencyBucket | null
  horizon: ProgressionHorizon
  isPuppy?: boolean
  advanceThresholdDelta?: number
  sessionCount?: number  // relevant for week
}): {
  decision: ProgressionDecision
  reason: string
  rate: number
  attempts: number
}

function resolveProgressionState(input: {
  rows: Array<{
    exercise_id: string
    date: string
    success_count: number
    fail_count: number
    latency_bucket?: LatencyBucket | null
    criteria_level_id: string | null
  }>
  exerciseId: string
  criteriaLevelId?: string | null
  horizon: ProgressionHorizon
  now?: Date
  windowDays?: number
  isPuppy?: boolean
  advanceThresholdDelta?: number
  sessionRows?: Array<{ exercise_id: string; criteria_level_id: string | null; date: string }>
}): {
  rungId: string | null
  rate: number
  attempts: number
  decision: ProgressionDecision
  reason: string
}
```

`resolveProgressionState` aggregerar success/fail/latency för angiven övning (och pinne om `criteriaLevelId` anges) inom fönstret, sedan anropar `evaluateRate`.

### Copy-regel

- Regress-meddelanden: **≤60 %** (eller “för låg träffsäkerhet”), aldrig “under 80 %”.
- Keep/stabilisera: 80 % är **målet innan höjning**.
- Kernel-`reason`-strängar ska följa samma regel så AI-prompt och UI inte divergerar.

## Callers

| Modul | Ändring |
|-------|---------|
| `session-coach.ts` | Rate-grenar via `evaluateRate({ horizon: 'session', ... })`. Guard/stop oförändrad. Mappar `advance`→`raise`, `regress`→`lower`, `hold`→`keep`. Behåll hard override: `latencyBucket === 'gt3s'` → lower (ovanpå rate). Valp: mappa aldrig `advance` → `raise`. |
| `progression-rules.ts` | Aggregering kan stanna; beslut + reasons via kernel (`horizon: 'week'`). Lokala `MIN_*` / rate-konstanter bort. |
| `training-projects.ts` | Rung uppnådd iff `evaluateRate({ horizon: 'project', success, fail })` ger `advance` (rate ≥ 80 % och attempts ≥ 6). `hold`/`regress` räknas inte som uppnådd. |
| `dog-state.ts` | `WEAK_THRESHOLD` / `STRONG_THRESHOLD` / `MIN_ATTEMPTS` importeras från kernel (0.60 / 0.80 / week minAttempts). |
| `insights.ts` | Byt till kernel-konstanter om trivialt; annars lämna och notera i plan. |
| `live-coach.ts` | `showFailTips = consecutiveFails >= 1 \|\| coachKind === 'lower' \|\| coachKind === 'stop'`. Input utökas med `consecutiveFails: number`. |
| `ExerciseRow.tsx` | Skicka `guard.consecutiveFails` till `resolveLiveCoach`. |

## Live failTip (detalj)

- **Visa** när `SessionGuard.consecutiveFails >= 1` (inte kumulativ `fail_count`).
- **Dölj** när success nollställer consecutive fails (`advanceGuard` redan nollställer vid success).
- Tips-innehåll oförändrat: rung `failTips` → `whenItFails` → `troubleshooting` (befintlig `resolveLiveCoach`-kedja).

## Data / persistence

Ingen schemaändring. Befintliga `daily_exercise_metrics.criteria_level_id` och live-state i UI räcker.

## Tester

Nya: `progression-kernel.test.ts`

- Under min attempts → `hold`
- Session: 4/5 (80 %) → `advance`; valp 3/0 (≥80 %, ≥3 reps) → `advance` i kernel (session-coach mappar till keep); valp/adult 2/3 (~67 %) → `hold`
- ≤60 % med tillräckliga attempts → `regress`
- 61–79 % → `hold`
- Latency push borderline
- Override caps till 0.90
- Week: `sessionCount < 2` → `hold` även vid hög rate

Uppdatera befintliga tester där session-min går 10→5 och regress-copy ändras.

## Implementeringsordning

1. Kernel + unit tests  
2. Wire `session-coach`  
3. Wire `progression-rules`  
4. Wire `training-projects`  
5. Wire `dog-state` (+ insights om trivialt)  
6. Live failTip (`live-coach` + `ExerciseRow`)  
7. Copy-fix i coach-meddelanden  
8. Full test-suite grön  

## Success

- Kort pass (5–8 reps): coach kan föreslå raise/lower, inte bara “kör fler”.
- En miss → failTips syns; lyckad → tips bort.
- 80/60 kommer från en modul; callers har inga lokala rate-literals.
- Ingen DB-migration; stop-guard oförändrad.
