# Dags-checkin för ekipaget (Delprojekt B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zon-checkin generaliseras från valpar till alla hundar och utökas med förarens energi och tillgänglig tid. En ren `scaleDayPlan`-funktion skalar om dagens pass (vila / 1 lugn övning / 1 prioriterad övning / oförändrat).

**Architecture:** Migration 022 lägger `handler_energy` + `minutes_available` på `daily_check_ins`. Ren lib `src/lib/training/day-scaler.ts` (TDD) återanvänder `selectYellowExercise`/`buildYellowExercise` från `puppy-zone.ts`. `useTodayExercises` applicerar skalningen så att swaps/nästa-övning/räknare automatiskt jobbar på den skalade listan. Nytt kompakt `DayCheckInCard` renderas i `TrainingCard` för vuxenflödet; valpflödet (`PuppyDayCard`/`ZoneCheckIn`) rörs INTE.

**Tech Stack:** vitest, Next.js App Router (läs `node_modules/next/dist/docs/` innan route-ändringar — repots version har breaking changes), Supabase, zod.

**Spec:** `docs/superpowers/specs/2026-06-11-adaptive-intelligence-design.md` (avsnitt "Delprojekt B").

**Bakåtkompatibilitet som MÅSTE hållas:** `use-puppy-day.ts` läser `d.zone` från `GET /api/training/checkin?date=` och POST:ar `{ date, zone }`; `calendar/page.tsx` använder `?from=&to=`-varianten. Båda ska fungera oförändrade.

---

### Task 1: Migration 022 + databastyper

**Files:**
- Create: `supabase/migrations/022_day_checkin_handler.sql`
- Modify: `src/types/database.ts` (blocket `daily_check_ins`, ca rad 156)

- [ ] **Step 1: Skriv migrationen**

```sql
alter table daily_check_ins
  add column if not exists handler_energy text check (handler_energy in ('low', 'ok', 'high')),
  add column if not exists minutes_available int check (minutes_available between 0 and 120);
```

- [ ] **Step 2: Uppdatera `daily_check_ins`-typerna i `src/types/database.ts`**

```ts
      daily_check_ins: {
        Row: {
          dog_id: string
          date: string
          zone: string
          handler_energy: string | null
          minutes_available: number | null
        }
        Insert: {
          dog_id: string
          date: string
          zone: string
          handler_energy?: string | null
          minutes_available?: number | null
        }
        Update: {
          dog_id?: string
          date?: string
          zone?: string
          handler_energy?: string | null
          minutes_available?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_check_ins_dog_id_fkey"
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
git add supabase/migrations/022_day_checkin_handler.sql src/types/database.ts
git commit -m "feat(day-checkin): add handler_energy and minutes_available to daily_check_ins"
```

**OBS till ägaren (skriv i rapporten, kör inte):** migration 022 måste appliceras i Supabase innan de nya fälten kan sparas.

---

### Task 2: Ren lib `day-scaler.ts` (TDD)

**Files:**
- Create: `src/lib/training/day-scaler.ts`
- Test: `src/lib/training/day-scaler.test.ts`

- [ ] **Step 1: Skriv de failande testerna**

```ts
import { describe, it, expect } from 'vitest'
import { scaleDayPlan, type DayCheckInState } from './day-scaler'
import type { Exercise } from '@/types'

const EXERCISES: Exercise[] = [
  { id: 'inkallning', label: 'Inkallning', desc: '5 reps', reps: 5 },
  { id: 'koppel', label: 'Koppel', desc: '5 reps', reps: 5 },
  { id: 'plats', label: 'Plats', desc: '3 reps', reps: 3 },
]

function checkIn(overrides: Partial<DayCheckInState> = {}): DayCheckInState {
  return { zone: 'green', handlerEnergy: null, minutesAvailable: null, ...overrides }
}

describe('scaleDayPlan', () => {
  it('returns full mode untouched without a check-in', () => {
    const result = scaleDayPlan(EXERCISES, null)
    expect(result.mode).toBe('full')
    expect(result.exercises).toEqual(EXERCISES)
    expect(result.note).toBeNull()
  })

  it('returns full mode for empty exercise lists', () => {
    const result = scaleDayPlan([], checkIn({ zone: 'red' }))
    expect(result.mode).toBe('full')
    expect(result.exercises).toEqual([])
  })

  it('red zone becomes a rest day', () => {
    const result = scaleDayPlan(EXERCISES, checkIn({ zone: 'red' }))
    expect(result.mode).toBe('rest')
    expect(result.exercises).toEqual([])
    expect(result.note).toContain('vila')
  })

  it('yellow zone becomes one calm exercise picked from metrics', () => {
    const result = scaleDayPlan(EXERCISES, checkIn({ zone: 'yellow' }), {
      metrics: { plats: { success_count: 5, fail_count: 1 } },
    })
    expect(result.mode).toBe('calm')
    expect(result.exercises).toHaveLength(1)
    expect(result.exercises[0].id).toBe('plats')
  })

  it('yellow zone falls back to nosework without metrics', () => {
    const result = scaleDayPlan(EXERCISES, checkIn({ zone: 'yellow' }))
    expect(result.exercises[0].id).toBe('nosework')
  })

  it('low handler energy trims to one exercise, preferring priority ids', () => {
    const result = scaleDayPlan(EXERCISES, checkIn({ handlerEnergy: 'low' }), {
      priorityIds: ['koppel'],
    })
    expect(result.mode).toBe('trimmed')
    expect(result.exercises).toEqual([EXERCISES[1]])
  })

  it('under 10 minutes trims to the first exercise when no priority matches', () => {
    const result = scaleDayPlan(EXERCISES, checkIn({ minutesAvailable: 5 }), {
      priorityIds: ['apportering'],
    })
    expect(result.mode).toBe('trimmed')
    expect(result.exercises).toEqual([EXERCISES[0]])
  })

  it('10 minutes or more with ok energy stays full', () => {
    const result = scaleDayPlan(EXERCISES, checkIn({ handlerEnergy: 'ok', minutesAvailable: 10 }))
    expect(result.mode).toBe('full')
    expect(result.exercises).toEqual(EXERCISES)
  })
})
```

- [ ] **Step 2: Kör och verifiera FAIL**

Run: `npx vitest run src/lib/training/day-scaler.test.ts`
Expected: FAIL — modulen finns inte.

- [ ] **Step 3: Implementera `src/lib/training/day-scaler.ts`**

```ts
import type { Exercise } from '@/types'
import {
  buildYellowExercise,
  selectYellowExercise,
  type PuppyZone,
} from '@/lib/training/puppy-zone'

export type HandlerEnergy = 'low' | 'ok' | 'high'

export interface DayCheckInState {
  zone: PuppyZone | null
  handlerEnergy: HandlerEnergy | null
  minutesAvailable: number | null
}

export type DayScaleMode = 'full' | 'trimmed' | 'calm' | 'rest'

export interface ScaledDay {
  mode: DayScaleMode
  exercises: Exercise[]
  note: string | null
}

const SHORT_SESSION_MINUTES = 10

export function scaleDayPlan(
  exercises: Exercise[],
  checkIn: DayCheckInState | null,
  options: {
    metrics?: Record<string, { success_count: number; fail_count: number }>
    priorityIds?: string[]
  } = {},
): ScaledDay {
  if (!checkIn || exercises.length === 0) {
    return { mode: 'full', exercises, note: null }
  }

  if (checkIn.zone === 'red') {
    return {
      mode: 'rest',
      exercises: [],
      note: 'Röd dag — vila, sniffpromenad och återhämtning är dagens träning.',
    }
  }
  if (checkIn.zone === 'yellow') {
    return {
      mode: 'calm',
      exercises: [buildYellowExercise(selectYellowExercise(options.metrics ?? {}))],
      note: 'Gul dag — kort och lugnt, en enkel vinst räcker.',
    }
  }

  const shortOnTime =
    typeof checkIn.minutesAvailable === 'number' &&
    checkIn.minutesAvailable < SHORT_SESSION_MINUTES
  if (checkIn.handlerEnergy === 'low' || shortOnTime) {
    const prioritized = (options.priorityIds ?? [])
      .map((id) => exercises.find((e) => e.id === id))
      .find((e): e is Exercise => Boolean(e))
    return {
      mode: 'trimmed',
      exercises: [prioritized ?? exercises[0]],
      note: 'Ont om tid eller energi — en fokuserad övning slår tre stressade.',
    }
  }

  return { mode: 'full', exercises, note: null }
}
```

- [ ] **Step 4: Kör och verifiera PASS, kör hela sviten**

Run: `npx vitest run src/lib/training/day-scaler.test.ts` → 8 PASS.
Run: `npm run test` → allt grönt.

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/day-scaler.ts src/lib/training/day-scaler.test.ts
git commit -m "feat(day-checkin): pure scaleDayPlan with rest, calm and trimmed modes"
```

---

### Task 3: Persistens + route tar emot de nya fälten

**Files:**
- Modify: `src/lib/supabase/daily-check-ins.ts`
- Modify: `src/app/api/training/checkin/route.ts`

- [ ] **Step 1: Utöka `daily-check-ins.ts`**

`getCheckIns` (from/to-varianten) lämnas helt orörd. `getCheckIn` och `saveCheckIn`
ersätts med:

```ts
export interface DayCheckInRow {
  zone: PuppyZone
  handler_energy: 'low' | 'ok' | 'high' | null
  minutes_available: number | null
}

export async function getCheckIn(dogId: string, date: string): Promise<DayCheckInRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('daily_check_ins')
    .select('zone, handler_energy, minutes_available')
    .eq('dog_id', dogId)
    .eq('date', date)
    .maybeSingle()
  if (error || !data) return null
  return data as DayCheckInRow
}

export async function saveCheckIn(
  dogId: string,
  date: string,
  checkIn: {
    zone: PuppyZone
    handler_energy?: 'low' | 'ok' | 'high' | null
    minutes_available?: number | null
  },
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('daily_check_ins')
    .upsert({ dog_id: dogId, date, ...checkIn }, { onConflict: 'dog_id,date' })
  if (error) throw new Error(`Check-in upsert failed: ${error.message}`)
}
```

- [ ] **Step 2: Uppdatera routen**

Läs först relevant route-handler-doc i `node_modules/next/dist/docs/`. Hela
`src/app/api/training/checkin/route.ts` blir:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { getCheckIn, getCheckIns, saveCheckIn } from '@/lib/supabase/daily-check-ins'
import type { PuppyZone } from '@/lib/training/puppy-zone'
import type { HandlerEnergy } from '@/lib/training/day-scaler'

const VALID_ZONES: PuppyZone[] = ['green', 'yellow', 'red']
const VALID_ENERGY: HandlerEnergy[] = ['low', 'ok', 'high']

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
    const checkIn = await getCheckIn(dog.id, date)
    return NextResponse.json({
      zone: checkIn?.zone ?? null,
      handlerEnergy: checkIn?.handler_energy ?? null,
      minutesAvailable: checkIn?.minutes_available ?? null,
    })
  })
}

export async function POST(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const { date, zone, handlerEnergy, minutesAvailable } = (await req.json()) as {
      date?: string
      zone?: string
      handlerEnergy?: string
      minutesAvailable?: number
    }
    if (!date || !zone || !VALID_ZONES.includes(zone as PuppyZone)) {
      return NextResponse.json({ error: 'date and valid zone required' }, { status: 400 })
    }
    if (Number.isNaN(Date.parse(date))) {
      return NextResponse.json({ error: 'invalid date format' }, { status: 400 })
    }
    if (handlerEnergy !== undefined && !VALID_ENERGY.includes(handlerEnergy as HandlerEnergy)) {
      return NextResponse.json({ error: 'invalid handlerEnergy' }, { status: 400 })
    }
    if (
      minutesAvailable !== undefined &&
      (!Number.isInteger(minutesAvailable) || minutesAvailable < 0 || minutesAvailable > 120)
    ) {
      return NextResponse.json({ error: 'invalid minutesAvailable' }, { status: 400 })
    }
    await saveCheckIn(dog.id, date, {
      zone: zone as PuppyZone,
      handler_energy: (handlerEnergy as HandlerEnergy | undefined) ?? null,
      minutes_available: minutesAvailable ?? null,
    })
    return NextResponse.json({ ok: true })
  })
}
```

OBS bakåtkompatibilitet: `withAuthAndDog` läser request-body via `safeJsonBody` för
`dogId` — verifiera att POST-anropet i `use-puppy-day.ts` (`{ dogId, date, zone }`)
fortsatt fungerar. GET-svaret behåller nyckeln `zone`, så `use-puppy-day` påverkas inte.

- [ ] **Step 3: Verifiera + commit**

Run: `npx tsc --noEmit && npm run test`
Expected: grönt. (PuppyDayCards `saveZone` POST:ar utan de nya fälten → de blir `null`, vilket är giltigt.)

```bash
git add src/lib/supabase/daily-check-ins.ts src/app/api/training/checkin/route.ts
git commit -m "feat(day-checkin): checkin API accepts handler energy and available minutes"
```

---

### Task 4: Zod-schema, klienthook och `DayCheckInCard`

**Files:**
- Modify: `src/types/api/schemas.ts` (lägg sist)
- Create: `src/components/TrainingCard/use-day-checkin.ts`
- Create: `src/components/TrainingCard/DayCheckInCard.tsx`
- Create: `src/components/TrainingCard/DayCheckInCard.module.css`

- [ ] **Step 1: Schema**

```ts
export const DayCheckInResponseSchema = z.object({
  zone: z.enum(['green', 'yellow', 'red']).nullable(),
  handlerEnergy: z.enum(['low', 'ok', 'high']).nullable(),
  minutesAvailable: z.number().nullable(),
})
```

- [ ] **Step 2: Hook `use-day-checkin.ts`** (mönster: `use-dog-state.ts` i samma katalog)

```ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/fetch'
import { DayCheckInResponseSchema } from '@/types/api/schemas'
import type { DayCheckInState } from '@/lib/training/day-scaler'

interface UseDayCheckInResult {
  checkIn: DayCheckInState | null
  loaded: boolean
  save: (value: DayCheckInState) => void
}

export function useDayCheckIn(dogId: string, date: string): UseDayCheckInResult {
  const [checkIn, setCheckIn] = useState<DayCheckInState | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!dogId) return
    let cancelled = false
    apiFetch(`/api/training/checkin?dogId=${encodeURIComponent(dogId)}&date=${date}`, DayCheckInResponseSchema)
      .then((res) => {
        if (cancelled) return
        setCheckIn(res.zone ? res : null)
      })
      .catch(() => {
        // Check-in är frivilligt — utan svar gäller planen som den är.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [dogId, date])

  const save = useCallback(
    (value: DayCheckInState) => {
      setCheckIn(value)
      fetch('/api/training/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dogId,
          date,
          zone: value.zone,
          handlerEnergy: value.handlerEnergy ?? undefined,
          minutesAvailable: value.minutesAvailable ?? undefined,
        }),
      }).catch(console.error)
    },
    [dogId, date],
  )

  return { checkIn, loaded, save }
}
```

- [ ] **Step 3: Komponent `DayCheckInCard.tsx`**

```tsx
'use client'

import { useState } from 'react'
import styles from './DayCheckInCard.module.css'
import type { DayCheckInState, HandlerEnergy } from '@/lib/training/day-scaler'
import type { PuppyZone } from '@/lib/training/puppy-zone'

interface Props {
  dogName: string
  onSave: (value: DayCheckInState) => void
  onDismiss: () => void
}

const ZONE_OPTIONS: Array<{ id: PuppyZone; label: string }> = [
  { id: 'green', label: 'Pigg & fokuserad' },
  { id: 'yellow', label: 'Lite trött/stressad' },
  { id: 'red', label: 'Behöver vila' },
]

const ENERGY_OPTIONS: Array<{ id: HandlerEnergy; label: string }> = [
  { id: 'low', label: 'Låg' },
  { id: 'ok', label: 'Ok' },
  { id: 'high', label: 'Hög' },
]

const TIME_OPTIONS: Array<{ minutes: number; label: string }> = [
  { minutes: 5, label: '5 min' },
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30+ min' },
]

export default function DayCheckInCard({ dogName, onSave, onDismiss }: Props) {
  const [zone, setZone] = useState<PuppyZone | null>(null)
  const [energy, setEnergy] = useState<HandlerEnergy | null>(null)
  const [minutes, setMinutes] = useState<number | null>(null)

  return (
    <div className={styles.card}>
      <p className={styles.question}>Hur är {dogName}s form idag?</p>
      <div className={styles.row}>
        {ZONE_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`${styles.chip} ${zone === o.id ? styles.chipActive : ''}`}
            onClick={() => setZone(o.id)}
            aria-pressed={zone === o.id}
          >
            {o.label}
          </button>
        ))}
      </div>

      <p className={styles.question}>Din egen energi?</p>
      <div className={styles.row}>
        {ENERGY_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`${styles.chip} ${energy === o.id ? styles.chipActive : ''}`}
            onClick={() => setEnergy(o.id)}
            aria-pressed={energy === o.id}
          >
            {o.label}
          </button>
        ))}
      </div>

      <p className={styles.question}>Hur mycket tid har ni?</p>
      <div className={styles.row}>
        {TIME_OPTIONS.map((o) => (
          <button
            key={o.minutes}
            type="button"
            className={`${styles.chip} ${minutes === o.minutes ? styles.chipActive : ''}`}
            onClick={() => setMinutes(o.minutes)}
            aria-pressed={minutes === o.minutes}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.saveBtn}
          disabled={!zone}
          onClick={() => zone && onSave({ zone, handlerEnergy: energy, minutesAvailable: minutes })}
        >
          Starta dagen
        </button>
        <button type="button" className={styles.skipBtn} onClick={onDismiss}>
          Hoppa över
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: CSS `DayCheckInCard.module.css`**

Titta på `WeeklyFocusPicker`/`PreSessionChecklist`-stilarna i samma katalog och
återanvänd samma tokens. Utgångspunkt:

```css
.card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
}

.question {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
}

.row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: transparent;
  color: inherit;
  font-size: var(--text-sm);
  cursor: pointer;
}

.chipActive {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.saveBtn {
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.saveBtn:disabled {
  opacity: 0.5;
  cursor: default;
}

.skipBtn {
  background: none;
  border: none;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  font-size: var(--text-sm);
}
```

Justera tokens/färger så de matchar det de befintliga korten i katalogen faktiskt
använder (kontrollera t.ex. att `--color-primary` och `--text-sm` förekommer i
befintliga moduler; annars byt till de tokens som används där).

- [ ] **Step 5: Verifiera + commit**

Run: `npx tsc --noEmit`
Expected: inga nya fel (komponenten är ännu inte inkopplad).

```bash
git add src/types/api/schemas.ts src/components/TrainingCard/use-day-checkin.ts src/components/TrainingCard/DayCheckInCard.tsx src/components/TrainingCard/DayCheckInCard.module.css
git commit -m "feat(day-checkin): check-in hook and card component"
```

---

### Task 5: Skalning i `useTodayExercises` + inkoppling i `TrainingCard`

**Files:**
- Modify: `src/components/TrainingCard/use-today-exercises.ts`
- Modify: `src/components/TrainingCard/TrainingCard.tsx`
- Modify: `src/components/TrainingCard/TrainingCard.module.css`

- [ ] **Step 1: `useTodayExercises` tar emot check-in och skalar**

Args-interfacet utökas:

```ts
interface UseTodayExercisesArgs {
  weekPlan: WeekPlan | null
  progress: Record<string, number>
  focusAreas: WeeklyFocusArea[]
  simpleFocus: boolean
  dayCheckIn: DayCheckInState | null
  metrics: Record<string, DailyExerciseMetrics>
  priorityIds: string[]
}
```

(`import { scaleDayPlan, type DayCheckInState, type DayScaleMode } from '@/lib/training/day-scaler'`
och `import type { DailyExerciseMetrics } ...` läggs till.)

Direkt efter `const todayPlan = weekPlan?.days.find(...)` (döp om den lokala variabeln
till `rawTodayPlan`) läggs:

```ts
  const scaled = useMemo(
    () =>
      scaleDayPlan(rawTodayPlan?.exercises ?? [], rawTodayPlan?.rest ? null : dayCheckIn, {
        metrics,
        priorityIds,
      }),
    [rawTodayPlan, dayCheckIn, metrics, priorityIds],
  )

  const todayPlan: DayPlan | undefined = useMemo(() => {
    if (!rawTodayPlan) return undefined
    if (scaled.mode === 'rest') return { ...rawTodayPlan, rest: true, exercises: [] }
    if (scaled.mode === 'full') return rawTodayPlan
    return { ...rawTodayPlan, exercises: scaled.exercises }
  }, [rawTodayPlan, scaled])
```

Resten av hooken är oförändrad (allt nedströms — swaps, next, counts — läser redan
`todayPlan`). Swap-reset-effekten (`useEffect(... , [todayPlan])`) fortsätter fungera.

Resultat-interfacet utökas med:

```ts
  scaleMode: DayScaleMode
  scaleNote: string | null
```

och returneras: `scaleMode: scaled.mode, scaleNote: scaled.note`.

- [ ] **Step 2: Koppla in i `TrainingCard.tsx`**

- Imports:
  ```ts
  import DayCheckInCard from './DayCheckInCard'
  import { useDayCheckIn } from './use-day-checkin'
  ```
- Efter `useDogState`-raden:
  ```ts
  const { checkIn, loaded: checkInLoaded, save: saveDayCheckIn } = useDayCheckIn(dogId, todayDate)
  const [checkInDismissed, setCheckInDismissed] = useState(false)
  ```
- `useTodayExercises`-anropet får de nya argumenten:
  ```ts
  } = useTodayExercises({
    weekPlan,
    progress,
    focusAreas,
    simpleFocus,
    dayCheckIn: checkIn,
    metrics,
    priorityIds: priorityExerciseIds,
  })
  ```
  och destrukturera även `scaleMode, scaleNote`.
- Rendera kortet direkt efter `<PreSessionChecklist ... />`-blocket:
  ```tsx
        {!loading && checkInLoaded && !checkIn && !checkInDismissed && !todayPlan?.rest && (
          <DayCheckInCard
            dogName={props.dogName}
            onSave={saveDayCheckIn}
            onDismiss={() => setCheckInDismissed(true)}
          />
        )}
  ```
- Rendera noten ovanför övningslistan (före `{!loading && todayExercises.length > 0 && (`-blocket med `styles.exercises`):
  ```tsx
        {!loading && scaleNote && (
          <p className={styles.scaleNote}>{scaleNote}</p>
        )}
  ```
- När dagen är skalad ska swap inte erbjudas (indexen pekar på den skalade listan):
  i `ExerciseRow`-anropet, byt `onSwap={swapCandidates.length > 0 ? ... }` till
  `onSwap={scaleMode === 'full' && swapCandidates.length > 0 ? () => handleSwap(originalIdx) : undefined}`.

- [ ] **Step 3: CSS-not i `TrainingCard.module.css`**

```css
.scaleNote {
  margin: 0;
  font-size: var(--text-sm);
  opacity: 0.85;
}
```

(Matcha tokens mot befintliga regler i filen.)

- [ ] **Step 4: Full verifiering**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: allt grönt. `PuppyDayCard` använder INTE `useTodayExercises`, så valpflödet
är opåverkat — verifiera med `grep -rn "useTodayExercises" src/` (ska bara träffa
TrainingCard + hooken själv).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(day-checkin): scale today's session from dog zone, handler energy and time"
```

---

## Slutkriterier

- `npm run test` och `npm run build` gröna; valp- och kalenderflödena oförändrade.
- Vuxenflödet visar check-in-kortet en gång per dag (frivilligt, kan hoppas över).
- Röd dag → vilodag; gul dag → 1 lugn övning; låg energi eller < 10 min → 1 prioriterad övning; annars oförändrad plan.
- Skalningen sker i `useTodayExercises` så nästa-övning, räknare och loggning automatiskt följer den skalade listan.
