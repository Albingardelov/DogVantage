# Live coach under passet — design

**Datum:** 2026-07-26  
**Status:** approved for implementation planning  
**Scope:** P1 + P2 (in-session specs-only) + P3 i samma leverans. Bygger på HandlerGuide-rewriten (2026-07-24).

## Problem

Under reps styrs ägaren av generisk metrics-coach och en statisk guide. Nivå (`criteria_level_id`), doc-groundad `exercise.desc`, och felsökning syns för sent eller inte alls. Checklist och chat från passet saknar övning/topic/lifeStage.

## Mål

- På aktuell nivå: fokus + 1–2 fail-tips synliga när det behövs.
- `exercise.desc` syns på övningskortet (samma text som veckoplanen).
- Struggle under pass: **bara curated specs** (snabbt, ingen nätverks-hämtning).
- Längre doc-groundade tips: **efter pass** (befintlig `getStruggleAdvice`).
- PreSessionChecklist speglar aktiv övningsnivå (+ ev. en källa).
- Chat från passet skickar label, topic, lifeStage och nivålabel — aldrig rått ladder-id.

## Icke-mål

- Doc-retrieval / AI-genererade tekniktips *under* reps.
- Video.
- Ny teknik uppfunnen av AI (specs förblir sanning; AI får bara förklara/välja bland godkända varianter).
- Ombyggnad av progression/metrics-regler.

## Beslut (låsta)

| Fråga | Val |
|-------|-----|
| Nivåstyrning | Kuraterade `tips`/`failTips` per ladder-pinne; fallback till `whenItFails` → `troubleshooting` |
| Struggle i passet | Specs only (inga docs live) |
| Content-volym v1 | Alla övningar i katalogen (~27) får tips per pinne |
| Arkitektur | En `resolveLiveCoach`-modul; UI konsumerar |

## Data model

Utöka `CriteriaLevel` i `exercise-specs.ts` (finns redan `tips?: string[]`):

```ts
export interface CriteriaLevel {
  id: string
  label: string
  criteria: string
  /** 0–2 fokuspunkter för just denna pinne. */
  tips?: string[]
  /** 0–2 felsökspunkter för just denna pinne. */
  failTips?: string[]
}
```

Oförändrat: `HandlerGuide`, `troubleshooting`, `definition`, ladder-ordning.

### Contentregler

- Imperativ svenska, ägarens språk.
- Max 2 strängar per `tips` / `failTips`.
- Inga råa ladder-id:n i tipstext.
- Tomma/uteblivna fält är OK — resolver faller tillbaka.

## Live-coach-modul

Ny fil: `src/lib/training/live-coach.ts`

```ts
resolveLiveCoach(input: {
  spec: ExerciseSpec
  levelId: string | null
  coachKind: 'keep' | 'raise' | 'lower' | 'stop' | 'end_on_success' | null
  exerciseLabel: string
  exerciseDesc?: string | null
  lifeStage: LifeStage
  sources?: TrainingSourceRef[]
}): LiveCoachView
```

`LiveCoachView` (ungefär):

| Fält | Innehåll |
|------|----------|
| `levelLabel` / `levelCriteria` | Aktiv pinne |
| `focusTips` | `rung.tips` (max 2), annars `[]` |
| `failTips` | `rung.failTips` → `guide.whenItFails` → `troubleshooting` (max 2) |
| `showFailTips` | `true` om `coachKind` är `lower` eller `stop` |
| `checklistItems` | 3–4 bullets: generisk setup, nivårad, 1 focusTip, ev. “Läs mer: {source}” |
| `chatContext` | `{ label, topic, lifeStage, levelLabel }` — aldrig rått `levelId` i ägartext |

Session-coach (`buildCoachAction`) behåller metrics-logik. Live-coach **kompletterar** med tipslistan; generiska “öppna guiden”-meningar kan kortas när `failTips` visas inline.

## UI

### ExerciseRow

1. Visa `exercise.desc` under namnet (doc-groundad från veckoplanen).
2. Behåll nivåchip + “Dagens kriterium”.
3. Visa `focusTips` (1–2) när de finns.
4. När `showFailTips`: lista `failTips` under coach-meddelandet.
5. `definition` flyttas i praktiken till Guide (kortet prioriterar desc + nivå + tips). Om desc saknas: fallback till kort definition eller first-step preview.

### ExerciseGuideSheet

1. Behåll HandlerGuide-layout (how/why, whenItFails, variants).
2. Nytt block “På din nivå”: `levelLabel`, `criteria`, `tips`, `failTips` för aktiv `criteria_level_id`.
3. Chat-CTA: fråga byggd från metrics + `chatContext`; navigera med query-params `question`, `topic`, `lifeStage`.

### PreSessionChecklist

Props utökas med aktiv övning (label, level, desc/criteria, sources). Items från `checklistItems`. Fortfarande dismissbar per hund+dag.

### Efter pass

Oförändrat flöde: `getStruggleAdvice` använder `troubleshooting` + doc-retrieval för längre tips.

## Chat

- `topic` via `topicForExerciseId(exerciseId)`.
- `lifeStage` från hundens ålder (`getLifeStage` / motsvarande).
- Chat-sidan / API tar emot `topic` + `lifeStage` query/body och skickar dem till retrieval-filter där det finns stöd (`retrieveDocumentChunks` / `searchBreedChunks`).
- Ägartext och CTA får aldrig visa rått `criteria_level_id`.

## Tester

1. **Unit `live-coach.test.ts`:** fallbackkedja, max 2 tips, `showFailTips` endast lower/stop, chatContext utan ladder-id.
2. **Content-gate:** för varje rung: `tips`/`failTips` om satta har längd ≤ 2; ingen ladder-id-läcka i tipstext.
3. **UI:** ExerciseRow visar desc; failTips syns vid lower; GuideSheet har nivåblock; checklist får nivårad.
4. **Chat:** CTA/query innehåller topic + lifeStage, inte rått level-id.

## Leveransordning

1. Typer + `resolveLiveCoach` + tester  
2. Content: `tips`/`failTips` på alla ladder-rungs  
3. ExerciseRow + GuideSheet  
4. PreSessionChecklist + chat query-params / retrieval wiring  
5. Full vitest + build  

## Spec coverage

| Krav | Lösning |
|------|---------|
| Filtrera guide/troubleshooting mot nivå | Per-rung tips/failTips + resolver |
| 1–2 felsökspunkter vid lower/stop | `showFailTips` + inline på kort |
| Visa `exercise.desc` på kortet | ExerciseRow |
| Coach → specs först, docs senare | Specs i pass; docs i struggle-advice efter |
| Checklist från nivå + källa | `checklistItems` |
| Chat: label, topic, lifeStage | `chatContext` + query-params |
