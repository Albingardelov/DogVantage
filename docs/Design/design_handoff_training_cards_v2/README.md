# Handoff: Träningskort – "Bold ring" (Variant 2)

## Overview
Detta är en omdesign av **hur man loggar ett träningspass** i DogVantage — de kort där användaren bockar i varje rep och om hunden lyckades. Den nuvarande `ExerciseRow` upplevs som rörig och ointuitiv eftersom **rep-prickarna och Lyckad/Miss-pillren gör samma sak** (båda anropar `onRepClick`), och panelen trycker in dropdown + procent + latens på liten yta.

Omdesignen ("Bold ring") gör tre saker:
1. **Slår ihop loggningen till EN handling** — användaren trycker **✓ Lyckad** eller **✗ Miss** per rep. Det finns inga separata rep-prickar att klicka; en segmenterad progress-**ring** fylls automatiskt utifrån utfallen.
2. **Gör det belönande/motiverande** — combo-streak, "+1" som flyter upp, och ett firande klar-läge med medalj.
3. **Behåller ALL data** som idag fångas (reps, lyckad/miss → andel, latens, kriterienivå).

Samma språk appliceras på **loggformuläret efter passet** (`SessionLogForm`) så att de hänger ihop.

> **Viktigt om scope:** `ExerciseRow` används av **både** `TrainingCard` (vanligt läge) **och** det nya `PuppyDayCard` (valp-läget, grön/gul dag). Designar man om `ExerciseRow` en gång får båda lägena förbättringen automatiskt. `SessionLogForm` delas också av båda.

---

## About the Design Files
Filerna i `prototype/` är **designreferenser byggda i HTML/React (Babel-in-browser)** — de visar avsedd look och beteende, **inte produktionskod att kopiera rakt av**. Uppgiften är att **återskapa designen i den befintliga kodbasen** (Next.js + React 19 + CSS-moduler + `src/styles/tokens.css`), med projektets etablerade mönster.

Konkret: du ska skriva om **`src/components/TrainingCard/ExerciseRow.tsx` + `ExerciseRow.module.css`** och **`src/components/SessionLogForm.tsx` + `SessionLogForm.module.css`** så att de matchar prototypen, men behålla samma props, datamodell, API-anrop och Zod-scheman som idag.

### Så öppnar du prototypen
Öppna `prototype/DogVantage – Träningskort (V2).html` i en webbläsare. Den kör hela flödet: ring-kort per övning → "Nästa övning" → firande loggformulär → "Pass sparat!". Ikoner är inline-SVG (`Ph`-komponenten i `ex-shared.jsx`) — i produktion: använd era befintliga `@/components/icons` (Phosphor) istället.

---

## Fidelity
**High-fidelity.** Färger, typografi, radier, spacing och interaktioner är slutgiltiga och tagna från `src/styles/tokens.css`. Återskapa pixel-troget med era CSS-moduler och tokens. Ringen och animationerna ska kännas exakt som i prototypen.

---

## Vy 1 — Övningskort (`ExerciseRow`, ring-läge)

**Syfte:** logga reps för en övning under passet, en hand ledig.

Prototyp-referens: `ex-variant2.jsx` → `V2Card`.

### Layout (uppifrån och ned)
Kortet är ett **mörkt grönt gradient-kort** (samma gradient som appens header), vit text, rundade hörn 22px, padding 18px, skugga `0 10px 30px rgba(27,67,50,0.35)`.

1. **Topprad:** övningsikon (fill, 18px, vit) + övningsnamn (16px/700). Till höger en **GUIDE-chip** (`onOpenGuide`).
2. **Kriterie-chip** (under namnet): translucent vit pill `rgba(255,255,255,0.15)`, border `rgba(255,255,255,0.3)`, innehåll: target-ikon + nuvarande kriterienivå + en "byt"-ikon. Tryck cyklar `criteria_level_id` genom `spec.ladder` (för valp: begränsa till `spec.ladder.slice(0,2)` precis som idag).
3. **Progress-ring** (SVG, 152×152, stroke 13px), centrerad. Segmenterad: **ett segment per rep** (`exercise.reps`). Segment färgas:
   - grönt `#52b788` för en **lyckad** rep,
   - orange `#f4a261` för en **miss**,
   - `rgba(255,255,255,0.16)` för ogjorda.
   - Implementation: rita `N` `<circle>` med `strokeDasharray="${seg} ${C-seg}"`, `strokeDashoffset={-i*(C/N)}`, hela gruppen roterad `-90°`. `seg = C/N - 6` (6px gap). `transition: stroke 280ms`.
   - **Mitten:** stort `done/reps` (38px/800) + liten rad "`X% lyckade`" (eller "reps" innan första utfallet). När **komplett**: medalj-ikon (guld `#fbbf24`) + "Klart!" med `dv-pop`-animation.
4. **Combo-indikator** (rad, 22px hög, centrerad): visas när ≥2 lyckade i rad och ej komplett — pill `rgba(251,191,36,0.22)`, text `#fde68a`, eld-ikon + "`{n} i rad!`", `dv-pop` 240ms.
5. **Knappar** (när ej komplett):
   - **✓ Lyckad** — flex 2, vit bakgrund, text `var(--color-primary-dark)`, 16px/800, radie 14, padding 15px.
   - **✗ Miss** — flex 1, `rgba(255,255,255,0.12)`, border `rgba(255,255,255,0.35)`, vit text.
   - Vid tryck: logga rep (se State), och spawna en **"+1"/"miss"** som flyter upp från ringens topp (`dv-float` 850ms; grön `#9ae6b4` för lyckad, orange för miss).
6. **Latens** (3 chips, alltid synliga): `<1s` / `1–3s` / `>3s`. Vald = vit bakgrund + mörkgrön text + liten blixt-ikon i accent; oval = translucent. Sätter `latency_bucket` (`lt1s` / `1to3s` / `gt3s`). Undertext "Svarstid efter signal".
7. **Komplett-läge** (ersätter knappar+latens): två stat-rutor (**X% lyckade**, **success/done reps satt**), en full-bredds **primär CTA** ("Nästa övning" eller "Avsluta & logga pass" på sista), och en diskret "Ångra registrering"-länk (nollställer).

### Hur det mappar till nuvarande kod (viktigt)
Den enhetliga ✓/✗-handlingen finns **redan** i `ExerciseRow.tsx` (pillren gör exakt detta) — designen tar bort de dubbla mekanismerna och gör ✓/✗ till det enda sättet:

- **✓ Lyckad** → `onMetricsPatch({ success_count: successCount + 1 }); onRepClick()`
- **✗ Miss** → `onMetricsPatch({ fail_count: failCount + 1 }); onRepClick()`

Ringen härleds från **befintlig data** — ni lagrar aggregat (`metrics.success_count`, `metrics.fail_count`), inte en ordnad lista. Det räcker: färga `success_count` segment gröna, därefter `fail_count` segment orange, resten tomma. (Prototypen använder en ordnad `results[]`-array för enkelhets skull — i produktion, härled från counts. Ordningen spelar ingen visuell roll.)
- `done` = `success_count + fail_count` (= `attempts`). Behåll spärren `done >= exercise.reps` (komplett).
- `successRate` = `success_count / attempts`.
- **Behåll**: `recommendation`/`showTroubleshooting` (visa under ringen som idag, men i kortets stil), `onSwap` ("Byt mot fokus"), `sessionNext`/`rootId` (scroll-ankare), `onOpenGuide`.
- **Props oförändrade.** Inga ändringar i `/api/training/progress` eller `/api/training/metrics`.

---

## Vy 2 — Logga pass (`SessionLogForm`, firande)

**Syfte:** sammanfatta och spara passet efteråt.

Prototyp-referens: `ex-log2.jsx` → `V2LogForm`.

### Layout
1. **Hero-sammanfattning** (mörkt grönt gradient-kort överst, radie 20, vit text): confetti-ikon + "Pass klart — bra jobbat!" + **3 stat-rutor**: `{andel}%` lyckade · `{antal}` övningar · `{reps}` reps. Räkna fram från `exercises`-summaries (success/attempts, antal, summa reps).
2. **"Hur kändes passet?"** — 3 stora **betygs-kort** (Bra / Blandat / Svårt) med smiley-ikoner. Valt kort fylls med sin färg (grön `#52b788` / orange `#f4a261` / röd `#d62828`), lyfts `translateY(-2px)`, vit ikon+text. Mappar till `quick_rating` (`good`/`mixed`/`bad`).
3. **"Hundens prestation"** — `Fokus`, `Lydnad` som **5-stegs Stepper** (segmenterad: 5 tappbara fält, fyllda = `var(--color-primary)`, värde `X/5`). Mappar till `focus`, `obedience`.
4. **"Din insats som förare"** — `Timing`, `Konsekvens`, `Läsa hunden` med samma Stepper + hjälptext. Mappar till `handler_timing`, `handler_consistency`, `handler_reading`.
5. **"Nästa pass"** — 3 pills (Behåll nivå / Lättare / Kan höja). Mappar till nuvarande `nextSession`-tagg som läggs i `notes`.
6. **Anteckningar** (textarea, valfri) + **primär "Spara pass"** (check-cirkel + grön CTA).
7. **Sparat-läge:** helskärm grön gradient, medalj-ikon i cirkel (`dv-pop`), "Pass sparat!" + streak-rad. Anropa `onSaved()` efter ~1s som idag.

> Detta är **rent presentationellt** — fälten, `POST /api/logs`-payloaden och `ExerciseSummary`-listan är oförändrade. Byt bara ut `RatingIcon`/`SliderField`-markupen och CSS:en.

---

## Interactions & Behavior
- **Logga rep:** tryck ✓/✗ → ringsegment fylls (280ms), "+1"/"miss" floatar (850ms), combo uppdateras. Spärr vid `done >= reps`.
- **Komplett övning:** ring full → medalj + "Klart!" (`dv-pop` 360ms) + burst-konfetti (`Burst` i `ex-shared.jsx`, 700ms, `forwards`). CTA "Nästa övning"/"Avsluta & logga".
- **Flöde (se `ex-v2-flow.jsx`):** övning 1 → N i `Dagens pass`, progress-rad överst (klar = primary, aktiv = green-100, kommande = bg-alt). Efter sista → `SessionLogForm` → "Pass sparat!".
- **Kriterie-cykling:** tryck på kriterie-chippen stegar `criteria_level_id`.
- **Latens:** sätts per övning, alltid synlig.
- **Reduced motion:** gör animationerna villkorade av `prefers-reduced-motion: no-preference`.

## State Management
Ingen ny state utöver dagens. Per övning (i `metrics[exerciseId]`): `success_count`, `fail_count`, `latency_bucket`, `criteria_level_id`. Pass-progress i `progress[exerciseId]` (count). Behåll `sessionGuard` (consecutiveFails/Slow) för `buildRecommendation`. Inga nya endpoints; valp-lägets `/api/training/checkin` berörs inte.

## Design Tokens (från `src/styles/tokens.css`)
- **Bakgrund/yta:** `--color-bg #faf8f4`, `--color-bg-alt #f2ede5`, `--color-surface #fff`
- **Brand:** `--color-primary #2d6a4f`, `--color-primary-dark #1b4332`, `--color-primary-light #52b788`, `--color-accent #f4a261`
- **Grön-toner:** `--color-green-50 #edf8f2`, `--color-green-100 #d8f0e5`
- **Text:** `--color-text #1c1917`, `--color-text-muted #5c5752`, `--color-border #e7e0d8`, `--color-error #d62828`
- **Firande-accent (ny, lokal):** guld `#fbbf24` / `#fde68a` för combo & medalj (matchar befintlig `StreakBadge`/`Fire`-användning).
- **Radier:** kort 22, log-hero 20, knappar 14, chips/pills 999. **Skuggor:** `--shadow-primary`, samt kort-skugga `0 10px 30px rgba(27,67,50,0.35)`.
- **Typografi:** DM Sans (befintlig). Ringens mittnummer 38/800, namn 16/700.
- **Animationer (keyframes, lägg i modulen eller globals):** `dv-pop`, `dv-float`, `dv-burst` — se `<style>` i HTML-filen.

## Assets
Inga bildassets. Ikoner: använd befintliga `@/components/icons` (Phosphor) — i prototypen heter de paw-print, target, check, x, caret-right, arrows-clockwise, lightning, fire, medal, confetti, smiley/-meh/-sad, check-circle.

## Files
- `prototype/DogVantage – Träningskort (V2).html` — körbar helhet (öppna i webbläsare)
- `prototype/ex-v2-flow.jsx` — pass-flödets orkestrering (övning → logg → sparat)
- `prototype/ex-variant2.jsx` — **`V2Card`** = ring-övningskortet (motsvarar `ExerciseRow`)
- `prototype/ex-log2.jsx` — **`V2LogForm`** = loggformuläret (motsvarar `SessionLogForm`)
- `prototype/ex-shared.jsx` — `Ph` (ikoner), `useExerciseLog`, `Burst`, `Stepper`, `Section`, demo-data
- `prototype/ios-frame.jsx` — endast telefonram för förhandsvisning (ej för produktion)

### Filer att ändra i kodbasen
- `src/components/TrainingCard/ExerciseRow.tsx` + `ExerciseRow.module.css`  ← Vy 1
- `src/components/SessionLogForm.tsx` + `SessionLogForm.module.css`        ← Vy 2
- (Ingen ändring krävs i `TrainingCard.tsx` eller `PuppyDayCard/*` — de konsumerar `ExerciseRow`/`SessionLogForm` via oförändrade props och får designen automatiskt.)
