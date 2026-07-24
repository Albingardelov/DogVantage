# Exercise Guide Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Skriv om alla övningsguider till konkret hur+därför med kuraterade fail-varianter, och visa dem i Guide-sheet / kort-preview — utan video och utan AI som uppfinner ny teknik.

**Architecture:** `ExerciseSpec.guide` får en ny typ (`HandlerGuide`) med `todaySummary`, steg som `{how, why}`, `successLooksLike`, `whenItFails`, `wrapUp` och `variants[]`. UI (`ExerciseGuideSheet`, `ExerciseRow`) renderar den nya formen. Innehåll kurateras manuellt i `exercise-specs.ts` för hela katalogen. AI/chat får bara förklara och peka på befintliga `variant.id`.

**Tech Stack:** TypeScript, Next.js App Router, React, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-07-24-exercise-guide-rewrite-design.md`

## Global Constraints

- Ingen video / externa klipp.
- Max 2 `variants` per övning; dolda bakom “Det går inte”.
- Svenska i all guidetext (nuvarande språk i specs).
- Progression (`definition`, `ladder`, metrics) orörda i beteende.
- AI får inte generera nya fysiska tekniker i passet — bara förklara / välja bland `variants`.
- Inga råa ladder-id:n synliga i ägar-UI.

---

## File map

| Fil | Ansvar |
|-----|--------|
| `src/lib/training/exercise-specs.ts` | Typer + alla kuraterade guider |
| `src/lib/training/exercise-guide-quality.test.ts` | Gate: varje guide följer nya formen |
| `src/components/ExerciseGuideSheet.tsx` (+ `.module.css`) | Full guide-UI |
| `src/components/TrainingCard/ExerciseRow.tsx` | Preview: `todaySummary` / `steps[0].how` |
| `src/components/TrainingCard/ExerciseRow.test.tsx` | Uppdatera fixture |
| `src/app/api/training/custom/route.ts` | Validering + AI-prompt för egna övningar |

---

### Task 1: Ny `HandlerGuide`-typ + kvalitetsgate

**Files:**
- Modify: `src/lib/training/exercise-specs.ts` (typer högst upp; lämna innehåll till senare tasks)
- Create: `src/lib/training/exercise-guide-quality.test.ts`
- Modify: `src/components/TrainingCard/ExerciseRow.test.tsx` (fixture till ny form så typerna kompilerar)

**Interfaces:**
- Produces:
```typescript
export interface GuideStep {
  how: string
  why: string
}

export interface GuideVariant {
  id: string
  label: string
  whenToUse: string
  how: string[]
  why: string
}

export interface HandlerGuide {
  todaySummary: string
  setup: string[]
  steps: GuideStep[]
  successLooksLike: string
  whenItFails: string[]
  wrapUp: string[]
  variants?: GuideVariant[]
}

// ExerciseSpec.guide?: HandlerGuide
// Behåll logging/commonMistakes/stopRules INTE — ersätts av whenItFails + wrapUp + successLooksLike
```

- [ ] **Step 1: Write the failing quality-gate test**

`src/lib/training/exercise-guide-quality.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { EXERCISE_SPECS } from './exercise-specs'

describe('HandlerGuide quality gate', () => {
  const entries = Object.values(EXERCISE_SPECS).filter((s) => s.guide)

  it('every guided exercise uses the new HandlerGuide shape', () => {
    expect(entries.length).toBeGreaterThan(10)
    for (const spec of entries) {
      const g = spec.guide!
      expect(g.todaySummary?.trim().length, spec.exerciseId).toBeGreaterThan(10)
      expect(g.setup.length, spec.exerciseId).toBeGreaterThanOrEqual(2)
      expect(g.steps.length, spec.exerciseId).toBeGreaterThanOrEqual(4)
      for (const step of g.steps) {
        expect(step.how?.trim().length, `${spec.exerciseId} how`).toBeGreaterThan(8)
        expect(step.why?.trim().length, `${spec.exerciseId} why`).toBeGreaterThan(8)
      }
      expect(g.successLooksLike?.trim().length, spec.exerciseId).toBeGreaterThan(10)
      expect(g.whenItFails.length, spec.exerciseId).toBeGreaterThanOrEqual(2)
      expect(g.wrapUp.length, spec.exerciseId).toBeGreaterThanOrEqual(1)
      if (g.variants) {
        expect(g.variants.length, spec.exerciseId).toBeLessThanOrEqual(2)
        for (const v of g.variants) {
          expect(v.id).toMatch(/^[a-z0-9_]+$/)
          expect(v.how.length).toBeGreaterThanOrEqual(2)
          expect(v.whenToUse.trim().length).toBeGreaterThan(8)
        }
      }
    }
  })

  it('owner-facing guide text does not expose raw ladder ids as prose', () => {
    for (const spec of entries) {
      const blob = JSON.stringify(spec.guide)
      for (const rung of spec.ladder) {
        expect(blob.includes(`"${rung.id}"`) || !blob.includes(rung.id), `${spec.exerciseId} leaked ${rung.id}`).toBe(true)
        // Allow id only inside structured ladder elsewhere — guide blob should not contain bare rung ids as words
        expect(new RegExp(`\\b${rung.id}\\b`).test(blob), `${spec.exerciseId} contains ${rung.id}`).toBe(false)
      }
    }
  })
})
```

- [ ] **Step 2: Run test — expect FAIL (old guide shape)**

Run: `npx vitest run src/lib/training/exercise-guide-quality.test.ts`
Expected: FAIL — `todaySummary` / `steps[0].how` undefined.

- [ ] **Step 3: Replace guide types in `exercise-specs.ts`**

Replace `guide?: { setup; steps: string[]; logging; commonMistakes; stopRules }` with `HandlerGuide` as above. Export the new interfaces.

Temporarily convert **one** exercise (`marker` or `sitt`) to the new shape so TypeScript can compile the file while other guides are updated in later tasks — OR convert all guides to stub `HandlerGuide` objects with `TODO`-free minimal real Swedish text (≥ quality gate mins). Prefer: update **all** guide objects to the new TypeScript shape in this task with **placeholder-quality content that still passes the gate** (real Swedish sentences, not "TODO"), then polish voice in content tasks. Fastest path that keeps `tsc` green:

For every existing `guide`, mechanically map:
- `todaySummary`: first sentence from old `definition` rephrased as “Idag tränar ni …”
- `steps`: each old step string → `{ how: old, why: 'Så här byggs beteendet steg för steg.' }` (will be rewritten in Task 4–6)
- `successLooksLike`: copy `definition`
- `whenItFails`: copy `troubleshooting` (or first 2)
- `wrapUp`: copy `stopRules` (or one wrap sentence)
- drop `logging` / `commonMistakes` from guide (logging stays explained lightly in wrapUp if needed)

- [ ] **Step 4: Fix `ExerciseRow.test.tsx` fixture**

```typescript
guide: {
  todaySummary: 'Idag lär ni sitt med locking.',
  setup: ['Ha godis i hand', 'Träna inne utan störning'],
  steps: [
    { how: 'Locka rumpan ner, markera, belöna', why: 'Hunden förstår vad som ger belöning.' },
    { how: 'Vänta en sekund i sitt innan belöning', why: 'Bygger lite stadga utan att pressa.' },
    { how: 'Ge fri med glad ton', why: 'Sitt får ett tydligt slut.' },
    { how: 'Gör 3–5 reps och avsluta', why: 'Korta pass sitter bättre än långa.' },
  ],
  successLooksLike: 'Rumpan i marken på första försöket, utan att du tjatar.',
  whenItFails: ['Gå tillbaka till locking utan signal.', 'Byt till godare belöning.'],
  wrapUp: ['Avsluta efter en lyckad rep.'],
},
```

- [ ] **Step 5: Run quality gate + ExerciseRow tests**

Run: `npx vitest run src/lib/training/exercise-guide-quality.test.ts src/components/TrainingCard/ExerciseRow.test.tsx`
Expected: PASS (mechanical migration ok; voice polish later).

- [ ] **Step 6: Commit**

```bash
git add src/lib/training/exercise-specs.ts src/lib/training/exercise-guide-quality.test.ts src/components/TrainingCard/ExerciseRow.test.tsx
git commit -m "refactor(training): HandlerGuide type + quality gate for all exercise guides"
```

---

### Task 2: `ExerciseGuideSheet` — ny layout + “Det går inte”

**Files:**
- Modify: `src/components/ExerciseGuideSheet.tsx`
- Modify: `src/components/ExerciseGuideSheet.module.css`
- Create: `src/components/ExerciseGuideSheet.test.tsx`

**Interfaces:**
- Consumes: `HandlerGuide` from Task 1
- Produces: UI sections in order from spec; variants behind toggle

- [ ] **Step 1: Write failing UI test**

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ExerciseGuideSheet from './ExerciseGuideSheet'
import type { ExerciseSpec } from '@/lib/training/exercise-specs'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const spec: ExerciseSpec = {
  exerciseId: 'inkallning',
  definition: 'Kommer hela vägen in.',
  ladder: [{ id: 'home_2m', label: 'Inne 2 m', criteria: '2 m inne' }],
  troubleshooting: [],
  guide: {
    todaySummary: 'Idag bygger ni en glad inkallning på kort avstånd.',
    setup: ['Träna inne eller inhägnat', 'Ha högvärdig belöning redo'],
    steps: [
      { how: 'Säg namnet. När hunden tittar: säg kom och backa två steg.', why: 'Rörelse bakåt gör dig mer intressant än miljön.' },
      { how: 'Belöna vid vändning och igen när hunden når dig.', why: 'Dubbel belöning bygger fart in till dig.' },
      { how: 'Ge fri och släpp ut igen.', why: 'Kom ska inte betyda att kul tar slut.' },
      { how: 'Gör 3–5 reps och avsluta på lyckad.', why: 'Korta pass håller kvaliteten hög.' },
    ],
    successLooksLike: 'Hunden vänder direkt och springer hela vägen in på första signalen.',
    whenItFails: ['Gå närmare innan du ropar.', 'Byt till godare belöning.'],
    wrapUp: ['Sluta efter en tydlig lyckad rep.'],
    variants: [
      {
        id: 'toy_chase',
        label: 'Leksaksjakt',
        whenToUse: 'När maten känns platt idag.',
        how: ['Samma korta avstånd', 'Belöna med 3 sek lek vid dig'],
        why: 'Byter valuta till det som motiverar just nu.',
      },
    ],
  },
}

describe('ExerciseGuideSheet', () => {
  it('renders how+why steps and hides variants until Det går inte', async () => {
    const user = userEvent.setup()
    render(
      <ExerciseGuideSheet
        exerciseId="inkallning"
        exerciseLabel="Inkallning"
        onClose={vi.fn()}
        customSpecs={{ inkallning: spec }}
      />,
    )
    expect(screen.getByText(/glad inkallning/i)).toBeInTheDocument()
    expect(screen.getByText(/Rörelse bakåt gör dig mer intressant/i)).toBeInTheDocument()
    expect(screen.queryByText('Leksaksjakt')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Det går inte/i }))
    expect(screen.getByText('Leksaksjakt')).toBeInTheDocument()
  })

  it('chat CTA uses label not raw exercise id jargon in question', async () => {
    const push = vi.fn()
    vi.mocked(await import('next/navigation')).useRouter = () => ({ push } as never)
    // Simpler: assert the button exists; question built with exerciseLabel
    render(
      <ExerciseGuideSheet
        exerciseId="inkallning"
        exerciseLabel="Inkallning"
        onClose={vi.fn()}
        customSpecs={{ inkallning: spec }}
        metrics={{ success_count: 2, fail_count: 1, latency_bucket: '1to3s', criteria_level_id: 'home_2m' } as never}
      />,
    )
    expect(screen.getByRole('button', { name: /Förklara mer/i })).toBeInTheDocument()
  })
})
```

Adjust the second test if router mock is awkward — minimum bar: first test must pass.

- [ ] **Step 2: Run test — expect FAIL**

Run: `npx vitest run src/components/ExerciseGuideSheet.test.tsx`
Expected: FAIL — old sections / no “Det går inte”.

- [ ] **Step 3: Implement sheet**

Render order:
1. Title + `todaySummary`
2. **Setup** — bullets
3. **Gör så här** — each step: bold `how`, muted `why`
4. **Så vet du att det funkar** — `successLooksLike`
5. **Om det inte funkar** — `whenItFails`
6. **Avsluta** — `wrapUp`
7. Button **Det går inte** toggles variants panel (`label`, `whenToUse`, `how[]`, `why`)
8. Chat CTA: build question with `exerciseLabel` (fallback pretty label), `definition` / `successLooksLike`, metrics rates — **never** put raw `criteria_level_id` in the string; use ladder label if metrics has a level:

```typescript
const levelLabel = spec.ladder.find((r) => r.id === metrics?.criteria_level_id)?.label
```

Remove sections Logging / Vanliga fel / Stop-regler as separate blocks (content lives in new fields). Keep Learn-article secondary button.

- [ ] **Step 4: CSS** — reuse existing tokens; add `.stepHow`, `.stepWhy`, `.variantCard` (no new design system). Keep sheet scrollable.

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/components/ExerciseGuideSheet.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/ExerciseGuideSheet.tsx src/components/ExerciseGuideSheet.module.css src/components/ExerciseGuideSheet.test.tsx
git commit -m "feat(training): HandlerGuide layout with fail variants in guide sheet"
```

---

### Task 3: `ExerciseRow` preview använder `steps[0].how`

**Files:**
- Modify: `src/components/TrainingCard/ExerciseRow.tsx` (~rad 297–300)
- Modify: `src/components/TrainingCard/ExerciseRow.test.tsx` (redan ny fixture)

- [ ] **Step 1: Update preview line**

Replace:
```tsx
{isNew && spec?.guide?.steps?.[0] && (
  <p className={styles.firstStep}>
    <strong>Så gör du:</strong> {spec.guide.steps[0]}
  </p>
)}
```

With:
```tsx
{isNew && (spec?.guide?.todaySummary || spec?.guide?.steps?.[0]?.how) && (
  <p className={styles.firstStep}>
    <strong>Så gör du:</strong>{' '}
    {spec.guide.steps?.[0]?.how ?? spec.guide.todaySummary}
  </p>
)}
```

Prefer `how` first (more actionable); fall back to summary.

- [ ] **Step 2: Run ExerciseRow tests**

Run: `npx vitest run src/components/TrainingCard/ExerciseRow.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/TrainingCard/ExerciseRow.tsx src/components/TrainingCard/ExerciseRow.test.tsx
git commit -m "fix(training): show first how-step on new exercise cards"
```

---

### Task 4: Golden content — inkallning, koppel, sitt, plats

**Files:**
- Modify: `src/lib/training/exercise-specs.ts` (dessa fyra övningars `guide` + `variants`)

**Voice rules (apply to every rewrite):**
- `how`: imperativ, kropp/röst/belöning synlig
- `why`: en mening, ägarens nytta
- Inga ladder-id:n i text
- 4–6 steps, 0–2 variants

- [ ] **Step 1: Rewrite `inkallning.guide` to this content (edit in place)**

```typescript
guide: {
  todaySummary: 'Idag bygger ni en glad inkallning: hunden vänder och springer hela vägen in till dig.',
  setup: [
    'Börja inne eller i inhägnad trädgård — ingen trafik, inga andra hundar.',
    'Ha belöning som är bättre än omgivningen (extra god mat eller favoritleksak).',
    'Planera 3–5 minuter. Hellre korta lyckade reps än långt tjat.',
  ],
  steps: [
    {
      how: 'Stå några steg ifrån. Säg namnet en gång. När hunden tittar: säg er inkallningssignal (“kom”) och backa två steg med glad kropp.',
      why: 'När du rör dig bakåt blir du mer intressant än det hunden höll på med.',
    },
    {
      how: 'I samma ögonblick hunden vänder mot dig: belöna (markör + godis/lek). Belöna igen när nosen når dig.',
      why: 'Dubbel belöning lär “vänd = jackpot” och “kom in till dig = fest”.',
    },
    {
      how: 'Ge en tydlig fri-signal och låt hunden gå ifrån dig igen i några sekunder.',
      why: 'Annars lär sig hunden att “kom” betyder att det roliga tar slut — då blir den seg.',
    },
    {
      how: 'Upprepa 3–5 gånger. Avsluta alltid efter en lyckad rep. Säg signalen bara en gång.',
      why: 'Tjat lär hunden att ignorera dig. Korta pass håller kvaliteten hög.',
    },
  ],
  successLooksLike: 'Hunden vänder direkt och kommer hela vägen in på första signalen, utan att du upprepar dig.',
  whenItFails: [
    'Gå närmare innan du ropar — börja på 1 meter om 3 meter är för svårt.',
    'Byt till godare belöning eller leksak, och belöna snabbare vid vändningen.',
    'Gör tre supersmidiga reps inne innan ni går ut igen.',
  ],
  wrapUp: [
    'Två miss i rad → gå närmare, få en lyckad, och avsluta där.',
    'Sluta medan hunden fortfarande vill mer — inte när den redan tröttnat.',
  ],
  variants: [
    {
      id: 'toy_chase',
      label: 'Leksaksjakt',
      whenToUse: 'När maten känns platt idag, eller hunden är igång och vill leka.',
      how: [
        'Samma korta avstånd och en signal.',
        'När hunden kommer: 2–5 sek dragkamp eller kasta-lek tätt intill dig.',
      ],
      why: 'Byter belöningsvaluta till det som faktiskt motiverar just den här hunden idag.',
    },
    {
      id: 'long_line_release',
      label: 'Långlina + släpp ut igen',
      whenToUse: 'När det funkar hemma men ute “hörs inte”, eller frihet vinner över dig.',
      how: [
        'Sätt långlina. Kalla en gång. Guidda in vid behov — tjata inte med rösten.',
        'Belöna vid dig, ge fri, och låt hunden gå ut på linan igen direkt.',
      ],
      why: 'Ger lycka utan att “kom” betyder fångenskap, och håller träningen ärlig i svårare miljö.',
    },
  ],
},
```

- [ ] **Step 2: Rewrite `koppel`, `sitt`, `plats` to the same quality bar** (full how+why, whenItFails, wrapUp, 1–2 variants each). Use the inkallning block as the voice reference. For `sitt` include lure → fade lure → signal; for `koppel` include “vänd när kopplet sträcks”; for `plats` include matta + fri.

- [ ] **Step 3: Run quality gate**

Run: `npx vitest run src/lib/training/exercise-guide-quality.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/training/exercise-specs.ts
git commit -m "feat(training): rewrite inkallning, koppel, sitt, plats guides (how+why)"
```

---

### Task 5: Content batch — vardagslydnad & kontakt

**Files:**
- Modify: `src/lib/training/exercise-specs.ts`

Övningar: `namn`, `fokus`, `ligg`, `stanna`, `fri`, `fot`, `hantering`, `socialisering`, `impulskontroll`, `marker`

- [ ] **Step 1: Rewrite each listed exercise’s `guide` to HandlerGuide quality** (same rules as Task 4). Variants optional (0–2); prefer 1 variant where motivation/mismatch is common (t.ex. `fokus` ute, `impulskontroll` vid dörr).

- [ ] **Step 2: Run quality gate**

Run: `npx vitest run src/lib/training/exercise-guide-quality.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/training/exercise-specs.ts
git commit -m "feat(training): rewrite everyday obedience and contact guides"
```

---

### Task 6: Content batch — resterande katalog

**Files:**
- Modify: `src/lib/training/exercise-specs.ts`

Övningar: allt övrigt som har `guide` (t.ex. `stoppsignal`, `stadga`, `orientering`, `kontrollerat_sok`, `apportering`, `vatten`, `vallning`, `nosework`, `rastning`, `bett_inhibition`, `box_traning`, `ensam_traning`, `lat`, …). Om en övning saknar guide: lägg till en full `HandlerGuide`.

- [ ] **Step 1: Rewrite / add guides for remaining exercise ids**

- [ ] **Step 2: Assert coverage**

Add to `exercise-guide-quality.test.ts`:

```typescript
it('every EXERCISE_SPECS entry has a HandlerGuide', () => {
  for (const spec of Object.values(EXERCISE_SPECS)) {
    expect(spec.guide, spec.exerciseId).toBeTruthy()
  }
})
```

- [ ] **Step 3: Run quality gate**

Run: `npx vitest run src/lib/training/exercise-guide-quality.test.ts`
Expected: PASS for all ~31 exercises

- [ ] **Step 4: Commit**

```bash
git add src/lib/training/exercise-specs.ts src/lib/training/exercise-guide-quality.test.ts
git commit -m "feat(training): complete HandlerGuide rewrite for full exercise catalogue"
```

---

### Task 7: Egna övningar (custom) — validering + prompt

**Files:**
- Modify: `src/app/api/training/custom/route.ts`

- [ ] **Step 1: Update `validateCustomExerciseSpec`**

Require `guide` with:
- `todaySummary` string
- `setup` string[]
- `steps` array of `{ how: string, why: string }` length ≥ 3
- `successLooksLike` string
- `whenItFails` string[] ≥ 1
- `wrapUp` string[] ≥ 1
- optional `variants` ≤ 2 with required fields

- [ ] **Step 2: Update `SYSTEM_PROMPT`** so genererade egna övningar följer samma fält (how/why steps, todaySummary, …). Ta bort krav på `logging` / `commonMistakes` / `stopRules` som separata guide-fält.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors from custom route / exercise-specs.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/training/custom/route.ts
git commit -m "feat(training): align custom exercise generation with HandlerGuide"
```

---

### Task 8: Session-coach pekar till “Om det inte funkar”

**Files:**
- Modify: `src/lib/training/session-coach.ts` (eller där `buildCoachAction` sätter copy)
- Modify: relevant test om finns (`session-coach.test.ts`)

- [ ] **Step 1: When decision is `lower` or `stop`, append a short owner-facing hint**

Example copy: `Öppna guiden och tryck “Det går inte” om du vill byta grepp.`  
Do not invent technique text in the coach — only point to the guide.

- [ ] **Step 2: Run session-coach tests**

Run: `npx vitest run src/lib/training/session-coach.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/training/session-coach.ts src/lib/training/session-coach.test.ts
git commit -m "feat(training): point struggle coach to guide fail variants"
```

---

### Task 9: Verifiering live-path

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: all PASS

- [ ] **Step 2: Production build**

Run: `npx next build`
Expected: success (needs network for fonts if applicable)

- [ ] **Step 3: Manual smoke (Vercel efter push)**
1. Öppna dagens pass → ny övning visar “Så gör du” med hur-text  
2. Öppna guide → hur/därför syns  
3. “Det går inte” → varianter för inkallning  
4. Chat CTA innehåller “Inkallning” / nivålabel, inte `home_2m` som enda ledtråd  

- [ ] **Step 4: Push om användaren ber om det**

---

## Spec coverage check

| Spec-krav | Task |
|-----------|------|
| HandlerGuide hur+därför | 1, 4–6 |
| Alla övningar | 6 |
| UI-ordning + Det går inte | 2 |
| Kort preview | 3 |
| Max 2 varianter | 1 gate + 4–6 |
| Ingen video | Global |
| AI inte ny teknik | 2 CTA + 8 coach pointer; custom prompt Task 7 |
| Chat utan rått level-id | 2 |
| Custom exercises aligned | 7 |
| Mätning | utanför kod (produkt); ej i denna plan |

## Placeholder scan

Inga TBD-steg. Innehållstasks 5–6 kräver kuraterad svensk text per övning — kvalitetsgaten i Task 1/6 är den objektiva spärren.
