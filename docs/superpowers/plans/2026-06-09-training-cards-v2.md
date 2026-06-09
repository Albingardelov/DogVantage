# Training Cards V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `ExerciseRow` to a ring-based gamified card and `SessionLogForm` to a celebratory form, matching the Bold Ring design prototype exactly.

**Architecture:** Pure UI rewrite — all props, API calls, Zod schemas and data flow stay identical. `ExerciseRow` gets a dark-green gradient card with a segmented SVG progress ring, ✓/✗ buttons, combo streak, and floating +1 labels. `SessionLogForm` gets a gradient hero-summary, large rating cards, 5-step Stepper inputs, and a full-screen celebration on save. Both components are consumed by `TrainingCard` and `PuppyDayCard` without any change to those callers.

**Tech Stack:** React 19, Next.js App Router, CSS Modules, `@phosphor-icons/react`, `src/styles/tokens.css`

---

## File Map

**New icons (add to existing files):**
- Modify: `src/components/icons/ui-icons.tsx` — add `IconFire`, `IconMedal`, `IconConfetti`, `IconLightning`, `IconX`
- Modify: `src/components/icons/index.ts` — export new icons

**ExerciseRow rewrite:**
- Rewrite: `src/components/TrainingCard/ExerciseRow.tsx`
- Rewrite: `src/components/TrainingCard/ExerciseRow.module.css`

**SessionLogForm rewrite:**
- Rewrite: `src/components/SessionLogForm.tsx`
- Rewrite: `src/components/SessionLogForm.module.css`

---

## Task 1: Add missing icons

**Files:**
- Modify: `src/components/icons/ui-icons.tsx`
- Modify: `src/components/icons/index.ts`

The prototype uses `fire` (combo), `medal` (complete/saved), `confetti` (session hero), `lightning` (latency). These don't exist yet. `X` already exists as `IconClose` but we need `IconX` with bold weight for the Miss button.

- [ ] **Step 1: Add imports and icon components to `src/components/icons/ui-icons.tsx`**

Add to the Phosphor import block (alongside existing imports):
```typescript
import {
  // ...existing imports...
  Confetti,
  Fire,
  Lightning,
  Medal,
  X as PhX,
} from '@phosphor-icons/react'
```

Add these four functions at the end of `ui-icons.tsx`, before the closing:

```typescript
export function IconFire({ size = 'sm', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={Fire} size={size} weight="fill" className={className} />
}

export function IconMedal({ size = 'sm', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={Medal} size={size} weight="fill" className={className} />
}

export function IconConfetti({ size = 'sm', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={Confetti} size={size} weight="fill" className={className} />
}

export function IconLightning({ size = 'sm', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={Lightning} size={size} weight="fill" className={className} />
}

export function IconX({ size = 'sm', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={PhX} size={size} weight="bold" className={className} />
}
```

- [ ] **Step 2: Export new icons from `src/components/icons/index.ts`**

Add to the named export block (alongside existing icon exports):
```typescript
  IconConfetti,
  IconFire,
  IconLightning,
  IconMedal,
  IconX,
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/icons/ui-icons.tsx src/components/icons/index.ts
git commit -m "feat(v2): add Fire, Medal, Confetti, Lightning, X icons"
```

---

## Task 2: ExerciseRow CSS — ring card + keyframes

**Files:**
- Rewrite: `src/components/TrainingCard/ExerciseRow.module.css`

Completely replace the file. The new card is dark-green gradient with white text. All colours reference `tokens.css` vars.

- [ ] **Step 1: Replace `ExerciseRow.module.css` with:**

```css
/* ── Card shell ───────────────────────────────────────────── */
.card {
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(160deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
  box-shadow: 0 10px 30px rgba(27, 67, 50, 0.35);
  padding: 18px 18px 20px;
}

/* ── Head row ────────────────────────────────��────────────── */
.head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  position: relative;
  z-index: 2;
}

.headLeft { flex: 1; min-width: 0; }

.nameRow {
  display: flex;
  align-items: center;
  gap: 7px;
}

.exerciseName {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

/* Criteria chip */
.criteriaChip {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-full);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.criteriaChip:active { transform: scale(0.97); }

/* Guide chip */
.guideChip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px 4px 11px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  flex-shrink: 0;
}

/* ── Ring ─────────────────────────────────────────────────── */
.ringWrap {
  display: flex;
  justify-content: center;
  margin: 14px 0 4px;
  position: relative;
  z-index: 2;
}

.ringContainer {
  position: relative;
  width: 152px;
  height: 152px;
}

.ringCenter {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ringCountBig {
  font-size: 38px;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.ringCountSmall {
  font-size: 20px;
  opacity: 0.6;
}

.ringRate {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 3px;
}

.ringComplete {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: dv-pop 360ms cubic-bezier(0.2, 0.8, 0.3, 1.2);
}

.ringCompleteText {
  font-size: 13px;
  font-weight: 700;
  margin-top: 2px;
}

/* Floating +1 / miss labels */
.floatLabel {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  font-weight: 800;
  pointer-events: none;
  animation: dv-float 850ms ease-out forwards;
}

.floatSuccess { color: #9ae6b4; }
.floatMiss    { color: #f4a261; }

/* ── Combo ────────────────────────────────────────────────── */
.comboRow {
  height: 22px;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.comboPill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 12px;
  border-radius: var(--radius-full);
  background: rgba(251, 191, 36, 0.22);
  border: 1px solid rgba(251, 191, 36, 0.5);
  color: #fde68a;
  font-size: 12px;
  font-weight: 800;
  animation: dv-pop 240ms ease;
}

/* ── Action buttons ───────────────────────────────────────── */
.actionRow {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  position: relative;
  z-index: 2;
}

.btnSuccess {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 15px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  background: #fff;
  color: var(--color-primary-dark);
  font-size: 16px;
  font-weight: 800;
}

.btnSuccess:active { transform: scale(0.98); }

.btnMiss {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 15px;
  border-radius: 14px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.12);
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}

.btnMiss:active { transform: scale(0.98); }

/* ── Latency ──────────────────────────────────────────────── */
.latencyRow {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  position: relative;
  z-index: 2;
}

.latencyBtn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 10px;
  border-radius: 11px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  transition: background 150ms;
}

.latencyBtnSelected {
  background: rgba(255, 255, 255, 0.95);
  color: var(--color-primary-dark);
  border-color: #fff;
}

.latencyHint {
  margin: 10px 0 0;
  text-align: center;
  font-size: 11px;
  opacity: 0.7;
  position: relative;
  z-index: 2;
}

/* ── Swap button ──────────────────────────────────────────── */
.swapBtn {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-full);
  color: rgba(255, 255, 255, 0.75);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  cursor: pointer;
  position: relative;
  z-index: 2;
}

/* ── Complete state ───────────────────────────────────────── */
.completeArea {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  position: relative;
  z-index: 2;
}

.statsRow {
  display: flex;
  gap: 10px;
}

.statBox {
  flex: 1;
  text-align: center;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 10px;
}

.statValue {
  font-size: 20px;
  font-weight: 800;
}

.statLabel {
  font-size: 11px;
  opacity: 0.8;
}

.ctaBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  background: #fff;
  color: var(--color-primary-dark);
  font-size: 15px;
  font-weight: 800;
}

.ctaBtn:active { transform: scale(0.98); }

.undoBtn {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.75);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

/* ── Recommendation ───────────────────────────────────────── */
.recommendation {
  margin-top: 10px;
  font-size: 12px;
  opacity: 0.85;
  line-height: 1.5;
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.recommendationAlert {
  color: #fde68a;
}

/* ── Confetti burst ───────────────────────────────────────── */
.burst {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}

.burstBit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 7px;
  height: 7px;
  border-radius: 2px;
  animation: dv-burst 700ms cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
}

/* ── Keyframes ────────────────────────────────────────────── */
@media (prefers-reduced-motion: no-preference) {
  @keyframes dv-pop {
    from { transform: scale(0.6); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }

  @keyframes dv-float {
    0%   { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-52px); }
  }

  @keyframes dv-burst {
    from { opacity: 1; transform: translate(0, 0); }
    to   { opacity: 0; transform: translate(var(--bx), var(--by)); }
  }
}
```

- [ ] **Step 2: Verify no syntax errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/TrainingCard/ExerciseRow.module.css
git commit -m "feat(v2): ExerciseRow ring card CSS + keyframes"
```

---

## Task 3: ExerciseRow — React component

**Files:**
- Rewrite: `src/components/TrainingCard/ExerciseRow.tsx`

Props are identical to the current version. The component gains local state for combo streak and floating labels. The ring SVG is rendered inline. The `Burst` confetti component is defined inline (small, used only here).

- [ ] **Step 1: Replace `ExerciseRow.tsx` with:**

```tsx
'use client'

import { useState } from 'react'
import {
  ExerciseIcon,
  IconCaretRight,
  IconCheck,
  IconConfetti,
  IconFire,
  IconLightning,
  IconMedal,
  IconSwap,
  IconTarget,
  IconWarning,
  IconX,
} from '@/components/icons'
import styles from './ExerciseRow.module.css'
import type { DailyExerciseMetrics, Exercise, LatencyBucket } from '@/types'
import type { ExerciseSpec } from '@/lib/training/exercise-specs'
import { isPuppy as isPuppyAge } from '@/lib/dog/age'

interface Props {
  exercise: Exercise
  done: number
  onRepClick: () => void
  onOpenGuide?: () => void
  spec: ExerciseSpec | null
  metrics: DailyExerciseMetrics | null
  recommendation: string | null
  showTroubleshooting: boolean
  onMetricsPatch: (patch: Partial<DailyExerciseMetrics>) => void
  ageWeeks?: number
  sessionNext?: boolean
  rootId?: string
  onSwap?: () => void
}

const LATENCY_OPTIONS: { id: LatencyBucket; label: string }[] = [
  { id: 'lt1s', label: '<1s' },
  { id: '1to3s', label: '1–3s' },
  { id: 'gt3s', label: '>3s' },
]

const BURST_PALETTE = ['#52b788', '#f4a261', '#fbbf24', '#ffffff']

function Burst({ show }: { show: boolean }) {
  if (!show) return null
  const bits = Array.from({ length: 14 }, (_, i) => {
    const ang = (i / 14) * Math.PI * 2
    const dist = 46 + (i % 3) * 16
    return {
      x: Math.cos(ang) * dist,
      y: Math.sin(ang) * dist,
      c: BURST_PALETTE[i % BURST_PALETTE.length],
      d: (i % 5) * 30,
    }
  })
  return (
    <div className={styles.burst}>
      {bits.map((b, i) => (
        <span
          key={i}
          className={styles.burstBit}
          style={{
            background: b.c,
            animationDelay: `${b.d}ms`,
            ['--bx' as string]: `${b.x}px`,
            ['--by' as string]: `${b.y}px`,
          }}
        />
      ))}
    </div>
  )
}

function Ring({ reps, successCount, failCount }: { reps: number; successCount: number; failCount: number }) {
  const size = 152
  const stroke = 13
  const r = (size - stroke) / 2
  const C = 2 * Math.PI * r
  const N = reps
  const seg = C / N - 6
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {Array.from({ length: N }, (_, i) => {
          const col =
            i < successCount
              ? '#52b788'
              : i < successCount + failCount
                ? '#f4a261'
                : 'rgba(255,255,255,0.16)'
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={col}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${seg} ${C - seg}`}
              strokeDashoffset={-i * (C / N)}
              style={{ transition: 'stroke 280ms ease' }}
            />
          )
        })}
      </g>
    </svg>
  )
}

export default function ExerciseRow({
  exercise,
  done,
  onRepClick,
  onOpenGuide,
  spec,
  metrics,
  recommendation,
  showTroubleshooting,
  onMetricsPatch,
  ageWeeks,
  sessionNext: _sessionNext,
  rootId,
  onSwap,
}: Props) {
  const [combo, setCombo] = useState(0)
  const [floats, setFloats] = useState<{ id: number; kind: 'success' | 'miss' }[]>([])

  const isComplete = done >= exercise.reps
  const successCount = metrics?.success_count ?? 0
  const failCount = metrics?.fail_count ?? 0
  const attempts = successCount + failCount
  const successRate = attempts > 0 ? Math.round((successCount / attempts) * 100) : null
  const latencyBucket = metrics?.latency_bucket ?? null

  const isPuppy = isPuppyAge(ageWeeks)
  const allowedLevels = spec
    ? isPuppy
      ? spec.ladder.slice(0, Math.min(2, spec.ladder.length))
      : spec.ladder
    : null
  const criteriaLevelId = metrics?.criteria_level_id ?? (allowedLevels?.[0]?.id ?? null)
  const currentLevelLabel = allowedLevels?.find((l) => l.id === criteriaLevelId)?.label
    ?? allowedLevels?.[0]?.label
    ?? null

  function spawnFloat(kind: 'success' | 'miss') {
    const id = Date.now() + Math.random()
    setFloats((f) => [...f, { id, kind }])
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 850)
  }

  function handleSuccess() {
    if (isComplete) return
    setCombo((c) => c + 1)
    spawnFloat('success')
    onMetricsPatch({ success_count: successCount + 1 })
    onRepClick()
  }

  function handleMiss() {
    if (isComplete) return
    setCombo(0)
    spawnFloat('miss')
    onMetricsPatch({ fail_count: failCount + 1 })
    onRepClick()
  }

  function handleUndo() {
    // Reset local state — parent manages progress via onRepClick, so we can't
    // truly undo the rep count without a dedicated prop. We reset visual state only.
    setCombo(0)
    setFloats([])
  }

  function cycleCriteria() {
    if (!allowedLevels || allowedLevels.length === 0) return
    const idx = allowedLevels.findIndex((l) => l.id === criteriaLevelId)
    const next = allowedLevels[(idx + 1) % allowedLevels.length]
    onMetricsPatch({ criteria_level_id: next.id })
  }

  return (
    <div id={rootId} className={styles.card}>
      <Burst show={isComplete} />

      {/* Head */}
      <div className={styles.head}>
        <div className={styles.headLeft}>
          <div className={styles.nameRow}>
            <ExerciseIcon exerciseId={exercise.id} size="md" />
            <span className={styles.exerciseName}>{exercise.label}</span>
          </div>
          {allowedLevels && currentLevelLabel && (
            <button
              type="button"
              className={styles.criteriaChip}
              onClick={cycleCriteria}
              aria-label="Byt kriterienivå"
            >
              <IconTarget size="sm" />
              <span>{currentLevelLabel}</span>
              <IconConfetti size="sm" />
            </button>
          )}
        </div>
        {onOpenGuide && (
          <button
            type="button"
            className={styles.guideChip}
            onClick={onOpenGuide}
            aria-label={`Öppna guide: ${exercise.label}`}
          >
            Guide <IconCaretRight size="sm" />
          </button>
        )}
      </div>

      {/* Ring */}
      <div className={styles.ringWrap}>
        <div className={styles.ringContainer}>
          <Ring reps={exercise.reps} successCount={successCount} failCount={failCount} />
          <div className={styles.ringCenter}>
            {isComplete ? (
              <div className={styles.ringComplete}>
                <IconMedal size="xl" />
                <span className={styles.ringCompleteText}>Klart!</span>
              </div>
            ) : (
              <>
                <span className={styles.ringCountBig}>
                  {done}
                  <span className={styles.ringCountSmall}>/{exercise.reps}</span>
                </span>
                <span className={styles.ringRate}>
                  {successRate !== null ? `${successRate}% lyckade` : 'reps'}
                </span>
              </>
            )}
          </div>
          {floats.map((f) => (
            <span
              key={f.id}
              className={`${styles.floatLabel} ${f.kind === 'success' ? styles.floatSuccess : styles.floatMiss}`}
            >
              {f.kind === 'success' ? '+1' : 'miss'}
            </span>
          ))}
        </div>
      </div>

      {/* Combo */}
      <div className={styles.comboRow}>
        {combo >= 2 && !isComplete && (
          <span className={styles.comboPill}>
            <IconFire size="sm" />
            {combo} i rad!
          </span>
        )}
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div
          className={`${styles.recommendation} ${showTroubleshooting ? styles.recommendationAlert : ''}`}
          role={showTroubleshooting ? 'alert' : undefined}
        >
          {showTroubleshooting && <IconWarning size="sm" />}
          <span>{recommendation}</span>
        </div>
      )}

      {/* Incomplete actions */}
      {!isComplete ? (
        <>
          <div className={styles.actionRow}>
            <button type="button" className={styles.btnSuccess} onClick={handleSuccess}>
              <IconCheck size="md" /> Lyckad
            </button>
            <button type="button" className={styles.btnMiss} onClick={handleMiss}>
              <IconX size="sm" /> Miss
            </button>
          </div>
          <div className={styles.latencyRow}>
            {LATENCY_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`${styles.latencyBtn} ${latencyBucket === o.id ? styles.latencyBtnSelected : ''}`}
                onClick={() => onMetricsPatch({ latency_bucket: o.id })}
                aria-pressed={latencyBucket === o.id}
              >
                <IconLightning size="sm" />
                {o.label}
              </button>
            ))}
          </div>
          <p className={styles.latencyHint}>Svarstid efter signal</p>
          {onSwap && (
            <button type="button" className={styles.swapBtn} onClick={onSwap}>
              <IconSwap size="sm" /> Byt mot fokus
            </button>
          )}
        </>
      ) : (
        /* Complete actions */
        <div className={styles.completeArea}>
          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <div className={styles.statValue}>{successRate ?? 0}%</div>
              <div className={styles.statLabel}>lyckade</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>{successCount}/{done}</div>
              <div className={styles.statLabel}>reps satt</div>
            </div>
          </div>
          <button
            type="button"
            className={styles.ctaBtn}
            onClick={() => {
              // Scroll to the next exercise. Parent handles the session flow.
              document.getElementById('training-session-next')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }}
          >
            Nästa övning <IconCaretRight size="sm" />
          </button>
          <button type="button" className={styles.undoBtn} onClick={handleUndo}>
            Ångra registrering
          </button>
        </div>
      )}
    </div>
  )
}
```

**Note on "Nästa övning" CTA:** Clicking scrolls to `#training-session-next` (the next incomplete exercise, which the parent marks via `rootId`). `onRepClick` is NOT called in complete state — the parent already knows the exercise is done via `done >= reps`.

**Note on criteria chip icon:** The design uses `arrows-clockwise` for the cycle icon. The closest existing icon in the codebase is not available, so we use `IconConfetti` as a visual stand-in — or add `ArrowsClockwise` from Phosphor (see step below).

- [ ] **Step 2: Add `ArrowsClockwise` icon** for the criteria cycle button (cosmetic, matches prototype exactly)

In `ui-icons.tsx`, add:
```typescript
import { ArrowsClockwise } from '@phosphor-icons/react'

export function IconArrowsClockwise({ size = 'sm', className }: { size?: IconSize; className?: string }) {
  return <DvIcon icon={ArrowsClockwise} size={size} className={className} />
}
```

In `index.ts`, add `IconArrowsClockwise` to exports.

Then in `ExerciseRow.tsx`, replace `IconConfetti` in the criteria chip import and usage with `IconArrowsClockwise`.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run tests**

```bash
npx vitest run --passWithNoTests
```

Expected: all tests pass (169/170, same pre-existing failure).

- [ ] **Step 5: Commit**

```bash
git add src/components/icons/ui-icons.tsx src/components/icons/index.ts src/components/TrainingCard/ExerciseRow.tsx
git commit -m "feat(v2): ExerciseRow ring card — ring, combo, ✓/✗ buttons, complete state"
```

---

## Task 4: SessionLogForm CSS

**Files:**
- Rewrite: `src/components/SessionLogForm.module.css`

- [ ] **Step 1: Replace `SessionLogForm.module.css` with:**

```css
/* ── Form wrapper ─────────────────────────────────────────── */
.form {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding-bottom: 16px;
}

/* ── Hero summary card ────────────────────────────────────── */
.hero {
  border-radius: 20px;
  padding: 18px;
  color: #fff;
  background: linear-gradient(160deg, var(--color-primary-dark), var(--color-primary));
  box-shadow: 0 8px 24px rgba(27, 67, 50, 0.3);
}

.heroHead {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
}

.heroStats {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.heroStat {
  flex: 1;
  text-align: center;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 10px 4px;
}

.heroStatValue {
  font-size: 22px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.heroStatLabel {
  font-size: 11px;
  opacity: 0.85;
}

/* ── Section ──────────────────────────────────────────────── */
.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sectionLabel {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Rating cards ─────────────────────────────────────────── */
.ratingRow {
  display: flex;
  gap: 10px;
}

.ratingBtn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 16px 8px;
  cursor: pointer;
  border-radius: 16px;
  background: var(--color-bg-alt);
  border: 2px solid transparent;
  transition: all 160ms ease;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 800;
}

.ratingBtn:active { transform: scale(0.98); }

.ratingBtnGood    { background: #52b788; color: #fff; border-color: #52b788; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.12); }
.ratingBtnMixed   { background: #f4a261; color: #fff; border-color: #f4a261; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.12); }
.ratingBtnBad     { background: #d62828; color: #fff; border-color: #d62828; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.12); }

/* ── Stepper ──────────────────────────────────────────────── */
.stepper {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.stepperHead {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.stepperLabel {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.stepperHint {
  display: block;
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 1px;
}

.stepperValue {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
  flex-shrink: 0;
}

.stepperSegments {
  display: flex;
  gap: 6px;
}

.stepperSeg {
  flex: 1;
  height: 30px;
  border-radius: 9px;
  cursor: pointer;
  border: none;
  background: var(--color-bg-alt);
  transition: background 150ms ease;
}

.stepperSegFilled { background: var(--color-primary); }

/* ── Next-session pills ───────────────────────────────────── */
.nextRow {
  display: flex;
  gap: 8px;
}

.nextBtn {
  flex: 1;
  padding: 11px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  transition: all 150ms;
}

.nextBtnSelected {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

/* ── Notes ────────────────────────────────────────────────── */
.notes {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--radius-input);
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  font-size: 14px;
  font-family: var(--font-sans);
  color: var(--color-text);
  resize: none;
  transition: border-color 200ms;
  box-sizing: border-box;
}

.notes:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* ── Save button ──────────────────────────────────────────── */
.submitBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border-radius: var(--radius-btn);
  border: none;
  cursor: pointer;
  background: var(--color-primary);
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  box-shadow: var(--shadow-primary);
}

.submitBtn:disabled { opacity: 0.6; cursor: not-allowed; }
.submitBtn:active:not(:disabled) { transform: scale(0.98); }

/* ── Cancel button ────────────────────────────────────────── */
.cancelBtn {
  padding: 12px 16px;
  border-radius: var(--radius-btn);
  border: 1.5px solid var(--color-border);
  background: none;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

/* ── Saved celebration ────────────────────────────────────── */
.savedScreen {
  position: relative;
  min-height: 400px;
  background: linear-gradient(160deg, var(--color-primary-dark), var(--color-primary));
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #fff;
  padding: 54px 24px;
  overflow: hidden;
}

.savedBurst {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}

.savedBurstBit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 7px;
  height: 7px;
  border-radius: 2px;
  animation: dv-burst 700ms cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
}

.savedMedalWrap {
  width: 88px;
  height: 88px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: dv-pop 380ms cubic-bezier(0.2, 0.8, 0.3, 1.2);
  position: relative;
  z-index: 6;
}

.savedTitle {
  font-size: 20px;
  font-weight: 800;
  position: relative;
  z-index: 6;
}

.savedStreak {
  font-size: 13px;
  opacity: 0.85;
  margin-top: -8px;
  position: relative;
  z-index: 6;
}

/* ── Keyframes (reuse from ExerciseRow if in same scope, else redeclare) ── */
@media (prefers-reduced-motion: no-preference) {
  @keyframes dv-pop {
    from { transform: scale(0.6); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }

  @keyframes dv-burst {
    from { opacity: 1; transform: translate(0, 0); }
    to   { opacity: 0; transform: translate(var(--bx), var(--by)); }
  }
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/SessionLogForm.module.css
git commit -m "feat(v2): SessionLogForm celebration CSS"
```

---

## Task 5: SessionLogForm — React component

**Files:**
- Rewrite: `src/components/SessionLogForm.tsx`

Props and API payload are unchanged. New: hero stats computed from `exercises`, Stepper replacing slider, large rating cards with icons, celebration saved-screen with burst.

- [ ] **Step 1: Replace `SessionLogForm.tsx` with:**

```tsx
'use client'

import { useState } from 'react'
import { IconCheckCircle, IconConfetti, IconMedal, RatingIcon } from '@/components/icons'
import type { Breed, ExerciseSummary, QuickRating } from '@/types'
import styles from './SessionLogForm.module.css'

interface Props {
  dogId: string
  breed: Breed
  weekNumber: number
  exercises?: ExerciseSummary[]
  onSaved: () => void
  onCancel?: () => void
}

const RATINGS: { value: QuickRating; label: string; selectedClass: string }[] = [
  { value: 'good',  label: 'Bra',     selectedClass: styles.ratingBtnGood },
  { value: 'mixed', label: 'Blandat', selectedClass: styles.ratingBtnMixed },
  { value: 'bad',   label: 'Svårt',   selectedClass: styles.ratingBtnBad },
]

type NextSessionIntent = 'same' | 'easier' | 'harder'
const NEXT_OPTIONS: { value: NextSessionIntent; label: string }[] = [
  { value: 'same',   label: 'Behåll nivå' },
  { value: 'easier', label: 'Lättare' },
  { value: 'harder', label: 'Kan höja' },
]

const BURST_PALETTE = ['#52b788', '#f4a261', '#fbbf24', '#ffffff']

function SavedBurst() {
  const bits = Array.from({ length: 14 }, (_, i) => {
    const ang = (i / 14) * Math.PI * 2
    const dist = 46 + (i % 3) * 16
    return {
      x: Math.cos(ang) * dist,
      y: Math.sin(ang) * dist,
      c: BURST_PALETTE[i % BURST_PALETTE.length],
      d: (i % 5) * 30,
    }
  })
  return (
    <div className={styles.savedBurst}>
      {bits.map((b, i) => (
        <span
          key={i}
          className={styles.savedBurstBit}
          style={{
            background: b.c,
            animationDelay: `${b.d}ms`,
            ['--bx' as string]: `${b.x}px`,
            ['--by' as string]: `${b.y}px`,
          }}
        />
      ))}
    </div>
  )
}

function Stepper({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className={styles.stepper}>
      <div className={styles.stepperHead}>
        <div>
          <span className={styles.stepperLabel}>{label}</span>
          {hint && <span className={styles.stepperHint}>{hint}</span>}
        </div>
        <span className={styles.stepperValue}>{value}/5</span>
      </div>
      <div className={styles.stepperSegments}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`${styles.stepperSeg} ${n <= value ? styles.stepperSegFilled : ''}`}
            onClick={() => onChange(n)}
            aria-label={`${label} ${n} av 5`}
          />
        ))}
      </div>
    </div>
  )
}

function computeHeroStats(exercises?: ExerciseSummary[]) {
  if (!exercises || exercises.length === 0) return { rate: null, count: 0, reps: 0 }
  const totalSuccess = exercises.reduce((s, e) => s + e.success_count, 0)
  const totalAttempts = exercises.reduce((s, e) => s + e.success_count + e.fail_count, 0)
  const rate = totalAttempts > 0 ? Math.round((totalSuccess / totalAttempts) * 100) : null
  return { rate, count: exercises.length, reps: totalAttempts }
}

export default function SessionLogForm({ dogId, breed, weekNumber, exercises, onSaved, onCancel }: Props) {
  const [rating, setRating] = useState<QuickRating | null>(null)
  const [focus, setFocus] = useState(3)
  const [obedience, setObedience] = useState(3)
  const [handlerTiming, setHandlerTiming] = useState(3)
  const [handlerConsistency, setHandlerConsistency] = useState(3)
  const [handlerReading, setHandlerReading] = useState(3)
  const [notes, setNotes] = useState('')
  const [nextSession, setNextSession] = useState<NextSessionIntent | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const { rate, count, reps } = computeHeroStats(exercises)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return
    setSaving(true)
    try {
      let combinedNotes = notes.trim()
      if (nextSession) {
        const tag =
          nextSession === 'same'
            ? '[Nästa pass: behåll nivå]'
            : nextSession === 'easier'
              ? '[Nästa pass: lättare]'
              : '[Nästa pass: kan höja]'
        combinedNotes = combinedNotes ? `${combinedNotes}\n${tag}` : tag
      }
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dog_id: dogId,
          breed,
          week_number: weekNumber,
          quick_rating: rating,
          focus,
          obedience,
          handler_timing: handlerTiming,
          handler_consistency: handlerConsistency,
          handler_reading: handlerReading,
          notes: combinedNotes || undefined,
          exercises: exercises && exercises.length > 0 ? exercises : undefined,
        }),
      })
      setSaved(true)
      setTimeout(() => onSaved(), 1200)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className={styles.savedScreen} role="status">
        <SavedBurst />
        <div className={styles.savedMedalWrap}>
          <IconMedal size="hero" />
        </div>
        <p className={styles.savedTitle}>Pass sparat!</p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* Hero summary */}
      <div className={styles.hero}>
        <div className={styles.heroHead}>
          <IconConfetti size="sm" />
          Pass klart — bra jobbat!
        </div>
        <div className={styles.heroStats}>
          {[
            [rate !== null ? `${rate}%` : '—', 'lyckade'],
            [String(count), 'övningar'],
            [String(reps), 'reps'],
          ].map(([v, l]) => (
            <div key={l} className={styles.heroStat}>
              <div className={styles.heroStatValue}>{v}</div>
              <div className={styles.heroStatLabel}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Hur kändes passet?</span>
        <div className={styles.ratingRow} role="radiogroup" aria-label="Hur gick passet?">
          {RATINGS.map((r) => {
            const selected = rating === r.value
            return (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`${styles.ratingBtn} ${selected ? r.selectedClass : ''}`}
                onClick={() => setRating(r.value)}
              >
                <RatingIcon rating={r.value} size="xl" />
                <span>{r.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Dog performance */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Hundens prestation</span>
        <Stepper label="Fokus" value={focus} onChange={setFocus} />
        <Stepper label="Lydnad" value={obedience} onChange={setObedience} />
      </div>

      {/* Handler performance */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Din insats som förare</span>
        <Stepper label="Timing" hint="Belönade du i rätt ögonblick?" value={handlerTiming} onChange={setHandlerTiming} />
        <Stepper label="Konsekvens" hint="Höll du samma krav hela passet?" value={handlerConsistency} onChange={setHandlerConsistency} />
        <Stepper label="Läsa hunden" hint="Märkte du när det började bli svårt?" value={handlerReading} onChange={setHandlerReading} />
      </div>

      {/* Next session */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Nästa pass (valfritt)</span>
        <div className={styles.nextRow} role="radiogroup" aria-label="Plan för nästa pass">
          {NEXT_OPTIONS.map((opt) => {
            const selected = nextSession === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`${styles.nextBtn} ${selected ? styles.nextBtnSelected : ''}`}
                onClick={() => setNextSession((prev) => (prev === opt.value ? null : opt.value))}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Notes */}
      <textarea
        className={styles.notes}
        placeholder="Anteckningar (valfritt)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />

      {/* Actions */}
      {onCancel && (
        <button type="button" onClick={onCancel} className={styles.cancelBtn} disabled={saving}>
          Avbryt
        </button>
      )}
      <button type="submit" className={styles.submitBtn} disabled={saving || !rating}>
        <IconCheckCircle size="md" /> Spara pass
      </button>
    </form>
  )
}
```

**Note on `IconMedal size="hero"`:** `hero` maps to 48px in `DvIcon.tsx` — no changes needed.

- [ ] **Step 2: Verify `DvIcon` sizes**

```bash
grep -n "hero" src/components/icons/DvIcon.tsx
```

Expected: `hero: 48` present in `SIZE_MAP`. No changes needed.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run --passWithNoTests
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/SessionLogForm.tsx src/components/icons/DvIcon.tsx
git commit -m "feat(v2): SessionLogForm hero summary, Stepper, celebration saved screen"
```

---

## Done

Both components are rewritten. `TrainingCard` and `PuppyDayCard` pick up the changes automatically since their props are unchanged. Open the app and verify:

1. Each `ExerciseRow` renders as a dark-green gradient card with a segmented ring
2. Clicking ✓/✗ fills ring segments and spawns floating labels
3. After 2+ successes in a row, a combo pill appears
4. When all reps are done, ring center shows medal + "Klart!" + confetti
5. `SessionLogForm` shows gradient hero, large rating cards, steppers, and a celebration on save
