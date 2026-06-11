# Stängd beslutslopp + kalibrering (Delprojekt E) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Systemet utvärderar sina egna progressionsbeslut: varje beslut loggas vid plangenerering, utvärderas vid nästa generering (advance som ledde till regress = dåligt), och per-hund-trösklar kalibreras därefter (`dog_state.thresholdAdjustments`) — som både veckoplanen (`computeProgressionDecisions`) och session-coachen (redan inkopplad i delprojekt A) läser.

**Architecture:** Ny tabell `progression_decision_log` (migration 023, RLS owner-only). Ren lib `src/lib/training/decision-calibration.ts` (TDD) med `evaluateDecisions` + `computeThresholdAdjustments`. Persistens i `src/lib/supabase/progression-decision-log.ts`. Orkestratorn: utvärdera väntande beslut → kalibrera → räkna beslut med `thresholdOverrides` → logga nya beslut vid faktisk generering (aldrig på cache-träff). All kalibrering är failure-tolerant — fel får aldrig blockera planeringen.

**Tech Stack:** vitest, Supabase, Next.js App Router (inga nya routes).

**Spec:** `docs/superpowers/specs/2026-06-11-adaptive-intelligence-design.md` (avsnitt "Delprojekt E").

---

### Task 1: Migration 023 + databastyper

**Files:**
- Create: `supabase/migrations/023_progression_decision_log.sql`
- Modify: `src/types/database.ts` (lägg till `progression_decision_log` alfabetiskt i `Tables`)

- [ ] **Step 1: Migrationen**

```sql
create table public.progression_decision_log (
  id                uuid primary key default gen_random_uuid(),
  dog_id            uuid not null references public.dog_profiles(id) on delete cascade,
  exercise_id       text not null,
  decision          text not null check (decision in ('advance', 'hold', 'regress')),
  success_rate      numeric not null,
  criteria_level_id text,
  created_at        timestamptz not null default now(),
  evaluated_at      timestamptz,
  outcome           text check (outcome in ('good', 'bad', 'neutral'))
);

create index progression_decision_log_dog_idx
  on public.progression_decision_log (dog_id, exercise_id, created_at desc);

alter table public.progression_decision_log enable row level security;

create policy "owner_only" on public.progression_decision_log
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

I `Tables`-objektet i `src/types/database.ts`, alfabetiskt placerad (efter
`heat_cycles`-blocket om det finns, annars i korrekt bokstavsordning):

```ts
      progression_decision_log: {
        Row: {
          id: string
          dog_id: string
          exercise_id: string
          decision: string
          success_rate: number
          criteria_level_id: string | null
          created_at: string
          evaluated_at: string | null
          outcome: string | null
        }
        Insert: {
          id?: string
          dog_id: string
          exercise_id: string
          decision: string
          success_rate: number
          criteria_level_id?: string | null
          created_at?: string
          evaluated_at?: string | null
          outcome?: string | null
        }
        Update: {
          id?: string
          dog_id?: string
          exercise_id?: string
          decision?: string
          success_rate?: number
          criteria_level_id?: string | null
          created_at?: string
          evaluated_at?: string | null
          outcome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progression_decision_log_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dog_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
```

- [ ] **Step 3: Verifiera + commit**

Run: `npx tsc --noEmit` — inga nya fel.

```bash
git add supabase/migrations/023_progression_decision_log.sql src/types/database.ts
git commit -m "feat(calibration): progression decision log table and types"
```

**OBS till ägaren (skriv i rapporten, kör inte):** migration 023 måste appliceras i Supabase.

---

### Task 2: Ren lib `decision-calibration.ts` (TDD)

**Files:**
- Create: `src/lib/training/decision-calibration.ts`
- Test: `src/lib/training/decision-calibration.test.ts`

- [ ] **Step 1: Skriv de failande testerna**

```ts
import { describe, it, expect } from 'vitest'
import {
  evaluateDecisions,
  computeThresholdAdjustments,
  type PendingDecisionRow,
  type CurrentExerciseState,
  type AdvanceOutcomeRow,
} from './decision-calibration'

const NOW = new Date('2026-06-11T12:00:00Z')

function pending(
  id: string,
  exerciseId: string,
  decision: PendingDecisionRow['decision'],
  daysAgo: number,
): PendingDecisionRow {
  const d = new Date(NOW)
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return { id, exercise_id: exerciseId, decision, created_at: d.toISOString() }
}

function current(
  exerciseId: string,
  decision: CurrentExerciseState['decision'],
  successRate: number,
): CurrentExerciseState {
  return { exercise_id: exerciseId, decision, success_rate: successRate }
}

function outcome(exerciseId: string, o: AdvanceOutcomeRow['outcome'], daysAgo: number): AdvanceOutcomeRow {
  const d = new Date(NOW)
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return { exercise_id: exerciseId, outcome: o, created_at: d.toISOString() }
}

describe('evaluateDecisions', () => {
  it('skips decisions younger than 7 days', () => {
    const result = evaluateDecisions(
      [pending('1', 'sitt', 'advance', 3)],
      [current('sitt', 'regress', 0.4)],
      NOW,
    )
    expect(result).toEqual([])
  })

  it('marks advance as bad when the exercise has regressed within 14 days', () => {
    const result = evaluateDecisions(
      [pending('1', 'sitt', 'advance', 8)],
      [current('sitt', 'regress', 0.4)],
      NOW,
    )
    expect(result).toEqual([{ id: '1', outcome: 'bad' }])
  })

  it('marks advance as good when the exercise still meets the advance bar', () => {
    const result = evaluateDecisions(
      [pending('1', 'inkallning', 'advance', 9)],
      [current('inkallning', 'advance', 0.85)],
      NOW,
    )
    expect(result).toEqual([{ id: '1', outcome: 'good' }])
  })

  it('marks advance as neutral when the rate is in between', () => {
    const result = evaluateDecisions(
      [pending('1', 'koppel', 'advance', 10)],
      [current('koppel', 'hold', 0.7)],
      NOW,
    )
    expect(result).toEqual([{ id: '1', outcome: 'neutral' }])
  })

  it('marks advance as neutral when the exercise has no current data', () => {
    const result = evaluateDecisions([pending('1', 'plats', 'advance', 9)], [], NOW)
    expect(result).toEqual([{ id: '1', outcome: 'neutral' }])
  })

  it('regress within 14 days counts as bad, but older advances with regress become neutral', () => {
    const result = evaluateDecisions(
      [pending('1', 'sitt', 'advance', 16)],
      [current('sitt', 'regress', 0.4)],
      NOW,
    )
    expect(result).toEqual([{ id: '1', outcome: 'neutral' }])
  })

  it('hold and regress decisions evaluate to neutral', () => {
    const result = evaluateDecisions(
      [pending('1', 'sitt', 'hold', 9), pending('2', 'koppel', 'regress', 9)],
      [current('sitt', 'advance', 0.9), current('koppel', 'regress', 0.3)],
      NOW,
    )
    expect(result).toEqual([
      { id: '1', outcome: 'neutral' },
      { id: '2', outcome: 'neutral' },
    ])
  })
})

describe('computeThresholdAdjustments', () => {
  it('returns previous adjustments untouched without history', () => {
    expect(computeThresholdAdjustments({ sitt: 0.05 }, [])).toEqual({ sitt: 0.05 })
  })

  it('raises the adjustment by 0.05 after two bad advances', () => {
    const result = computeThresholdAdjustments({}, [
      outcome('sitt', 'bad', 1),
      outcome('sitt', 'bad', 8),
      outcome('sitt', 'good', 15),
    ])
    expect(result.sitt).toBeCloseTo(0.05)
  })

  it('caps the adjustment at 0.10', () => {
    const result = computeThresholdAdjustments({ sitt: 0.1 }, [
      outcome('sitt', 'bad', 1),
      outcome('sitt', 'bad', 2),
    ])
    expect(result.sitt).toBeCloseTo(0.1)
  })

  it('resets the adjustment after five consecutive good outcomes', () => {
    const result = computeThresholdAdjustments({ sitt: 0.1 }, [
      outcome('sitt', 'good', 1),
      outcome('sitt', 'good', 2),
      outcome('sitt', 'good', 3),
      outcome('sitt', 'good', 4),
      outcome('sitt', 'good', 5),
      outcome('sitt', 'bad', 20),
    ])
    expect(result.sitt).toBeUndefined()
  })

  it('only considers the 10 most recent outcomes per exercise', () => {
    const old = [outcome('sitt', 'bad', 30), outcome('sitt', 'bad', 31)]
    const recent = Array.from({ length: 10 }, (_, i) => outcome('sitt', 'neutral', i + 1))
    const result = computeThresholdAdjustments({}, [...recent, ...old])
    expect(result.sitt).toBeUndefined()
  })

  it('handles multiple exercises independently', () => {
    const result = computeThresholdAdjustments({}, [
      outcome('sitt', 'bad', 1),
      outcome('sitt', 'bad', 2),
      outcome('koppel', 'good', 1),
    ])
    expect(result.sitt).toBeCloseTo(0.05)
    expect(result.koppel).toBeUndefined()
  })
})
```

- [ ] **Step 2: Kör och verifiera FAIL**

Run: `npx vitest run src/lib/training/decision-calibration.test.ts`

- [ ] **Step 3: Implementera `src/lib/training/decision-calibration.ts`**

```ts
export interface PendingDecisionRow {
  id: string
  exercise_id: string
  decision: 'advance' | 'hold' | 'regress'
  created_at: string
}

export interface CurrentExerciseState {
  exercise_id: string
  decision: 'advance' | 'hold' | 'regress'
  success_rate: number
}

export type DecisionOutcome = 'good' | 'bad' | 'neutral'

export interface DecisionEvaluation {
  id: string
  outcome: DecisionOutcome
}

export interface AdvanceOutcomeRow {
  exercise_id: string
  outcome: DecisionOutcome
  created_at: string
}

const EVAL_MIN_AGE_DAYS = 7
const ATTRIBUTION_WINDOW_DAYS = 14
const ADVANCE_THRESHOLD = 0.8
const ADJUSTMENT_STEP = 0.05
const MAX_ADJUSTMENT = 0.1
const BAD_COUNT_FOR_RAISE = 2
const GOOD_STREAK_FOR_RESET = 5
const HISTORY_WINDOW = 10

function ageInDays(createdAt: string, now: Date): number {
  return (now.getTime() - new Date(createdAt).getTime()) / 86_400_000
}

export function evaluateDecisions(
  pending: PendingDecisionRow[],
  current: CurrentExerciseState[],
  now: Date = new Date(),
): DecisionEvaluation[] {
  const byExercise = new Map(current.map((c) => [c.exercise_id, c]))
  const evaluations: DecisionEvaluation[] = []

  for (const row of pending) {
    const age = ageInDays(row.created_at, now)
    if (age < EVAL_MIN_AGE_DAYS) continue

    if (row.decision !== 'advance') {
      evaluations.push({ id: row.id, outcome: 'neutral' })
      continue
    }

    const state = byExercise.get(row.exercise_id)
    if (!state) {
      evaluations.push({ id: row.id, outcome: 'neutral' })
      continue
    }
    if (state.decision === 'regress' && age <= ATTRIBUTION_WINDOW_DAYS) {
      evaluations.push({ id: row.id, outcome: 'bad' })
      continue
    }
    if (state.decision !== 'regress' && state.success_rate >= ADVANCE_THRESHOLD) {
      evaluations.push({ id: row.id, outcome: 'good' })
      continue
    }
    evaluations.push({ id: row.id, outcome: 'neutral' })
  }

  return evaluations
}

export function computeThresholdAdjustments(
  previous: Record<string, number>,
  history: AdvanceOutcomeRow[],
): Record<string, number> {
  const byExercise = new Map<string, AdvanceOutcomeRow[]>()
  for (const row of history) {
    const list = byExercise.get(row.exercise_id) ?? []
    list.push(row)
    byExercise.set(row.exercise_id, list)
  }

  const result: Record<string, number> = { ...previous }

  for (const [exerciseId, rows] of byExercise) {
    const recent = rows
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, HISTORY_WINDOW)

    const goodStreak = recent.findIndex((r) => r.outcome !== 'good')
    const consecutiveGood = goodStreak === -1 ? recent.length : goodStreak
    if (consecutiveGood >= GOOD_STREAK_FOR_RESET) {
      delete result[exerciseId]
      continue
    }

    const badCount = recent.filter((r) => r.outcome === 'bad').length
    if (badCount >= BAD_COUNT_FOR_RAISE) {
      result[exerciseId] = Math.min((previous[exerciseId] ?? 0) + ADJUSTMENT_STEP, MAX_ADJUSTMENT)
    }
  }

  return result
}
```

- [ ] **Step 4: Kör testerna (13 PASS) + hela sviten + commit**

```bash
git add src/lib/training/decision-calibration.ts src/lib/training/decision-calibration.test.ts
git commit -m "feat(calibration): pure decision evaluation and per-dog threshold adjustments"
```

---

### Task 3: `thresholdOverrides` i `computeProgressionDecisions` (TDD)

**Files:**
- Modify: `src/lib/training/progression-rules.ts`
- Modify: `src/lib/training/progression-rules.test.ts` (lägg till 2 tester)

- [ ] **Step 1: Lägg till de failande testerna**

Titta i testfilen på hur befintliga tester bygger metric-rader, och följ samma
hjälpfunktioner. Beteendet som ska testas:

```ts
  it('thresholdOverrides raises the advance bar per exercise', () => {
    // En övning med 85% success rate och tillräckligt med data:
    // utan override → advance; med override 0.10 → hold.
    // Bygg rader som ger adjustedRate ≈ 0.85 (utan latensjustering).
    // expect(withoutOverride[0].decision).toBe('advance')
    // expect(withOverride[0].decision).toBe('hold')
  })

  it('threshold override is capped at 0.9', () => {
    // 92% success rate med override 0.5 → fortfarande advance (0.8+0.5 → cappas till 0.9).
  })
```

(Skriv ut testerna konkret med filens befintliga hjälpfunktioner — pseudokoden ovan
anger förväntat beteende, inte exakt kod.)

- [ ] **Step 2: Kör och verifiera FAIL**

- [ ] **Step 3: Implementera**

I `computeProgressionDecisions`:
- Options-typen får `thresholdOverrides?: Record<string, number>`.
- Lägg till konstanten `const MAX_ADVANCE_THRESHOLD = 0.90` bredvid de befintliga
  trösklarna.
- I beslutsloopen, före if-kedjan:

```ts
    const advanceThreshold = Math.min(
      ADVANCE_THRESHOLD + (options.thresholdOverrides?.[exerciseId] ?? 0),
      MAX_ADVANCE_THRESHOLD,
    )
```

och byt `adjustedRate >= ADVANCE_THRESHOLD` mot `adjustedRate >= advanceThreshold`.

OBS: `options` destruktureras eventuellt i funktionshuvudet — anpassa så att
`thresholdOverrides` är tillgängligt i loopen (t.ex. `const thresholdOverrides =
options.thresholdOverrides ?? {}` högst upp).

- [ ] **Step 4: Kör testerna + hela sviten + commit**

```bash
git add src/lib/training/progression-rules.ts src/lib/training/progression-rules.test.ts
git commit -m "feat(calibration): per-exercise advance threshold overrides in progression rules"
```

---

### Task 4: Persistens — beslutslogg + adjustments-skrivning

**Files:**
- Create: `src/lib/supabase/progression-decision-log.ts`
- Modify: `src/lib/supabase/dog-state.ts`

- [ ] **Step 1: `progression-decision-log.ts`**

```ts
import { getSupabaseAdmin } from './client'
import type { ExerciseProgressionDecision } from '@/lib/training/progression-rules'
import type {
  DecisionEvaluation,
  PendingDecisionRow,
  AdvanceOutcomeRow,
  DecisionOutcome,
} from '@/lib/training/decision-calibration'

const OUTCOME_HISTORY_LIMIT = 50

export async function logProgressionDecisions(
  dogId: string,
  decisions: ExerciseProgressionDecision[],
): Promise<void> {
  if (decisions.length === 0) return
  const rows = decisions.map((d) => ({
    dog_id: dogId,
    exercise_id: d.exercise_id,
    decision: d.decision,
    success_rate: d.success_rate,
    criteria_level_id: d.criteria_level_id,
  }))
  const { error } = await getSupabaseAdmin().from('progression_decision_log').insert(rows)
  if (error) throw new Error(`decision log insert failed: ${error.message}`)
}

export async function getPendingDecisions(dogId: string): Promise<PendingDecisionRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('progression_decision_log')
    .select('id, exercise_id, decision, created_at')
    .eq('dog_id', dogId)
    .is('evaluated_at', null)
    .order('created_at', { ascending: true })
  if (error) throw new Error(`pending decisions fetch failed: ${error.message}`)
  return (data ?? []) as PendingDecisionRow[]
}

export async function markDecisionsEvaluated(
  evaluations: DecisionEvaluation[],
): Promise<void> {
  const evaluatedAt = new Date().toISOString()
  const byOutcome = new Map<DecisionOutcome, string[]>()
  for (const e of evaluations) {
    const ids = byOutcome.get(e.outcome) ?? []
    ids.push(e.id)
    byOutcome.set(e.outcome, ids)
  }
  for (const [outcome, ids] of byOutcome) {
    const { error } = await getSupabaseAdmin()
      .from('progression_decision_log')
      .update({ outcome, evaluated_at: evaluatedAt })
      .in('id', ids)
    if (error) throw new Error(`decision evaluation update failed: ${error.message}`)
  }
}

export async function getRecentAdvanceOutcomes(dogId: string): Promise<AdvanceOutcomeRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('progression_decision_log')
    .select('exercise_id, outcome, created_at')
    .eq('dog_id', dogId)
    .eq('decision', 'advance')
    .not('outcome', 'is', null)
    .order('created_at', { ascending: false })
    .limit(OUTCOME_HISTORY_LIMIT)
  if (error) throw new Error(`advance outcomes fetch failed: ${error.message}`)
  return (data ?? []) as AdvanceOutcomeRow[]
}
```

- [ ] **Step 2: `updateThresholdAdjustments` i `dog-state.ts`**

Refaktorera först carry-over-API:t: `recomputeDogState(dogId, previous)` tar idag hela
förra payloaden men använder bara `thresholdAdjustments`. Byt signaturen till:

```ts
export async function recomputeDogState(
  dogId: string,
  carryOverAdjustments: Record<string, number> = {},
): Promise<DogStatePayload>
```

och raden `payload.thresholdAdjustments = previous?.thresholdAdjustments ?? {}` blir
`payload.thresholdAdjustments = carryOverAdjustments`. Uppdatera anropet i
`getDogState` till
`recomputeDogState(dogId, (cached?.payload as unknown as DogStatePayload | null)?.thresholdAdjustments ?? {})`.

Lägg sedan till sist i filen:

```ts
export async function updateThresholdAdjustments(
  dogId: string,
  adjustments: Record<string, number>,
): Promise<void> {
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from('dog_state')
    .select('payload')
    .eq('dog_id', dogId)
    .maybeSingle()

  if (!data) {
    await recomputeDogState(dogId, adjustments)
    return
  }

  const payload = data.payload as unknown as DogStatePayload
  payload.thresholdAdjustments = adjustments
  // .update rör inte computed_at — kalibreringen ska inte маskera stale aggregat som färska.
  const { error } = await admin
    .from('dog_state')
    .update({ payload: payload as unknown as Json })
    .eq('dog_id', dogId)
  if (error) {
    console.warn('[dog-state] threshold adjustment write failed:', error.message)
  }
}
```

(Skriv kommentaren utan det felaktiga tecknet: "kalibreringen ska inte maskera stale
aggregat som färska".)

- [ ] **Step 3: Verifiera + commit**

Run: `npx tsc --noEmit && npm run test` — grönt.

```bash
git add src/lib/supabase/progression-decision-log.ts src/lib/supabase/dog-state.ts
git commit -m "feat(calibration): decision log persistence and threshold adjustment writes"
```

---

### Task 5: Orkestrator-wiring — utvärdera, kalibrera, logga

**Files:**
- Modify: `src/lib/training/week-orchestrator.ts`

- [ ] **Step 1: Imports**

```ts
import { evaluateDecisions, computeThresholdAdjustments } from '@/lib/training/decision-calibration'
import {
  getPendingDecisions,
  getRecentAdvanceOutcomes,
  logProgressionDecisions,
  markDecisionsEvaluated,
} from '@/lib/supabase/progression-decision-log'
```

- [ ] **Step 2: Strukturera om beslutsblocket i `buildWeekContextFromRequest`**

Dagens block (efter delprojekt D) ser ut så här:

```ts
  const rawProgressionDecisions = computeProgressionDecisions(recentMetrics, { sessionRows })
  const handlerStruggle = await (async () => {
    try {
      const [dogState, quizStats] = await Promise.all([
        getDogState(dog.id),
        getRecentQuizStats(dog.user_id, dog.id),
      ])
      return computeHandlerStruggle(dogState.handler, quizStats)
    } catch {
      return { struggling: false, dimensions: [], reason: null }
    }
  })()
  const progressionDecisions = dampAdvances(rawProgressionDecisions, handlerStruggle)
```

Ersätt hela blocket med:

```ts
  const adaptiveContext = await (async () => {
    try {
      const [dogState, quizStats] = await Promise.all([
        getDogState(dog.id),
        getRecentQuizStats(dog.user_id, dog.id),
      ])
      return { dogState, quizStats }
    } catch {
      return null
    }
  })()

  let thresholdOverrides = adaptiveContext?.dogState.thresholdAdjustments ?? {}
  if (adaptiveContext) {
    try {
      const pending = await getPendingDecisions(dog.id)
      if (pending.length > 0) {
        const observed = computeProgressionDecisions(recentMetrics, { sessionRows })
        const evaluations = evaluateDecisions(
          pending,
          observed.map((d) => ({
            exercise_id: d.exercise_id,
            decision: d.decision,
            success_rate: d.success_rate,
          })),
        )
        if (evaluations.length > 0) {
          await markDecisionsEvaluated(evaluations)
          const outcomes = await getRecentAdvanceOutcomes(dog.id)
          thresholdOverrides = computeThresholdAdjustments(thresholdOverrides, outcomes)
          await updateThresholdAdjustments(dog.id, thresholdOverrides)
          trackTelemetry('progression_decision_evaluated', {
            dogId: dog.id,
            evaluated: evaluations.length,
            bad: evaluations.filter((e) => e.outcome === 'bad').length,
            good: evaluations.filter((e) => e.outcome === 'good').length,
          })
        }
      }
    } catch (e) {
      // Kalibrering får aldrig blockera planeringen.
      console.warn('[week-orchestrator] calibration skipped:', e instanceof Error ? e.message : String(e))
    }
  }

  const rawProgressionDecisions = computeProgressionDecisions(recentMetrics, {
    sessionRows,
    thresholdOverrides,
  })
  const handlerStruggle = adaptiveContext
    ? computeHandlerStruggle(adaptiveContext.dogState.handler, adaptiveContext.quizStats)
    : { struggling: false, dimensions: [] as [], reason: null }
  const progressionDecisions = dampAdvances(rawProgressionDecisions, handlerStruggle)
```

(`updateThresholdAdjustments` importeras från `@/lib/supabase/dog-state`; justera
befintlig import-rad. Typen `dimensions: [] as []` — använd i stället
`{ struggling: false, dimensions: [], reason: null } satisfies HandlerStruggle` eller
importera typen; välj det som kompilerar renast.)

Telemetri-eventet `handler_struggle_damping` (från delprojekt D) behålls oförändrat.

- [ ] **Step 3: Logga nya beslut vid faktisk generering**

I `getOrGenerateWeekPlan`, i den lyckade genereringsgrenen — direkt efter raden
`trackTelemetry('week-plan-api', { ...baseTelemetry, source: 'generated', cacheHit: false })`:

```ts
    logProgressionDecisions(ctx.dogId, ctx.input.progressionDecisions ?? []).catch((e) => {
      console.warn('[week-orchestrator] decision log failed:', e instanceof Error ? e.message : String(e))
    })
```

Loggning sker alltså bara vid cache-miss med lyckad generering — inte på cache-träffar
och inte i singleflight-fallbacken (medvetet: fallbacken cachas inte och skulle ge
dubbletter när låshållarens plan landar).

- [ ] **Step 4: Full verifiering**

Run: `npx tsc --noEmit && npm run test && npm run build` — allt grönt.

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/week-orchestrator.ts
git commit -m "feat(calibration): evaluate past decisions and calibrate thresholds at plan generation"
```

---

## Slutkriterier

- 13 nya calibration-tester + 2 nya progression-rules-tester gröna; hela sviten + build grönt.
- Beslut loggas enbart vid faktisk plangenerering (cache-miss + lyckad generering).
- Advance som följts av regress inom 14 dagar ⇒ `bad`; ≥ 2 bad bland senaste 10 ⇒ +0.05 på advance-tröskeln (tak 0.90); 5 raka good ⇒ återställning.
- Kalibrerade trösklar påverkar både veckoplanens beslut (`thresholdOverrides`) och session-coachen (via `dog_state.thresholdAdjustments`, redan inkopplad).
- Alla kalibreringssteg är failure-tolerant och degraderar till dagens beteende.
