# Interactive Training Checklist — Design Spec
**Datum:** 2026-04-29  
**Status:** Approved  
**Referens:** `docs/Design/README.md` (fullständig visuell specifikation)

---

## Problem

1. Chat-svaren dumpar alltid hela veckoschemat oavsett vad användaren frågar — onödigt och störande.
2. Träningsplanen visas som råtext — inget interaktivt, ingen möjlighet att bocka av övningar eller följa progress.

---

## Lösning

### Del 1 — Chat-fix
Ändra systemprompt i `rag.ts` (chat-läge) så att AI:n svarar på den specifika frågan utan att rada upp hela veckoschemat. Schemat hör hemma i dashboarden — inte chatten.

**Nuläge:** Prompten säger "Ge ett KONKRET veckoschema: rubrik per dag eller per övning".  
**Efter:** Chatten svarar direkt och kontextuellt. Schemat hanteras av `/api/training/week`.

### Del 2 — Strukturerad veckosplan
Ny endpoint `POST /api/training/week` returnerar strukturerad JSON istället för fritext:

```typescript
interface WeekPlan {
  days: DayPlan[]
}

interface DayPlan {
  day: string        // "Måndag" | "Tisdag" | ... | "Söndag"
  rest?: boolean
  exercises?: Exercise[]
}

interface Exercise {
  id: string         // slug, t.ex. "inkallning"
  label: string      // visningsnamn
  desc: string       // kort instruktion, max 8 ord
  reps: number       // antal reps (1–5)
}
```

AI:n instrueras att returnera JSON via systemprompt. Planen cacheas i Supabase (`training_cache`-tabellen med `content` = JSON-sträng) per ras + vecka.

### Del 3 — Interaktiv checklista (TrainingCard)
`TrainingCard` ersätts med ny komponent som:
- Filtrerar ut **idag** ur veckoplanen och visar som klickbara övningar
- Varje övning har prick-räknare: en prick per rep, klicka för att fylla
- Klar (alla reps klara) → prickarna ersätts med grön bock, rad-bakgrund tonas grön
- Progress-bar överst: `X/Y klara`
- "Visa hela veckans schema"-knapp → overlay med alla 7 dagar

### Del 4 — Progress-lagring i Supabase
Ny tabell `daily_progress`:

```sql
CREATE TABLE daily_progress (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed       text NOT NULL,
  date        date NOT NULL,             -- ISO-datum, t.ex. "2026-04-29"
  exercise_id text NOT NULL,
  reps_done   int  NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(breed, date, exercise_id)
);
```

Endpoints:
- `GET /api/training/progress?breed=X&date=Y` → `{ exerciseId: repsDone }[]`
- `PATCH /api/training/progress` `{ breed, date, exerciseId, count }` → upsert

Progress sparas i **realtid** per rep-klick (optimistic update i UI, bakgrundssync).

---

## Scope

**Ingår:**
- Ny `/api/training/week` endpoint med AI + RAG + JSON-svar
- Ny `/api/training/progress` endpoint (GET + PATCH)
- Ny `daily_progress` Supabase-tabell
- Ny `TrainingCard` med `ExerciseRow` och veckovy-overlay
- Chat-prompt justeras (svarar utan att dumpa schema)
- Typer: `WeekPlan`, `DayPlan`, `Exercise` läggs till i `src/types/index.ts`

**Ingår inte (befintlig funktionalitet rörs ej):**
- `SessionLogForm` — oförändrad
- RAG-pipeline (`rag.ts`) — chat-prompts justeras, inget annat
- Supabase-schema i övrigt

---

## Visuell design
Se `docs/Design/README.md` → sektion "3a. Träningskort – Dagens pass" för exakt layout, spacing, färger och animationer.

**Design-tokens** (från README):
- Klar: `--color-green-100` bakgrund, `--color-primary` bock-cirkel
- Prick fylld: `--color-primary`; prick tom: `--color-border`; nästa: `2px solid --color-primary`
- Progress-bar: `transition: width 0.4s ease`
- Prick-klick: `transition: background 0.2s`

---

## Arkitektur & fil-förändringar

```
src/
  types/index.ts                    ← lägg till WeekPlan, DayPlan, Exercise
  lib/
    supabase/
      daily-progress.ts             ← ny (get + upsert progress)
    ai/
      week-plan.ts                  ← ny (generera + parsa WeekPlan från AI)
  app/
    api/
      training/
        week/route.ts               ← ny POST-endpoint
        progress/route.ts           ← ny GET + PATCH endpoint
  components/
    TrainingCard/
      TrainingCard.tsx              ← ersätt befintlig
      TrainingCard.module.css       ← ny
      ExerciseRow.tsx               ← ny sub-komponent
      ExerciseRow.module.css        ← ny
      WeekView.tsx                  ← ny overlay
      WeekView.module.css           ← ny
```

---

## CSS-regler (följer projektets standard)
- En `.module.css` per komponent — ingen inline `style={{}}` utom CSS custom property-värden
- Inga utility-klasser
- Alla färger och spacing via tokens från `src/styles/tokens.css`
