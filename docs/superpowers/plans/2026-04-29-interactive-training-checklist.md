# Interactive Training Checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain-text weekly plan with an AI-generated structured checklist where each exercise has clickable rep dots — progress persists in Supabase. Fix chat to not dump the full schedule in responses.

**Architecture:** New `/api/training/week` endpoint generates a `WeekPlan` (structured JSON) via Groq with JSON mode, cached in `training_cache`. New `/api/training/progress` endpoint reads/writes `daily_progress` Supabase table. `TrainingCard` is rewritten as a folder of sub-components that fetch their own data. Chat system prompt is tightened to answer questions concisely.

**Tech Stack:** Next.js 15 App Router, Groq (llama-3.3-70b), Supabase, CSS Modules, TypeScript 5, Vitest

---

## File Map

**New files:**
- `src/types/index.ts` — extend with `WeekPlan`, `DayPlan`, `Exercise`
- `src/lib/supabase/daily-progress.ts` — get/upsert progress per exercise+date
- `src/lib/ai/week-plan.ts` — generate + parse `WeekPlan` JSON via Groq
- `src/lib/ai/week-plan.test.ts` — unit tests for JSON parsing
- `src/app/api/training/week/route.ts` — GET endpoint, returns `WeekPlan`
- `src/app/api/training/progress/route.ts` — GET + PATCH endpoints
- `src/components/TrainingCard/TrainingCard.tsx` — replaces flat file, fetches internally
- `src/components/TrainingCard/TrainingCard.module.css`
- `src/components/TrainingCard/ExerciseRow.tsx` — single exercise with rep dots
- `src/components/TrainingCard/ExerciseRow.module.css`
- `src/components/TrainingCard/WeekView.tsx` — full-week overlay
- `src/components/TrainingCard/WeekView.module.css`

**Modified files:**
- `src/lib/supabase/training-cache.ts` — add `getCachedWeekPlan` / `setCachedWeekPlan`
- `src/lib/ai/rag.ts` — tighten chat system prompt (no schedule dump)
- `src/app/dashboard/page.tsx` — update TrainingCard props, remove training fetch

**Deleted files:**
- `src/components/TrainingCard.tsx` (flat) → replaced by folder
- `src/components/TrainingCard.module.css` (flat) → replaced by folder

---

### Task 1: Add WeekPlan types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add types**

Open `src/types/index.ts` and append after the existing exports:

```typescript
export interface Exercise {
  id: string      // slug, e.g. "inkallning"
  label: string   // display name, e.g. "Inkallning"
  desc: string    // short instruction, max 8 words
  reps: number    // 1–5
}

export interface DayPlan {
  day: string          // "Måndag" | "Tisdag" | "Onsdag" | "Torsdag" | "Fredag" | "Lördag" | "Söndag"
  rest?: boolean
  exercises?: Exercise[]
}

export interface WeekPlan {
  days: DayPlan[]      // always exactly 7 items
}
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add WeekPlan, DayPlan, Exercise types"
```

---

### Task 2: Supabase daily_progress table

**Files:**
- Modify: `docs/supabase-schema.sql` (documentation only)

- [ ] **Step 1: Run SQL in Supabase**

Open your Supabase project → SQL Editor and run:

```sql
CREATE TABLE IF NOT EXISTS daily_progress (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed       text NOT NULL,
  date        date NOT NULL,
  exercise_id text NOT NULL,
  reps_done   int  NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(breed, date, exercise_id)
);

CREATE INDEX IF NOT EXISTS daily_progress_lookup_idx
  ON daily_progress (breed, date);
```

- [ ] **Step 2: Verify**

In Supabase Table Editor confirm `daily_progress` appears with columns: `id`, `breed`, `date`, `exercise_id`, `reps_done`, `created_at`.

- [ ] **Step 3: Document the schema**

Append to `docs/supabase-schema.sql`:

```sql
-- Daily exercise progress — persists rep counts per exercise per day
CREATE TABLE IF NOT EXISTS daily_progress (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed       text NOT NULL,
  date        date NOT NULL,
  exercise_id text NOT NULL,
  reps_done   int  NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(breed, date, exercise_id)
);

CREATE INDEX IF NOT EXISTS daily_progress_lookup_idx
  ON daily_progress (breed, date);
```

- [ ] **Step 4: Commit**

```bash
git add docs/supabase-schema.sql
git commit -m "feat: add daily_progress Supabase table"
```

---

### Task 3: daily-progress Supabase lib

**Files:**
- Create: `src/lib/supabase/daily-progress.ts`

- [ ] **Step 1: Implement**

```typescript
// src/lib/supabase/daily-progress.ts
import { supabaseAdmin } from './client'
import type { Breed } from '@/types'

export async function getProgress(
  breed: Breed,
  date: string
): Promise<Record<string, number>> {
  const { data, error } = await supabaseAdmin
    .from('daily_progress')
    .select('exercise_id, reps_done')
    .eq('breed', breed)
    .eq('date', date)

  if (error) throw new Error(`Progress fetch failed: ${error.message}`)
  return Object.fromEntries((data ?? []).map((r) => [r.exercise_id as string, r.reps_done as number]))
}

export async function upsertProgress(
  breed: Breed,
  date: string,
  exerciseId: string,
  repsDone: number
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('daily_progress')
    .upsert(
      { breed, date, exercise_id: exerciseId, reps_done: repsDone },
      { onConflict: 'breed,date,exercise_id' }
    )

  if (error) throw new Error(`Progress upsert failed: ${error.message}`)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase/daily-progress.ts
git commit -m "feat: add daily-progress Supabase lib (get/upsert)"
```

---

### Task 4: week-plan AI module (with tests)

**Files:**
- Create: `src/lib/ai/week-plan.ts`
- Create: `src/lib/ai/week-plan.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/ai/week-plan.test.ts
import { describe, it, expect } from 'vitest'
import { parseWeekPlan, buildFallbackPlan } from './week-plan'

describe('parseWeekPlan', () => {
  it('parses valid JSON with 7 days', () => {
    const json = JSON.stringify({
      days: [
        { day: 'Måndag', exercises: [{ id: 'inkallning', label: 'Inkallning', desc: 'Kalla med glad röst', reps: 3 }] },
        { day: 'Tisdag', rest: true },
        { day: 'Onsdag', exercises: [{ id: 'sitt', label: 'Sitt', desc: 'Håll godis över nosen', reps: 5 }] },
        { day: 'Torsdag', exercises: [{ id: 'ligg', label: 'Ligg', desc: 'Sjunk ner från sitt', reps: 3 }] },
        { day: 'Fredag', rest: true },
        { day: 'Lördag', exercises: [{ id: 'namn', label: 'Namnträning', desc: 'Säg namn, belöna blick', reps: 5 }] },
        { day: 'Söndag', exercises: [{ id: 'inkallning', label: 'Inkallning', desc: 'Kalla med glad röst', reps: 3 }] },
      ],
    })
    const plan = parseWeekPlan(json)
    expect(plan).not.toBeNull()
    expect(plan!.days).toHaveLength(7)
    expect(plan!.days[0].day).toBe('Måndag')
    expect(plan!.days[0].exercises![0].reps).toBe(3)
  })

  it('returns null for invalid JSON', () => {
    expect(parseWeekPlan('not json')).toBeNull()
  })

  it('returns null when days array has wrong length', () => {
    const json = JSON.stringify({ days: [{ day: 'Måndag' }] })
    expect(parseWeekPlan(json)).toBeNull()
  })

  it('returns null when days key is missing', () => {
    expect(parseWeekPlan(JSON.stringify({}))).toBeNull()
  })
})

describe('buildFallbackPlan', () => {
  it('always returns exactly 7 days', () => {
    const plan = buildFallbackPlan()
    expect(plan.days).toHaveLength(7)
  })

  it('all days have a day name', () => {
    const plan = buildFallbackPlan()
    plan.days.forEach((d) => expect(typeof d.day).toBe('string'))
  })
})
```

- [ ] **Step 2: Run — verify fails**

```bash
npx vitest run src/lib/ai/week-plan.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```typescript
// src/lib/ai/week-plan.ts
import { groq, GROQ_MODEL } from './client'
import { embedText } from './embed'
import { searchBreedChunks } from '@/lib/supabase/breed-chunks'
import { formatBreedProfile, formatCurrentPhase } from './breed-profiles'
import type { Breed, WeekPlan } from '@/types'

export function parseWeekPlan(raw: string): WeekPlan | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!Array.isArray(parsed.days) || parsed.days.length !== 7) return null
    return parsed as unknown as WeekPlan
  } catch {
    return null
  }
}

export function buildFallbackPlan(): WeekPlan {
  return {
    days: [
      { day: 'Måndag', exercises: [{ id: 'inkallning', label: 'Inkallning', desc: 'Kalla med glad röst', reps: 3 }, { id: 'sitt', label: 'Sitt', desc: 'Håll godis över nosen', reps: 5 }] },
      { day: 'Tisdag', rest: true },
      { day: 'Onsdag', exercises: [{ id: 'ligg', label: 'Ligg', desc: 'Sjunk ner från sitt', reps: 3 }, { id: 'namn', label: 'Namnträning', desc: 'Säg namn, belöna blick', reps: 5 }] },
      { day: 'Torsdag', exercises: [{ id: 'inkallning', label: 'Inkallning', desc: 'Kalla med glad röst', reps: 3 }] },
      { day: 'Fredag', rest: true },
      { day: 'Lördag', exercises: [{ id: 'sitt', label: 'Sitt', desc: 'Håll godis över nosen', reps: 5 }, { id: 'ligg', label: 'Ligg', desc: 'Sjunk ner från sitt', reps: 3 }] },
      { day: 'Söndag', exercises: [{ id: 'inkallning', label: 'Inkallning', desc: 'Kalla med glad röst', reps: 3 }] },
    ],
  }
}

export async function generateWeekPlan(breed: Breed, weekNumber: number): Promise<WeekPlan> {
  let chunks: import('@/types').ChunkMatch[] = []
  try {
    const embedding = await embedText(`träning vecka ${weekNumber} ${breed}`)
    chunks = await searchBreedChunks(embedding, breed)
  } catch {
    // Continue without RAG chunks if embedding fails
  }

  const documentContext = chunks.length > 0
    ? chunks.map((c) => `${c.content}\n[Källa: ${c.source}]`).join('\n\n')
    : ''

  const systemPrompt = `Du är DogVantage träningsassistent för rasen ${breed}. Returnera ett veckoschema som giltig JSON.

${formatBreedProfile(breed)}
${formatCurrentPhase(weekNumber)}
${documentContext ? `\n=== KÄLLDOKUMENT ===\n${documentContext}\n` : ''}
Returnera ENBART detta JSON-schema (inga förklaringar, inga kommentarer):
{
  "days": [
    { "day": "Måndag", "rest": false, "exercises": [
      { "id": "inkallning", "label": "Inkallning", "desc": "Kalla med glad röst", "reps": 3 }
    ]},
    { "day": "Tisdag", "rest": true }
  ]
}

Regler:
- Exakt 7 dagar i ordning: Måndag, Tisdag, Onsdag, Torsdag, Fredag, Lördag, Söndag
- Träningsdagar: 2–3 exercises, reps 1–5
- Vilodagar: rest: true, utelämna exercises
- Minst 1 och max 2 vilodagar per vecka
- id: lowercase, inga mellanslag, inga specialtecken (t.ex. "inkallning", "apportering")
- desc: max 8 ord på svenska
- Anpassa övningarna till hundens vecka ${weekNumber} och rasens egenskaper`

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Veckoschema JSON för ${breed}, vecka ${weekNumber}` },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0].message.content ?? '{}'
  return parseWeekPlan(raw) ?? buildFallbackPlan()
}
```

- [ ] **Step 4: Run — verify passes**

```bash
npx vitest run src/lib/ai/week-plan.test.ts
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/week-plan.ts src/lib/ai/week-plan.test.ts
git commit -m "feat: add week-plan AI module with JSON parsing and tests"
```

---

### Task 5: Extend training-cache for week plans

**Files:**
- Modify: `src/lib/supabase/training-cache.ts`

- [ ] **Step 1: Add two new exported functions**

Open `src/lib/supabase/training-cache.ts` and append after the existing functions:

```typescript
import type { WeekPlan } from '@/types'

// Week plan cache uses breed key prefixed with "weekplan_" to avoid
// collisions with the existing text-based training cache entries.
export async function getCachedWeekPlan(
  breed: Breed,
  weekNumber: number
): Promise<WeekPlan | null> {
  const { data, error } = await supabaseAdmin
    .from('training_cache')
    .select('content')
    .eq('breed', `weekplan_${breed}`)
    .eq('week_number', weekNumber)
    .single()

  if (error || !data) return null
  try {
    return JSON.parse(data.content) as WeekPlan
  } catch {
    return null
  }
}

export async function setCachedWeekPlan(
  breed: Breed,
  weekNumber: number,
  plan: WeekPlan
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('training_cache')
    .upsert({
      breed: `weekplan_${breed}`,
      week_number: weekNumber,
      content: JSON.stringify(plan),
      source: 'week_plan',
    })

  if (error) throw new Error(`Week plan cache write failed: ${error.message}`)
}
```

The `WeekPlan` import should be added to the existing import line at the top:

```typescript
import type { TrainingResult, Breed, WeekPlan } from '@/types'
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/training-cache.ts
git commit -m "feat: extend training-cache with week plan get/set"
```

---

### Task 6: /api/training/week endpoint

**Files:**
- Create: `src/app/api/training/week/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/training/week/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateWeekPlan } from '@/lib/ai/week-plan'
import { getCachedWeekPlan, setCachedWeekPlan } from '@/lib/supabase/training-cache'
import type { Breed } from '@/types'

export async function GET(req: NextRequest) {
  const breed = req.nextUrl.searchParams.get('breed') as Breed | null
  const weekStr = req.nextUrl.searchParams.get('week')
  const weekNumber = weekStr ? Number(weekStr) : NaN

  if (!breed || isNaN(weekNumber)) {
    return NextResponse.json({ error: 'breed and week required' }, { status: 400 })
  }

  const cached = await getCachedWeekPlan(breed, weekNumber)
  if (cached) return NextResponse.json(cached)

  const plan = await generateWeekPlan(breed, weekNumber)
  await setCachedWeekPlan(breed, weekNumber, plan).catch(() => {})

  return NextResponse.json(plan)
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Smoke test the endpoint**

Start the dev server (`npm run dev`) and run in another terminal:

```bash
curl "http://localhost:3000/api/training/week?breed=braque_francais&week=12"
```

Expected: JSON with `{ "days": [...] }` containing 7 day objects.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/training/week/route.ts
git commit -m "feat: add /api/training/week GET endpoint (AI + cache)"
```

---

### Task 7: /api/training/progress endpoint

**Files:**
- Create: `src/app/api/training/progress/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/training/progress/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getProgress, upsertProgress } from '@/lib/supabase/daily-progress'
import type { Breed } from '@/types'

export async function GET(req: NextRequest) {
  const breed = req.nextUrl.searchParams.get('breed') as Breed | null
  const date = req.nextUrl.searchParams.get('date')

  if (!breed || !date) {
    return NextResponse.json({ error: 'breed and date required' }, { status: 400 })
  }

  const progress = await getProgress(breed, date)
  return NextResponse.json(progress)
}

export async function PATCH(req: NextRequest) {
  const { breed, date, exerciseId, count } = (await req.json()) as {
    breed: Breed
    date: string
    exerciseId: string
    count: number
  }

  if (!breed || !date || !exerciseId || count === undefined) {
    return NextResponse.json({ error: 'breed, date, exerciseId, count required' }, { status: 400 })
  }

  await upsertProgress(breed, date, exerciseId, count)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Smoke test**

With the dev server running:

```bash
curl -X PATCH "http://localhost:3000/api/training/progress" \
  -H "Content-Type: application/json" \
  -d '{"breed":"braque_francais","date":"2026-04-29","exerciseId":"inkallning","count":2}'
```

Expected: `{ "ok": true }`

```bash
curl "http://localhost:3000/api/training/progress?breed=braque_francais&date=2026-04-29"
```

Expected: `{ "inkallning": 2 }`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/training/progress/route.ts
git commit -m "feat: add /api/training/progress GET+PATCH endpoint"
```

---

### Task 8: Fix chat system prompt

**Files:**
- Modify: `src/lib/ai/rag.ts`

The current prompt instructs the AI to "Ge ett KONKRET veckoschema: rubrik per dag eller per övning". This causes every chat response to include the full weekly schedule, even when the user asks a simple question. Remove this instruction and replace with one that focuses on direct, concise answers.

- [ ] **Step 1: Locate and replace the instructions block**

In `src/lib/ai/rag.ts`, find the `INSTRUKTIONER:` block in the `systemPrompt` template literal (around line 99) and replace:

```
INSTRUKTIONER:
• Kombinera alltid metodiken (lager 1) med rasspecifika krav (lager 2) och träningsfasen ovan
• Ge ett KONKRET veckoschema: vilka övningar, hur länge, hur många pass, hur du gör dem steg för steg
• Inkludera alltid: namnträning/inkallning om hunden är ung (< 16 veckor)
• Anpassa till hundens exakta ålder i veckor — inte generiska råd
• Om källdokument finns — citera dem. Om inte — använd din träningskunskap öppet
• Svara alltid på svenska
• Format: rubrik per dag eller per övning, konkret och praktiskt
```

with:

```
INSTRUKTIONER:
• Svara direkt på frågan — ge inte hela veckoschemat om det inte efterfrågas
• Kombinera metodiken (lager 1) med rasspecifika krav (lager 2)
• Anpassa svaret till hundens exakta ålder i veckor — inte generiska råd
• Om källdokument finns — citera dem kort. Om inte — använd din träningskunskap
• Svara alltid på svenska, kortfattat och konkret
• Max 150 ord om inte frågan kräver längre svar
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Smoke test chat**

With the dev server running, open the chat page and ask: "Hur länge bör ett träningspass vara?" — verify the response answers the question directly without dumping a 7-day schedule.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai/rag.ts
git commit -m "fix: tighten chat prompt to answer directly without schedule dump"
```

---

### Task 9: ExerciseRow component

**Files:**
- Create: `src/components/TrainingCard/ExerciseRow.tsx`
- Create: `src/components/TrainingCard/ExerciseRow.module.css`

- [ ] **Step 1: Create the component**

```tsx
// src/components/TrainingCard/ExerciseRow.tsx
'use client'

import styles from './ExerciseRow.module.css'
import type { Exercise } from '@/types'

const EXERCISE_ICONS: Record<string, string> = {
  inkallning: '📣',
  namn: '🏷️',
  namntraning: '🏷️',
  sitt: '🐾',
  ligg: '😴',
  stanna: '✋',
  koppel: '🔗',
  apportering: '🎾',
  vatten: '💧',
  socialiserning: '👥',
  stoppsignal: '🛑',
  fokus: '👁️',
}

function getIcon(id: string): string {
  return EXERCISE_ICONS[id] ?? '🐾'
}

interface Props {
  exercise: Exercise
  done: number        // reps completed so far
  onRepClick: () => void
}

export default function ExerciseRow({ exercise, done, onRepClick }: Props) {
  const isComplete = done >= exercise.reps

  return (
    <div className={`${styles.row} ${isComplete ? styles.rowDone : ''}`}>
      <div className={`${styles.iconBox} ${isComplete ? styles.iconBoxDone : ''}`}>
        <span aria-hidden="true">{getIcon(exercise.id)}</span>
      </div>

      <div className={styles.info}>
        <span className={`${styles.label} ${isComplete ? styles.labelDone : ''}`}>
          {exercise.label}
        </span>
        {exercise.desc && (
          <span className={styles.desc}>{exercise.desc}</span>
        )}
      </div>

      <div className={styles.counter} aria-label={`${done} av ${exercise.reps} gjorda`}>
        {isComplete ? (
          <div className={styles.checkCircle} aria-hidden="true">✓</div>
        ) : (
          <div className={styles.dots}>
            {Array.from({ length: exercise.reps }, (_, i) => {
              const filled = i < done
              const isNext = i === done
              return (
                <button
                  key={i}
                  type="button"
                  className={`${styles.dot} ${filled ? styles.dotFilled : ''} ${isNext ? styles.dotNext : ''}`}
                  onClick={onRepClick}
                  aria-label={`Markera rep ${i + 1}`}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create the CSS**

```css
/* src/components/TrainingCard/ExerciseRow.module.css */
.row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 13px var(--space-4);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.rowDone {
  background: var(--color-green-50);
}

.iconBox {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--color-bg-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}

.iconBoxDone {
  background: var(--color-green-100);
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  transition: color var(--transition-fast);
}

.labelDone {
  color: var(--color-primary);
  text-decoration: line-through;
}

.desc {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.counter {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.dots {
  display: flex;
  gap: 5px;
  align-items: center;
}

.dot {
  width: 13px;
  height: 13px;
  border-radius: var(--radius-full);
  background: var(--color-border);
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast);
  padding: 0;
}

.dotFilled {
  background: var(--color-primary);
}

.dotNext {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.dot:active {
  transform: scale(0.9);
}

.checkCircle {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: var(--font-bold);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TrainingCard/ExerciseRow.tsx src/components/TrainingCard/ExerciseRow.module.css
git commit -m "feat: add ExerciseRow component with rep dot counter"
```

---

### Task 10: WeekView overlay

**Files:**
- Create: `src/components/TrainingCard/WeekView.tsx`
- Create: `src/components/TrainingCard/WeekView.module.css`

- [ ] **Step 1: Create the component**

```tsx
// src/components/TrainingCard/WeekView.tsx
import styles from './WeekView.module.css'
import type { WeekPlan } from '@/types'

const SWEDISH_DAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']

interface Props {
  plan: WeekPlan
  onClose: () => void
}

export default function WeekView({ plan, onClose }: Props) {
  const todayName = SWEDISH_DAYS[new Date().getDay()]

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Veckans schema">
      <div className={styles.sheet}>
        <div className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={onClose} aria-label="Stäng">
            <BackArrow />
          </button>
          <span className={styles.title}>Veckans schema</span>
        </div>

        <div className={styles.days}>
          {plan.days.map((day) => {
            const isToday = day.day === todayName
            return (
              <div
                key={day.day}
                className={`${styles.dayCard} ${isToday ? styles.dayCardToday : ''}`}
              >
                <div className={styles.dayHeader}>
                  <span className={`${styles.dayName} ${isToday ? styles.dayNameToday : ''}`}>
                    {day.day}
                    {isToday && <span className={styles.todayBadge}>· idag</span>}
                  </span>
                  {day.rest && <span className={styles.restBadge}>Vilodag</span>}
                </div>

                {day.rest ? (
                  <p className={styles.restText}>😴 Vila och återhämtning</p>
                ) : (
                  <ul className={styles.exerciseList}>
                    {(day.exercises ?? []).map((ex) => (
                      <li key={ex.id} className={styles.exerciseItem}>
                        <span className={styles.exerciseName}>{ex.label}</span>
                        <span className={styles.exerciseMeta}>{ex.reps}× · {ex.desc}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function BackArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
```

- [ ] **Step 2: Create the CSS**

```css
/* src/components/TrainingCard/WeekView.module.css */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(28, 25, 23, 0.4);
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  max-height: 92dvh;
  background: var(--color-bg);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
}

.backBtn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--color-bg-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  flex-shrink: 0;
}

.title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text);
}

.days {
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  scrollbar-width: none;
}

.days::-webkit-scrollbar {
  display: none;
}

.dayCard {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border);
}

.dayCardToday {
  border-color: var(--color-primary);
}

.dayHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.dayName {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-muted);
}

.dayNameToday {
  color: var(--color-primary);
}

.todayBadge {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-primary-light);
  margin-left: var(--space-1);
}

.restBadge {
  font-size: var(--text-xs);
  background: var(--color-bg-alt);
  color: var(--color-text-muted);
  border-radius: var(--radius-full);
  padding: 2px 8px;
}

.restText {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.exerciseList {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.exerciseItem {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.exerciseName {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.exerciseMeta {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TrainingCard/WeekView.tsx src/components/TrainingCard/WeekView.module.css
git commit -m "feat: add WeekView overlay component"
```

---

### Task 11: Rewrite TrainingCard + update Dashboard

**Files:**
- Create: `src/components/TrainingCard/TrainingCard.tsx`
- Create: `src/components/TrainingCard/TrainingCard.module.css`
- Delete: `src/components/TrainingCard.tsx` (flat file)
- Delete: `src/components/TrainingCard.module.css` (flat file)
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create TrainingCard.tsx**

```tsx
// src/components/TrainingCard/TrainingCard.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ExerciseRow from './ExerciseRow'
import WeekView from './WeekView'
import styles from './TrainingCard.module.css'
import type { Breed, WeekPlan, Exercise } from '@/types'

const SWEDISH_DAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']

function todayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

interface Props {
  weekNumber: number
  breed: Breed
  dogName: string
}

export default function TrainingCard({ weekNumber, breed, dogName }: Props) {
  const router = useRouter()
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [showWeekView, setShowWeekView] = useState(false)
  const todayDate = todayDateString()
  const todayName = SWEDISH_DAYS[new Date().getDay()]

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [planRes, progressRes] = await Promise.all([
        fetch(`/api/training/week?breed=${breed}&week=${weekNumber}`),
        fetch(`/api/training/progress?breed=${breed}&date=${todayDate}`),
      ])
      if (planRes.ok) setWeekPlan(await planRes.json())
      if (progressRes.ok) setProgress(await progressRes.json())
    } finally {
      setLoading(false)
    }
  }, [breed, weekNumber, todayDate])

  useEffect(() => { fetchData() }, [fetchData])

  function handleRepClick(exerciseId: string, currentDone: number, maxReps: number) {
    if (currentDone >= maxReps) return
    const newDone = currentDone + 1
    setProgress((prev) => ({ ...prev, [exerciseId]: newDone }))
    fetch('/api/training/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ breed, date: todayDate, exerciseId, count: newDone }),
    }).catch(console.error)
  }

  const todayPlan = weekPlan?.days.find((d) => d.day === todayName)
  const todayExercises: Exercise[] = todayPlan?.exercises ?? []
  const completedCount = todayExercises.filter((e) => (progress[e.id] ?? 0) >= e.reps).length
  const progressPct = todayExercises.length > 0 ? (completedCount / todayExercises.length) * 100 : 0

  return (
    <>
      <section className={styles.card}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>Dagens pass</span>
          {!loading && todayExercises.length > 0 && (
            <span className={styles.headerCount}>{completedCount}/{todayExercises.length} klara</span>
          )}
        </div>

        {!loading && todayExercises.length > 0 && (
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={styles.progressFill} style={{ '--pct': `${progressPct}%` } as React.CSSProperties} />
          </div>
        )}

        {loading && (
          <div className={styles.loading} aria-live="polite">
            <span className={styles.spinner} />
            <span>Hämtar träningsplan…</span>
          </div>
        )}

        {!loading && todayPlan?.rest && (
          <div className={styles.restDay}>
            <span className={styles.restEmoji} aria-hidden="true">😴</span>
            <span className={styles.restTitle}>Vilodag idag</span>
            <span className={styles.restSub}>Vila och återhämtning — bra jobbat i veckan!</span>
          </div>
        )}

        {!loading && todayExercises.length > 0 && (
          <div className={styles.exercises}>
            {todayExercises.map((ex) => (
              <ExerciseRow
                key={ex.id}
                exercise={ex}
                done={progress[ex.id] ?? 0}
                onRepClick={() => handleRepClick(ex.id, progress[ex.id] ?? 0, ex.reps)}
              />
            ))}
          </div>
        )}

        {!loading && (
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.askBtn}
              onClick={() => router.push('/chat')}
            >
              Fråga om dagens pass
              <ChevronRight />
            </button>
            {weekPlan && (
              <button
                type="button"
                className={styles.weekBtn}
                onClick={() => setShowWeekView(true)}
              >
                Visa hela veckans schema
                <ChevronRight />
              </button>
            )}
          </div>
        )}
      </section>

      {showWeekView && weekPlan && (
        <WeekView plan={weekPlan} onClose={() => setShowWeekView(false)} />
      )}
    </>
  )
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
```

- [ ] **Step 2: Create TrainingCard.module.css**

```css
/* src/components/TrainingCard/TrainingCard.module.css */
.card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.header {
  background: var(--color-green-50);
  border-bottom: 1px solid var(--color-green-100);
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.headerTitle {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-primary);
}

.headerCount {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-primary-light);
  background: var(--color-green-100);
  border-radius: var(--radius-full);
  padding: 0.1875rem 0.625rem;
}

.progressBar {
  height: 3px;
  background: var(--color-border);
  overflow: hidden;
}

.progressFill {
  height: 100%;
  width: var(--pct);
  background: var(--color-primary);
  transition: width 0.4s ease;
}

.exercises {
  display: flex;
  flex-direction: column;
}

.restDay {
  padding: var(--space-6) var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  text-align: center;
}

.restEmoji {
  font-size: 2.5rem;
}

.restTitle {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text);
}

.restSub {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.footer {
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border-top: 1px solid var(--color-border);
}

.askBtn,
.weekBtn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6875rem var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  transition: background var(--transition-fast);
}

.askBtn {
  background: var(--color-green-50);
  border: 1.5px solid var(--color-green-100);
  color: var(--color-primary);
}

.askBtn:hover {
  background: var(--color-green-100);
}

.weekBtn {
  background: transparent;
  border: 1.5px solid var(--color-border);
  color: var(--color-text-muted);
}

.weekBtn:hover {
  background: var(--color-bg-alt);
}

.loading {
  padding: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.spinner {
  display: block;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

- [ ] **Step 3: Delete the old flat files**

```bash
git rm src/components/TrainingCard.tsx src/components/TrainingCard.module.css
```

- [ ] **Step 4: Update Dashboard**

Open `src/app/dashboard/page.tsx`. Make the following changes:

**Remove** the `training`, `loading`, `apiError`, and `fetchTraining` state/logic since `TrainingCard` now fetches internally.

**Remove** the `TrainingResult` import.

**Update** the `TrainingCard` import to the new path:

```typescript
import TrainingCard from '@/components/TrainingCard/TrainingCard'
```

**Replace** the entire `Dashboard` function with:

```typescript
function Dashboard() {
  const [profile, setProfile] = useState<DogProfile | null>(null)
  const [showLogForm, setShowLogForm] = useState(false)

  const weekNumber = profile ? Math.max(1, getAgeInWeeks(profile.birthdate)) : 0

  useEffect(() => {
    const p = getDogProfile()
    if (p) setProfile(p)
  }, [])

  function handleLogSaved() {
    setShowLogForm(false)
  }

  const dogName = profile?.name ?? '…'

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.decorCircle} aria-hidden="true" />
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <span className={styles.greeting}>{getGreeting()}</span>
            <h1 className={styles.dogName}>{dogName}</h1>
            <span className={styles.weekBadge}>
              <span aria-hidden="true">📅</span> Vecka {weekNumber || '–'}
            </span>
          </div>
          <Avatar name={dogName} size={64} />
        </div>
      </header>

      <div className={styles.scrollArea}>
        {profile && (
          <TrainingCard
            weekNumber={weekNumber}
            breed={profile.breed}
            dogName={dogName}
          />
        )}

        <div className={styles.statsGrid}>
          <StatCard label="Pass loggade" value="3" sub="denna vecka" tone="primary" />
          <StatCard label="Snittbetyg" value="4.2" sub="fokus & lydnad" tone="accent" />
        </div>

        {!showLogForm ? (
          <button
            className={styles.logCta}
            onClick={() => setShowLogForm(true)}
            type="button"
          >
            <span aria-hidden="true">✍️</span>
            <span>Logga träningspass</span>
          </button>
        ) : (
          profile && (
            <SessionLogForm
              breed={profile.breed}
              weekNumber={weekNumber}
              onSaved={handleLogSaved}
              onCancel={() => setShowLogForm(false)}
            />
          )
        )}
      </div>

      <BottomNav active="dashboard" />
    </main>
  )
}
```

Also update the import block at the top of `dashboard/page.tsx` — remove `TrainingResult` and `useCallback`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import ProfileGuard from '@/components/ProfileGuard'
import TrainingCard from '@/components/TrainingCard/TrainingCard'
import SessionLogForm from '@/components/SessionLogForm'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import { getDogProfile } from '@/lib/dog/profile'
import { getAgeInWeeks } from '@/lib/dog/age'
import type { DogProfile } from '@/types'
import styles from './page.module.css'
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Smoke test in browser**

Start `npm run dev`. Open the dashboard. Confirm:
- Training card loads with today's exercises
- Clicking a rep dot fills it and stays filled on refresh
- "Visa hela veckans schema" opens the overlay
- "Fråga om dagens pass" navigates to chat
- Asking a question in chat does NOT dump a 7-day schedule

- [ ] **Step 8: Commit**

```bash
git add src/components/TrainingCard/ src/app/dashboard/page.tsx
git commit -m "feat: rewrite TrainingCard as interactive checklist with per-rep progress"
```

---

## Self-Review

**Spec coverage:**
- [x] Chat no longer dumps full schedule — Task 8 (tightened system prompt)
- [x] AI returns structured WeekPlan JSON — Tasks 4, 6
- [x] Interactive rep dots per exercise — Task 9 (ExerciseRow)
- [x] Green check when all reps done — Task 9 (ExerciseRow, `isComplete` state)
- [x] Progress persists in Supabase — Tasks 2, 3, 7
- [x] Progress bar `X/Y klara` in header — Task 11 (TrainingCard header)
- [x] Week overview overlay — Task 10 (WeekView)
- [x] Today highlighted in week view — Task 10 (`dayCardToday` CSS class)
- [x] Week plan cached to avoid re-generating — Tasks 5, 6
- [x] Fallback plan if AI fails or returns invalid JSON — Task 4 (`buildFallbackPlan`)
- [x] CSS Modules only, no inline styles except CSS custom properties — all components

**Type consistency:**
- `Exercise`, `DayPlan`, `WeekPlan` defined in Task 1, used consistently in Tasks 4, 9, 10, 11
- `progress: Record<string, number>` used in Tasks 3, 7, 11 — consistent key is `exercise.id`
- `breed`, `date`, `exerciseId`, `count` naming used consistently across Tasks 3, 7, 11

**No placeholders found.**
