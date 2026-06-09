# Puppy Zone Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the weekly AI-generated training schedule for puppies (< 26 weeks) with a daily zone check-in (green/yellow/red) that adapts the session to how the puppy feels that day.

**Architecture:** A new `PuppyDayCard` component replaces `TrainingCard` on the dashboard when `isPuppyMode(ageWeeks)` is true. It fetches today's zone from a new `daily_check_ins` table, shows a zone picker if no zone is set, then serves exercises based on the zone: green = existing week-plan exercises (AI, cached), yellow = 1 calm exercise chosen deterministically from recent metrics, red = recovery tips only. Adult dog flow (≥ 26 weeks) is completely untouched.

**Tech Stack:** Next.js App Router, Supabase (postgres + admin client), Vitest, React hooks, CSS Modules

---

## File Map

**New files (in dependency order):**
- `src/lib/dog/age.ts` — add `isPuppyMode()`
- `src/lib/dog/age.test.ts` — tests
- `src/lib/training/puppy-zone.ts` — zone types + exercise selection
- `src/lib/training/puppy-zone.test.ts` — tests
- `supabase/migrations/014_daily_check_ins.sql`
- `src/lib/supabase/daily-check-ins.ts` — imports from puppy-zone.ts
- `src/app/api/training/checkin/route.ts` — imports from puppy-zone.ts
- `src/components/PuppyDayCard/PuppyDayCard.module.css`
- `src/components/PuppyDayCard/ZoneCheckIn.tsx`
- `src/components/PuppyDayCard/RecoveryCard.tsx`
- `src/components/PuppyDayCard/use-puppy-day.ts`
- `src/components/PuppyDayCard/PuppyDayCard.tsx`

**Modified files:**
- `src/app/dashboard/page.tsx`
- `src/app/calendar/page.tsx`

---

## Task 1: `isPuppyMode()` — age.ts (TDD)

**Files:**
- Modify: `src/lib/dog/age.ts`
- Modify: `src/lib/dog/age.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `src/lib/dog/age.test.ts`:

```typescript
describe('isPuppyMode', () => {
  it('is true for puppies and juniors (< 26 weeks)', () => {
    expect(isPuppyMode(8)).toBe(true)
    expect(isPuppyMode(15)).toBe(true)
    expect(isPuppyMode(25)).toBe(true)
  })
  it('is false at 26 weeks and above', () => {
    expect(isPuppyMode(26)).toBe(false)
    expect(isPuppyMode(52)).toBe(false)
  })
  it('is false for 0 or undefined', () => {
    expect(isPuppyMode(0)).toBe(false)
    expect(isPuppyMode(undefined)).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/lib/dog/age.test.ts
```

Expected: FAIL with "isPuppyMode is not a function"

- [ ] **Step 3: Implement `isPuppyMode` in age.ts**

Add after the existing `isJunior` export in `src/lib/dog/age.ts`:

```typescript
export const isPuppyMode = (ageWeeks?: number): boolean =>
  typeof ageWeeks === 'number' && ageWeeks > 0 && ageWeeks < 26
```

Update the import in `age.test.ts`:

```typescript
import { getAgeInWeeks, getLifeStage, isPuppy, isPuppyMode } from './age'
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run src/lib/dog/age.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/dog/age.ts src/lib/dog/age.test.ts
git commit -m "feat(puppy-zone): add isPuppyMode helper (< 26 weeks)"
```

---

## Task 2: Zone types + exercise selection (TDD)

**Files:**
- Create: `src/lib/training/puppy-zone.ts`
- Create: `src/lib/training/puppy-zone.test.ts`

This task must be done before Tasks 3–4 because both the Supabase helper and API route import `PuppyZone` from this file.

- [ ] **Step 1: Write failing tests**

Create `src/lib/training/puppy-zone.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  selectYellowExercise,
  buildYellowExercise,
  getRecoveryTips,
  CALM_EXERCISE_IDS,
} from './puppy-zone'

describe('selectYellowExercise', () => {
  it('returns the first calm exercise with positive success rate', () => {
    const metrics = {
      nosework: { success_count: 0, fail_count: 3 },
      plats: { success_count: 4, fail_count: 1 },
      ligg: { success_count: 2, fail_count: 0 },
    }
    expect(selectYellowExercise(metrics)).toBe('plats')
  })

  it('falls back to nosework when no calm exercise has positive rate', () => {
    const metrics = {
      nosework: { success_count: 0, fail_count: 5 },
      plats: { success_count: 0, fail_count: 2 },
    }
    expect(selectYellowExercise(metrics)).toBe('nosework')
  })

  it('falls back to nosework when metrics is empty', () => {
    expect(selectYellowExercise({})).toBe('nosework')
  })

  it('only considers CALM_EXERCISE_IDS — ignores non-calm exercises', () => {
    const metrics = {
      inkallning: { success_count: 10, fail_count: 0 },
      nosework: { success_count: 0, fail_count: 1 },
    }
    expect(selectYellowExercise(metrics)).toBe('nosework')
  })
})

describe('buildYellowExercise', () => {
  it('returns an Exercise with 3 reps and a framing desc', () => {
    const ex = buildYellowExercise('plats')
    expect(ex.id).toBe('plats')
    expect(ex.reps).toBe(3)
    expect(ex.label).toBe('Plats')
    expect(ex.desc).toContain('3 repetitioner')
  })
})

describe('getRecoveryTips', () => {
  it('returns exactly 3 non-empty tips', () => {
    const tips = getRecoveryTips()
    expect(tips).toHaveLength(3)
    tips.forEach((t) => expect(t.length).toBeGreaterThan(0))
  })
})

describe('CALM_EXERCISE_IDS', () => {
  it('contains expected calm exercises', () => {
    expect(CALM_EXERCISE_IDS).toContain('nosework')
    expect(CALM_EXERCISE_IDS).toContain('plats')
    expect(CALM_EXERCISE_IDS).toContain('ligg')
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/lib/training/puppy-zone.test.ts
```

Expected: FAIL with "Cannot find module './puppy-zone'"

- [ ] **Step 3: Implement `puppy-zone.ts`**

Create `src/lib/training/puppy-zone.ts`:

```typescript
import type { Exercise } from '@/types'

export type PuppyZone = 'green' | 'yellow' | 'red'

export const CALM_EXERCISE_IDS = ['nosework', 'plats', 'ligg', 'fokus', 'stanna', 'namn'] as const
export type CalmExerciseId = (typeof CALM_EXERCISE_IDS)[number]

const CALM_EXERCISE_LABELS: Record<CalmExerciseId, string> = {
  nosework: 'Nosework',
  plats: 'Plats',
  ligg: 'Ligg',
  fokus: 'Fokus',
  stanna: 'Stanna',
  namn: 'Namn',
}

// Picks the calm exercise the dog has most recently performed well.
// Falls back to 'nosework' when no calm exercise has a positive success rate.
export function selectYellowExercise(
  metrics: Record<string, { success_count: number; fail_count: number }>,
): CalmExerciseId {
  const passing = CALM_EXERCISE_IDS.filter(
    (id) => (metrics[id]?.success_count ?? 0) > (metrics[id]?.fail_count ?? 0),
  )
  return passing[0] ?? 'nosework'
}

export function buildYellowExercise(id: CalmExerciseId): Exercise {
  return {
    id,
    label: CALM_EXERCISE_LABELS[id],
    desc: '3 repetitioner — fokus på lugn och enkla vinster.',
    reps: 3,
  }
}

export function getRecoveryTips(): string[] {
  return [
    'Sniffpromenad utan krav — låt hunden styra tempo och riktning.',
    'Vila i bur eller på plats — ge hunden tid att varva ner.',
    'Fri lek på säker plats utan prestationskrav.',
  ]
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run src/lib/training/puppy-zone.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/puppy-zone.ts src/lib/training/puppy-zone.test.ts
git commit -m "feat(puppy-zone): add zone types and exercise selection logic"
```

---

## Task 3: DB migration + Supabase helper

**Files:**
- Create: `supabase/migrations/014_daily_check_ins.sql`
- Create: `src/lib/supabase/daily-check-ins.ts`

- [ ] **Step 1: Write migration**

Create `supabase/migrations/014_daily_check_ins.sql`:

```sql
create table daily_check_ins (
  dog_id  uuid  not null references dog_profiles(id) on delete cascade,
  date    date  not null,
  zone    text  not null check (zone in ('green', 'yellow', 'red')),
  primary key (dog_id, date)
);

alter table daily_check_ins enable row level security;

create policy "owner_only" on daily_check_ins
  for all
  using (
    dog_id in (
      select id from dog_profiles where user_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```

Expected: migration applies without errors.

- [ ] **Step 3: Create Supabase helper**

Create `src/lib/supabase/daily-check-ins.ts`:

```typescript
import { getSupabaseAdmin } from './client'
import type { PuppyZone } from '@/lib/training/puppy-zone'

export async function getCheckIn(dogId: string, date: string): Promise<PuppyZone | null> {
  const { data } = await getSupabaseAdmin()
    .from('daily_check_ins')
    .select('zone')
    .eq('dog_id', dogId)
    .eq('date', date)
    .single()
  return (data?.zone as PuppyZone) ?? null
}

export async function saveCheckIn(dogId: string, date: string, zone: PuppyZone): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('daily_check_ins')
    .upsert({ dog_id: dogId, date, zone }, { onConflict: 'dog_id,date' })
  if (error) throw new Error(`Check-in upsert failed: ${error.message}`)
}

export async function getCheckIns(
  dogId: string,
  fromDate: string,
  toDate: string,
): Promise<Record<string, PuppyZone>> {
  const { data } = await getSupabaseAdmin()
    .from('daily_check_ins')
    .select('date, zone')
    .eq('dog_id', dogId)
    .gte('date', fromDate)
    .lte('date', toDate)
  return Object.fromEntries(
    (data ?? []).map((r) => [r.date as string, r.zone as PuppyZone]),
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors for the new files.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/014_daily_check_ins.sql src/lib/supabase/daily-check-ins.ts
git commit -m "feat(puppy-zone): add daily_check_ins table and supabase helper"
```

---

## Task 4: API route `/api/training/checkin`

**Files:**
- Create: `src/app/api/training/checkin/route.ts`

Supports `GET ?dogId=&date=` (single day) and `GET ?dogId=&from=&to=` (range for calendar). Returns `{ zone }` or `{ zones }` respectively.

- [ ] **Step 1: Create route**

Create `src/app/api/training/checkin/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { getCheckIn, getCheckIns, saveCheckIn } from '@/lib/supabase/daily-check-ins'
import type { PuppyZone } from '@/lib/training/puppy-zone'

const VALID_ZONES: PuppyZone[] = ['green', 'yellow', 'red']

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const date = req.nextUrl.searchParams.get('date')
    const from = req.nextUrl.searchParams.get('from')
    const to = req.nextUrl.searchParams.get('to')

    if (from && to) {
      const zones = await getCheckIns(dog.id, from, to)
      return NextResponse.json({ zones })
    }
    if (!date) {
      return NextResponse.json({ error: 'date or from+to required' }, { status: 400 })
    }
    const zone = await getCheckIn(dog.id, date)
    return NextResponse.json({ zone })
  })
}

export async function POST(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const { date, zone } = (await req.json()) as { date?: string; zone?: string }
    if (!date || !zone || !VALID_ZONES.includes(zone as PuppyZone)) {
      return NextResponse.json({ error: 'date and valid zone required' }, { status: 400 })
    }
    await saveCheckIn(dog.id, date, zone as PuppyZone)
    return NextResponse.json({ ok: true })
  })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/training/checkin/route.ts
git commit -m "feat(puppy-zone): add /api/training/checkin route"
```

---

## Task 5: Zone UI components + CSS

**Files:**
- Create: `src/components/PuppyDayCard/PuppyDayCard.module.css`
- Create: `src/components/PuppyDayCard/ZoneCheckIn.tsx`
- Create: `src/components/PuppyDayCard/RecoveryCard.tsx`

- [ ] **Step 1: Create shared CSS module**

Create `src/components/PuppyDayCard/PuppyDayCard.module.css`:

```css
/* Card shell */
.card {
  background: var(--surface, #fff);
  border-radius: 16px;
  padding: 20px;
  margin: 0 16px 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.headerTitle {
  font-weight: 700;
  font-size: 17px;
  color: var(--text-primary, #111);
}

.zoneBadge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(0,0,0,0.06);
}

.zoneDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.yellowFrame {
  font-size: 14px;
  color: #92400e;
  background: #fef3c7;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 12px;
  line-height: 1.5;
}

.exercises {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0,0,0,0.06);
}

.askBtn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  color: var(--text-primary, #111);
}

.errorMsg {
  font-size: 14px;
  color: #dc2626;
  text-align: center;
  padding: 12px 0;
}

/* ZoneCheckIn */
.checkIn { padding: 4px 0; }

.checkInQ {
  font-weight: 700;
  font-size: 18px;
  margin: 0 0 16px;
  color: var(--text-primary, #111);
}

.zones {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.zoneBtn {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: transform 0.1s;
}

.zoneBtn:active { transform: scale(0.98); }

.zoneBtnGreen  { border-color: #22c55e; background: #f0fdf4; }
.zoneBtnYellow { border-color: #eab308; background: #fefce8; }
.zoneBtnRed    { border-color: #ef4444; background: #fef2f2; }

.zoneEmoji { font-size: 22px; flex-shrink: 0; margin-top: 1px; }

.zoneBtnText {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.zoneLabel { font-weight: 700; font-size: 15px; color: var(--text-primary, #111); }
.zoneDesc  { font-size: 13px; color: #6b7280; }

/* RecoveryCard */
.recovery { padding: 4px 0; }

.recoveryHeader {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.recoveryTitle { font-weight: 700; font-size: 17px; color: var(--text-primary, #111); }

.recoveryDesc {
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 16px;
}

.tipList {
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.tipItem {
  background: #f9fafb;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary, #111);
}

/* Loading */
.loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 0;
  justify-content: center;
  color: #6b7280;
  font-size: 14px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top-color: #6b7280;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
```

- [ ] **Step 2: Create `ZoneCheckIn` component**

Create `src/components/PuppyDayCard/ZoneCheckIn.tsx`:

```tsx
'use client'

import type { PuppyZone } from '@/lib/training/puppy-zone'
import styles from './PuppyDayCard.module.css'

interface Props {
  dogName: string
  onSelect: (zone: PuppyZone) => void
}

const ZONES: { zone: PuppyZone; emoji: string; label: string; desc: string; cls: string }[] = [
  { zone: 'green',  emoji: '🟢', label: 'Grön',  desc: 'Reglerbar, tar kontakt, nyfiken', cls: styles.zoneBtnGreen },
  { zone: 'yellow', emoji: '🟡', label: 'Gul',   desc: 'Lite stissig eller övertrött',    cls: styles.zoneBtnYellow },
  { zone: 'red',    emoji: '🔴', label: 'Röd',   desc: 'Kaos — svårt att reglera',        cls: styles.zoneBtnRed },
]

export default function ZoneCheckIn({ dogName, onSelect }: Props) {
  return (
    <div className={styles.checkIn}>
      <p className={styles.checkInQ}>Hur är {dogName} idag?</p>
      <div className={styles.zones}>
        {ZONES.map(({ zone, emoji, label, desc, cls }) => (
          <button
            key={zone}
            type="button"
            className={`${styles.zoneBtn} ${cls}`}
            onClick={() => onSelect(zone)}
          >
            <span className={styles.zoneEmoji} aria-hidden="true">{emoji}</span>
            <span className={styles.zoneBtnText}>
              <span className={styles.zoneLabel}>{label}</span>
              <span className={styles.zoneDesc}>{desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `RecoveryCard` component**

Create `src/components/PuppyDayCard/RecoveryCard.tsx`:

```tsx
import { getRecoveryTips } from '@/lib/training/puppy-zone'
import styles from './PuppyDayCard.module.css'

export default function RecoveryCard() {
  return (
    <div className={styles.recovery}>
      <div className={styles.recoveryHeader}>
        <span className={styles.zoneDot} style={{ background: '#ef4444' }} aria-hidden="true" />
        <span className={styles.recoveryTitle}>Röd dag — bara återhämtning idag</span>
      </div>
      <p className={styles.recoveryDesc}>Inga träningskrav. Låt hjärnan vila.</p>
      <ul className={styles.tipList}>
        {getRecoveryTips().map((tip) => (
          <li key={tip} className={styles.tipItem}>{tip}</li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/PuppyDayCard/
git commit -m "feat(puppy-zone): add ZoneCheckIn, RecoveryCard, and shared CSS"
```

---

## Task 6: `use-puppy-day` hook

**Files:**
- Create: `src/components/PuppyDayCard/use-puppy-day.ts`

Fetches today's zone on mount. When zone is set, fetches exercises based on zone:
- `green` → week-plan API (AI, cached) → extract today's day by Swedish weekday name
- `yellow` → metrics API → `selectYellowExercise` → `buildYellowExercise`
- `red` → no fetch, returns recovery tips

- [ ] **Step 1: Create `use-puppy-day.ts`**

```typescript
'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Breed, DailyExerciseMetrics, Exercise, HouseholdPet, RewardPreference, TrainingEnvironment, TrainingGoal } from '@/types'
import { buildWeekPlanUrl } from '../TrainingCard/url-builder'
import { apiFetch } from '@/lib/api/fetch'
import { MetricsMapSchema, ProgressMapSchema, WeekPlanSchema } from '@/types/api/schemas'
import {
  buildYellowExercise,
  getRecoveryTips,
  selectYellowExercise,
  type PuppyZone,
} from '@/lib/training/puppy-zone'

const SWEDISH_DAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']

export interface UsePuppyDayParams {
  dogId: string
  todayDate: string
  breed: Breed
  trainingWeek: number
  ageWeeks: number
  goals?: TrainingGoal[]
  environment?: TrainingEnvironment
  rewardPreference?: RewardPreference
  takesRewardsOutdoors?: boolean
  householdPets?: HouseholdPet[]
}

export interface UsePuppyDayResult {
  zone: PuppyZone | null
  exercises: Exercise[]
  progress: Record<string, number>
  metrics: Record<string, DailyExerciseMetrics>
  recoveryTips: string[]
  loading: boolean
  error: boolean
  saveZone: (zone: PuppyZone) => Promise<void>
  setProgress: React.Dispatch<React.SetStateAction<Record<string, number>>>
  setMetrics: React.Dispatch<React.SetStateAction<Record<string, DailyExerciseMetrics>>>
}

export function usePuppyDay({
  dogId, todayDate, breed, trainingWeek, ageWeeks,
  goals, environment, rewardPreference, takesRewardsOutdoors, householdPets,
}: UsePuppyDayParams): UsePuppyDayResult {
  const [zone, setZone] = useState<PuppyZone | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [metrics, setMetrics] = useState<Record<string, DailyExerciseMetrics>>({})
  const [loadingZone, setLoadingZone] = useState(true)
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoadingZone(true)
    fetch(`/api/training/checkin?dogId=${encodeURIComponent(dogId)}&date=${todayDate}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.zone) setZone(d.zone as PuppyZone) })
      .catch(() => {})
      .finally(() => setLoadingZone(false))
  }, [dogId, todayDate])

  const fetchForZone = useCallback(async (currentZone: PuppyZone) => {
    setLoadingExercises(true)
    setError(false)
    try {
      if (currentZone === 'green') {
        const planUrl = buildWeekPlanUrl({
          breed, trainingWeek, ageWeeks, dogId, goals,
          environment, rewardPreference, takesRewardsOutdoors, householdPets,
        })
        const [planRes, progressData, metricsData] = await Promise.all([
          fetch(planUrl),
          apiFetch(`/api/training/progress?breed=${breed}&date=${todayDate}&dogId=${encodeURIComponent(dogId)}`, ProgressMapSchema),
          apiFetch(`/api/training/metrics?breed=${breed}&date=${todayDate}&dogId=${encodeURIComponent(dogId)}`, MetricsMapSchema),
        ])
        if (planRes.ok) {
          const body = await planRes.json()
          const parsed = WeekPlanSchema.safeParse(body)
          if (parsed.success) {
            const todayName = SWEDISH_DAYS[new Date().getDay()]
            const todayPlan = parsed.data.days.find((d) => d.day === todayName)
            setExercises(todayPlan?.exercises ?? [])
          } else {
            setError(true)
          }
        } else {
          setError(true)
        }
        setProgress(progressData)
        setMetrics(metricsData)
      } else if (currentZone === 'yellow') {
        const [progressData, metricsData] = await Promise.all([
          apiFetch(`/api/training/progress?breed=${breed}&date=${todayDate}&dogId=${encodeURIComponent(dogId)}`, ProgressMapSchema),
          apiFetch(`/api/training/metrics?breed=${breed}&date=${todayDate}&dogId=${encodeURIComponent(dogId)}`, MetricsMapSchema),
        ])
        setProgress(progressData)
        setMetrics(metricsData)
        setExercises([buildYellowExercise(selectYellowExercise(metricsData))])
      } else {
        setExercises([])
      }
    } catch {
      setError(true)
    } finally {
      setLoadingExercises(false)
    }
  }, [breed, trainingWeek, ageWeeks, dogId, todayDate, goals, environment, rewardPreference, takesRewardsOutdoors, householdPets])

  useEffect(() => {
    if (zone) void fetchForZone(zone)
  }, [zone, fetchForZone])

  const saveZone = useCallback(async (newZone: PuppyZone) => {
    setZone(newZone)
    await fetch('/api/training/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dogId, date: todayDate, zone: newZone }),
    }).catch(console.error)
  }, [dogId, todayDate])

  return {
    zone,
    exercises,
    progress,
    metrics,
    recoveryTips: zone === 'red' ? getRecoveryTips() : [],
    loading: loadingZone || loadingExercises,
    error,
    saveZone,
    setProgress,
    setMetrics,
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PuppyDayCard/use-puppy-day.ts
git commit -m "feat(puppy-zone): add use-puppy-day hook"
```

---

## Task 7: `PuppyDayCard` component

**Files:**
- Create: `src/components/PuppyDayCard/PuppyDayCard.tsx`

Reuses `ExerciseRow`, `DayProgressBar`, `PreSessionChecklist`, `SessionLogForm` from the existing codebase.

- [ ] **Step 1: Create `PuppyDayCard.tsx`**

```tsx
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ExerciseRow from '../TrainingCard/ExerciseRow'
import DayProgressBar from '../TrainingCard/DayProgressBar'
import PreSessionChecklist from '../TrainingCard/PreSessionChecklist'
import ZoneCheckIn from './ZoneCheckIn'
import RecoveryCard from './RecoveryCard'
import styles from './PuppyDayCard.module.css'
import { getExerciseSpec } from '@/lib/training/exercise-specs'
import { buildRecommendation } from '../TrainingCard/recommendation'
import { buildExerciseSummaries, emptyMetrics } from '../TrainingCard/exercise-helpers'
import { usePuppyDay } from './use-puppy-day'
import SessionLogForm from '@/components/SessionLogForm'
import type { Breed, DailyExerciseMetrics, HouseholdPet, RewardPreference, TrainingEnvironment, TrainingGoal } from '@/types'
import { IconChevronRight } from '@/components/icons'

const ZONE_LABELS = { green: 'Grön dag', yellow: 'Gul dag', red: 'Röd dag' } as const
const ZONE_COLORS = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' } as const

interface Props {
  trainingWeek: number
  ageWeeks: number
  breed: Breed
  dogName: string
  dogId: string
  goals?: TrainingGoal[]
  environment?: TrainingEnvironment
  rewardPreference?: RewardPreference
  takesRewardsOutdoors?: boolean
  householdPets?: HouseholdPet[]
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function PuppyDayCard(props: Props) {
  const { ageWeeks, breed, dogName, dogId, trainingWeek } = props
  const router = useRouter()
  const todayDate = useMemo(todayStr, [])
  const [showLogForm, setShowLogForm] = useState(false)
  const [sessionGuard, setSessionGuard] = useState<Record<string, { consecutiveFails: number; consecutiveSlow: number }>>({})

  const { zone, exercises, progress, metrics, loading, error, saveZone, setProgress, setMetrics } =
    usePuppyDay({ ...props, todayDate })

  const repsPlanned = useMemo(() => exercises.reduce((s, e) => s + e.reps, 0), [exercises])
  const repsDone = useMemo(
    () => exercises.reduce((s, e) => s + Math.min(progress[e.id] ?? 0, e.reps), 0),
    [exercises, progress],
  )

  function handleRepClick(exerciseId: string, currentDone: number, maxReps: number) {
    if (currentDone >= maxReps) return
    const newDone = currentDone + 1
    const newProgress = { ...progress, [exerciseId]: newDone }
    setProgress(newProgress)
    if (exercises.every((e) => (newProgress[e.id] ?? 0) >= e.reps)) setShowLogForm(true)
    fetch('/api/training/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ breed, date: todayDate, dogId, exerciseId, count: newDone }),
    }).catch(console.error)
  }

  function patchMetrics(exerciseId: string, patch: Partial<DailyExerciseMetrics>) {
    setSessionGuard((prev) => {
      const cur = prev[exerciseId] ?? { consecutiveFails: 0, consecutiveSlow: 0 }
      let next = cur
      if ('fail_count' in patch) next = { ...next, consecutiveFails: next.consecutiveFails + 1 }
      if (patch.latency_bucket === 'gt3s') next = { ...next, consecutiveSlow: next.consecutiveSlow + 1 }
      if ('success_count' in patch) next = { consecutiveFails: 0, consecutiveSlow: 0 }
      return { ...prev, [exerciseId]: next }
    })
    setMetrics((prev) => ({
      ...prev,
      [exerciseId]: { ...(prev[exerciseId] ?? emptyMetrics()), ...patch },
    }))
    fetch('/api/training/metrics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ breed, date: todayDate, dogId, exerciseId, patch }),
    }).catch(console.error)
  }

  if (loading) {
    return (
      <section className={styles.card}>
        <div className={styles.loading}>
          <span className={styles.spinner} />
          <span>Laddar…</span>
        </div>
      </section>
    )
  }

  if (!zone) {
    return (
      <section className={styles.card}>
        <ZoneCheckIn dogName={dogName} onSelect={saveZone} />
      </section>
    )
  }

  if (zone === 'red') {
    return (
      <section className={styles.card}>
        <RecoveryCard />
      </section>
    )
  }

  const nextExerciseId = exercises.find((e) => (progress[e.id] ?? 0) < e.reps)?.id ?? null

  return (
    <>
      <section className={styles.card}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>Dagens pass</span>
          <span className={styles.zoneBadge}>
            <span className={styles.zoneDot} style={{ background: ZONE_COLORS[zone] }} aria-hidden="true" />
            {ZONE_LABELS[zone]}
          </span>
        </div>

        {zone === 'yellow' && (
          <p className={styles.yellowFrame}>
            Kort och enkelt idag — en enkel vinst är allt ni behöver.
          </p>
        )}

        <PreSessionChecklist ageWeeks={ageWeeks} dateKey={todayDate} dogId={dogId} />

        <DayProgressBar repsDone={repsDone} repsPlanned={repsPlanned} isRestDay={false} />

        {error && <p className={styles.errorMsg}>Kunde inte hämta träningsplan. Försök igen.</p>}

        {exercises.length > 0 && (
          <div className={styles.exercises}>
            {exercises.map((ex) => {
              const spec = getExerciseSpec(ex.id)
              const m = metrics[ex.id] ?? null
              const guard = sessionGuard[ex.id] ?? { consecutiveFails: 0, consecutiveSlow: 0 }
              const rec = buildRecommendation(
                m?.success_count ?? 0, m?.fail_count ?? 0, m?.latency_bucket ?? null, ageWeeks, guard,
              )
              return (
                <ExerciseRow
                  key={ex.id}
                  exercise={ex}
                  done={progress[ex.id] ?? 0}
                  onRepClick={() => handleRepClick(ex.id, progress[ex.id] ?? 0, ex.reps)}
                  onOpenGuide={() => {}}
                  spec={spec}
                  metrics={m}
                  recommendation={rec?.message ?? null}
                  showTroubleshooting={rec?.kind === 'lower' || rec?.kind === 'stop'}
                  onMetricsPatch={(patch) => patchMetrics(ex.id, patch)}
                  ageWeeks={ageWeeks}
                  sessionNext={nextExerciseId === ex.id}
                  rootId={nextExerciseId === ex.id ? 'training-session-next' : undefined}
                />
              )
            })}
          </div>
        )}

        <div className={styles.footer}>
          <button type="button" className={styles.askBtn} onClick={() => router.push('/chat')}>
            Fråga om dagens pass <IconChevronRight size="sm" />
          </button>
        </div>
      </section>

      {showLogForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: 24, width: '100%' }}>
            <SessionLogForm
              dogId={dogId}
              breed={breed}
              weekNumber={trainingWeek}
              exercises={buildExerciseSummaries(exercises, metrics)}
              onSaved={() => setShowLogForm(false)}
              onCancel={() => setShowLogForm(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Run all tests**

```bash
npx vitest run --passWithNoTests
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/PuppyDayCard/PuppyDayCard.tsx
git commit -m "feat(puppy-zone): add PuppyDayCard component"
```

---

## Task 8: Dashboard — swap TrainingCard for PuppyDayCard

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Add imports**

Add these two imports alongside the existing ones near the top of `src/app/dashboard/page.tsx`:

```typescript
import PuppyDayCard from '@/components/PuppyDayCard/PuppyDayCard'
import { isPuppyMode } from '@/lib/dog/age'
```

- [ ] **Step 2: Replace the card render**

Find this block (around line 448):

```tsx
        ) : profile ? (
          <TrainingCard
            trainingWeek={trainingWeek}
            ageWeeks={ageWeeks}
            breed={profile.breed}
            dogName={dogName}
            dogId={profile.id ?? ''}
            goals={profile.onboarding?.goals}
            environment={profile.onboarding?.environment}
            rewardPreference={profile.onboarding?.rewardPreference}
            takesRewardsOutdoors={profile.onboarding?.takesRewardsOutdoors}
            householdPets={profile.onboarding?.householdPets}
          />
```

Replace with:

```tsx
        ) : profile ? (
          isPuppyMode(ageWeeks) ? (
            <PuppyDayCard
              trainingWeek={trainingWeek}
              ageWeeks={ageWeeks}
              breed={profile.breed}
              dogName={dogName}
              dogId={profile.id ?? ''}
              goals={profile.onboarding?.goals}
              environment={profile.onboarding?.environment}
              rewardPreference={profile.onboarding?.rewardPreference}
              takesRewardsOutdoors={profile.onboarding?.takesRewardsOutdoors}
              householdPets={profile.onboarding?.householdPets}
            />
          ) : (
            <TrainingCard
              trainingWeek={trainingWeek}
              ageWeeks={ageWeeks}
              breed={profile.breed}
              dogName={dogName}
              dogId={profile.id ?? ''}
              goals={profile.onboarding?.goals}
              environment={profile.onboarding?.environment}
              rewardPreference={profile.onboarding?.rewardPreference}
              takesRewardsOutdoors={profile.onboarding?.takesRewardsOutdoors}
              householdPets={profile.onboarding?.householdPets}
            />
          )
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(puppy-zone): swap TrainingCard for PuppyDayCard when isPuppyMode"
```

---

## Task 9: Calendar — zone dots for puppy days

**Files:**
- Modify: `src/app/calendar/page.tsx`

- [ ] **Step 1: Add imports**

At the top of `src/app/calendar/page.tsx`, add:

```typescript
import { isPuppyMode } from '@/lib/dog/age'
import type { PuppyZone } from '@/lib/training/puppy-zone'
```

- [ ] **Step 2: Add `zone` prop to `AgendaDay`**

Find the `AgendaDay` function signature. It currently takes `dateStr`, `todayStr`, `dayPlan`, `log`, `onClick`. Add `zone?`:

```typescript
function AgendaDay({
  dateStr,
  todayStr,
  dayPlan,
  log,
  zone,
  onClick,
}: {
  dateStr: string
  todayStr: string
  dayPlan: DayPlan | null
  log: SessionLog | null
  zone?: PuppyZone
  onClick?: () => void
}) {
```

- [ ] **Step 3: Render zone dot in `AgendaDay`**

Inside `AgendaDay`, find the `.trainingDayMeta` div (the block containing `todayPip` and the day name). Add the zone dot immediately after the `{isToday && <span ... todayPip />}` line:

```tsx
            {zone && (
              <span
                aria-label={`Zon: ${zone}`}
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: zone === 'green' ? '#22c55e' : zone === 'yellow' ? '#eab308' : '#ef4444',
                  marginRight: 4,
                  flexShrink: 0,
                }}
              />
            )}
```

- [ ] **Step 4: Add `checkIns` state to `CalendarView`**

In `CalendarView`, add alongside the existing `useState` calls:

```typescript
const [checkIns, setCheckIns] = useState<Record<string, PuppyZone>>({})
```

- [ ] **Step 5: Fetch check-ins in `fetchData`**

`fetchData` is a `useCallback` inside `CalendarView`. `todayStr` is in scope (defined in `CalendarView` body). Modify `fetchData` to:

1. Compute `puppyMode` flag from `ageWeeks` (already computed inside fetchData)
2. Compute the visible date range (`startStr` to `endStr`) — the same range used for the week rendering, computed from `todayStr`
3. Add a conditional check-in fetch to the `Promise.all`

Replace the `Promise.all` inside `fetchData`:

```typescript
      const ageWeeks = Math.max(1, getAgeInWeeks(profile.birthdate))
      const puppyMode = isPuppyMode(ageWeeks)
      const visibleStart = addDays(getMondayOf(todayStr), -14)
      const visibleEnd   = addDays(getMondayOf(todayStr), 34)

      const [logsRes, planRes, checkInRes] = await Promise.all([
        fetch(`/api/logs?dogId=${encodeURIComponent(profile.id ?? '')}`),
        fetch(`/api/training/week?breed=${profile.breed}&week=${trainingWeek}&ageWeeks=${ageWeeks}${goalsParam}${petsParam}${dogIdParam}`),
        puppyMode && profile.id
          ? fetch(`/api/training/checkin?dogId=${encodeURIComponent(profile.id)}&from=${visibleStart}&to=${visibleEnd}`)
          : Promise.resolve(null),
      ])
```

Then after the existing log/plan handling blocks, add:

```typescript
      if (checkInRes?.ok) {
        const body = await checkInRes.json().catch(() => null)
        if (body?.zones) setCheckIns(body.zones as Record<string, PuppyZone>)
      }
```

- [ ] **Step 6: Pass zone prop when rendering `AgendaDay`**

Find the `<AgendaDay` usage in the `weeks.map` render and add the `zone` prop:

```tsx
                      <AgendaDay
                        dateStr={dateStr}
                        todayStr={todayStr}
                        dayPlan={dayPlan}
                        log={logs[dateStr] ?? null}
                        zone={checkIns[dateStr]}
                        onClick={...existing onClick...}
                      />
```

- [ ] **Step 7: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 8: Run all tests**

```bash
npx vitest run --passWithNoTests
```

Expected: all tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/app/calendar/page.tsx
git commit -m "feat(puppy-zone): show zone dots in calendar for puppy mode dogs"
```

---

## Done

At this point the full feature is implemented:

- Puppies (< 26 weeks) see a daily zone picker on the dashboard instead of the weekly schedule
- **Green day** → AI week-plan exercises for today (cached, fast)
- **Yellow day** → 1 calm exercise chosen from recent metrics (deterministic, instant)
- **Red day** → recovery tips only, no training demands
- Calendar shows colored zone dots for past puppy days
- Adult dogs (≥ 26 weeks) are completely unchanged
