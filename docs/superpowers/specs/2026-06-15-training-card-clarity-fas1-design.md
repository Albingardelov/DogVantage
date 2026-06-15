# Träningspassens begriplighet — Fas 1

**Datum:** 2026-06-15
**Status:** Design, väntar på godkännande

## Bakgrund

En panelutvärdering (två hundträningsexperter, två förstagångsförare, alla med 1 års
användning) bekräftade grundarens hypotes: Förarguiderna (Learn-tab) upplevs som mer
strukturerade och lättare att förstå än övningspassen ("Dagens pass" / `TrainingCard`).

Orsaken är inte att träningslogiken är för avancerad. Den är två saker:

1. **Kognitiv överbelastning.** Innan föraren ser första övningen möts hon av pre-pass-checklista,
   dagsincheckning, veckofokus-panel, fokusväljare, progressbar, nästa-banner och en badge-legend
   med tre klickbara begrepp. Övningsraden (`ExerciseRow`) visar dessutom *samtidigt* definition,
   kriterienivå, coach-text, Lyckad/Miss, latensknappar, kriteriecykling och swap.
2. **Slutsatser utan resonemang.** Siffror (träffsäkerhet %, latens), kodade nivå-id och
   automatiska beslut ("Svag färdighet → håller/sänker nivån") visas utan det "varför" som
   guiderna alltid ger. Etiketten "Svag färdighet" läses som en anklagelse.

Guiderna följer mönstret *varför → vad du gör → vad du undviker*, en sak i taget. Fas 1 ger
övningspassen samma DNA — utan att röra träningslogiken eller datamodellen för progression.

## Mål

- En förare ska kunna öppna "Dagens pass" och förstå *vad gör jag nu* utan att tolka ett
  instrumentbräde.
- En övning som föraren aldrig tränat ska presenteras lugnt och instruktivt; en övning hon
  behärskar ska behålla den nuvarande täta kraftvyn.
- Varje siffra och automatiskt beslut ska ha ett klarspråkligt "därför" i guidernas röst.

## Avgränsning

**Ingår (Fas 1):**
- Per-övnings-mognad ("ny" vs "tränad") styr kortets visningsläge.
- Sidnivå: kollapsa planerings-klustret bakom en disclosure.
- En badge i taget + omdöpning + inline-tooltips i stället för klickbar legend.
- "Därför"-rader på coach-beslut och nyckeltal.
- Onboarding-genomgång av passet (första gången).
- "Klart för idag"-läge på sidnivå.

**Ingår INTE (senare faser):**
- Fas 2: generaliseringströskel bunden till advance, mätenhet per övning (reps/sek/meter),
  proofing-steg i ladders. (Kräver datamodell-ändring.)
- Fas 3: veckosammanfattning i prosa.

## Komponent 1 — Mognadssignal per övning

### Datakälla (Val A, godkänd)

Ett fokuserat läs-API som returnerar mängden `exercise_id` som har minst en *tidigare* dag med
faktiska försök i `daily_exercise_metrics` (`success_count + fail_count > 0`).

- **Endpoint:** `GET /api/training/exercise-history?dogId=…`
- **Auth:** `withAuthAndDog` (samma mönster som `dog-state`-routen), RLS via hundägarskap.
- **Query:** distinkta `exercise_id` ur `daily_exercise_metrics` för hunden där
  `success_count + fail_count > 0` och `date < idag`. Returnerar `{ practicedExerciseIds: string[] }`.
- **Klient:** ny hook `useExerciseHistory(dogId)` (samma form som `useDogState`/`useExerciseSources`).
- **Schema:** ny `ExerciseHistoryPayloadSchema` i `src/types/api/schemas.ts`.

"Tidigare dag" (`date < idag`) gör att dagens egna första reps inte direkt graderar upp kortet
mitt i passet — kortet graderar först nästa gång övningen dyker upp.

### Härledning

`maturity: 'new' | 'practiced'` per övning beräknas i `TrainingCard` och skickas som prop till
`ExerciseRow`: `practiced` om `practicedExerciseIds` innehåller övningens id, annars `new`.
Custom-övningar utan historik räknas som `new`.

## Komponent 2 — Kortets visningslägen (`ExerciseRow`)

En ny prop `maturity` styr vad som visas. Träningslogiken (coach, ladder, metrics-patchar) är
oförändrad — endast presentationen ändras.

**`new` — "Lär dig"-läge:**
- Övningsnamn, *en* badge (se Komponent 3), definition.
- Första guide-steget inline (`spec.guide.steps[0]`) + setup-rad om den finns.
- "Dagens kriterium" låst på startnivån; kriteriecykling-chipet döljs.
- Stora primära Lyckad/Miss-knappar.
- Tydlig "Öppna full guide".
- Latensknappar och swap kollapsas bakom en "Visa mer"-disclosure (de finns kvar, men inte i vägen).

**`practiced` — nuvarande kraftvy (oförändrad):**
- Ring, Lyckad/Miss, latensknappar, kriteriecykling-chip, swap, coach.
- Definitionen kollapsas (visas via "Visa mer" / guiden).

## Komponent 3 — En badge i taget

Idag kan Prioriterad / Veckofokus / Svag färdighet visas samtidigt på samma rad och konkurrera.

- `reasonBadgesForExercise` i `TrainingCard` returnerar fortsatt alla matchande skäl, men
  `ExerciseRow` visar **endast den högst prioriterade**: `weak > focus > priority`.
- Den klickbara badge-legenden överst i `TrainingCard` tas bort. Förklaringen flyttas till en
  inline (?)-tooltip på själva badgen (`title` finns redan i `detail`; vi gör den även till en
  synlig (?)-affordance).
- **Omdöpning:** "Svag färdighet" → **"Behöver mer tid"**. Tonen i `detail` skrivs om från
  konstaterande till stöd: *"Träffsäkerheten är under 80 % just nu, så vi stannar på samma nivå
  ett tag till — så ska inlärning gå till."*

## Komponent 4 — "Därför"-rader

Knyt slutsatser till resonemang i guidernas röst.

- **Coach-beslut:** när `buildCoachAction` ger `lower`/`hold`/`stop`/`raise`, komplettera meddelandet
  med en mening som refererar 80 %-regeln (t.ex. "under 80 % → vi sänker; det är inte ett
  misslyckande"). Texten centraliseras i `session-coach`-copyn så den är konsekvent.
- **Latens:** ersätt/komplettera "Svarstid efter signal" med en tolkningsrad — vad <1s / 1–3s / >3s
  *betyder* och om det pekar på timing (förare) eller svårighetsgrad (övning).
- **Nivå-id:** kodade id (`outdoor_medium`, `home_fade_lure`) ska aldrig exponeras i UI:t — endast
  `CriteriaLevel.label`. Verifiera att inget läge läcker råa id (chat-frågan i `ExerciseGuideSheet`
  får behålla id internt men formulerar om till label i synlig text).

## Komponent 5 — Onboarding-genomgång

En lättviktig, avfärdbar första-gångs-overlay på "Dagens pass".

- Visas när föraren öppnar passet första gången (per `dogId`). Persistens: en flagga i
  `localStorage` (`dv:onboarded:training:<dogId>`) — ingen serverändring i Fas 1.
- Steg: (1) vad ett övningskort är, (2) Lyckad/Miss, (3) vad "Dagens kriterium" betyder,
  (4) var guiden finns, (5) att appen anpassar nivån åt dig. Max 5 korta steg, "Hoppa över" alltid synlig.
- Ren presentationskomponent, inga ikoner utanför appens eget ikonpaket, inga emojis.

## Komponent 6 — "Klart för idag"-läge

Idag visas bara en liten rad ("Du är klar för idag — bra jobbat!") i sista kortet när det inte
finns fler övningar. Fas 1 lyfter detta till ett tydligt sidnivå-tillstånd.

- När alla dagens övningar är klara (eller vid vilodag) visar `TrainingCard` ett avslutande kort:
  bekräftelse, kort sammanfattning (antal reps, träffsäkerhet idag), och CTA till logg/chat.
- Ersätter inte loggformuläret — visas efter att passet är slutfört.

## Felhantering

- `exercise-history`-läsningen är supplementär: om den faller ut behandlas alla övningar som
  `practiced` (nuvarande beteende), precis som `useDogState` failar tyst. Inget pass blockeras.
- Onboarding-overlayn får aldrig fastna: "Hoppa över" och stängning sätter localStorage-flaggan.

## Testning

- **Enhet:** `maturity`-härledning (ny vs tränad, custom-övning, tom historik, API-fel → practiced).
- **Enhet:** badge-prioritering (weak > focus > priority) och att endast en visas.
- **Enhet:** `exercise-history`-routen (distinkta id, `date < idag`, attempts-filter, RLS-väg).
- **Enhet:** "därför"-copyn för varje coach-beslut.
- **Komponent:** `ExerciseRow` i `new` vs `practiced`-läge renderar rätt synliga element.
- **Komponent:** "Klart för idag"-tillståndet när alla övningar är klara.
- Manuell verifiering i appen av onboarding-flödet och sid-disclosuren.

## Filer som berörs (preliminärt)

- `src/app/api/training/exercise-history/route.ts` (ny)
- `src/lib/supabase/` — query för practiced exercise ids (ny)
- `src/types/api/schemas.ts` — `ExerciseHistoryPayloadSchema`
- `src/components/TrainingCard/use-exercise-history.ts` (ny hook)
- `src/components/TrainingCard/TrainingCard.tsx` — maturity, disclosure, en badge, klart-läge
- `src/components/TrainingCard/ExerciseRow.tsx` — visningslägen, en badge, "Visa mer"
- `src/lib/training/session-coach.ts` (+copy) — "därför"-rader
- Onboarding-komponent (ny) + ev. `parts.tsx`
