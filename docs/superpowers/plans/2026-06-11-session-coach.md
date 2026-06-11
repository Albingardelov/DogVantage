# Adaptivt pass / Session Coach (Delprojekt A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Per-rep-rekommendationsmotorn blir en handlingsbar coach: konkreta one-tap-förslag på nivåbyte (upp/ner i övningens `ladder`), "avsluta på topp" efter vänt läge, och per-hund-kalibrerade trösklar från dog-state.

**Architecture:** Logiken flyttar från `src/components/TrainingCard/recommendation.ts` till ren lib `src/lib/training/session-coach.ts` (RN-delbar, TDD). `ExerciseRow` beräknar `CoachAction` själv (den har redan `ladder` + aktuell nivå) och renderar knappar som går genom befintliga `onMetricsPatch`/progress-PATCH:ar. Ingen server-rundresa per rep. Dog-state-trösklar hämtas via ny klienthook mot `GET /api/training/dog-state` (byggd i delprojekt C).

**Tech Stack:** vitest (`npm run test`), Next.js App Router (inga nya routes i detta delprojekt), befintliga API:er `/api/training/progress` och `/api/training/metrics`.

**Spec:** `docs/superpowers/specs/2026-06-11-adaptive-intelligence-design.md` (avsnitt "Delprojekt A").

**Konsumenter som påverkas:** `TrainingCard.tsx` och `PuppyDayCard.tsx` (båda använder `buildRecommendation` + duplicerad guard-logik idag — duplikationen försvinner via `advanceGuard`).

---

### Task 1: Ren lib `session-coach.ts` (TDD)

**Files:**
- Create: `src/lib/training/session-coach.ts`
- Test: `src/lib/training/session-coach.test.ts`

`recommendation.ts` rörs INTE i denna task — konsumenterna migreras i Task 3–5 och filen tas bort i Task 5.

- [ ] **Step 1: Skriv de failande testerna**

```ts
import { describe, it, expect } from 'vitest'
import {
  advanceGuard,
  buildCoachAction,
  EMPTY_GUARD,
  type CoachInput,
} from './session-coach'
import type { CriteriaLevel } from '@/lib/training/exercise-specs'

const LADDER: CriteriaLevel[] = [
  { id: 'home_low', label: 'Hemma, låg störning', criteria: 'Inomhus utan distraktion' },
  { id: 'garden', label: 'Trädgård', criteria: 'Utomhus, mild distraktion' },
  { id: 'park', label: 'Park', criteria: 'Full distraktion' },
]

function input(overrides: Partial<CoachInput> = {}): CoachInput {
  return {
    successCount: 0,
    failCount: 0,
    latencyBucket: null,
    ageWeeks: 52,
    guard: EMPTY_GUARD,
    ladder: LADDER,
    currentLevelId: 'garden',
    ...overrides,
  }
}

describe('advanceGuard', () => {
  it('increments consecutiveFails on a miss and sets stopTriggered at 2', () => {
    const g1 = advanceGuard(EMPTY_GUARD, { fail_count: 1 })
    expect(g1).toEqual({ consecutiveFails: 1, consecutiveSlow: 0, stopTriggered: false })
    const g2 = advanceGuard(g1, { fail_count: 2 })
    expect(g2.consecutiveFails).toBe(2)
    expect(g2.stopTriggered).toBe(true)
  })

  it('sets stopTriggered after 2 consecutive slow reps', () => {
    const g1 = advanceGuard(EMPTY_GUARD, { latency_bucket: 'gt3s' })
    const g2 = advanceGuard(g1, { latency_bucket: 'gt3s' })
    expect(g2.stopTriggered).toBe(true)
  })

  it('a success resets counters but keeps stopTriggered', () => {
    const stopped = { consecutiveFails: 2, consecutiveSlow: 0, stopTriggered: true }
    const g = advanceGuard(stopped, { success_count: 5 })
    expect(g).toEqual({ consecutiveFails: 0, consecutiveSlow: 0, stopTriggered: true })
  })
})

describe('buildCoachAction', () => {
  it('suggests stop with the previous ladder step after 2 consecutive misses', () => {
    const action = buildCoachAction(input({
      guard: { consecutiveFails: 2, consecutiveSlow: 0, stopTriggered: true },
      failCount: 2,
    }))
    expect(action?.kind).toBe('stop')
    expect(action?.suggestedLevelId).toBe('home_low')
  })

  it('stop at the lowest ladder step has no suggested level', () => {
    const action = buildCoachAction(input({
      guard: { consecutiveFails: 2, consecutiveSlow: 0, stopTriggered: true },
      currentLevelId: 'home_low',
    }))
    expect(action?.kind).toBe('stop')
    expect(action?.suggestedLevelId).toBeNull()
  })

  it('suggests end_on_success after a success that follows a stop', () => {
    const action = buildCoachAction(input({
      guard: { consecutiveFails: 0, consecutiveSlow: 0, stopTriggered: true },
      successCount: 3,
      failCount: 2,
    }))
    expect(action?.kind).toBe('end_on_success')
    expect(action?.suggestedLevelId).toBeNull()
  })

  it('asks for more attempts below 10 attempts', () => {
    const action = buildCoachAction(input({ successCount: 5, failCount: 1 }))
    expect(action?.kind).toBe('keep')
  })

  it('suggests raise with next ladder step at >= 80% for adult dogs', () => {
    const action = buildCoachAction(input({ successCount: 9, failCount: 1 }))
    expect(action?.kind).toBe('raise')
    expect(action?.suggestedLevelId).toBe('park')
  })

  it('never suggests raise for puppies', () => {
    const action = buildCoachAction(input({ successCount: 9, failCount: 1, ageWeeks: 12 }))
    expect(action?.kind).toBe('keep')
  })

  it('raise at the top of the ladder becomes keep with a stabilize message', () => {
    const action = buildCoachAction(input({
      successCount: 9, failCount: 1, currentLevelId: 'park',
    }))
    expect(action?.kind).toBe('keep')
    expect(action?.suggestedLevelId).toBeNull()
  })

  it('suggests lower with previous ladder step at <= 60%', () => {
    const action = buildCoachAction(input({ successCount: 5, failCount: 5 }))
    expect(action?.kind).toBe('lower')
    expect(action?.suggestedLevelId).toBe('home_low')
  })

  it('a positive advanceThresholdDelta raises the bar for raise', () => {
    const base = input({ successCount: 8, failCount: 2 }) // 80%
    expect(buildCoachAction(base)?.kind).toBe('raise')
    expect(buildCoachAction({ ...base, advanceThresholdDelta: 0.05 })?.kind).toBe('keep')
  })

  it('caps the effective advance threshold at 0.9', () => {
    const action = buildCoachAction(input({
      successCount: 9, failCount: 1, advanceThresholdDelta: 0.5,
    })) // 90% ska fortfarande nå raise trots delta 0.5
    expect(action?.kind).toBe('raise')
  })

  it('works without a ladder (custom exercises): kinds intact, no suggested levels', () => {
    const action = buildCoachAction(input({
      successCount: 5, failCount: 5, ladder: null, currentLevelId: null,
    }))
    expect(action?.kind).toBe('lower')
    expect(action?.suggestedLevelId).toBeNull()
  })
})
```

- [ ] **Step 2: Kör testerna och verifiera att de failar**

Run: `npx vitest run src/lib/training/session-coach.test.ts`
Expected: FAIL — "Cannot find module './session-coach'".

- [ ] **Step 3: Implementera `src/lib/training/session-coach.ts`**

Meddelandetexterna för stop/keep/raise/lower är ordagrant samma som i
`src/components/TrainingCard/recommendation.ts` (kopiera dem därifrån).

```ts
import type { DailyExerciseMetrics, LatencyBucket } from '@/types'
import { isPuppy as isPuppyAge } from '@/lib/dog/age'
import type { CriteriaLevel } from '@/lib/training/exercise-specs'

export interface SessionGuard {
  consecutiveFails: number
  consecutiveSlow: number
  stopTriggered: boolean
}

export const EMPTY_GUARD: SessionGuard = {
  consecutiveFails: 0,
  consecutiveSlow: 0,
  stopTriggered: false,
}

export interface CoachAction {
  kind: 'keep' | 'raise' | 'lower' | 'stop' | 'end_on_success'
  message: string
  suggestedLevelId: string | null
}

export interface CoachInput {
  successCount: number
  failCount: number
  latencyBucket: LatencyBucket | null
  ageWeeks?: number
  guard: SessionGuard
  ladder: CriteriaLevel[] | null
  currentLevelId: string | null
  advanceThresholdDelta?: number
}

const MIN_ATTEMPTS_FOR_DECISION = 10
const ADVANCE_THRESHOLD = 0.8
const REGRESS_THRESHOLD = 0.6
const MAX_ADVANCE_THRESHOLD = 0.9

export function advanceGuard(
  guard: SessionGuard,
  patch: Partial<DailyExerciseMetrics>,
): SessionGuard {
  let next = guard
  if ('fail_count' in patch) {
    next = { ...next, consecutiveFails: next.consecutiveFails + 1 }
  }
  if (patch.latency_bucket === 'gt3s') {
    next = { ...next, consecutiveSlow: next.consecutiveSlow + 1 }
  }
  if ('success_count' in patch) {
    next = { ...next, consecutiveFails: 0, consecutiveSlow: 0 }
  }
  if (next.consecutiveFails >= 2 || next.consecutiveSlow >= 2) {
    next = { ...next, stopTriggered: true }
  }
  return next
}

function stepFrom(
  ladder: CriteriaLevel[] | null,
  currentLevelId: string | null,
  delta: number,
): string | null {
  if (!ladder || ladder.length === 0) return null
  const idx = ladder.findIndex((l) => l.id === currentLevelId)
  const base = idx >= 0 ? idx : 0
  const target = base + delta
  if (target < 0 || target >= ladder.length) return null
  return ladder[target].id
}

export function buildCoachAction(input: CoachInput): CoachAction | null {
  const { guard, ladder, currentLevelId } = input
  const attempts = input.successCount + input.failCount
  const isPuppy = isPuppyAge(input.ageWeeks)
  const lowerLevelId = stepFrom(ladder, currentLevelId, -1)

  if (guard.consecutiveFails >= 2 || guard.consecutiveSlow >= 2) {
    return {
      kind: 'stop',
      suggestedLevelId: lowerLevelId,
      message:
        'Pausa och backa nivån direkt — avsluta efter en lyckad rep. Om hunden inte tar belöning kan den vara stressad eller över tröskeln: gör lättare eller öka avstånd.',
    }
  }
  if (guard.stopTriggered && input.successCount > 0) {
    return {
      kind: 'end_on_success',
      suggestedLevelId: null,
      message: 'Snyggt — ni vände det. Avsluta övningen här, på topp.',
    }
  }
  if (attempts < MIN_ATTEMPTS_FOR_DECISION) {
    return {
      kind: 'keep',
      suggestedLevelId: null,
      message: 'Kör fler försök på samma nivå innan du höjer eller sänker kriteriet.',
    }
  }

  const rate = input.successCount / attempts
  const advanceThreshold = Math.min(
    ADVANCE_THRESHOLD + (input.advanceThresholdDelta ?? 0),
    MAX_ADVANCE_THRESHOLD,
  )

  if (rate >= advanceThreshold && input.latencyBucket !== 'gt3s' && !isPuppy) {
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
  if (rate <= REGRESS_THRESHOLD || input.latencyBucket === 'gt3s') {
    return {
      kind: 'lower',
      suggestedLevelId: lowerLevelId,
      message:
        'Sänk kriteriet ett steg och höj belöningsvärdet. Många miss eller långsam svarstid betyder oftast att kraven är för höga just nu.',
    }
  }
  return {
    kind: 'keep',
    suggestedLevelId: null,
    message: 'Behåll nivån och stabilisera (sikta på ≥80% och kort latens).',
  }
}
```

- [ ] **Step 4: Kör testerna och verifiera att de passerar**

Run: `npx vitest run src/lib/training/session-coach.test.ts`
Expected: PASS, 14 tester.

- [ ] **Step 5: Kör hela sviten**

Run: `npm run test`
Expected: PASS (193 + 14 nya).

- [ ] **Step 6: Commit**

```bash
git add src/lib/training/session-coach.ts src/lib/training/session-coach.test.ts
git commit -m "feat(session-coach): actionable per-rep coach with ladder steps, end-on-success and calibrated thresholds"
```

---

### Task 2: Klienthook för dog-state

**Files:**
- Create: `src/components/TrainingCard/use-dog-state.ts`

Mönster: `use-exercise-sources.ts` i samma katalog (apiFetch + zod-schema + fail-silent).

- [ ] **Step 1: Implementera**

```ts
'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/fetch'
import { DogStatePayloadSchema } from '@/types/api/schemas'
import type { z } from 'zod'

export type DogStatePayload = z.infer<typeof DogStatePayloadSchema>

export function useDogState(dogId: string): DogStatePayload | null {
  const [state, setState] = useState<DogStatePayload | null>(null)

  useEffect(() => {
    if (!dogId) return
    let cancelled = false
    apiFetch(`/api/training/dog-state?dogId=${encodeURIComponent(dogId)}`, DogStatePayloadSchema)
      .then((res) => {
        if (!cancelled) setState(res)
      })
      .catch(() => {
        // Adaptive thresholds are supplementary — fail silently.
      })
    return () => {
      cancelled = true
    }
  }, [dogId])

  return state
}
```

- [ ] **Step 2: Verifiera kompilering**

Run: `npx tsc --noEmit`
Expected: inga nya fel.

- [ ] **Step 3: Commit**

```bash
git add src/components/TrainingCard/use-dog-state.ts
git commit -m "feat(session-coach): useDogState hook for calibrated thresholds"
```

---

### Task 3: `ExerciseRow` beräknar coachen och renderar knappar

**Files:**
- Modify: `src/components/TrainingCard/ExerciseRow.tsx`
- Modify: `src/components/TrainingCard/ExerciseRow.module.css`

- [ ] **Step 1: Byt props**

I `Props`-interfacet: ta bort `recommendation: string | null` och
`showTroubleshooting: boolean`; lägg till:

```ts
  guard: SessionGuard
  advanceThresholdDelta?: number
  onEndExercise?: () => void
```

Import: `import { buildCoachAction, type SessionGuard } from '@/lib/training/session-coach'`.

- [ ] **Step 2: Beräkna coachen i komponenten**

Efter att `criteriaLevelId`/`activeLevel` beräknats (befintliga rader med
`allowedLevels`), lägg till:

```ts
  const coach = buildCoachAction({
    successCount,
    failCount,
    latencyBucket,
    ageWeeks,
    guard,
    ladder: allowedLevels,
    currentLevelId: criteriaLevelId,
    advanceThresholdDelta,
  })
  const showTroubleshooting = coach?.kind === 'lower' || coach?.kind === 'stop'
  const suggestedLevel =
    coach?.suggestedLevelId && allowedLevels
      ? allowedLevels.find((l) => l.id === coach.suggestedLevelId) ?? null
      : null
```

OBS: `allowedLevels` är redan valp-begränsad (slice till 2 steg) — coachen kan därför
aldrig föreslå nivåer utanför valpens tak.

- [ ] **Step 3: Ersätt recommendation-blocket i JSX**

Det befintliga blocket

```tsx
      {/* Recommendation */}
      {recommendation && (
        <div ...>
          {showTroubleshooting && <IconWarning size="sm" />}
          <span>{recommendation}</span>
        </div>
      )}
```

ersätts med:

```tsx
      {/* Coach */}
      {coach && (
        <div
          className={`${styles.recommendation} ${showTroubleshooting ? styles.recommendationAlert : ''}`}
          role={showTroubleshooting ? 'alert' : undefined}
        >
          {showTroubleshooting && <IconWarning size="sm" />}
          <span>{coach.message}</span>
        </div>
      )}
      {!isComplete && suggestedLevel && (coach?.kind === 'lower' || coach?.kind === 'stop' || coach?.kind === 'raise') && (
        <button
          type="button"
          className={styles.coachActionBtn}
          onClick={() => onMetricsPatch({ criteria_level_id: suggestedLevel.id })}
        >
          {coach.kind === 'raise' ? `Höj till: ${suggestedLevel.label}` : `Sänk till: ${suggestedLevel.label}`}
        </button>
      )}
      {!isComplete && coach?.kind === 'end_on_success' && onEndExercise && (
        <button type="button" className={styles.coachActionBtn} onClick={onEndExercise}>
          Avsluta på topp
        </button>
      )}
```

Uppdatera även destruktureringen i funktionssignaturen (ta bort
`recommendation`, `showTroubleshooting`; lägg till `guard`, `advanceThresholdDelta`,
`onEndExercise`).

- [ ] **Step 4: CSS för knappen**

I `ExerciseRow.module.css`: hitta `.swapBtn`-regeln och lägg till en
`.coachActionBtn` med samma deklarationer (kopiera blocket), men behåll den som egen
klass så den kan justeras separat senare.

- [ ] **Step 5: Verifiera kompilering**

Run: `npx tsc --noEmit`
Expected: fel i `TrainingCard.tsx` och `PuppyDayCard.tsx` (props finns inte längre) —
det är väntat och fixas i Task 4–5. Inga fel i `ExerciseRow.tsx` självt.

- [ ] **Step 6: Commit (ihop med Task 4 och 5 går också bra — men committa senast i Task 5)**

Vänta med commit till Task 5 så att bygget aldrig är trasigt i ett commit.

---

### Task 4: `TrainingCard` — guard via lib, end-on-success, trösklar

**Files:**
- Modify: `src/components/TrainingCard/TrainingCard.tsx`

- [ ] **Step 1: Byt imports och state-typ**

- Ta bort: `import { buildRecommendation, type SessionGuard } from './recommendation'`
- Lägg till:
  ```ts
  import { advanceGuard, EMPTY_GUARD, type SessionGuard } from '@/lib/training/session-coach'
  import { useDogState } from './use-dog-state'
  ```
- `sessionGuard`-state behåller typen `Record<string, SessionGuard>` (nya fältet
  `stopTriggered` följer med automatiskt).
- Lägg till hooken efter `useCustomSpecs`-raden:
  ```ts
  const dogState = useDogState(dogId)
  ```

- [ ] **Step 2: Extrahera `commitProgress` och använd den i `handleRepClick`**

Ersätt hela `handleRepClick` med:

```ts
  function commitProgress(exerciseId: string, count: number) {
    const newProgress = { ...progress, [exerciseId]: count }
    setProgress(newProgress)

    const allDone = todayExercises.length > 0 &&
      todayExercises.every((e) => (newProgress[e.id] ?? 0) >= e.reps)
    if (allDone) setShowLogForm(true)

    fetch('/api/training/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: todayDate, dogId, exerciseId, count }),
    }).catch(console.error)
  }

  function handleRepClick(exerciseId: string, currentDone: number, maxReps: number) {
    if (currentDone >= maxReps) return
    commitProgress(exerciseId, currentDone + 1)
  }
```

- [ ] **Step 3: Förenkla `patchMetrics` med `advanceGuard`**

`setSessionGuard`-blocket i `patchMetrics` ersätts med:

```ts
    setSessionGuard((prev) => ({
      ...prev,
      [exerciseId]: advanceGuard(prev[exerciseId] ?? EMPTY_GUARD, patch),
    }))
```

- [ ] **Step 4: Uppdatera `ExerciseRow`-anropet**

I render-loopen: ta bort raderna som beräknar `rec` (hela
`const rec = buildRecommendation(...)`) och byt props:

```tsx
              const guard = sessionGuard[ex.id] ?? EMPTY_GUARD
              return (
                <ExerciseRow
                  key={`${originalIdx}-${ex.id}`}
                  exercise={ex}
                  done={progress[ex.id] ?? 0}
                  onRepClick={() => handleRepClick(ex.id, progress[ex.id] ?? 0, ex.reps)}
                  onOpenGuide={() => setGuideExerciseId(ex.id)}
                  spec={spec}
                  metrics={m}
                  guard={guard}
                  advanceThresholdDelta={dogState?.thresholdAdjustments[ex.id] ?? 0}
                  onEndExercise={() => commitProgress(ex.id, ex.reps)}
                  onMetricsPatch={(patch) => patchMetrics(ex.id, patch)}
                  ageWeeks={ageWeeks}
                  sessionNext={nextExerciseId === ex.id}
                  rootId={nextExerciseId === ex.id ? 'training-session-next' : undefined}
                  onSwap={swapCandidates.length > 0 ? () => handleSwap(originalIdx) : undefined}
                  reasonBadges={reasonBadgesForExercise(ex.id)}
                  sources={exerciseSources[ex.id]}
                />
              )
```

- [ ] **Step 5: Verifiera kompilering**

Run: `npx tsc --noEmit`
Expected: bara `PuppyDayCard.tsx` felar nu (fixas i Task 5).

---

### Task 5: `PuppyDayCard` migreras + `recommendation.ts` tas bort

**Files:**
- Modify: `src/components/PuppyDayCard/PuppyDayCard.tsx`
- Delete: `src/components/TrainingCard/recommendation.ts`

- [ ] **Step 1: Migrera PuppyDayCard**

- Byt `import { buildRecommendation } from '../TrainingCard/recommendation'` mot
  `import { advanceGuard, EMPTY_GUARD, type SessionGuard } from '@/lib/training/session-coach'`.
- `sessionGuard`-state: `useState<Record<string, SessionGuard>>({})`.
- Extrahera `commitProgress` exakt som i TrainingCard (Task 4 Step 2), men med
  PuppyDayCards `exercises`-lista i `allDone`-kontrollen:

```ts
  function commitProgress(exerciseId: string, count: number) {
    const newProgress = { ...progress, [exerciseId]: count }
    setProgress(newProgress)
    if (exercises.every((e) => (newProgress[e.id] ?? 0) >= e.reps)) setShowLogForm(true)
    fetch('/api/training/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: todayDate, dogId, exerciseId, count }),
    }).catch(console.error)
  }

  function handleRepClick(exerciseId: string, currentDone: number, maxReps: number) {
    if (currentDone >= maxReps) return
    commitProgress(exerciseId, currentDone + 1)
  }
```

- `patchMetrics`-guardblocket ersätts med samma `advanceGuard`-rad som i Task 4 Step 3.
- I render-loopen: ta bort `const rec = buildRecommendation(...)` och byt
  `recommendation=`/`showTroubleshooting=`-props mot:

```tsx
                  guard={sessionGuard[ex.id] ?? EMPTY_GUARD}
                  onEndExercise={() => commitProgress(ex.id, ex.reps)}
```

(Ingen `advanceThresholdDelta` här — valpar får aldrig raise, och valpkortet ska
förbli enkelt.)

- [ ] **Step 2: Ta bort gamla filen**

```bash
git rm src/components/TrainingCard/recommendation.ts
```

Verifiera att inget annat importerar den: `grep -rn "from './recommendation'\|TrainingCard/recommendation" src/` ska ge noll träffar.

- [ ] **Step 3: Full verifiering**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: allt grönt.

- [ ] **Step 4: Commit (Task 3+4+5 ihop — ett sammanhängande UI-byte)**

```bash
git add -A
git commit -m "feat(session-coach): one-tap level changes and end-on-success in exercise rows"
```

---

## Slutkriterier

- `npm run test` och `npm run build` gröna.
- `recommendation.ts` borttagen; guard-logiken finns på exakt ett ställe (`advanceGuard`).
- Stop-läge visar "Sänk till: {nivå}"-knapp som byter kriterienivå med ett tryck.
- Lyckad rep efter stop visar "Avsluta på topp" som avslutar övningen i förtid.
- Dog-state-trösklar påverkar raise-gränsen i TrainingCard (no-op tills delprojekt E
  skriver `thresholdAdjustments`).
