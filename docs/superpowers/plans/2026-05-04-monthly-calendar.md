# Monthly Calendar View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/calendar` — a monthly training calendar showing history (colored dots from session logs) and upcoming planned days (from week plan pattern), reached via the "Programvecka X" badge in the dashboard header.

**Architecture:** Client-side page, two fetches on mount (`/api/logs` and `/api/training/week`). Session logs build a `date → SessionLog` map; the week plan extracts which Swedish weekday names are training days and projects that pattern across the displayed month. No new API endpoints.

**Tech Stack:** Next.js App Router, React hooks, CSS Modules, existing `/api/logs` and `/api/training/week` endpoints, `SessionLog.exercises` field (added recently — may be undefined on older logs, handled gracefully).

---

### Task 1: Dashboard entry point

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Make weekBadge a Link**

In `src/app/dashboard/page.tsx`, `Link` is already imported (from `next/navigation` via `useRouter` — add explicit import if not present). Change the `weekBadge` span to a Link:

```tsx
// Add at top if not already imported:
import Link from 'next/link'

// Replace:
<span className={styles.weekBadge}>
  <span aria-hidden="true">🗓️</span> Programvecka {trainingWeek}
</span>

// With:
<Link href="/calendar" className={styles.weekBadge}>
  <span aria-hidden="true">🗓️</span> Programvecka {trainingWeek}
</Link>
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: weekBadge links to /calendar"
```

---

### Task 2: Calendar page skeleton + CSS

**Files:**
- Create: `src/app/calendar/page.tsx`
- Create: `src/app/calendar/page.module.css`

- [ ] **Step 1: Create page.module.css**

```css
/* src/app/calendar/page.module.css */
.main {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: var(--max-width);
  margin: 0 auto;
  width: 100%;
  background: var(--color-bg);
  padding-bottom: var(--bottom-nav-height);
}

.header {
  position: relative;
  overflow: hidden;
  padding: var(--space-5) var(--space-6) 1.75rem;
  background: linear-gradient(160deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
  color: #fff;
}

.decorCircle {
  position: absolute;
  top: -1.875rem;
  right: -1.875rem;
  width: 8.75rem;
  height: 8.75rem;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.05);
  pointer-events: none;
}

.headerContent {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.backBtn {
  background: rgb(255 255 255 / 0.15);
  border: none;
  border-radius: var(--radius-full);
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}

.backBtn:hover {
  background: rgb(255 255 255 / 0.25);
}

.headerTitle {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: #fff;
  flex: 1;
}

.scrollArea {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
}

/* Month navigation */
.monthNav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) 0;
}

.monthLabel {
  font-size: var(--text-md);
  font-weight: var(--font-bold);
  color: var(--color-text);
  text-transform: capitalize;
}

.monthNavBtn {
  background: none;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: border-color var(--transition-fast), color var(--transition-fast);
}

.monthNavBtn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Calendar grid */
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.weekdayHeader {
  text-align: center;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-muted);
  padding: var(--space-2) 0;
}

.dayCell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: var(--space-2) 0;
  cursor: pointer;
  border-radius: var(--radius-md);
  min-height: 3.25rem;
  background: none;
  border: none;
  transition: background var(--transition-fast);
}

.dayCell:hover {
  background: var(--color-bg-alt);
}

.dayCellEmpty {
  min-height: 3.25rem;
}

.dayCellSelected {
  background: var(--color-green-50);
}

.dayCellToday .dayNumber {
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-full);
}

.dayNumber {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
  width: 1.625rem;
  height: 1.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dotGood    { background: var(--color-primary); }
.dotMixed   { background: #f59e0b; }
.dotBad     { background: #ef4444; }
.dotMissed  { background: transparent; border: 1.5px solid var(--color-text-muted); opacity: 0.5; }
.dotPlanned { background: var(--color-primary); opacity: 0.3; }

/* Day detail panel */
.detailPanel {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 7rem;
}

.detailDate {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-muted);
  text-transform: capitalize;
}

.detailRating {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  align-self: flex-start;
}

.ratingGood  { background: var(--color-green-50); color: var(--color-primary); }
.ratingMixed { background: #fef3c7; color: #92400e; }
.ratingBad   { background: #fee2e2; color: #991b1b; }

.detailStats {
  display: flex;
  gap: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.detailStats strong { color: var(--color-text); }

.exerciseList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.exerciseItem {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm);
  color: var(--color-text);
}

.exerciseRate { color: var(--color-text-muted); }

.detailLabel {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text);
}

.detailSub { font-size: var(--text-sm); color: var(--color-text-muted); }
.noData    { font-size: var(--text-sm); color: var(--color-text-muted); }

/* Legend */
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding: var(--space-2) 0;
}

.legendItem {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.legendDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
```

- [ ] **Step 2: Create page.tsx skeleton**

```tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProfileGuard from '@/components/ProfileGuard'
import BottomNav from '@/components/BottomNav'
import { getDogProfile } from '@/lib/dog/profile'
import { getAgeInWeeks } from '@/lib/dog/age'
import type { DogProfile, SessionLog, WeekPlan } from '@/types'
import styles from './page.module.css'

export default function CalendarPage() {
  return (
    <ProfileGuard>
      <CalendarView />
    </ProfileGuard>
  )
}

// Swedish weekday name lookup — matches Date.getDay() (0 = Sunday)
const WEEKDAY_NAMES = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']
const WEEKDAY_ABBR  = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']
const MONTH_NAMES   = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
]
const DAY_NAMES_LC  = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag']

function CalendarView() {
  const router = useRouter()
  const [profile, setProfile] = useState<DogProfile | null>(null)

  useEffect(() => {
    const p = getDogProfile()
    if (p) setProfile(p)
  }, [])

  if (!profile) return null

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.decorCircle} aria-hidden="true" />
        <div className={styles.headerContent}>
          <button type="button" className={styles.backBtn} onClick={() => router.back()} aria-label="Tillbaka">
            <BackIcon />
          </button>
          <span className={styles.headerTitle}>Träningskalender</span>
        </div>
      </header>
      <div className={styles.scrollArea}>
        <p className={styles.noData}>Laddar…</p>
      </div>
      <BottomNav active="dashboard" />
    </main>
  )
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/calendar/page.tsx src/app/calendar/page.module.css
git commit -m "feat: calendar page skeleton and CSS"
```

---

### Task 3: Data fetching

**Files:**
- Modify: `src/app/calendar/page.tsx`

- [ ] **Step 1: Replace CalendarView with data-fetching version**

Replace the entire `CalendarView` function (keep all constants and `BackIcon` intact):

```tsx
function CalendarView() {
  const router = useRouter()
  const [profile, setProfile] = useState<DogProfile | null>(null)
  const [logs, setLogs] = useState<Record<string, SessionLog>>({})
  const [trainingWeekdays, setTrainingWeekdays] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const [viewYear, setViewYear]     = useState(today.getFullYear())
  const [viewMonth, setViewMonth]   = useState(today.getMonth()) // 0-based
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)

  useEffect(() => {
    const p = getDogProfile()
    if (p) setProfile(p)
  }, [])

  const fetchData = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    try {
      const ageWeeks = Math.max(1, getAgeInWeeks(profile.birthdate))
      const trainingWeek = profile.trainingWeek ?? 1
      const goals = profile.onboarding?.goals
      const goalsParam = goals && goals.length > 0 ? `&goals=${goals.join(',')}` : ''

      const [logsRes, planRes] = await Promise.all([
        fetch(`/api/logs?breed=${profile.breed}`),
        fetch(`/api/training/week?breed=${profile.breed}&week=${trainingWeek}&ageWeeks=${ageWeeks}${goalsParam}`),
      ])

      if (logsRes.ok) {
        const allLogs: SessionLog[] = await logsRes.json()
        const byDate: Record<string, SessionLog> = {}
        for (const log of allLogs) {
          const date = log.created_at.slice(0, 10)
          if (!byDate[date]) byDate[date] = log // keep first (most recent) per day
        }
        setLogs(byDate)
      }

      if (planRes.ok) {
        const plan: WeekPlan = await planRes.json()
        setTrainingWeekdays(
          new Set(plan.days.filter((d) => !d.rest).map((d) => d.day))
        )
      }
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => { fetchData() }, [fetchData])

  if (!profile) return null

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.decorCircle} aria-hidden="true" />
        <div className={styles.headerContent}>
          <button type="button" className={styles.backBtn} onClick={() => router.back()} aria-label="Tillbaka">
            <BackIcon />
          </button>
          <span className={styles.headerTitle}>Träningskalender</span>
        </div>
      </header>
      <div className={styles.scrollArea}>
        {loading
          ? <p className={styles.noData}>Laddar…</p>
          : <p className={styles.noData}>Data laddad: {Object.keys(logs).length} loggade pass</p>
        }
      </div>
      <BottomNav active="dashboard" />
    </main>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/calendar/page.tsx
git commit -m "feat: calendar data fetching (logs + week plan)"
```

---

### Task 4: Calendar grid

**Files:**
- Modify: `src/app/calendar/page.tsx`

- [ ] **Step 1: Add helper functions after the constants block**

Add these after `DAY_NAMES_LC` and before `CalendarView`:

```tsx
type DayState = 'good' | 'mixed' | 'bad' | 'missed' | 'planned' | 'rest'

function getDayState(
  dateStr: string,
  todayStr: string,
  logs: Record<string, SessionLog>,
  trainingWeekdays: Set<string>
): DayState {
  const log = logs[dateStr]
  if (log) return log.quick_rating as DayState

  // Use noon to avoid timezone issues when parsing date-only strings
  const date = new Date(dateStr + 'T12:00:00')
  const isTraining = trainingWeekdays.has(WEEKDAY_NAMES[date.getDay()])

  if (dateStr < todayStr) return isTraining ? 'missed' : 'rest'
  return isTraining ? 'planned' : 'rest'
}

// Returns array of YYYY-MM-DD strings (or null for padding cells).
// Grid starts on Monday (offset by Mon=0…Sun=6).
function getMonthCells(year: number, month: number): (string | null)[] {
  const firstDay   = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7 // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = Array(startOffset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    )
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
```

- [ ] **Step 2: Add DayCell component**

Add after the helper functions:

```tsx
function DayCell({
  dateStr,
  todayStr,
  selected,
  state,
  onClick,
}: {
  dateStr: string
  todayStr: string
  selected: boolean
  state: DayState
  onClick: () => void
}) {
  const dayNum  = Number(dateStr.slice(8))
  const isToday = dateStr === todayStr

  const dotClass: string | null = {
    good:    styles.dotGood,
    mixed:   styles.dotMixed,
    bad:     styles.dotBad,
    missed:  styles.dotMissed,
    planned: styles.dotPlanned,
    rest:    null,
  }[state]

  return (
    <button
      type="button"
      className={[
        styles.dayCell,
        isToday   ? styles.dayCellToday    : '',
        selected  ? styles.dayCellSelected : '',
      ].join(' ')}
      onClick={onClick}
      aria-label={dateStr}
      aria-pressed={selected}
    >
      <span className={styles.dayNumber}>{dayNum}</span>
      {dotClass && <span className={`${styles.dot} ${dotClass}`} aria-hidden="true" />}
    </button>
  )
}
```

- [ ] **Step 3: Add CalendarGrid component**

Add after `DayCell`:

```tsx
function CalendarGrid({
  year,
  month,
  todayStr,
  selectedDate,
  logs,
  trainingWeekdays,
  onSelectDate,
}: {
  year: number
  month: number
  todayStr: string
  selectedDate: string
  logs: Record<string, SessionLog>
  trainingWeekdays: Set<string>
  onSelectDate: (date: string) => void
}) {
  const cells = getMonthCells(year, month)
  return (
    <div className={styles.grid}>
      {WEEKDAY_ABBR.map((d) => (
        <div key={d} className={styles.weekdayHeader}>{d}</div>
      ))}
      {cells.map((dateStr, i) => {
        if (!dateStr) return <div key={`pad-${i}`} className={styles.dayCellEmpty} />
        const state = getDayState(dateStr, todayStr, logs, trainingWeekdays)
        return (
          <DayCell
            key={dateStr}
            dateStr={dateStr}
            todayStr={todayStr}
            selected={selectedDate === dateStr}
            state={state}
            onClick={() => onSelectDate(dateStr)}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Add ChevronLeft/ChevronRight icons**

Add after `BackIcon`:

```tsx
function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
```

- [ ] **Step 5: Replace CalendarView return with full grid render**

Replace only the `return (…)` inside `CalendarView` (keep all state/effects unchanged):

```tsx
  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.decorCircle} aria-hidden="true" />
        <div className={styles.headerContent}>
          <button type="button" className={styles.backBtn} onClick={() => router.back()} aria-label="Tillbaka">
            <BackIcon />
          </button>
          <span className={styles.headerTitle}>Träningskalender</span>
        </div>
      </header>

      <div className={styles.scrollArea}>
        {loading ? (
          <p className={styles.noData}>Laddar…</p>
        ) : (
          <>
            <div className={styles.monthNav}>
              <button type="button" className={styles.monthNavBtn} onClick={prevMonth} aria-label="Föregående månad">
                <ChevronLeft />
              </button>
              <span className={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
              <button type="button" className={styles.monthNavBtn} onClick={nextMonth} aria-label="Nästa månad">
                <ChevronRight />
              </button>
            </div>

            <CalendarGrid
              year={viewYear}
              month={viewMonth}
              todayStr={todayStr}
              selectedDate={selectedDate}
              logs={logs}
              trainingWeekdays={trainingWeekdays}
              onSelectDate={setSelectedDate}
            />

            <DayDetailPanel
              dateStr={selectedDate}
              todayStr={todayStr}
              log={logs[selectedDate] ?? null}
              trainingWeekdays={trainingWeekdays}
            />

            <Legend />
          </>
        )}
      </div>

      <BottomNav active="dashboard" />
    </main>
  )
```

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: errors for `DayDetailPanel` and `Legend` not yet defined — these are added in Task 5. Confirm errors are only about those two missing components, not structural issues.

- [ ] **Step 7: Commit**

```bash
git add src/app/calendar/page.tsx
git commit -m "feat: calendar grid with dot indicators"
```

---

### Task 5: Day detail panel + legend

**Files:**
- Modify: `src/app/calendar/page.tsx`

- [ ] **Step 1: Add DayDetailPanel component**

Add after `CalendarGrid`:

```tsx
const RATING_CONFIG: Record<string, { label: string; cls: string }> = {
  good:  { label: 'Bra',     cls: styles.ratingGood },
  mixed: { label: 'Blandat', cls: styles.ratingMixed },
  bad:   { label: 'Svårt',   cls: styles.ratingBad },
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return `${DAY_NAMES_LC[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

function DayDetailPanel({
  dateStr,
  todayStr,
  log,
  trainingWeekdays,
}: {
  dateStr: string
  todayStr: string
  log: SessionLog | null
  trainingWeekdays: Set<string>
}) {
  const date      = new Date(dateStr + 'T12:00:00')
  const isTraining = trainingWeekdays.has(WEEKDAY_NAMES[date.getDay()])
  const isFuture  = dateStr > todayStr
  const rating    = log ? RATING_CONFIG[log.quick_rating] : null

  return (
    <div className={styles.detailPanel}>
      <span className={styles.detailDate}>{formatDateLabel(dateStr)}</span>

      {log ? (
        <>
          {rating && (
            <span className={`${styles.detailRating} ${rating.cls}`}>
              {rating.label}
            </span>
          )}
          <div className={styles.detailStats}>
            <span><strong>{log.focus}/5</strong> fokus</span>
            <span><strong>{log.obedience}/5</strong> lydnad</span>
          </div>
          {log.exercises && log.exercises.length > 0 && (
            <ul className={styles.exerciseList}>
              {log.exercises.map((ex) => {
                const attempts = ex.success_count + ex.fail_count
                const rate = attempts > 0 ? Math.round((ex.success_count / attempts) * 100) : null
                return (
                  <li key={ex.id} className={styles.exerciseItem}>
                    <span>{ex.label}</span>
                    {rate !== null && (
                      <span className={styles.exerciseRate}>
                        {ex.success_count}/{attempts} ({rate}%)
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {log.notes && <p className={styles.detailSub}>"{log.notes}"</p>}
        </>
      ) : isFuture ? (
        <>
          <span className={styles.detailLabel}>
            {isTraining ? 'Planerad träningsdag' : 'Vilodag'}
          </span>
          {!isTraining && (
            <span className={styles.detailSub}>Vila och återhämtning</span>
          )}
        </>
      ) : isTraining ? (
        <span className={styles.noData}>Inget pass loggat</span>
      ) : (
        <span className={styles.detailLabel}>Vilodag</span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add Legend component**

Add after `DayDetailPanel`:

```tsx
function Legend() {
  const items = [
    { cls: styles.dotGood,    label: 'Bra pass' },
    { cls: styles.dotMixed,   label: 'Blandat' },
    { cls: styles.dotBad,     label: 'Svårt' },
    { cls: styles.dotMissed,  label: 'Missat' },
    { cls: styles.dotPlanned, label: 'Planerat' },
  ]
  return (
    <div className={styles.legend}>
      {items.map((item) => (
        <div key={item.label} className={styles.legendItem}>
          <span className={`${styles.legendDot} ${item.cls}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/calendar/page.tsx
git commit -m "feat: day detail panel and legend"
```

---

### Task 6: Push

- [ ] **Step 1: Push all commits**

```bash
git push
```
Expected: all commits pushed to origin/main.
