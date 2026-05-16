# Custom Exercises Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Users can type a short free-text description (e.g. "Cykla med hunden") and Groq expands it into a full `ExerciseSpec` JSON that is saved to Supabase and included in the weekly training schedule.

**Architecture:** A new `custom_exercises` Supabase table stores AI-generated specs per user account. A new API route (`/api/training/custom`) handles CRUD. The week plan prompt is extended with the user's active custom exercise IDs. `TrainingCard` pre-loads custom specs via GET and passes them to `ExerciseGuideSheet` as a `customSpecs` prop.

**Tech Stack:** Next.js App Router, Supabase (server + browser clients via `@supabase/ssr`), Groq SDK (`groq-sdk`), Vitest.

---

## File Map

**Create:**
- `supabase/migrations/002_custom_exercises.sql` — DB table + RLS
- `src/lib/utils/slugify.ts` — slug + random suffix helpers
- `src/lib/utils/slugify.test.ts` — unit tests
- `src/lib/supabase/custom-exercises.ts` — server-side Supabase queries
- `src/app/api/training/custom/route.ts` — GET / POST / PATCH / DELETE
- `src/components/AddCustomExerciseModal.tsx` — creation modal
- `src/components/AddCustomExerciseModal.module.css`
- `src/components/CustomExerciseList.tsx` — profile list with toggle/delete
- `src/components/CustomExerciseList.module.css`

**Modify:**
- `src/lib/ai/week-plan.ts` — new `customExercises` param in `generateWeekPlan`
- `src/app/api/training/week/route.ts` — fetch and pass custom exercises
- `src/app/api/training/metrics/route.ts` — allow `custom_` prefixed IDs
- `src/components/ExerciseGuideSheet.tsx` — new `customSpecs` + `exerciseLabel` props
- `src/components/TrainingCard/TrainingCard.tsx` — load custom specs, render modal + button
- `src/app/profile/page.tsx` — add `CustomExerciseList` section

---

## Task 1: Supabase migration

**Files:**
- Create: `supabase/migrations/002_custom_exercises.sql`

- [ ] **Step 1: Write migration file**

```sql
-- supabase/migrations/002_custom_exercises.sql
create table if not exists custom_exercises (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  label       text not null,
  prompt      text not null,
  spec        jsonb not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (user_id, exercise_id)
);

alter table custom_exercises enable row level security;

create policy "Users manage own custom exercises"
  on custom_exercises
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration in Supabase**

Open the Supabase dashboard → SQL Editor → paste and run the migration above.

- [ ] **Step 3: Commit migration file**

```bash
git add supabase/migrations/002_custom_exercises.sql
git commit -m "feat: add custom_exercises migration"
```

---

## Task 2: Slug utility

**Files:**
- Create: `src/lib/utils/slugify.ts`
- Create: `src/lib/utils/slugify.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/utils/slugify.test.ts
import { describe, it, expect } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('lowercases and replaces spaces', () => {
    expect(slugify('Canicross')).toBe('canicross')
    expect(slugify('Cykla med hunden')).toBe('cykla_med_hunden')
  })
  it('replaces Swedish vowels', () => {
    expect(slugify('Övning')).toBe('ovning')
    expect(slugify('Åktur')).toBe('aktur')
    expect(slugify('Söka')).toBe('soka')
  })
  it('removes special characters', () => {
    expect(slugify('test (canicross)!')).toBe('test_canicross')
  })
  it('collapses multiple underscores', () => {
    expect(slugify('a  b')).toBe('a_b')
  })
  it('truncates to 30 chars', () => {
    expect(slugify('a'.repeat(50))).toHaveLength(30)
  })
  it('trims leading/trailing underscores', () => {
    expect(slugify('(test)')).toBe('test')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/utils/slugify.test.ts
```
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement slugify**

```typescript
// src/lib/utils/slugify.ts
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30)
}

export function randomSuffix(length = 4): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/utils/slugify.test.ts
```
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/slugify.ts src/lib/utils/slugify.test.ts
git commit -m "feat: add slugify utility for custom exercise IDs"
```

---

## Task 3: Supabase query layer

**Files:**
- Create: `src/lib/supabase/custom-exercises.ts`

- [ ] **Step 1: Write the query module**

```typescript
// src/lib/supabase/custom-exercises.ts
import { createSupabaseServer } from './server'
import type { ExerciseSpec } from '@/lib/training/exercise-specs'

export interface CustomExercise {
  id: string
  user_id: string
  exercise_id: string
  label: string
  prompt: string
  spec: ExerciseSpec
  active: boolean
  created_at: string
}

export async function getActiveCustomExercises(): Promise<CustomExercise[]> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('custom_exercises')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`custom_exercises fetch failed: ${error.message}`)
  return (data ?? []) as CustomExercise[]
}

export async function getAllCustomExercises(): Promise<CustomExercise[]> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('custom_exercises')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`custom_exercises fetch failed: ${error.message}`)
  return (data ?? []) as CustomExercise[]
}

export async function createCustomExercise(
  userId: string,
  exerciseId: string,
  label: string,
  prompt: string,
  spec: ExerciseSpec
): Promise<CustomExercise> {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('custom_exercises')
    .insert({ user_id: userId, exercise_id: exerciseId, label, prompt, spec })
    .select()
    .single()

  if (error) throw new Error(`custom_exercises insert failed: ${error.message}`)
  return data as CustomExercise
}

export async function toggleCustomExercise(id: string, active: boolean): Promise<void> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { error } = await supabase
    .from('custom_exercises')
    .update({ active })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(`custom_exercises toggle failed: ${error.message}`)
}

export async function deleteCustomExercise(id: string): Promise<void> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { error } = await supabase
    .from('custom_exercises')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(`custom_exercises delete failed: ${error.message}`)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/custom-exercises.ts
git commit -m "feat: add custom_exercises Supabase query layer"
```

---

## Task 4: API route — GET / POST / PATCH / DELETE

**Files:**
- Create: `src/app/api/training/custom/route.ts`

- [ ] **Step 1: Write the spec validator**

Add a `validateCustomExerciseSpec` function at the top of the route file:

```typescript
// src/app/api/training/custom/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import {
  getAllCustomExercises,
  createCustomExercise,
  toggleCustomExercise,
  deleteCustomExercise,
} from '@/lib/supabase/custom-exercises'
import { getGroqClient, GROQ_MODEL } from '@/lib/ai/client'
import { slugify, randomSuffix } from '@/lib/utils/slugify'
import type { ExerciseSpec } from '@/lib/training/exercise-specs'

function validateCustomExerciseSpec(raw: unknown): (Omit<ExerciseSpec, 'exerciseId'> & { label: string }) | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.label !== 'string' || !r.label.trim()) return null
  if (typeof r.definition !== 'string' || !r.definition.trim()) return null
  if (!Array.isArray(r.ladder) || r.ladder.length < 2) return null
  if (!Array.isArray(r.troubleshooting) || r.troubleshooting.length < 1) return null
  if (!r.guide || typeof r.guide !== 'object') return null
  const g = r.guide as Record<string, unknown>
  if (!Array.isArray(g.setup) || !Array.isArray(g.steps) || !Array.isArray(g.logging) || !Array.isArray(g.commonMistakes) || !Array.isArray(g.stopRules)) return null
  return raw as Omit<ExerciseSpec, 'exerciseId'> & { label: string }
}

const SYSTEM_PROMPT = `Du är en expertträningsinstruktör för hundar. Generera ett JSON-objekt för en hundträningsövning baserat på användarens beskrivning. Svara ENBART med giltig JSON, inga förklaringar.

JSON-schema:
{
  "label": "Kort visningsnamn (2-3 ord, svenska)",
  "definition": "En mening — vad räknas som en lyckad repetition",
  "ladder": [
    { "id": "level_1", "label": "Steg 1 (lättast)", "criteria": "Vad som krävs för att nå denna nivå" },
    { "id": "level_2", "label": "Steg 2", "criteria": "..." },
    { "id": "level_3", "label": "Steg 3 (svårast)", "criteria": "..." }
  ],
  "troubleshooting": [
    "Råd 1 för när det inte funkar",
    "Råd 2",
    "Råd 3"
  ],
  "guide": {
    "setup": ["Förberedelse 1", "Förberedelse 2"],
    "steps": ["Steg 1 för föraren", "Steg 2", "Steg 3", "Steg 4"],
    "logging": ["Tryck 'Lyckad' när...", "Tryck 'Miss' när..."],
    "commonMistakes": ["Vanligt misstag 1", "Vanligt misstag 2"],
    "stopRules": ["Stoppregel 1", "Stoppregel 2"]
  }
}

Regler:
- 2-4 ladder-nivåer, ordnade enklast → svårast
- 2-3 troubleshooting-punkter
- Allt på svenska
- id i ladder: snake_case, t.ex. "inne_bas", "ute_latta_miljoer"
- För fysiskt krävande övningar (löpning, cykling, hopp): inkludera ålders-/hälsovarning i stopRules (t.ex. "Träna inte detta med valpar under 12 månader utan veterinärens godkännande.")`
```

- [ ] **Step 2: Write GET handler**

```typescript
export async function GET() {
  try {
    const exercises = await getAllCustomExercises()
    return NextResponse.json(exercises)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 3: Write POST handler**

```typescript
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

    const body = await req.json() as { prompt?: unknown }
    const prompt = body.prompt
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 })
    }
    if (prompt.length > 300) {
      return NextResponse.json({ error: 'prompt max 300 chars' }, { status: 400 })
    }

    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Skapa en träningsövningsspec för: ${prompt}` },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0].message.content ?? '{}'
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 422 })
    }

    const validated = validateCustomExerciseSpec(parsed)
    if (!validated) {
      return NextResponse.json({ error: 'AI response missing required fields' }, { status: 422 })
    }

    const exerciseId = `custom_${slugify(validated.label)}_${randomSuffix()}`
    const spec: ExerciseSpec = { ...validated, exerciseId }

    const exercise = await createCustomExercise(user.id, exerciseId, validated.label, prompt.trim(), spec)
    return NextResponse.json(exercise, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('rate_limit') || message.includes('429')) {
      return NextResponse.json({ error: 'Groq rate limit nådd. Försök igen om en stund.' }, { status: 429 })
    }
    console.error('[POST /api/training/custom]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Write PATCH handler**

```typescript
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { id?: unknown; active?: unknown }
    if (typeof body.id !== 'string' || typeof body.active !== 'boolean') {
      return NextResponse.json({ error: 'id and active required' }, { status: 400 })
    }
    await toggleCustomExercise(body.id, body.active)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 5: Write DELETE handler**

```typescript
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as { id?: unknown }
    if (typeof body.id !== 'string') {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }
    await deleteCustomExercise(body.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/training/custom/route.ts
git commit -m "feat: add /api/training/custom route (CRUD for custom exercises)"
```

---

## Task 5: Week plan integration

**Files:**
- Modify: `src/lib/ai/week-plan.ts`
- Modify: `src/app/api/training/week/route.ts`

- [ ] **Step 1: Update `generateWeekPlan` signature in `week-plan.ts`**

Change the function signature from:
```typescript
export async function generateWeekPlan(
  breed: Breed,
  trainingWeek: number,
  ageWeeks?: number,
  goals?: TrainingGoal[],
  onboardingContext?: string,
  performanceSummary?: string
): Promise<WeekPlan> {
```

To:
```typescript
export async function generateWeekPlan(
  breed: Breed,
  trainingWeek: number,
  ageWeeks?: number,
  goals?: TrainingGoal[],
  onboardingContext?: string,
  performanceSummary?: string,
  customExercises?: Array<{ exercise_id: string; label: string }>
): Promise<WeekPlan> {
```

- [ ] **Step 2: Inject custom exercises into the prompt**

Find this block in `generateWeekPlan` (just before `const systemPrompt = ...`):
```typescript
  const idRules = [
    breedSpecificRule,
    isPuppy
      ? 'Valpregel: inkludera hantering och socialisering flera dagar. Inga "tunga" distans/störnings-ökningar.'
      : null,
    goalRules || null,
  ].filter(Boolean).join('\n')
```

Add after it:
```typescript
  const customSection = customExercises && customExercises.length > 0
    ? `\n=== EGNA ÖVNINGAR (inkludera om lämpligt, max 1 per dag) ===\n${customExercises.map((e) => `- ${e.exercise_id}: ${e.label}`).join('\n')}\n`
    : ''

  const customIds = customExercises?.map((e) => e.exercise_id) ?? []
```

Then find in the systemPrompt template:
```
- Tillåtna id för rasen ${breed}: ${allowedIds.join(', ')}
```

Change to:
```
- Tillåtna id för rasen ${breed}: ${[...allowedIds, ...customIds].join(', ')}
```

And add `${customSection}` just before the rules section in the systemPrompt string. Find:
```typescript
const systemPrompt = `Du är DogVantage träningsassistent för rasen ${breed}. Returnera ett veckoschema som giltig JSON.

${formatBreedProfile(breed)}
${ageInfo}${typeof ageWeeks === 'number' && Number.isFinite(ageWeeks) ? formatCurrentPhase(ageWeeks) : ''}${goalContext}${onboardingSection}${performanceSection}
```

Change to:
```typescript
const systemPrompt = `Du är DogVantage träningsassistent för rasen ${breed}. Returnera ett veckoschema som giltig JSON.

${formatBreedProfile(breed)}
${ageInfo}${typeof ageWeeks === 'number' && Number.isFinite(ageWeeks) ? formatCurrentPhase(ageWeeks) : ''}${goalContext}${onboardingSection}${performanceSection}${customSection}
```

- [ ] **Step 3: Update `/api/training/week/route.ts`**

At the top, add the import:
```typescript
import { getActiveCustomExercises } from '@/lib/supabase/custom-exercises'
```

In the `GET` handler, find where `performanceSummary` is assembled (around line 75–85):
```typescript
  let performanceSummary: string | undefined
  try {
    const recentLogs = await getRecentLogs(breed, trainingWeek, 3)
    performanceSummary = formatPerformanceSummary(formatLogsForPrompt(recentLogs))
  } catch {
    // Not critical — continue without performance data
  }
```

Add after it:
```typescript
  let customExercises: Array<{ exercise_id: string; label: string }> = []
  try {
    const rows = await getActiveCustomExercises()
    customExercises = rows.map((r) => ({ exercise_id: r.exercise_id, label: r.label }))
  } catch {
    // Not critical — continue without custom exercises
  }
```

Then find:
```typescript
  const plan = await generateWeekPlan(breed, trainingWeek, ageWeeks, goals, onboardingContext, performanceSummary)
```

Change to:
```typescript
  const plan = await generateWeekPlan(breed, trainingWeek, ageWeeks, goals, onboardingContext, performanceSummary, customExercises)
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/week-plan.ts src/app/api/training/week/route.ts
git commit -m "feat: inject custom exercises into week plan prompt"
```

---

## Task 6: Metrics route — allow custom exercise IDs

**Files:**
- Modify: `src/app/api/training/metrics/route.ts`

- [ ] **Step 1: Update the `criteria_level_id` validation block**

Find in `parsePatch`:
```typescript
    } else {
      if (!getExerciseSpec(exerciseId)) return { error: 'Unknown exerciseId', status: 400 }
      if (!isValidCriteriaLevel(exerciseId, level)) {
        return { error: 'criteria_level_id invalid for exerciseId', status: 400 }
      }
      patch.criteria_level_id = level
    }
```

Replace with:
```typescript
    } else {
      const isCustom = exerciseId.startsWith('custom_')
      if (!isCustom && !getExerciseSpec(exerciseId)) return { error: 'Unknown exerciseId', status: 400 }
      if (!isCustom && !isValidCriteriaLevel(exerciseId, level)) {
        return { error: 'criteria_level_id invalid for exerciseId', status: 400 }
      }
      patch.criteria_level_id = level
    }
```

- [ ] **Step 2: Verify TypeScript and run tests**

```bash
npx tsc --noEmit && npx vitest run
```
Expected: no errors, all existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/training/metrics/route.ts
git commit -m "fix: allow custom_ exercise IDs in metrics route"
```

---

## Task 7: ExerciseGuideSheet — customSpecs and exerciseLabel props

**Files:**
- Modify: `src/components/ExerciseGuideSheet.tsx`

- [ ] **Step 1: Update the component props and spec lookup**

First, update the existing import at the top of the file from:
```typescript
import { getExerciseSpec } from '@/lib/training/exercise-specs'
```
To:
```typescript
import { getExerciseSpec } from '@/lib/training/exercise-specs'
import type { ExerciseSpec } from '@/lib/training/exercise-specs'
```

Then replace the current props interface and spec lookup:
```typescript
export default function ExerciseGuideSheet({
  exerciseId,
  onClose,
  metrics,
}: {
  exerciseId: string
  metrics?: DailyExerciseMetrics | null
  onClose: () => void
}) {
  const router = useRouter()
  const spec = getExerciseSpec(exerciseId)
```

With:
```typescript
export default function ExerciseGuideSheet({
  exerciseId,
  exerciseLabel,
  onClose,
  metrics,
  customSpecs,
}: {
  exerciseId: string
  exerciseLabel?: string
  metrics?: DailyExerciseMetrics | null
  onClose: () => void
  customSpecs?: Record<string, ExerciseSpec>
}) {
  const router = useRouter()
  const spec = customSpecs?.[exerciseId] ?? getExerciseSpec(exerciseId)
```

- [ ] **Step 2: Use exerciseLabel for the title**

Find:
```typescript
          <div className={styles.title}>{prettyLabel(exerciseId)}</div>
```

Replace with:
```typescript
          <div className={styles.title}>{exerciseLabel ?? prettyLabel(exerciseId)}</div>
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no new errors (there will be an error in TrainingCard if it passes no `customSpecs` — that's fine until Task 8).

- [ ] **Step 4: Commit**

```bash
git add src/components/ExerciseGuideSheet.tsx
git commit -m "feat: ExerciseGuideSheet accepts customSpecs and exerciseLabel props"
```

---

## Task 8: TrainingCard — load custom specs + pass to guide sheet

**Files:**
- Modify: `src/components/TrainingCard/TrainingCard.tsx`

- [ ] **Step 1: Import ExerciseSpec type**

At the top of `TrainingCard.tsx`, add to the existing imports:
```typescript
import type { ExerciseSpec } from '@/lib/training/exercise-specs'
```

- [ ] **Step 2: Add customSpecs state and fetch**

After the existing `const [sessionGuard, ...]` state line, add:
```typescript
  const [customSpecs, setCustomSpecs] = useState<Record<string, ExerciseSpec>>({})
```

Add a new `useEffect` after the existing `useEffect(() => { fetchData() }, [fetchData])`:
```typescript
  useEffect(() => {
    let alive = true
    fetch('/api/training/custom')
      .then((r) => r.ok ? r.json() : [])
      .then((rows: Array<{ exercise_id: string; spec: ExerciseSpec }>) => {
        if (!alive) return
        const map: Record<string, ExerciseSpec> = {}
        for (const row of rows) map[row.exercise_id] = row.spec
        setCustomSpecs(map)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])
```

- [ ] **Step 3: Use customSpecs in exercise rendering**

Find in the `displayedExercises.map(...)` block:
```typescript
                const spec = getExerciseSpec(ex.id)
```

Replace with:
```typescript
                const spec = customSpecs[ex.id] ?? getExerciseSpec(ex.id)
```

- [ ] **Step 4: Pass customSpecs and exerciseLabel to ExerciseGuideSheet**

Find:
```typescript
      {guideExerciseId && (
        <ExerciseGuideSheet
          exerciseId={guideExerciseId}
          metrics={metrics[guideExerciseId] ?? null}
          onClose={() => setGuideExerciseId(null)}
        />
      )}
```

Replace with:
```typescript
      {guideExerciseId && (
        <ExerciseGuideSheet
          exerciseId={guideExerciseId}
          exerciseLabel={todayExercises.find((e) => e.id === guideExerciseId)?.label}
          metrics={metrics[guideExerciseId] ?? null}
          onClose={() => setGuideExerciseId(null)}
          customSpecs={customSpecs}
        />
      )}
```

- [ ] **Step 5: Verify TypeScript and run tests**

```bash
npx tsc --noEmit && npx vitest run
```
Expected: no errors, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/TrainingCard/TrainingCard.tsx
git commit -m "feat: TrainingCard loads and passes custom exercise specs"
```

---

## Task 9: AddCustomExerciseModal component + button in TrainingCard

**Files:**
- Create: `src/components/AddCustomExerciseModal.tsx`
- Create: `src/components/AddCustomExerciseModal.module.css`
- Modify: `src/components/TrainingCard/TrainingCard.tsx`

- [ ] **Step 1: Write the modal component**

```typescript
// src/components/AddCustomExerciseModal.tsx
'use client'

import { useState } from 'react'
import styles from './AddCustomExerciseModal.module.css'

export default function AddCustomExerciseModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: () => void
}) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = prompt.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/training/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Något gick fel')
        return
      }
      onCreated() // parent handles closing and refreshing specs
    } catch {
      setError('Nätverksfel — försök igen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Lägg till eget pass">
      <div className={styles.sheet}>
        <div className={styles.header}>
          <span className={styles.title}>Lägg till eget pass</span>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Stäng">✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label} htmlFor="custom-prompt">
            Beskriv vad du vill träna
          </label>
          <textarea
            id="custom-prompt"
            className={styles.textarea}
            placeholder="t.ex. Cykla med hunden (canicross)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={300}
            rows={3}
            disabled={loading}
          />
          <span className={styles.charCount}>{prompt.length}/300</span>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !prompt.trim()}
          >
            {loading ? 'Skapar pass…' : 'Skapa pass med AI'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write the modal CSS**

```css
/* src/components/AddCustomExerciseModal.module.css */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
  padding: 0 0 env(safe-area-inset-bottom);
}

.sheet {
  background: var(--card-bg, #fff);
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 480px;
  padding: 24px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 1.1rem;
  font-weight: 600;
}

.closeBtn {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px 8px;
  color: var(--text-secondary, #666);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary, #555);
}

.textarea {
  width: 100%;
  padding: 12px;
  border: 1.5px solid var(--border, #ddd);
  border-radius: 10px;
  font-size: 1rem;
  resize: none;
  font-family: inherit;
  background: var(--input-bg, #fafafa);
  box-sizing: border-box;
}

.textarea:focus {
  outline: none;
  border-color: var(--accent, #4f7dff);
}

.charCount {
  font-size: 0.75rem;
  color: var(--text-secondary, #999);
  text-align: right;
}

.error {
  font-size: 0.85rem;
  color: #c0392b;
  margin: 0;
}

.submitBtn {
  margin-top: 8px;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: var(--accent, #4f7dff);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.submitBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 3: Add modal state and button to TrainingCard**

In `TrainingCard.tsx`, add import at the top:
```typescript
import AddCustomExerciseModal from '@/components/AddCustomExerciseModal'
```

Add state after `const [customSpecs, ...]`:
```typescript
  const [showAddCustom, setShowAddCustom] = useState(false)
```

Find the footer section inside the `<section>`:
```typescript
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
```

Replace with:
```typescript
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
            <button
              type="button"
              className={styles.weekBtn}
              onClick={() => setShowAddCustom(true)}
            >
              + Lägg till eget pass
              <ChevronRight />
            </button>
          </div>
        )}
```

Add the modal at the bottom of the component return, just before the closing `</>`:
```typescript
      {showAddCustom && (
        <AddCustomExerciseModal
          onClose={() => setShowAddCustom(false)}
          onCreated={() => {
            setShowAddCustom(false)
            // Reload custom specs so new exercise appears in future weeks
            fetch('/api/training/custom')
              .then((r) => r.ok ? r.json() : [])
              .then((rows: Array<{ exercise_id: string; spec: ExerciseSpec }>) => {
                const map: Record<string, ExerciseSpec> = {}
                for (const row of rows) map[row.exercise_id] = row.spec
                setCustomSpecs(map)
              })
              .catch(() => {})
          }}
        />
      )}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/AddCustomExerciseModal.tsx src/components/AddCustomExerciseModal.module.css src/components/TrainingCard/TrainingCard.tsx
git commit -m "feat: add custom exercise creation modal and button in TrainingCard"
```

---

## Task 10: Profile — CustomExerciseList

**Files:**
- Create: `src/components/CustomExerciseList.tsx`
- Create: `src/components/CustomExerciseList.module.css`
- Modify: `src/app/profile/page.tsx`

- [ ] **Step 1: Write the CustomExerciseList component**

```typescript
// src/components/CustomExerciseList.tsx
'use client'

import { useEffect, useState } from 'react'
import styles from './CustomExerciseList.module.css'

interface CustomExercise {
  id: string
  label: string
  prompt: string
  active: boolean
}

export default function CustomExerciseList() {
  const [exercises, setExercises] = useState<CustomExercise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/training/custom')
      .then((r) => r.ok ? r.json() : [])
      .then((data: CustomExercise[]) => { setExercises(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleToggle(id: string, active: boolean) {
    setExercises((prev) => prev.map((e) => e.id === id ? { ...e, active } : e))
    await fetch('/api/training/custom', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active }),
    }).catch(() => {})
  }

  async function handleDelete(id: string) {
    setExercises((prev) => prev.filter((e) => e.id !== id))
    await fetch('/api/training/custom', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  }

  if (loading) return null
  if (exercises.length === 0) return (
    <p className={styles.empty}>Inga egna pass skapade ännu.</p>
  )

  return (
    <ul className={styles.list}>
      {exercises.map((ex) => (
        <li key={ex.id} className={styles.item}>
          <div className={styles.info}>
            <span className={styles.label}>{ex.label}</span>
            <span className={styles.prompt}>{ex.prompt}</span>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              role="switch"
              aria-checked={ex.active}
              className={`${styles.toggle} ${ex.active ? styles.toggleOn : ''}`}
              onClick={() => handleToggle(ex.id, !ex.active)}
              aria-label={ex.active ? 'Inaktivera' : 'Aktivera'}
            >
              {ex.active ? 'På' : 'Av'}
            </button>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => handleDelete(ex.id)}
              aria-label={`Ta bort ${ex.label}`}
            >
              Ta bort
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 2: Write the CSS**

```css
/* src/components/CustomExerciseList.module.css */
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--input-bg, #f7f7f7);
}

.info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.label {
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prompt {
  font-size: 0.78rem;
  color: var(--text-secondary, #888);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.toggle {
  padding: 5px 12px;
  border-radius: 20px;
  border: 1.5px solid var(--border, #ccc);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  background: none;
  color: var(--text-secondary, #777);
}

.toggleOn {
  background: var(--accent, #4f7dff);
  border-color: var(--accent, #4f7dff);
  color: #fff;
}

.deleteBtn {
  padding: 5px 10px;
  border-radius: 8px;
  border: 1.5px solid #e74c3c;
  color: #e74c3c;
  background: none;
  font-size: 0.8rem;
  cursor: pointer;
}

.empty {
  font-size: 0.9rem;
  color: var(--text-secondary, #888);
  margin: 0;
}
```

- [ ] **Step 3: Add CustomExerciseList section to profile page**

In `src/app/profile/page.tsx`, add the import at the top of the file:
```typescript
import CustomExerciseList from '@/components/CustomExerciseList'
```

Find the `<div className={styles.scrollArea}>` block. After the last `<div className={styles.section}>` that contains trainer settings (the one with `OptionField` components), and before the save button block, add a new section:

```tsx
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Egna träningspass</span>
          <CustomExerciseList />
        </div>
```

- [ ] **Step 4: Verify TypeScript and run all tests**

```bash
npx tsc --noEmit && npx vitest run
```
Expected: no errors, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/CustomExerciseList.tsx src/components/CustomExerciseList.module.css src/app/profile/page.tsx
git commit -m "feat: add CustomExerciseList to profile page with toggle and delete"
```

---

## Done — manual smoke test

After all tasks are complete, verify end-to-end:

1. Open the training view — a `+ Lägg till eget pass` button should appear in the footer.
2. Click it, type "Cykla med hunden" and submit. Watch the loading state.
3. On success the modal closes. Open the profile page → "Egna träningspass" section shows the new exercise with an active toggle.
4. Toggle it off, verify it updates. Toggle back on.
5. Wait for the next week plan fetch (or refresh) — check that "Canicross" (or whatever label Groq generated) can appear in the week plan.
6. When it does appear in the plan and you open its guide sheet, the full spec from Supabase should render correctly.
7. Delete the exercise from profile — it disappears from the list.
