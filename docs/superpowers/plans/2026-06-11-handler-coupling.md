# Ekipage-koppling (Delprojekt D) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Förarens signaler (självskattningar i `session_logs.handler_*` + quizresultat i `quiz_cards`) påverkar (1) veckoplanen — advance dämpas till hold när föraren kämpar — och (2) kursen — moduler som matchar förarens/hundens svagheter flaggas "Rekommenderad", quiz-fel ger "Repetera", och rekommenderade moduler låses upp av behov i stället för ordning.

**Architecture:** Ren lib `src/lib/training/handler-state.ts` (TDD) med `computeHandlerStruggle` + `dampAdvances`. Handler-snittet kommer från dog-state (delprojekt C, `getDogState`); quiz-statistik via två nya läsfunktioner i `src/lib/supabase/learning-progress.ts`. Orkestratorn dämpar besluten innan de når prompt/deterministisk planner. Kursen får en `personalization`-parameter i `getCurriculumOverview`.

**Tech Stack:** vitest, Supabase, zod. Inga nya tabeller, inga nya routes — bara nya fält i befintliga svar.

**Spec:** `docs/superpowers/specs/2026-06-11-adaptive-intelligence-design.md` (avsnitt "Delprojekt D").

---

### Task 1: Ren lib `handler-state.ts` (TDD)

**Files:**
- Create: `src/lib/training/handler-state.ts`
- Test: `src/lib/training/handler-state.test.ts`

- [ ] **Step 1: Skriv de failande testerna**

```ts
import { describe, it, expect } from 'vitest'
import {
  computeHandlerStruggle,
  dampAdvances,
  type HandlerAverages,
} from './handler-state'
import type { ExerciseProgressionDecision } from '@/lib/training/progression-rules'

function handler(overrides: Partial<HandlerAverages> = {}): HandlerAverages {
  return { timing: null, consistency: null, reading: null, sampleSize: 0, ...overrides }
}

function decision(
  exerciseId: string,
  d: ExerciseProgressionDecision['decision'],
): ExerciseProgressionDecision {
  return {
    exercise_id: exerciseId,
    criteria_level_id: null,
    decision: d,
    attempts: 12,
    success_rate: 0.85,
    reason: 'ursprunglig anledning',
  }
}

describe('computeHandlerStruggle', () => {
  it('is not struggling without data', () => {
    const result = computeHandlerStruggle(handler(), null)
    expect(result.struggling).toBe(false)
    expect(result.dimensions).toEqual([])
    expect(result.reason).toBeNull()
  })

  it('flags a dimension below 3.0 with at least 3 samples', () => {
    const result = computeHandlerStruggle(handler({ timing: 2.4, sampleSize: 3 }), null)
    expect(result.struggling).toBe(true)
    expect(result.dimensions).toEqual(['timing'])
    expect(result.reason).toContain('timing')
  })

  it('ignores low dimensions with too few samples', () => {
    const result = computeHandlerStruggle(handler({ timing: 1.0, sampleSize: 2 }), null)
    expect(result.struggling).toBe(false)
  })

  it('collects multiple weak dimensions', () => {
    const result = computeHandlerStruggle(
      handler({ timing: 2.0, consistency: 2.5, reading: 4.0, sampleSize: 5 }),
      null,
    )
    expect(result.dimensions).toEqual(['timing', 'consistency'])
  })

  it('flags quiz accuracy below 50% with at least 5 answered', () => {
    const result = computeHandlerStruggle(handler(), { answered: 6, correct: 2 })
    expect(result.struggling).toBe(true)
    expect(result.dimensions).toEqual([])
    expect(result.reason).toContain('kursen')
  })

  it('ignores quiz accuracy with fewer than 5 answered', () => {
    const result = computeHandlerStruggle(handler(), { answered: 4, correct: 0 })
    expect(result.struggling).toBe(false)
  })

  it('exactly 50% quiz accuracy is not struggling', () => {
    const result = computeHandlerStruggle(handler(), { answered: 6, correct: 3 })
    expect(result.struggling).toBe(false)
  })
})

describe('dampAdvances', () => {
  it('returns decisions untouched when not struggling', () => {
    const decisions = [decision('sitt', 'advance'), decision('koppel', 'regress')]
    const result = dampAdvances(decisions, computeHandlerStruggle(handler(), null))
    expect(result).toEqual(decisions)
  })

  it('turns advance into hold with an explanatory reason when struggling', () => {
    const struggle = computeHandlerStruggle(handler({ timing: 2.0, sampleSize: 4 }), null)
    const result = dampAdvances([decision('sitt', 'advance')], struggle)
    expect(result[0].decision).toBe('hold')
    expect(result[0].reason).toContain('stabiliserar')
  })

  it('leaves hold and regress untouched when struggling', () => {
    const struggle = computeHandlerStruggle(handler({ timing: 2.0, sampleSize: 4 }), null)
    const result = dampAdvances(
      [decision('plats', 'hold'), decision('koppel', 'regress')],
      struggle,
    )
    expect(result[0].decision).toBe('hold')
    expect(result[0].reason).toBe('ursprunglig anledning')
    expect(result[1].decision).toBe('regress')
  })
})
```

- [ ] **Step 2: Kör och verifiera FAIL**

Run: `npx vitest run src/lib/training/handler-state.test.ts`
Expected: FAIL — modulen finns inte.

- [ ] **Step 3: Implementera `src/lib/training/handler-state.ts`**

```ts
import type { HandlerDimension } from '@/lib/training/handler-feedback'
import type { ExerciseProgressionDecision } from '@/lib/training/progression-rules'

export interface HandlerAverages {
  timing: number | null
  consistency: number | null
  reading: number | null
  sampleSize: number
}

export interface QuizStats {
  answered: number
  correct: number
}

export interface HandlerStruggle {
  struggling: boolean
  dimensions: HandlerDimension[]
  reason: string | null
}

const DIMENSION_THRESHOLD = 3.0
const MIN_HANDLER_SAMPLES = 3
const QUIZ_ACCURACY_THRESHOLD = 0.5
const MIN_QUIZ_ANSWERED = 5

const DIMENSION_LABELS: Record<HandlerDimension, string> = {
  timing: 'timing',
  consistency: 'konsekvens',
  reading: 'avläsning av hunden',
}

export function computeHandlerStruggle(
  handler: HandlerAverages,
  quiz: QuizStats | null,
): HandlerStruggle {
  const dimensions: HandlerDimension[] = []
  if (handler.sampleSize >= MIN_HANDLER_SAMPLES) {
    const candidates: Array<[HandlerDimension, number | null]> = [
      ['timing', handler.timing],
      ['consistency', handler.consistency],
      ['reading', handler.reading],
    ]
    for (const [dim, avg] of candidates) {
      if (typeof avg === 'number' && avg < DIMENSION_THRESHOLD) dimensions.push(dim)
    }
  }

  const quizWeak =
    quiz !== null &&
    quiz.answered >= MIN_QUIZ_ANSWERED &&
    quiz.correct / quiz.answered < QUIZ_ACCURACY_THRESHOLD

  const struggling = dimensions.length > 0 || quizWeak
  if (!struggling) return { struggling: false, dimensions: [], reason: null }

  const reason = dimensions.length > 0
    ? `Vi stabiliserar en vecka — fokus på din ${DIMENSION_LABELS[dimensions[0]]}.`
    : 'Vi stabiliserar en vecka — repetera grunderna i kursen först.'

  return { struggling, dimensions, reason }
}

export function dampAdvances(
  decisions: ExerciseProgressionDecision[],
  struggle: HandlerStruggle,
): ExerciseProgressionDecision[] {
  if (!struggle.struggling) return decisions
  return decisions.map((d) =>
    d.decision === 'advance'
      ? { ...d, decision: 'hold' as const, reason: struggle.reason ?? d.reason }
      : d,
  )
}
```

- [ ] **Step 4: Kör testerna (PASS) + hela sviten + commit**

Run: `npx vitest run src/lib/training/handler-state.test.ts` → 10 PASS.
Run: `npm run test` → grönt.

```bash
git add src/lib/training/handler-state.ts src/lib/training/handler-state.test.ts
git commit -m "feat(handler-state): compute handler struggle and damp progression advances"
```

---

### Task 2: Quiz-läsfunktioner i `learning-progress.ts`

**Files:**
- Modify: `src/lib/supabase/learning-progress.ts` (lägg sist; följ filens befintliga `admin()`-mönster)

- [ ] **Step 1: Implementera**

```ts
export async function getRecentQuizStats(
  userId: string,
  dogId: string,
  limit = 10,
): Promise<{ answered: number; correct: number } | null> {
  const { data, error } = await admin()
    .from('quiz_cards')
    .select('last_result')
    .eq('user_id', userId)
    .eq('dog_id', dogId)
    .not('last_result', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error || !data || data.length === 0) return null
  return {
    answered: data.length,
    correct: data.filter((r) => r.last_result === true).length,
  }
}

export async function listFailedQuizModuleIds(
  userId: string,
  dogId: string,
): Promise<string[]> {
  const { data, error } = await admin()
    .from('quiz_cards')
    .select('context_key')
    .eq('user_id', userId)
    .eq('dog_id', dogId)
    .eq('last_result', false)
  if (error || !data) return []
  const ids = new Set<string>()
  for (const row of data) {
    const key = String(row.context_key)
    if (key.startsWith('curr_')) ids.add(key.slice('curr_'.length))
  }
  return [...ids]
}
```

- [ ] **Step 2: Verifiera + commit**

Run: `npx tsc --noEmit` — inga nya fel.

```bash
git add src/lib/supabase/learning-progress.ts
git commit -m "feat(handler-state): quiz stats and failed-module readers"
```

---

### Task 3: Orkestratorn dämpar advance när föraren kämpar

**Files:**
- Modify: `src/lib/training/week-orchestrator.ts`

- [ ] **Step 1: Imports**

```ts
import { computeHandlerStruggle, dampAdvances } from '@/lib/training/handler-state'
import { getDogState } from '@/lib/supabase/dog-state'
import { getRecentQuizStats } from '@/lib/supabase/learning-progress'
```

- [ ] **Step 2: Dämpa besluten**

I `buildWeekContextFromRequest`, raden
`const progressionDecisions = computeProgressionDecisions(recentMetrics, { sessionRows })`
ersätts med:

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

`formatProgressionRule(progressionDecisions, ...)` på raden under använder därmed de
dämpade besluten — både prompten och den deterministiska plannern får hold i stället
för advance. Ingen ändring behövs nedströms.

- [ ] **Step 3: Telemetri**

I samma funktion, direkt efter dämpningen:

```ts
  if (handlerStruggle.struggling) {
    trackTelemetry('handler_struggle_damping', {
      dogId: dog.id,
      dimensions: handlerStruggle.dimensions,
      dampedCount: rawProgressionDecisions.filter((d) => d.decision === 'advance').length,
    })
  }
```

(`trackTelemetry` är redan importerad i filen.)

- [ ] **Step 4: Verifiera + commit**

Run: `npx tsc --noEmit && npm run test` — grönt.

```bash
git add src/lib/training/week-orchestrator.ts
git commit -m "feat(handler-state): damp progression advances in week planning when handler struggles"
```

---

### Task 4: Kursen — taggar, personalisering, behovs-upplåsning

**Files:**
- Modify: `src/lib/learning/curriculum-def.ts`
- Modify: `src/lib/learning/curriculum.ts`
- Modify: `src/types/api/schemas.ts`
- Modify: `src/app/api/learning/curriculum/route.ts`

- [ ] **Step 1: Tagga modulerna med förardimension**

I `CurriculumModuleDef`: lägg till `dimension?: 'timing' | 'consistency' | 'reading'`
(importera INTE från handler-feedback här — learning-lagret ska inte bero på
training-lagret; använd literal-unionen och låt TypeScript strukturellt matcha
`HandlerDimension`).

Taggar i `CURRICULUM_MODULES`:

| Modul-id | dimension |
|---|---|
| `marker` | `timing` |
| `sitt` | `consistency` |
| `koppel` | `consistency` |
| `hantering` | `reading` |
| `socialisering` | `reading` |
| `hemma`, `inkallning`, `bur` | (ingen) |

- [ ] **Step 2: Personalisering i `getCurriculumOverview`**

Utöka signaturen och flaggorna i `src/lib/learning/curriculum.ts`:

```ts
export interface CurriculumPersonalization {
  weakExerciseIds: string[]
  strugglingDimensions: Array<'timing' | 'consistency' | 'reading'>
  failedModuleIds: string[]
}

export interface CurriculumOverview {
  lifeStage: LifeStage
  modules: Array<CurriculumModuleContent & {
    completed: boolean
    unlocked: boolean
    recommended: boolean
    recommendationReason: string | null
    reviewSuggested: boolean
  }>
  completedCount: number
}

export async function getCurriculumOverview(
  breed: Breed,
  lifeStage: LifeStage,
  completedModuleids: string[],
  personalization?: CurriculumPersonalization,
): Promise<CurriculumOverview> {
  const defs = modulesForLifeStage(lifeStage)
  const completedSet = new Set(completedModuleids)
  const weakSet = new Set(personalization?.weakExerciseIds ?? [])
  const dimSet = new Set(personalization?.strugglingDimensions ?? [])
  const failedSet = new Set(personalization?.failedModuleIds ?? [])
  const modules: CurriculumOverview['modules'] = []

  for (const def of defs) {
    const prior = defs.filter((m) => m.order < def.order)
    const matchesDimension = Boolean(def.dimension && dimSet.has(def.dimension))
    const matchesWeakExercise = Boolean(def.exerciseId && weakSet.has(def.exerciseId))
    const recommended = matchesDimension || matchesWeakExercise
    const recommendationReason = matchesDimension
      ? 'Dina egna skattningar visar att det här är din svaga punkt just nu.'
      : matchesWeakExercise
        ? 'Träningsdatan visar att den här övningen behöver mer stöd.'
        : null
    // Rekommenderade moduler låses upp av behov, inte ordning.
    const unlocked = recommended || prior.every((m) => completedSet.has(m.id))
    const content = await getModuleContent(breed, lifeStage, def)
    modules.push({
      ...content,
      completed: completedSet.has(def.id),
      unlocked,
      recommended,
      recommendationReason,
      reviewSuggested: failedSet.has(def.id),
    })
  }

  return {
    lifeStage,
    modules,
    completedCount: completedModuleids.length,
  }
}
```

- [ ] **Step 3: Schema**

I `src/types/api/schemas.ts`, `CurriculumModuleSchema` får tre nya optionella fält
(efter `unlocked`):

```ts
  recommended: z.boolean().optional(),
  recommendationReason: z.string().nullable().optional(),
  reviewSuggested: z.boolean().optional(),
```

- [ ] **Step 4: Routen skickar in personaliseringen**

`src/app/api/learning/curriculum/route.ts` — efter `const completed = ...`:

```ts
    const personalization = await (async () => {
      try {
        const [dogState, failedModuleIds] = await Promise.all([
          getDogState(dog.id),
          listFailedQuizModuleIds(user.id, dog.id),
        ])
        const struggle = computeHandlerStruggle(dogState.handler, null)
        return {
          weakExerciseIds: dogState.weakExercises.map((e) => e.exerciseId),
          strugglingDimensions: struggle.dimensions,
          failedModuleIds,
        }
      } catch {
        return undefined
      }
    })()

    const overview = await getCurriculumOverview(breed, lifeStage, completed, personalization)
```

Imports som behövs:

```ts
import { getDogState } from '@/lib/supabase/dog-state'
import { computeHandlerStruggle } from '@/lib/training/handler-state'
import { listFailedQuizModuleIds } from '@/lib/supabase/learning-progress'
```

(Quiz-statistiken till `computeHandlerStruggle` är `null` här med flit — kursens
rekommendationer ska bygga på dimensioner och svaga övningar; quiz-fel hanteras separat
via `failedModuleIds`/Repetera.)

- [ ] **Step 5: Verifiera + commit**

Run: `npx tsc --noEmit && npm run test` — grönt.

```bash
git add src/lib/learning/curriculum-def.ts src/lib/learning/curriculum.ts src/types/api/schemas.ts src/app/api/learning/curriculum/route.ts
git commit -m "feat(curriculum): personalized recommendations, need-based unlock and review flags"
```

---

### Task 5: `CurriculumView` visar chips

**Files:**
- Modify: `src/components/CurriculumView.tsx`
- Modify: `src/components/CurriculumView.module.css`

- [ ] **Step 1: Rendera chips**

I modul-loopen, inuti `<div className={styles.moduleMeta}>` direkt FÖRE
`<h2 className={styles.moduleTitle}>`:

```tsx
                {(mod.recommended || mod.reviewSuggested) && (
                  <div className={styles.flagRow}>
                    {mod.recommended && (
                      <span
                        className={styles.flagRecommended}
                        title={mod.recommendationReason ?? undefined}
                      >
                        Rekommenderad för dig
                      </span>
                    )}
                    {mod.reviewSuggested && (
                      <span className={styles.flagReview}>Repetera</span>
                    )}
                  </div>
                )}
```

- [ ] **Step 2: CSS**

Lägg i `CurriculumView.module.css` (matcha tokens mot filens befintliga regler —
titta på hur `.progressCount`/`.quizLink` är stylade och använd samma vokabulär):

```css
.flagRow {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.flagRecommended,
.flagReview {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: var(--text-xs);
  font-weight: 600;
}

.flagRecommended {
  background: color-mix(in srgb, var(--color-primary) 18%, transparent);
  color: var(--color-primary);
}

.flagReview {
  background: color-mix(in srgb, var(--color-accent, #f4a261) 18%, transparent);
  color: var(--color-accent, #f4a261);
}
```

- [ ] **Step 3: Full verifiering**

Run: `npx tsc --noEmit && npm run test && npm run build` — allt grönt.

- [ ] **Step 4: Commit**

```bash
git add src/components/CurriculumView.tsx src/components/CurriculumView.module.css
git commit -m "feat(curriculum): show recommended and review chips in course view"
```

---

## Slutkriterier

- 10 nya handler-state-tester gröna; hela sviten + build grönt.
- Advance-beslut blir hold (med förklarande reason) i veckoplanen när någon
  förardimension < 3,0 (≥ 3 pass) eller quiz-träffsäkerheten < 50 % (≥ 5 svar).
- Kursmoduler som matchar svaga dimensioner/övningar flaggas och låses upp av behov.
- Quiz-fel på `curr_<moduleId>`-kort ger "Repetera"-chip även på klarmarkerade moduler.
- Fel i personaliseringen degraderar tyst till dagens beteende (try/catch → undefined).
