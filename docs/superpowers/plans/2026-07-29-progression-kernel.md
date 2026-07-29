# Progression Kernel + Live FailTip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One shared progression kernel (80/60 rates, horizon-specific min attempts) that session-coach, week rules, projects, and dog-state all use — plus failTips after the first consecutive miss in live sessions.

**Architecture:** Add pure `progression-kernel.ts` with `evaluateRate` + `resolveProgressionState` and horizon presets (`session` / `week` / `project`). Callers delete local rate literals and delegate. Live coach takes `consecutiveFails` so tips show on first miss and clear on success. No DB migration.

**Tech Stack:** TypeScript, Vitest, existing `session-coach`, `progression-rules`, `training-projects`, `dog-state`, `live-coach`, `ExerciseRow`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-29-progression-kernel-design.md`
- Rates: advance `0.80`, regress `0.60`, max advance cap `0.90` — one module owns them
- Horizons: session 5 (puppy 3), week 10 + 2 sessions, project 6
- Puppy: session may decide earlier; **never map advance → raise** in session-coach
- Stop-guard (2 consecutive fails / 2 slow) unchanged — sits above rate decisions
- Regress copy must say ≤60 % (never “under 80 %”); 80 % is advance goal only
- FailTips: `consecutiveFails >= 1`, not cumulative `fail_count`
- No DB migration; no week-orchestrator rewrite
- `insights.ts` MIN_ATTEMPTS=8 for env gaps is **out of scope** (different purpose)

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/training/progression-kernel.ts` | Constants, horizons, `evaluateRate`, `resolveProgressionState` |
| `src/lib/training/progression-kernel.test.ts` | Kernel unit tests |
| `src/lib/training/session-coach.ts` | Delegate rate branch to kernel; fix regress copy |
| `src/lib/training/session-coach.test.ts` | Session min 5; copy assertions |
| `src/lib/training/progression-rules.ts` | Delegate decisions to kernel |
| `src/lib/training/training-projects.ts` | Rung achieved via kernel project horizon |
| `src/lib/training/dog-state.ts` | Import weak/strong/min from kernel |
| `src/lib/training/live-coach.ts` | `consecutiveFails` → `showFailTips` |
| `src/lib/training/live-coach.test.ts` | FailTip visibility tests |
| `src/components/TrainingCard/ExerciseRow.tsx` | Pass `guard.consecutiveFails` |

---

### Task 1: Progression kernel + tests

**Files:**
- Create: `src/lib/training/progression-kernel.ts`
- Create: `src/lib/training/progression-kernel.test.ts`

**Interfaces:**
- Consumes: `LatencyBucket` from `@/types`
- Produces:
  - `export type ProgressionDecision = 'advance' | 'hold' | 'regress'`
  - `export type ProgressionHorizon = 'session' | 'week' | 'project'`
  - `export const ADVANCE_THRESHOLD = 0.80`
  - `export const REGRESS_THRESHOLD = 0.60`
  - `export const MAX_ADVANCE_THRESHOLD = 0.90`
  - `export function horizonMinAttempts(horizon: ProgressionHorizon, isPuppy?: boolean): number`
  - `export function horizonMinSessions(horizon: ProgressionHorizon): number`
  - `export function evaluateRate(input: EvaluateRateInput): EvaluateRateResult`
  - `export function resolveProgressionState(input: ResolveProgressionStateInput): ResolveProgressionStateResult`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/training/progression-kernel.test.ts
import { describe, expect, it } from 'vitest'
import {
  evaluateRate,
  resolveProgressionState,
  ADVANCE_THRESHOLD,
  REGRESS_THRESHOLD,
} from './progression-kernel'

describe('evaluateRate', () => {
  it('holds when under min attempts (session adult needs 5)', () => {
    const r = evaluateRate({
      success: 3, fail: 0, horizon: 'session', isPuppy: false,
    })
    expect(r.decision).toBe('hold')
    expect(r.attempts).toBe(3)
  })

  it('advances at 80% with 5 session attempts', () => {
    const r = evaluateRate({
      success: 4, fail: 1, horizon: 'session', isPuppy: false,
    })
    expect(r.decision).toBe('advance')
    expect(r.rate).toBeCloseTo(0.8)
  })

  it('puppy session min is 3 — kernel advances at 2/3', () => {
    const r = evaluateRate({
      success: 2, fail: 1, horizon: 'session', isPuppy: true,
    })
    expect(r.decision).toBe('advance')
  })

  it('adult holds at 2/3 on session', () => {
    const r = evaluateRate({
      success: 2, fail: 1, horizon: 'session', isPuppy: false,
    })
    expect(r.decision).toBe('hold')
  })

  it('regresses at <=60% with enough attempts', () => {
    const r = evaluateRate({
      success: 3, fail: 2, horizon: 'session', // 60% of 5
    })
    expect(r.decision).toBe('regress')
    expect(r.reason).not.toMatch(/under 80|under\s*80/i)
  })

  it('holds between 61% and 79%', () => {
    const r = evaluateRate({
      success: 7, fail: 3, horizon: 'session', // 70%
    })
    expect(r.decision).toBe('hold')
  })

  it('week holds when sessionCount < 2 even at high rate', () => {
    const r = evaluateRate({
      success: 10, fail: 0, horizon: 'week', sessionCount: 1,
    })
    expect(r.decision).toBe('hold')
    expect(r.reason).toMatch(/pass/i)
  })

  it('week advances with 2 sessions and 10 attempts at 80%', () => {
    const r = evaluateRate({
      success: 8, fail: 2, horizon: 'week', sessionCount: 2,
    })
    expect(r.decision).toBe('advance')
  })

  it('project advances at 6 attempts and 80%', () => {
    const r = evaluateRate({
      success: 5, fail: 1, horizon: 'project',
    })
    expect(r.decision).toBe('advance')
  })

  it('project holds under 6 attempts', () => {
    const r = evaluateRate({
      success: 4, fail: 0, horizon: 'project',
    })
    expect(r.decision).toBe('hold')
  })

  it('latency lt1s can push borderline toward advance', () => {
    // 7/9 ≈ 0.778 + 0.05 = 0.828 >= 0.80
    const r = evaluateRate({
      success: 7, fail: 2, horizon: 'session', latencyBucket: 'lt1s',
    })
    expect(r.decision).toBe('advance')
  })

  it('caps advance threshold at 0.90', () => {
    const r = evaluateRate({
      success: 9, fail: 1, horizon: 'session', advanceThresholdDelta: 0.5,
    })
    expect(r.decision).toBe('advance')
  })

  it('exports shared thresholds', () => {
    expect(ADVANCE_THRESHOLD).toBe(0.8)
    expect(REGRESS_THRESHOLD).toBe(0.6)
  })
})

describe('resolveProgressionState', () => {
  it('aggregates rows for exercise+rung within window', () => {
    const state = resolveProgressionState({
      rows: [
        {
          exercise_id: 'sitt',
          date: '2026-07-28',
          success_count: 4,
          fail_count: 1,
          criteria_level_id: 'home',
          latency_bucket: null,
        },
        {
          exercise_id: 'sitt',
          date: '2026-07-27',
          success_count: 4,
          fail_count: 1,
          criteria_level_id: 'home',
          latency_bucket: null,
        },
        {
          exercise_id: 'other',
          date: '2026-07-28',
          success_count: 10,
          fail_count: 0,
          criteria_level_id: 'home',
        },
      ],
      exerciseId: 'sitt',
      criteriaLevelId: 'home',
      horizon: 'week',
      now: new Date('2026-07-29T12:00:00Z'),
      windowDays: 7,
      sessionRows: [
        { exercise_id: 'sitt', criteria_level_id: 'home', date: '2026-07-28' },
        { exercise_id: 'sitt', criteria_level_id: 'home', date: '2026-07-27' },
      ],
    })
    expect(state.attempts).toBe(10)
    expect(state.rungId).toBe('home')
    expect(state.decision).toBe('advance')
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx vitest run src/lib/training/progression-kernel.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement kernel**

```ts
// src/lib/training/progression-kernel.ts
import type { LatencyBucket } from '@/types'

export type ProgressionDecision = 'advance' | 'hold' | 'regress'
export type ProgressionHorizon = 'session' | 'week' | 'project'

export const ADVANCE_THRESHOLD = 0.80
export const REGRESS_THRESHOLD = 0.60
export const MAX_ADVANCE_THRESHOLD = 0.90

export function horizonMinAttempts(horizon: ProgressionHorizon, isPuppy = false): number {
  if (horizon === 'session') return isPuppy ? 3 : 5
  if (horizon === 'project') return 6
  return 10 // week
}

export function horizonMinSessions(horizon: ProgressionHorizon): number {
  if (horizon === 'week') return 2
  return 1
}

function latencyWeight(bucket: LatencyBucket | null | undefined): number {
  if (bucket === 'lt1s') return 0.05
  if (bucket === 'gt3s') return -0.05
  return 0
}

export interface EvaluateRateInput {
  success: number
  fail: number
  latencyBucket?: LatencyBucket | null
  horizon: ProgressionHorizon
  isPuppy?: boolean
  advanceThresholdDelta?: number
  sessionCount?: number
}

export interface EvaluateRateResult {
  decision: ProgressionDecision
  reason: string
  rate: number
  attempts: number
}

export function evaluateRate(input: EvaluateRateInput): EvaluateRateResult {
  const attempts = input.success + input.fail
  const rate = attempts > 0 ? input.success / attempts : 0
  const minAttempts = horizonMinAttempts(input.horizon, input.isPuppy)
  const minSessions = horizonMinSessions(input.horizon)
  const sessionCount = input.sessionCount ?? 1

  const adjustedRate = rate + latencyWeight(input.latencyBucket)
  const advanceThreshold = Math.min(
    ADVANCE_THRESHOLD + (input.advanceThresholdDelta ?? 0),
    MAX_ADVANCE_THRESHOLD,
  )

  if (sessionCount < minSessions) {
    return {
      decision: 'hold',
      reason: `${sessionCount} pass på nivån — kör minst ${minSessions} pass innan nivåbeslut`,
      rate,
      attempts,
    }
  }
  if (attempts < minAttempts) {
    return {
      decision: 'hold',
      reason: `${attempts} reps — för få datapunkter, håll nuvarande nivå`,
      rate,
      attempts,
    }
  }
  if (adjustedRate >= advanceThreshold) {
    return {
      decision: 'advance',
      reason: `${Math.round(rate * 100)}% lyckade över ${attempts} reps — höj kriteriet ett steg`,
      rate,
      attempts,
    }
  }
  if (adjustedRate <= REGRESS_THRESHOLD) {
    return {
      decision: 'regress',
      reason: `${Math.round(rate * 100)}% lyckade över ${attempts} reps — sänk kriteriet ett steg (≤${Math.round(REGRESS_THRESHOLD * 100)}%)`,
      rate,
      attempts,
    }
  }
  return {
    decision: 'hold',
    reason: `${Math.round(rate * 100)}% lyckade över ${attempts} reps — fortsätt på nuvarande nivå`,
    rate,
    attempts,
  }
}

export interface ProgressionMetricRow {
  exercise_id: string
  date: string
  success_count: number
  fail_count: number
  latency_bucket?: LatencyBucket | null
  criteria_level_id: string | null
}

export interface ProgressionSessionRow {
  exercise_id: string
  criteria_level_id: string | null
  date: string
}

export interface ResolveProgressionStateInput {
  rows: ProgressionMetricRow[]
  exerciseId: string
  criteriaLevelId?: string | null
  horizon: ProgressionHorizon
  now?: Date
  windowDays?: number
  isPuppy?: boolean
  advanceThresholdDelta?: number
  sessionRows?: ProgressionSessionRow[]
}

export interface ResolveProgressionStateResult {
  rungId: string | null
  rate: number
  attempts: number
  decision: ProgressionDecision
  reason: string
}

export function resolveProgressionState(
  input: ResolveProgressionStateInput,
): ResolveProgressionStateResult {
  const windowDays = input.windowDays ?? 7
  const now = input.now ?? new Date()
  const cutoff = new Date(now)
  cutoff.setUTCDate(cutoff.getUTCDate() - windowDays)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  let success = 0
  let fail = 0
  let latencyScore = 0
  let latencyCount = 0
  const sessionDays = new Set<string>()

  for (const row of input.rows) {
    if (row.date < cutoffStr) continue
    if (row.exercise_id !== input.exerciseId) continue
    if (
      input.criteriaLevelId !== undefined &&
      row.criteria_level_id !== input.criteriaLevelId
    ) {
      continue
    }
    success += row.success_count
    fail += row.fail_count
    if (row.latency_bucket) {
      latencyScore += latencyWeight(row.latency_bucket)
      latencyCount += 1
    }
  }

  for (const row of input.sessionRows ?? []) {
    if (row.date < cutoffStr) continue
    if (row.exercise_id !== input.exerciseId) continue
    if (
      input.criteriaLevelId !== undefined &&
      row.criteria_level_id !== input.criteriaLevelId
    ) {
      continue
    }
    sessionDays.add(row.date)
  }

  // Represent average latency as one bucket for evaluateRate when mixed:
  // pass the dominant tilt via a synthetic bucket only if we have latency data.
  let latencyBucket: LatencyBucket | null = null
  if (latencyCount > 0) {
    const avg = latencyScore / latencyCount
    if (avg > 0) latencyBucket = 'lt1s'
    else if (avg < 0) latencyBucket = 'gt3s'
    else latencyBucket = '1to3s'
  }

  const evaluated = evaluateRate({
    success,
    fail,
    latencyBucket,
    horizon: input.horizon,
    isPuppy: input.isPuppy,
    advanceThresholdDelta: input.advanceThresholdDelta,
    sessionCount: Math.max(sessionDays.size, input.horizon === 'week' ? 0 : 1),
  })

  return {
    rungId: input.criteriaLevelId ?? null,
    rate: evaluated.rate,
    attempts: evaluated.attempts,
    decision: evaluated.decision,
    reason: evaluated.reason,
  }
}
```

Note on week `sessionCount`: when no `sessionRows` are provided, `sessionDays.size` is 0 — for week that correctly forces hold until sessions are passed. For session/project horizons, use `Math.max(sessionDays.size, 1)` so missing sessionRows does not block. Prefer explicit logic:

```ts
const sessionCount =
  input.horizon === 'week'
    ? sessionDays.size
    : Math.max(sessionDays.size, 1)
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npx vitest run src/lib/training/progression-kernel.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/progression-kernel.ts src/lib/training/progression-kernel.test.ts
git commit -m "feat(training): add shared progression kernel"
```

---

### Task 2: Wire session-coach + copy fix

**Files:**
- Modify: `src/lib/training/session-coach.ts`
- Modify: `src/lib/training/session-coach.test.ts`

**Interfaces:**
- Consumes: `evaluateRate` from `./progression-kernel`
- Produces: same `buildCoachAction` / `CoachAction` public API

- [ ] **Step 1: Update failing expectations in tests**

Change the “below 10 attempts” test to session min 5:

```ts
it('asks for more attempts below 5 attempts', () => {
  const action = buildCoachAction(input({ successCount: 3, failCount: 1 }))
  expect(action?.kind).toBe('keep')
})

it('suggests raise at 4/5 for adult dogs', () => {
  const action = buildCoachAction(input({ successCount: 4, failCount: 1 }))
  expect(action?.kind).toBe('raise')
  expect(action?.suggestedLevelId).toBe('park')
})

it('suggests lower copy mentions 60% not 80%', () => {
  const action = buildCoachAction(input({ successCount: 3, failCount: 2 }))
  expect(action?.kind).toBe('lower')
  expect(action?.message).toMatch(/60\s*%/)
  expect(action?.message).not.toMatch(/under 80/)
})

it('gt3s latency forces lower even above regress rate (after min attempts)', () => {
  const action = buildCoachAction(input({
    successCount: 4, failCount: 1, latencyBucket: 'gt3s',
  }))
  expect(action?.kind).toBe('lower')
})

it('gt3s does not force lower before min attempts', () => {
  const action = buildCoachAction(input({
    successCount: 2, failCount: 0, latencyBucket: 'gt3s',
  }))
  expect(action?.kind).toBe('keep')
})
```

Keep existing puppy never-raise test (9/1 still keep). Keep stop/end_on_success tests.

- [ ] **Step 2: Run tests — expect some FAIL**

Run: `npx vitest run src/lib/training/session-coach.test.ts`  
Expected: FAIL on new thresholds / copy until implementation

- [ ] **Step 3: Rewrite rate branch in `buildCoachAction`**

After guard/stop/`end_on_success` handling, replace the old `MIN_ATTEMPTS_FOR_DECISION` / local thresholds block with:

```ts
import { evaluateRate, horizonMinAttempts } from '@/lib/training/progression-kernel'
import { isPuppy as isPuppyAge } from '@/lib/dog/age'

// remove local ADVANCE/REGRESS/MIN_ATTEMPTS constants

const isPuppy = isPuppyAge(input.ageWeeks)
const lowerLevelId = stepFrom(ladder, currentLevelId, -1)

// ... keep stop / end_on_success unchanged ...

const evaluated = evaluateRate({
  success: input.successCount,
  fail: input.failCount,
  latencyBucket: input.latencyBucket,
  horizon: 'session',
  isPuppy,
  advanceThresholdDelta: input.advanceThresholdDelta,
})

// Hard session override after enough attempts: slow latency → lower
// (same timing as pre-kernel: only once min attempts is met)
const minForSession = horizonMinAttempts('session', isPuppy)
const attempts = input.successCount + input.failCount
if (attempts >= minForSession && input.latencyBucket === 'gt3s') {
  return {
    kind: 'lower',
    suggestedLevelId: lowerLevelId,
    message: withGuideFailHint(
      'Svarstiden är över 3 sek — oftast för svårt just nu. Sänk kriteriet ett steg och höj belöningsvärdet.',
    ),
  }
}

if (evaluated.decision === 'advance' && !isPuppy && input.latencyBucket !== 'gt3s') {
  const raiseLevelId = stepFrom(ladder, currentLevelId, 1)
  if (raiseLevelId) {
    return {
      kind: 'raise',
      suggestedLevelId: raiseLevelId,
      message: 'Höj kriteriet ett steg (lite svårare miljö/störning/avstånd).',
    }
  }
  return {
    kind: 'keep',
    suggestedLevelId: null,
    message: 'Högsta nivån avklarad — stabilisera och generalisera i nya miljöer.',
  }
}

if (evaluated.decision === 'regress') {
  return {
    kind: 'lower',
    suggestedLevelId: lowerLevelId,
    message: withGuideFailHint(
      'Träffsäkerheten är ≤60 %, så vi sänker ett steg och höjer belöningsvärdet. Det är inte ett misslyckande — kraven är för höga just nu.',
    ),
  }
}

if (evaluated.attempts < 5 && !isPuppy) {
  // evaluateRate already holds; prefer explicit “kör fler” when under session min
}
return {
  kind: 'keep',
  suggestedLevelId: null,
  message:
    evaluated.attempts < (isPuppy ? 3 : 5)
      ? 'Kör fler försök på samma nivå innan du höjer eller sänker kriteriet.'
      : 'Behåll nivån och stabilisera. Målet är ≥80 % lyckade med kort svarstid innan vi höjer — så ska inlärning gå till.',
}
```

Use `horizonMinAttempts('session', isPuppy)` instead of magic 5/3 in the message branch.

Order matters: stop → end_on_success → gt3s lower → evaluateRate → map decision.

- [ ] **Step 4: Run tests — expect PASS**

Run: `npx vitest run src/lib/training/session-coach.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/session-coach.ts src/lib/training/session-coach.test.ts
git commit -m "feat(training): session-coach uses progression kernel"
```

---

### Task 3: Wire progression-rules

**Files:**
- Modify: `src/lib/training/progression-rules.ts`
- Test: `src/lib/training/progression-rules.test.ts` (should stay green; only change if reasons diverge)

**Interfaces:**
- Consumes: `evaluateRate`, thresholds from `./progression-kernel`
- Produces: same `computeProgressionDecisions` / `ExerciseProgressionDecision` API

- [ ] **Step 1: Run existing tests (baseline)**

Run: `npx vitest run src/lib/training/progression-rules.test.ts`  
Expected: PASS on current main

- [ ] **Step 2: Replace local constants + decision block**

Remove `MIN_ATTEMPTS`, `MIN_SESSIONS`, `ADVANCE_THRESHOLD`, `MAX_ADVANCE_THRESHOLD`, `REGRESS_THRESHOLD`, and `latencyWeight` if unused.

In the loop over `byExerciseCriteria`, after computing `attempts` / `sessionCount` / raw rate aggregates, call:

```ts
import {
  evaluateRate,
  type ProgressionDecision,
} from '@/lib/training/progression-kernel'

// Keep ProgressionDecision re-export from progression-rules OR import type from kernel
// Prefer: export type { ProgressionDecision } from './progression-kernel'
// and delete local ProgressionDecision type to avoid drift.

const evaluated = evaluateRate({
  success: acc.success,
  fail: acc.fail,
  // pass average latency: convert acc.latencyScore/acc.latencyCount same as kernel resolve
  latencyBucket:
    acc.latencyCount > 0
      ? acc.latencyScore / acc.latencyCount > 0
        ? 'lt1s'
        : acc.latencyScore / acc.latencyCount < 0
          ? 'gt3s'
          : '1to3s'
      : null,
  horizon: 'week',
  sessionCount,
  advanceThresholdDelta: thresholdOverrides[exerciseId] ?? 0,
})

decisions.push({
  exercise_id: exerciseId,
  criteria_level_id: criteriaLevelId,
  decision: evaluated.decision,
  attempts: evaluated.attempts,
  success_rate: evaluated.rate,
  reason: evaluated.reason,
})
```

Keep sorting logic unchanged. Keep `formatProgressionRule` unchanged.

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/lib/training/progression-rules.test.ts`  
Expected: PASS (same decisions; reasons may need assertion updates if tests match exact Swedish strings — update assertions to match kernel reasons if needed)

- [ ] **Step 4: Commit**

```bash
git add src/lib/training/progression-rules.ts src/lib/training/progression-rules.test.ts
git commit -m "refactor(training): progression-rules delegates to kernel"
```

---

### Task 4: Wire training-projects

**Files:**
- Modify: `src/lib/training/training-projects.ts`
- Test: `src/lib/training/training-projects.test.ts`

**Interfaces:**
- Consumes: `evaluateRate` from `./progression-kernel`
- Produces: same `computeProjectProgress` API

- [ ] **Step 1: Replace rung-achieved gate**

Remove `MIN_ATTEMPTS_PER_RUNG` and `MIN_SUCCESS_RATE`.

```ts
import { evaluateRate } from '@/lib/training/progression-kernel'

// inside loop:
for (const [idx, bucket] of byRung) {
  const evaluated = evaluateRate({
    success: bucket.success,
    fail: bucket.attempts - bucket.success,
    horizon: 'project',
  })
  if (evaluated.decision === 'advance') {
    highestAchievedIdx = Math.max(highestAchievedIdx, idx)
  }
}
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/lib/training/training-projects.test.ts`  
Expected: PASS (behavior unchanged: 6@80% still advances)

- [ ] **Step 3: Commit**

```bash
git add src/lib/training/training-projects.ts
git commit -m "refactor(training): project rung gate uses progression kernel"
```

---

### Task 5: Wire dog-state

**Files:**
- Modify: `src/lib/training/dog-state.ts`
- Test: `src/lib/training/dog-state.test.ts`

**Interfaces:**
- Consumes: `ADVANCE_THRESHOLD`, `REGRESS_THRESHOLD`, `horizonMinAttempts` from `./progression-kernel`

- [ ] **Step 1: Replace local thresholds**

```ts
import {
  ADVANCE_THRESHOLD,
  REGRESS_THRESHOLD,
  horizonMinAttempts,
} from '@/lib/training/progression-kernel'

const MIN_ATTEMPTS = horizonMinAttempts('week')
const WEAK_THRESHOLD = REGRESS_THRESHOLD
const STRONG_THRESHOLD = ADVANCE_THRESHOLD
// keep MAX_LISTED, MIN_ENV_ATTEMPTS as-is (env sample size is separate)
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/lib/training/dog-state.test.ts`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/training/dog-state.ts
git commit -m "refactor(training): dog-state thresholds from progression kernel"
```

---

### Task 6: Live failTips after first consecutive miss

**Files:**
- Modify: `src/lib/training/live-coach.ts`
- Modify: `src/lib/training/live-coach.test.ts`
- Modify: `src/components/TrainingCard/ExerciseRow.tsx`
- Modify: `src/components/TrainingCard/ExerciseRow.test.tsx` (if present)

**Interfaces:**
- Consumes: `SessionGuard.consecutiveFails` from ExerciseRow
- Produces: `ResolveLiveCoachInput.consecutiveFails: number`; `showFailTips` updated

- [ ] **Step 1: Write failing tests**

Update `live-coach.test.ts`:

```ts
it('hides fail tips when coach is keep and no consecutive fails', () => {
  const view = resolveLiveCoach({
    spec: ink(),
    levelId: ink().ladder[0].id,
    coachKind: 'keep',
    consecutiveFails: 0,
    exerciseLabel: 'Inkallning',
    exerciseId: 'inkallning',
    lifeStage: 'adult',
  })
  expect(view.showFailTips).toBe(false)
})

it('shows fail tips after first consecutive miss even when keep', () => {
  const view = resolveLiveCoach({
    spec: ink(),
    levelId: ink().ladder[0].id,
    coachKind: 'keep',
    consecutiveFails: 1,
    exerciseLabel: 'Inkallning',
    exerciseId: 'inkallning',
    lifeStage: 'adult',
  })
  expect(view.showFailTips).toBe(true)
  expect(view.failTips.length).toBeGreaterThan(0)
})
```

Add `consecutiveFails: 0` to existing tests that expect `showFailTips: false` / don’t care.

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/lib/training/live-coach.test.ts`  
Expected: FAIL on new consecutiveFails behavior / type

- [ ] **Step 3: Implement**

In `live-coach.ts`:

```ts
export interface ResolveLiveCoachInput {
  spec: ExerciseSpec
  levelId: string | null
  coachKind: CoachKind
  consecutiveFails?: number
  exerciseLabel: string
  exerciseId: string
  lifeStage: LifeStage
  sources?: TrainingSourceRef[]
}

const consecutiveFails = input.consecutiveFails ?? 0
const showFailTips =
  consecutiveFails >= 1 ||
  input.coachKind === 'lower' ||
  input.coachKind === 'stop'
```

In `ExerciseRow.tsx` where `resolveLiveCoach` is called, add:

```ts
consecutiveFails: guard.consecutiveFails,
```

If fail tips only render inside the coach recommendation block today, also ensure tips remain visible when `coach.kind === 'keep'` and `live.showFailTips` — the existing `{live?.showFailTips && ...}` under the recommendation is enough **if** `buildCoachAction` still returns a keep message (it does). No CSS change required unless tips are hard to see; do not redesign.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/training/live-coach.test.ts src/components/TrainingCard/ExerciseRow.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/live-coach.ts src/lib/training/live-coach.test.ts src/components/TrainingCard/ExerciseRow.tsx src/components/TrainingCard/ExerciseRow.test.tsx
git commit -m "feat(training): show failTips after first consecutive miss"
```

---

### Task 7: Full verification

**Files:** none (verify only)

- [ ] **Step 1: Run full training-related suite**

```bash
npx vitest run src/lib/training src/components/TrainingCard
```

Expected: PASS

- [ ] **Step 2: Grep for leftover local rate literals in callers**

```bash
rg "ADVANCE_THRESHOLD|REGRESS_THRESHOLD|MIN_ATTEMPTS_FOR_DECISION|MIN_ATTEMPTS_PER_RUNG|MIN_SUCCESS_RATE" src/lib/training --glob '!**/progression-kernel.ts' --glob '!**/*.test.ts'
```

Expected: no hits in `session-coach.ts`, `progression-rules.ts`, `training-projects.ts` for the old locals (dog-state may alias via import). `insights.ts` may still have `MIN_ATTEMPTS = 8` — allowed.

- [ ] **Step 3: Final commit only if Step 1–2 caused doc/test fixups; otherwise done**

If any fixups:

```bash
git add -u src/lib/training src/components/TrainingCard
git commit -m "fix(training): progression kernel verification nits"
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Shared 80/60/cap + horizons | Task 1 |
| `evaluateRate` / `resolveProgressionState` | Task 1 |
| session-coach horizon session + puppy no raise + gt3s | Task 2 |
| Copy ≤60 % | Task 2 |
| progression-rules week | Task 3 |
| training-projects project advance = rung achieved | Task 4 |
| dog-state imports | Task 5 |
| failTips on consecutiveFails ≥ 1 | Task 6 |
| No DB / no orchestrator / insights out of scope | Global + Task 7 |
| Full suite green | Task 7 |
