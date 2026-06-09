# Puppy Zone Mode — Design Spec

**Datum:** 2026-06-09  
**Status:** Godkänd

## Bakgrund

Det befintliga veckoschemat (AI-genererad 7-dagarsplan) fungerar bra för vuxna hundar men är opraktiskt för valpar. Valpar kan vara överträtta, överstimulerade eller i "rött läge" vissa dagar — ett fast schema ger då dålig vägledning och skapar stress hos ägaren. Lösningen är ett valpspecifikt dagligt zon-check-in som ersätter veckoplanens flöde för hundar under 26 veckor.

## Arkitektur

Hundens ålder styr vilket flöde som körs:

- **Valpläge (< 26 veckor):** Zon-first. Ingen veckoplan visas. Varje dag börjar med ett check-in. Övningar väljs dynamiskt baserat på zon + progression-pool.
- **Vuxenläge (≥ 26 veckor):** Oförändrat. AI-genererad veckoplan, TrainingCard, WeekView — allt som idag.

26 veckor är den naturliga gränsen — det är där `developmental-context.ts` går från valpbaserade session-caps (max 8 min) till vuxna (15 min). Inget i vuxenflödet rörs. Valpläget är ett parallellt spår i egna komponenter.

Valpdetektering sker via befintligt `birthdate`-fält i `dog_profiles`.

## Dagligt zon-check-in

Första gången ägaren öppnar appen varje dag möts de av ett check-in innan övningarna visas.

| Zon | Signaler | Vad appen gör |
|-----|----------|---------------|
| Grön | Reglerbar, tar kontakt, nyfiken | Normalt pass — 2–3 övningar, åldersanpassade reps |
| Gul | Stissig, övertrött, svårt fokus | Mikro-pass — 1 lugn övning, färre reps, 1–3 min |
| Röd | Kaos, svårt att reglera | Inga krav — återhämtningskort med management-tips |

Zonen sparas i `daily_check_ins` och används för att färglägga historiken i kalender-vyn. Check-in visas en gång per dag — om det redan är gjort visas dagens session direkt.

## Zon → session-logik

Ingen AI-genererad veckoplan för valpar. Den tunga veckogenerering (Groq-anrop + caching) ersätts av en enklare daglig selektion. Breed-specifik RAG (vektorsökning) används fortfarande för att hämta relevanta övningar per dag:

**Grön dag**
- Progression-regler körs som vanligt
- 2–3 övningar från progression-pool + breed-specifik RAG
- Åldersbaserad session-cap gäller (developmental-context.ts)
- Räknas mot `training_week`-progression

**Gul dag**
- 1 övning ur "lugn-kategori": övningar med hög success-rate i `daily_exercise_metrics`, eller kategorierna plats/ögonkontakt/nos-arbete
- Reps halveras jämfört med grön dag
- Framing: "Kort och enkelt idag — en enkel vinst är allt ni behöver"
- Neutral för progression (varken framåt eller bakåt)

**Röd dag**
- Inga övningar visas
- Återhämtningskort med 2–3 management-tips (t.ex. sniffpromenad utan krav, burvila, fri lek på säker plats)
- Påverkar inte progression

## Datamodell

**Ny tabell: `daily_check_ins`**
```sql
dog_id  uuid  NOT NULL REFERENCES dog_profiles(id) ON DELETE CASCADE,
date    date  NOT NULL,
zone    text  NOT NULL CHECK (zone IN ('green', 'yellow', 'red')),
PRIMARY KEY (dog_id, date)
```

**Ny API-route: `/api/training/checkin`**
- `GET ?date=YYYY-MM-DD` — hämta dagens zon för aktiv hund
- `POST` — spara vald zon `{ date, zone }`

**Oförändrade tabeller:** `daily_progress`, `daily_exercise_metrics`, `training_cache`, `dog_profiles`

## UI-ändringar

**Ny komponent: `PuppyDayCard`**
Ersätter `TrainingCard` på dashboarden för valpar (< 26 veckor). Två steg:

1. **Zon-check-in** — visas om ingen zon är satt idag. Tre stora knappar (Grön/Gul/Röd) med kortbeskrivning.
2. **Session baserat på zon** — efter val visas antingen övningslista (grön/gul) eller återhämtningskort (röd).

**Återanvänds oförändrade:** `ExerciseRow`, `DayProgressBar`, `PreSessionChecklist` — fungerar direkt inuti `PuppyDayCard`.

**Kalender-vyn (`/calendar`)**
Dag-celler för valpar färgkodas med zonens färg om ett check-in finns. Vuxenhundars kalendervy rör vi inte.

**WeekView / veckoschemat**
Knappen "Visa veckans schema" i `TrainingCard` göms för valpar. Veckoplan-API:et anropas inte för hundar i valpläge.

## Vad som inte förändras

- Allt i vuxenflödet (≥ 26 veckor)
- AI-generering av veckoplan för vuxna hundar
- Progression-rules, skill-progress, developmental-context
- Befintliga tabeller och API-routes (utom att `/api/training/week` inte anropas för valpar)
