# Live Coach Under Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Under training reps, show level-specific focus/fail tips, week-plan `exercise.desc` on the card, a personalized pre-session checklist, and chat context with label/topic/lifeStage — without live doc-retrieval during the session.

**Architecture:** Extend each `CriteriaLevel` with optional `failTips` (reuse existing `tips`). Add pure `resolveLiveCoach()` in `src/lib/training/live-coach.ts`. UI (`ExerciseRow`, `ExerciseGuideSheet`, `PreSessionChecklist`) consumes `LiveCoachView`. Docs remain after-session via existing `getStruggleAdvice`. Chat passes `topic` + `lifeStage` into RAG retrieval filters.

**Tech Stack:** TypeScript, Next.js App Router, Vitest, existing `session-coach`, `exercise-specs`, `topicForExerciseId`, `searchBreedChunks` filters.

## Global Constraints

- Specs are truth during the session — no AI-invented technique under reps.
- No doc-retrieval while logging reps; longer tips stay in post-session struggle advice.
- Owner-facing copy never shows raw ladder ids (`home_2m`, etc.).
- Max 2 strings in `tips` / `failTips` per rung.
- Swedish owner language; imperative tips.
- Build on HandlerGuide rewrite — do not regress how/why guides or “Det går inte” variants.
- Spec: `docs/superpowers/specs/2026-07-26-live-coach-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/training/exercise-specs.ts` | `CriteriaLevel.failTips`; curated `tips`/`failTips` on every rung |
| `src/lib/training/live-coach.ts` | `resolveLiveCoach` + `LiveCoachView` |
| `src/lib/training/live-coach.test.ts` | Resolver unit tests |
| `src/lib/training/exercise-guide-quality.test.ts` | Content gate for tips/failTips |
| `src/lib/training/session-coach.ts` | Optional: shorter guide-hint when fail tips shown inline (keep metrics logic) |
| `src/components/TrainingCard/ExerciseRow.tsx` (+ css/test) | desc, focusTips, failTips on lower/stop |
| `src/components/ExerciseGuideSheet.tsx` (+ test) | “På din nivå” block; chat CTA params |
| `src/components/TrainingCard/PreSessionChecklist.tsx` | Level + source checklist items |
| `src/components/TrainingCard/TrainingCard.tsx` | Pass active exercise into checklist |
| `src/components/PuppyDayCard/PuppyDayCard.tsx` | Same checklist props if used |
| `src/app/chat/page.tsx` | Read `topic`/`lifeStage` search params |
| `src/components/ChatInterface.tsx` | Forward filters to `/api/chat` |
| `src/app/api/chat/route.ts` | Accept filters; pass to `queryRAG` |
| `src/lib/ai/rag.ts` | Optional retrieval filters on `QueryRAGOptions` |

---

### Task 1: `resolveLiveCoach` + types

**Files:**
- Modify: `src/lib/training/exercise-specs.ts` (`CriteriaLevel`)
- Create: `src/lib/training/live-coach.ts`
- Create: `src/lib/training/live-coach.test.ts`

**Interfaces:**
- Consumes: `ExerciseSpec`, `CriteriaLevel`, `CoachAction['kind']`, `LifeStage` from `@/lib/dog/age`, `TrainingSourceRef` from `@/types`, `topicForExerciseId` from `@/lib/learning/chunk-metadata`
- Produces:
  - `CriteriaLevel.failTips?: string[]`
  - `export type CoachKind = CoachAction['kind'] | null`
  - `export interface LiveCoachChatContext { label: string; topic: string; lifeStage: LifeStage; levelLabel: string | null }`
  - `export interface LiveCoachView { levelId: string | null; levelLabel: string | null; levelCriteria: string | null; focusTips: string[]; failTips: string[]; showFailTips: boolean; checklistItems: string[]; chatContext: LiveCoachChatContext }`
  - `export function resolveLiveCoach(input: ResolveLiveCoachInput): LiveCoachView`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/training/live-coach.test.ts
import { describe, expect, it } from 'vitest'
import { getExerciseSpec } from './exercise-specs'
import { resolveLiveCoach } from './live-coach'

const ink = () => getExerciseSpec('inkallning')!

describe('resolveLiveCoach', () => {
  it('uses rung tips and failTips when present', () => {
    const spec = structuredClone(ink())
    spec.ladder[0] = {
      ...spec.ladder[0],
      tips: ['Stå 1 m ifrån.', 'Belöna vid vändning.'],
      failTips: ['Gå närmare.', 'Byt till godare belöning.'],
    }
    const view = resolveLiveCoach({
      spec,
      levelId: spec.ladder[0].id,
      coachKind: 'lower',
      exerciseLabel: 'Inkallning',
      exerciseId: 'inkallning',
      lifeStage: 'adult',
    })
    expect(view.focusTips).toEqual(['Stå 1 m ifrån.', 'Belöna vid vändning.'])
    expect(view.failTips).toEqual(['Gå närmare.', 'Byt till godare belöning.'])
    expect(view.showFailTips).toBe(true)
  })

  it('falls back to whenItFails then troubleshooting, max 2', () => {
    const spec = structuredClone(ink())
    // ensure no failTips on rung
    spec.ladder[0] = { ...spec.ladder[0], failTips: undefined, tips: undefined }
    const view = resolveLiveCoach({
      spec,
      levelId: spec.ladder[0].id,
      coachKind: 'stop',
      exerciseLabel: 'Inkallning',
      exerciseId: 'inkallning',
      lifeStage: 'puppy',
    })
    expect(view.failTips.length).toBeGreaterThan(0)
    expect(view.failTips.length).toBeLessThanOrEqual(2)
    expect(view.showFailTips).toBe(true)
  })

  it('hides fail tips when coach is keep', () => {
    const view = resolveLiveCoach({
      spec: ink(),
      levelId: ink().ladder[0].id,
      coachKind: 'keep',
      exerciseLabel: 'Inkallning',
      exerciseId: 'inkallning',
      lifeStage: 'adult',
    })
    expect(view.showFailTips).toBe(false)
  })

  it('chatContext uses topic + lifeStage and never raw level id as levelLabel', () => {
    const spec = ink()
    const levelId = spec.ladder[1].id // e.g. home_2m
    const view = resolveLiveCoach({
      spec,
      levelId,
      coachKind: null,
      exerciseLabel: 'Inkallning',
      exerciseId: 'inkallning',
      lifeStage: 'junior',
    })
    expect(view.chatContext.topic).toBe('recall')
    expect(view.chatContext.lifeStage).toBe('junior')
    expect(view.chatContext.levelLabel).not.toBe(levelId)
    expect(view.chatContext.levelLabel).toBe(spec.ladder[1].label)
  })

  it('checklist includes level row and optional source', () => {
    const view = resolveLiveCoach({
      spec: ink(),
      levelId: ink().ladder[0].id,
      coachKind: null,
      exerciseLabel: 'Inkallning',
      exerciseId: 'inkallning',
      lifeStage: 'adult',
      sources: [{ source: 'Dummybok', source_url: 'https://example.com' }],
    })
    expect(view.checklistItems.some((i) => i.includes(ink().ladder[0].label))).toBe(true)
    expect(view.checklistItems.some((i) => /Dummybok|Läs mer/i.test(i))).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx vitest run src/lib/training/live-coach.test.ts`  
Expected: FAIL (module missing)

- [ ] **Step 3: Add `failTips` to `CriteriaLevel`**

In `exercise-specs.ts`:

```ts
export interface CriteriaLevel {
  id: string
  label: string
  criteria: string
  tips?: string[]
  failTips?: string[]
}
```

- [ ] **Step 4: Implement `live-coach.ts`**

```ts
import type { TrainingSourceRef } from '@/types'
import type { LifeStage } from '@/lib/dog/age'
import { topicForExerciseId } from '@/lib/learning/chunk-metadata'
import type { CoachAction } from '@/lib/training/session-coach'
import type { ExerciseSpec } from '@/lib/training/exercise-specs'

export type CoachKind = CoachAction['kind'] | null

export interface LiveCoachChatContext {
  label: string
  topic: string
  lifeStage: LifeStage
  levelLabel: string | null
}

export interface LiveCoachView {
  levelId: string | null
  levelLabel: string | null
  levelCriteria: string | null
  focusTips: string[]
  failTips: string[]
  showFailTips: boolean
  checklistItems: string[]
  chatContext: LiveCoachChatContext
}

export interface ResolveLiveCoachInput {
  spec: ExerciseSpec
  levelId: string | null
  coachKind: CoachKind
  exerciseLabel: string
  exerciseId: string
  lifeStage: LifeStage
  sources?: TrainingSourceRef[]
}

function takeTips(list: string[] | undefined, max = 2): string[] {
  return (list ?? []).map((s) => s.trim()).filter(Boolean).slice(0, max)
}

export function resolveLiveCoach(input: ResolveLiveCoachInput): LiveCoachView {
  const rung =
    input.spec.ladder.find((r) => r.id === input.levelId) ??
    input.spec.ladder[0] ??
    null
  const levelId = rung?.id ?? input.levelId
  const levelLabel = rung?.label ?? null
  const levelCriteria = rung?.criteria ?? null
  const focusTips = takeTips(rung?.tips)
  const failTips = takeTips(
    rung?.failTips?.length
      ? rung.failTips
      : input.spec.guide?.whenItFails?.length
        ? input.spec.guide.whenItFails
        : input.spec.troubleshooting,
  )
  const showFailTips = input.coachKind === 'lower' || input.coachKind === 'stop'
  const topic = topicForExerciseId(input.exerciseId) ?? 'general'

  const checklistItems: string[] = [
    'Belöning inom räckhåll — belöna i rätt ögonblick.',
    'Lugn plats; stäng bort onödiga störningar om du kan.',
  ]
  if (levelLabel && levelCriteria) {
    checklistItems.push(`Idag: ${levelLabel} — ${levelCriteria}`)
  }
  if (focusTips[0]) checklistItems.push(focusTips[0])
  const src = input.sources?.[0]
  if (src?.source) {
    checklistItems.push(src.source_url ? `Läs mer: ${src.source}` : `Läs mer: ${src.source}`)
  }

  return {
    levelId,
    levelLabel,
    levelCriteria,
    focusTips,
    failTips,
    showFailTips,
    checklistItems,
    chatContext: {
      label: input.exerciseLabel,
      topic,
      lifeStage: input.lifeStage,
      levelLabel,
    },
  }
}
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `npx vitest run src/lib/training/live-coach.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/training/exercise-specs.ts src/lib/training/live-coach.ts src/lib/training/live-coach.test.ts
git commit -m "feat(training): add resolveLiveCoach for level tips under session"
```

---

### Task 2: Content gate + tips/failTips on all ladder rungs

**Files:**
- Modify: `src/lib/training/exercise-guide-quality.test.ts`
- Modify: `src/lib/training/exercise-specs.ts` (every `ladder` entry)

**Interfaces:**
- Consumes: `CriteriaLevel.tips` / `failTips` from Task 1
- Produces: every rung in `EXERCISE_SPECS` has `tips` length 1–2 and `failTips` length 1–2; no ladder-id leaks in those strings

- [ ] **Step 1: Extend quality gate (failing until content filled)**

Add to `exercise-guide-quality.test.ts`:

```ts
it('every ladder rung has curated tips and failTips (1–2 each)', () => {
  for (const spec of Object.values(EXERCISE_SPECS)) {
    for (const rung of spec.ladder) {
      expect(rung.tips?.length, `${spec.exerciseId}.${rung.id} tips`).toBeGreaterThanOrEqual(1)
      expect(rung.tips!.length, `${spec.exerciseId}.${rung.id} tips`).toBeLessThanOrEqual(2)
      expect(rung.failTips?.length, `${spec.exerciseId}.${rung.id} failTips`).toBeGreaterThanOrEqual(1)
      expect(rung.failTips!.length, `${spec.exerciseId}.${rung.id} failTips`).toBeLessThanOrEqual(2)
      const blob = [...rung.tips!, ...rung.failTips!].join(' ')
      expect(new RegExp(`\\b${rung.id}\\b`).test(blob), `${spec.exerciseId} leaked ${rung.id}`).toBe(false)
      for (const other of spec.ladder) {
        if (other.id === rung.id) continue
        expect(new RegExp(`\\b${other.id}\\b`).test(blob), `${spec.exerciseId} leaked ${other.id}`).toBe(false)
      }
    }
  }
})
```

- [ ] **Step 2: Run gate — expect FAIL**

Run: `npx vitest run src/lib/training/exercise-guide-quality.test.ts`  
Expected: FAIL on missing tips

- [ ] **Step 3: Fill tips/failTips for all rungs**

Authoring rules (apply to every exercise in `EXERCISE_SPECS`):

1. Read rung `label` + `criteria` + exercise `guide.whenItFails` / `troubleshooting`.
2. `tips` (1–2): what the handler does *on this pin* (environment + distance + reward timing). Imperative Swedish.
3. `failTips` (1–2): concrete “do instead” if this pin fails — prefer level-specific (e.g. ute → gå närmare / bättre belöning), never paste raw ids.
4. Do not invent new techniques beyond existing guide/troubleshooting/variants.

Example for `inkallning` (edit ladder in place):

```ts
ladder: [
  {
    id: 'home_no_distance',
    label: 'Inne · 0–1 m',
    criteria: 'Säg signalen när hunden redan är nära. Belöna direkt vid vändning.',
    tips: [
      'Stå 0–1 m ifrån. Säg namn, sedan “kom”, backa ett steg.',
      'Belöna i samma ögonblick hunden vänder — jackpot när den når dig.',
    ],
    failTips: [
      'Säg signalen när hunden redan tittar på dig.',
      'Byt till godare belöning och gör tre supersmå reps.',
    ],
  },
  {
    id: 'home_2m',
    label: 'Inne · 2 m',
    criteria: 'Hunden kommer 2 m på första signalen. Belöna vid kontakt + när den når dig.',
    tips: [
      'Öka till ~2 m. En signal. Backa när hunden kommer.',
      'Dubbelbelöna: vid vändning och vid nosen hos dig.',
    ],
    failTips: [
      'Gå tillbaka till 1 m tills tre lyckade i rad.',
      'Ge fri efter belöning så “kom” inte betyder att leken tar slut.',
    ],
  },
  {
    id: 'garden_low',
    label: 'Ute · låg störning',
    criteria: 'Enkelt ute (tom gård). Kort avstånd. Belöna snabbt och generöst.',
    tips: [
      'Tom gård, kort avstånd. Samma signal som inne.',
      'Belöna generöst ute — miljön konkurrerar.',
    ],
    failTips: [
      'Gå närmare eller tillbaka inne en stund.',
      'Använd långlina om frihet vinner.',
    ],
  },
  {
    id: 'park_low',
    label: 'Ute · låg störning (park)',
    criteria: 'Korta avstånd, långlina vid behov. Belöna med hög värde-belöning.',
    tips: [
      'Korta avstånd, långlina på. En signal.',
      'Högvärdesbelöning (lek/mat) vid dig, sedan fri ut på linan igen.',
    ],
    failTips: [
      'Korta avståndet och höj belöningsvärdet.',
      'Avsluta efter en lyckad — nöta inte i stökig park.',
    ],
  },
  {
    id: 'park_medium',
    label: 'Ute · medel störning',
    criteria: 'Öka störning gradvis. Backa nivå om latens blir lång eller miss ökar.',
    tips: [
      'Öka störning bara om latensen fortfarande är kort.',
      'Hellre backa nivå än upprepa signalen.',
    ],
    failTips: [
      'Backa till park med lägre störning eller kortare avstånd.',
      'Två miss i rad → en lyckad på lättare nivå och avsluta.',
    ],
  },
],
```

Repeat for all other exercises until the gate passes. Prefer deriving tips from each rung’s `criteria` and the exercise guide’s fail language.

- [ ] **Step 4: Run gate — expect PASS**

Run: `npx vitest run src/lib/training/exercise-guide-quality.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/training/exercise-specs.ts src/lib/training/exercise-guide-quality.test.ts
git commit -m "feat(training): curate level tips and failTips for all ladder rungs"
```

---

### Task 3: ExerciseRow — desc, focusTips, failTips

**Files:**
- Modify: `src/components/TrainingCard/ExerciseRow.tsx`
- Modify: `src/components/TrainingCard/ExerciseRow.module.css`
- Modify: `src/components/TrainingCard/ExerciseRow.test.tsx`
- Modify: `src/lib/training/session-coach.ts` (shorten `GUIDE_FAIL_HINT` — tips are inline now)

**Interfaces:**
- Consumes: `resolveLiveCoach`, `buildCoachAction`, `getLifeStage(ageWeeks)`, `exercise.desc`, `exercise.sources`
- Produces: card UI showing desc + focusTips; failTips list when `showFailTips`

- [ ] **Step 1: Update tests**

In `ExerciseRow.test.tsx`, assert:

```ts
expect(screen.getByText(exercise.desc)).toBeTruthy()
// after mocking coach lower / or setting metrics that trigger lower:
// expect fail tip text from resolveLiveCoach / rung.failTips
```

Add a case that when coach kind is lower, a fail tip string from the active rung is visible. Prefer driving via metrics + guard props already used by the component; if the component needs a test hook, call `resolveLiveCoach` in render (preferred — no new prop).

- [ ] **Step 2: Wire `resolveLiveCoach` in `ExerciseRow`**

After `buildCoachAction(...)`:

```ts
import { resolveLiveCoach } from '@/lib/training/live-coach'
import { getLifeStage } from '@/lib/dog/age'

const live = spec
  ? resolveLiveCoach({
      spec,
      levelId: criteriaLevelId,
      coachKind: coach?.kind ?? null,
      exerciseLabel: exercise.label,
      exerciseId: exercise.id,
      lifeStage: getLifeStage(ageWeeks),
      sources: sources,
    })
  : null
```

UI changes in head / coach sections:

1. Show `{exercise.desc}` in a `styles.descText` paragraph (under name / badge). Prefer desc over long `definition` on the card — keep definition only if `!exercise.desc`.
2. If `live?.focusTips.length`, render a short list under criteria.
3. When `live?.showFailTips`, under coach message render:

```tsx
<ul className={styles.failTips}>
  {live.failTips.map((t) => (
    <li key={t}>{t}</li>
  ))}
</ul>
```

- [ ] **Step 3: Shorten session-coach hint**

Replace `GUIDE_FAIL_HINT` with:

```ts
const GUIDE_FAIL_HINT =
  'Se felsökningen under kortet, eller öppna guiden för mer.'
```

Update `session-coach.test.ts` expectations from `/Om det inte funkar/` to `/felsökningen|guiden/i`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/TrainingCard/ExerciseRow.test.tsx src/lib/training/session-coach.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/TrainingCard/ExerciseRow.tsx src/components/TrainingCard/ExerciseRow.module.css src/components/TrainingCard/ExerciseRow.test.tsx src/lib/training/session-coach.ts src/lib/training/session-coach.test.ts
git commit -m "feat(training): show desc and level fail tips on exercise cards"
```

---

### Task 4: GuideSheet nivåblock + chat CTA params

**Files:**
- Modify: `src/components/ExerciseGuideSheet.tsx`
- Modify: `src/components/ExerciseGuideSheet.test.tsx`
- Modify: `src/components/ExerciseGuideSheet.module.css` (if needed)

**Interfaces:**
- Consumes: `resolveLiveCoach`, `metrics.criteria_level_id`, `ageWeeks` (add prop if missing — pass from parent)
- Produces: “På din nivå” section; chat URL with `question`, `topic`, `lifeStage`

- [ ] **Step 1: Ensure `ageWeeks` prop exists on GuideSheet** (add if absent; wire from TrainingCard / open-guide caller)

- [ ] **Step 2: Build live view + chat URL**

```ts
const live = resolveLiveCoach({
  spec,
  levelId: metrics?.criteria_level_id ?? null,
  coachKind: null,
  exerciseLabel: exerciseLabel ?? prettyLabel(exerciseId),
  exerciseId,
  lifeStage: getLifeStage(ageWeeks),
})

const coachQuestion = [ /* existing bits using live.chatContext.levelLabel */ ].join(' ')

const chatHref =
  `/chat?question=${encodeURIComponent(coachQuestion)}` +
  `&topic=${encodeURIComponent(live.chatContext.topic)}` +
  `&lifeStage=${encodeURIComponent(live.chatContext.lifeStage)}`
```

Include in question text: övningslabel, topic, lifeStage, nivålabel — never raw `criteria_level_id`.

- [ ] **Step 3: Render “På din nivå”** after summary / before setup:

```tsx
{live.levelLabel && (
  <section>
    <h3>På din nivå</h3>
    <p><strong>{live.levelLabel}</strong> — {live.levelCriteria}</p>
    {live.focusTips.map((t) => <p key={t}>{t}</p>)}
  </section>
)}
```

- [ ] **Step 4: Tests**

- Assert “På din nivå” appears when metrics have a known level.
- Assert chat button href / navigation includes `topic=` and `lifeStage=` and does not include raw `home_2m` as the only level cue (level label text OK).

- [ ] **Step 5: Run + commit**

Run: `npx vitest run src/components/ExerciseGuideSheet.test.tsx`  
Expected: PASS

```bash
git add src/components/ExerciseGuideSheet.tsx src/components/ExerciseGuideSheet.test.tsx src/components/ExerciseGuideSheet.module.css
# plus TrainingCard wiring for ageWeeks if changed
git commit -m "feat(training): show level block in guide and pass topic to chat"
```

---

### Task 5: PreSessionChecklist from active exercise

**Files:**
- Modify: `src/components/TrainingCard/PreSessionChecklist.tsx`
- Modify: `src/components/TrainingCard/TrainingCard.tsx`
- Modify: `src/components/PuppyDayCard/PuppyDayCard.tsx` (if it mounts checklist)

**Interfaces:**
- Consumes: `resolveLiveCoach` output `checklistItems` OR props: `items: string[]`
- Produces: checklist shows level + tip + optional source

- [ ] **Step 1: Change props**

```ts
interface Props {
  ageWeeks: number
  dateKey: string
  dogId: string
  items?: string[] // from resolveLiveCoach.checklistItems; fallback to generic if empty
}
```

Render `items` when provided (length ≥ 1); otherwise keep current generic bullets + `durationHint`.

- [ ] **Step 2: In TrainingCard**, for first incomplete today’s exercise (or first exercise), compute:

```ts
const focusEx = todayExercises.find(...) // first not complete, else [0]
const focusSpec = focusEx ? getExerciseSpec(focusEx.id) : null
const checklistItems = focusSpec
  ? resolveLiveCoach({
      spec: focusSpec,
      levelId: metricsByExercise[focusEx.id]?.criteria_level_id ?? null,
      coachKind: null,
      exerciseLabel: focusEx.label,
      exerciseId: focusEx.id,
      lifeStage: getLifeStage(ageWeeks),
      sources: focusEx.sources,
    }).checklistItems
  : undefined

<PreSessionChecklist ... items={checklistItems} />
```

Mirror in `PuppyDayCard` if applicable.

- [ ] **Step 3: Smoke test** (add small unit test or component test that custom `items` render)

- [ ] **Step 4: Commit**

```bash
git add src/components/TrainingCard/PreSessionChecklist.tsx src/components/TrainingCard/TrainingCard.tsx src/components/PuppyDayCard/PuppyDayCard.tsx
git commit -m "feat(training): personalize pre-session checklist from active level"
```

---

### Task 6: Chat retrieval filters (topic + lifeStage)

**Files:**
- Modify: `src/lib/ai/rag.ts` (`QueryRAGOptions` + `searchBreedChunks` call)
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/components/ChatInterface.tsx`
- Modify: `src/app/chat/page.tsx`
- Test: add/extend a focused test if rag has tests; otherwise route-level unit for body parsing

**Interfaces:**
- Consumes: `ChunkTopic`, `LifeStageFilter` from chunk-metadata
- Produces: optional `topic` + `lifeStage` on chat POST body and URL params flow into filtered retrieval

- [ ] **Step 1: Extend RAG options**

```ts
// rag.ts
export interface QueryRAGOptions {
  history?: ChatHistoryEntry[]
  dogStateContext?: string | null
  locale?: Locale
  topic?: ChunkTopic
  lifeStage?: LifeStageFilter
}
```

In retrieval:

```ts
const retrieved = await searchBreedChunks(embedding, breed, retrievalCount, {
  topic: opts.topic,
  lifeStage: opts.lifeStage,
})
```

- [ ] **Step 2: API body**

```ts
const body = await req.json() as {
  query?: string
  locale?: string
  topic?: string
  lifeStage?: string
}
// validate topic against CHUNK_TOPICS; lifeStage against puppy|junior|adolescent|adult|all
// pass to queryRAG(..., { topic, lifeStage, ... })
```

- [ ] **Step 3: Chat page + interface**

```ts
// page.tsx
const topic = searchParams.get('topic') ?? undefined
const lifeStage = searchParams.get('lifeStage') ?? undefined
<ChatInterface initialQuestion={...} initialTopic={topic} initialLifeStage={lifeStage} ... />
```

```ts
// ChatInterface send body
body: JSON.stringify({
  query,
  dogId,
  locale: i18n.language,
  topic: initialTopic,
  lifeStage: initialLifeStage,
})
```

- [ ] **Step 4: Run relevant tests + commit**

```bash
npx vitest run src/lib/ai/rag.ts src/lib/learning/chunk-metadata.test.ts 2>/dev/null; npx tsc --noEmit
git add src/lib/ai/rag.ts src/app/api/chat/route.ts src/components/ChatInterface.tsx src/app/chat/page.tsx
git commit -m "feat(chat): filter RAG by topic and lifeStage from session CTA"
```

---

### Task 7: Full verification

**Files:** none new

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`  
Expected: all PASS

- [ ] **Step 2: Production build**

Run: `npx next build`  
Expected: success (network may be needed for fonts)

- [ ] **Step 3: Manual smoke (Vercel after push)**

1. Dagens pass → kort visar `desc`  
2. Välj nivå → focusTips syns  
3. Logga missar till lower/stop → 1–2 failTips under coach  
4. Guide → “På din nivå”  
5. Chat CTA URL innehåller `topic` + `lifeStage`, fråga utan rått level-id  
6. PreSessionChecklist nämner dagens nivå  

- [ ] **Step 4: Push only if user asks**

---

## Spec coverage check

| Spec-krav | Task |
|-----------|------|
| Per-rung tips/failTips + fallback | 1, 2 |
| failTips vid lower/stop på kort | 3 |
| `exercise.desc` på kort | 3 |
| Specs i pass / docs efter | 1–3 (docs unchanged) |
| Checklist nivå + källa | 5 |
| Chat label/topic/lifeStage | 4, 6 |
| Inga råa ladder-id | 1, 2, 4 |
| Tester + build | 1–7 |
