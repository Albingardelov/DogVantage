# Fas 1 — Breeds: Design spec

**Issues:** #77 (BREEDS-1), #78 (BREEDS-2), #79 (BREEDS-3)
**Datum:** 2026-05-15

---

## Sammanfattning

Expanderar rassstödet från 4 hårdkodade raser till ~356 FCI-raser. Delas i två PR:

- **PR 1 (BREEDS-1+2):** Typ-byte, statiskt register, FCI-grupprofiler, autocomplete-picker i onboarding. Gör appen launchbar med valfri ras.
- **PR 2 (BREEDS-3):** Topp-50 fullständiga BreedProfiles + ingest-pipeline för RAG-chunks.

---

## PR 1 — Registry, typbyte, fallback, UI

### 1. Typ-ändring (`src/types/index.ts`)

`Breed` ändras från union till `string`:

```ts
// Före
export type Breed = 'labrador' | 'italian_greyhound' | 'braque_francais' | 'miniature_american_shepherd'

// Efter
export type Breed = string
export type BreedOrGeneral = Breed | 'general'
```

Ingen DB-migration behövs — `dog_profiles.breed` är redan `text` i Supabase.

### 2. Rasregister (`src/lib/breeds/registry.ts`)

Ny fil med alla ~356 FCI-raser som konstant array:

```ts
export interface BreedEntry {
  slug: string       // maskin-ID, t.ex. 'golden_retriever'
  nameSv: string     // svenska visningsnamnet
  nameEn: string
  fciGroup: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  fciNumber: number
}

export const BREED_REGISTRY: BreedEntry[]
export function isValidBreed(s: string): boolean
export function getBreedEntry(slug: string): BreedEntry | undefined
```

De 4 befintliga raserna behåller sina slugs (`labrador`, `italian_greyhound`, `braque_francais`, `miniature_american_shepherd`) — inga befintliga hundprofiler i DB behöver migreras.

### 3. FCI-grupprofiler och fallback (`src/lib/breeds/fci-groups.ts`)

En `BreedProfile` per FCI-grupp (10 st). Täcker temperament, sensitivity, suggestedGoals, hiddenGoals, breedSkills, trainingCautions och activityGuidelines på gruppnivå.

| Grupp | Beskrivning | Exempel |
|-------|-------------|---------|
| 1 | Vall- och bokapshundar | Border Collie, Schäfer |
| 2 | Pinscher, Schnauzer, Molosser, Bergshundar | Rottweiler, Boxer |
| 3 | Terrierr | Jack Russell, Airedale |
| 4 | Taxar | Tax |
| 5 | Spetsar och urtyper | Husky, Akita |
| 6 | Drevhundar | Beagle, Hamiltonsstövare |
| 7 | Stående fågelhundar | Vizsla, Weimaraner |
| 8 | Apporterande, stötande, vattenhundar | Golden Retriever, Spaniel |
| 9 | Sällskapshundar | Pudel, Bichon |
| 10 | Vinthundar | Greyhound, Whippet |

### 4. Fallback-resolver (`src/lib/ai/breed-profiles.ts`)

Ny funktion ersätter `getBreedProfile`:

```ts
export function resolveBreedProfile(slug: string): BreedProfile
```

Logik: `BREED_PROFILES[slug]` → om saknas, hämta `fciGroup` via `getBreedEntry(slug)` → returnera `FCI_GROUP_PROFILES[fciGroup]`. Kastar aldrig — alla giltiga slugs täcks av en av de 10 grupperna.

Alla anrop till `getBreedProfile(breed)` i appen byts till `resolveBreedProfile(breed)`.

### 5. Autocomplete-picker (`src/components/BreedPicker.tsx`)

- Fritext-input filtrerar `BREED_REGISTRY` på `nameSv` + `nameEn` client-side
- Visar max 8 träffar i dropdown under input
- Val sätter `slug` som värde (kompatibelt med `DogProfile.breed`)
- Tom sökning → "Hittade ingen ras — kontrollera stavningen"
- Används i onboarding (`src/app/onboarding/page.tsx`)

---

## PR 2 — Topp-50 profiler + ingest (BREEDS-3)

### 1. Topp-50 BreedProfiles

De 4 befintliga profilerna i `src/lib/ai/breed-profiles.ts` behålls. Ytterligare ~46 skrivs med samma `BreedProfile`-interface. Urval baseras på SKK-registreringsstatistik (vanligaste raser i Sverige). Källmaterial: FCI-standarder, SKK rasstandards.

### 2. Ingest-script (`scripts/ingest-breed-profiles.ts`)

Körs manuellt / via admin-UI. Flöde per ras:

1. Ta `BreedProfile` från `BREED_PROFILES`
2. Chunk:a till RAG-dokument (ett chunk per logisk sektion: `temperament`, `breedSkills`, `trainingCautions`, `activityGuidelines`)
3. Generera embedding via befintlig pipeline (OpenAI / Groq)
4. Upsert till `breed_chunks`-tabellen med `breed = slug`

Raser utan fullständig profil får inga chunks — de faller tillbaka på FCI-gruppens prompt-block i AI-anropen direkt.

---

## Beroenden och gränser

- PR 1 blockar **REFACTOR-1** (#67) — `Breed`-typen blir `string` här, REFACTOR-1 bygger vidare
- PR 2 är fristående och kan göras parallellt med Fas 2
- Ingen DB-migration krävs för PR 1
- Befintliga 4 raser fungerar under hela migreringen

## Filer som berörs

### PR 1
- `src/types/index.ts` — typ-byte
- `src/lib/breeds/registry.ts` — ny
- `src/lib/breeds/fci-groups.ts` — ny
- `src/lib/ai/breed-profiles.ts` — lägg till `resolveBreedProfile`, ändra `BREED_PROFILES` till `Partial<Record<string, BreedProfile>>`
- `src/components/BreedPicker.tsx` — ny
- `src/app/onboarding/page.tsx` — byt till BreedPicker
- Alla filer som anropar `getBreedProfile` — byt till `resolveBreedProfile`

### PR 2
- `src/lib/ai/breed-profiles.ts` — lägg till ~46 profiler
- `scripts/ingest-breed-profiles.ts` — ny
