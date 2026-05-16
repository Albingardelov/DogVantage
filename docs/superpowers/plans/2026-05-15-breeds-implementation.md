# Fas 1 — Breeds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand breed support from 4 hardcoded breeds to ~356 FCI breeds, with FCI-group fallback profiles and an autocomplete picker in onboarding.

**Architecture:** Two PRs — PR 1 bundles BREEDS-1+2 (registry, type change, FCI group fallback, autocomplete UI); PR 2 is BREEDS-3 (top-50 full profiles + ingest script). All existing breed slugs (`labrador`, `italian_greyhound`, `braque_francais`, `miniature_american_shepherd`) are preserved unchanged.

**Tech Stack:** TypeScript, React, Vitest, Next.js App Router, Supabase, Gemini embedding (for BREEDS-3 ingest).

---

## File Map

### PR 1 — New files
- `src/lib/breeds/registry.ts` — 356 FCI breeds as const array + helpers
- `src/lib/breeds/registry.test.ts` — unit tests for registry helpers
- `src/lib/breeds/fci-groups.ts` — BreedProfile per FCI group (10 entries)
- `src/lib/breeds/fci-groups.test.ts` — unit tests for group coverage
- `src/components/BreedPicker.tsx` — autocomplete input component
- `src/components/BreedPicker.module.css` — styles for picker

### PR 1 — Modified files
- `src/types/index.ts` — `Breed = string`
- `src/lib/ai/breed-profiles.ts` — add `resolveBreedProfile`, update `BREED_PROFILES` type, update `formatBreedProfileShort` / `formatBreedProfile`
- `src/lib/ai/breed-profiles.test.ts` — new tests for resolveBreedProfile
- `src/components/DogProfileForm.tsx` — use BreedPicker, update goal helpers
- `src/lib/training/week-focus-copy.ts` — use `resolveBreedProfile`

### PR 2 — New files
- `scripts/ingest-breed-profiles.ts` — ingest BreedProfiles as RAG chunks

### PR 2 — Modified files
- `src/lib/ai/breed-profiles.ts` — add ~46 full BreedProfiles

---

## PR 1 — Tasks

---

### Task 1: FCI breed registry

**Files:**
- Create: `src/lib/breeds/registry.ts`

- [ ] **Step 1: Create the registry file**

```ts
// src/lib/breeds/registry.ts

export interface BreedEntry {
  slug: string
  nameSv: string
  nameEn: string
  fciGroup: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  fciNumber: number
}

export const BREED_REGISTRY: BreedEntry[] = [
  // ── Grupp 1: Vall- och bokapshundar ─────────────────────────────────────
  { slug: 'australian_shepherd',        nameSv: 'Australisk vallhund',          nameEn: 'Australian Shepherd',              fciGroup: 1, fciNumber: 351 },
  { slug: 'australian_kelpie',          nameSv: 'Australisk kelpie',             nameEn: 'Australian Kelpie',                fciGroup: 1, fciNumber: 293 },
  { slug: 'belgian_malinois',           nameSv: 'Belgisk vallhund Malinois',     nameEn: 'Belgian Shepherd Malinois',        fciGroup: 1, fciNumber: 257 },
  { slug: 'belgian_tervuren',           nameSv: 'Belgisk vallhund Tervuren',     nameEn: 'Belgian Shepherd Tervuren',        fciGroup: 1, fciNumber: 257 },
  { slug: 'berger_australien',          nameSv: 'Berger Australien',             nameEn: 'Berger Australien',                fciGroup: 1, fciNumber: 337 },
  { slug: 'border_collie',              nameSv: 'Border Collie',                 nameEn: 'Border Collie',                    fciGroup: 1, fciNumber: 297 },
  { slug: 'bouvier_des_flandres',       nameSv: 'Bouvier des Flandres',          nameEn: 'Bouvier des Flandres',             fciGroup: 1, fciNumber: 191 },
  { slug: 'collie_rough',               nameSv: 'Collie (lång)',                 nameEn: 'Rough Collie',                     fciGroup: 1, fciNumber: 156 },
  { slug: 'collie_smooth',              nameSv: 'Collie (kort)',                 nameEn: 'Smooth Collie',                    fciGroup: 1, fciNumber: 296 },
  { slug: 'dutch_shepherd',             nameSv: 'Holländsk vallhund',            nameEn: 'Dutch Shepherd',                   fciGroup: 1, fciNumber: 223 },
  { slug: 'german_shepherd',            nameSv: 'Tysk schäfer',                  nameEn: 'German Shepherd Dog',              fciGroup: 1, fciNumber: 166 },
  { slug: 'miniature_american_shepherd', nameSv: 'Miniature American Shepherd', nameEn: 'Miniature American Shepherd',      fciGroup: 1, fciNumber: 357 },
  { slug: 'shetland_sheepdog',          nameSv: 'Shetland sheepdog',             nameEn: 'Shetland Sheepdog',                fciGroup: 1, fciNumber: 88 },
  { slug: 'welsh_corgi_cardigan',       nameSv: 'Cardigan Welsh Corgi',          nameEn: 'Cardigan Welsh Corgi',             fciGroup: 1, fciNumber: 38 },
  { slug: 'welsh_corgi_pembroke',       nameSv: 'Pembroke Welsh Corgi',          nameEn: 'Pembroke Welsh Corgi',             fciGroup: 1, fciNumber: 39 },
  // ── Grupp 2: Pinscher, Schnauzer, Molosser, Bergshundar ─────────────────
  { slug: 'bernese_mountain_dog',       nameSv: 'Berner sennenhund',             nameEn: 'Bernese Mountain Dog',             fciGroup: 2, fciNumber: 45 },
  { slug: 'boxer',                      nameSv: 'Boxer',                         nameEn: 'Boxer',                            fciGroup: 2, fciNumber: 144 },
  { slug: 'bullmastiff',                nameSv: 'Bullmastiff',                   nameEn: 'Bullmastiff',                      fciGroup: 2, fciNumber: 157 },
  { slug: 'cane_corso',                 nameSv: 'Cane Corso Italiano',           nameEn: 'Cane Corso',                       fciGroup: 2, fciNumber: 343 },
  { slug: 'dobermann',                  nameSv: 'Dobermann',                     nameEn: 'Dobermann',                        fciGroup: 2, fciNumber: 143 },
  { slug: 'great_dane',                 nameSv: 'Dansk-svensk gårdshund',        nameEn: 'Great Dane',                       fciGroup: 2, fciNumber: 235 },
  { slug: 'greater_swiss_mountain_dog', nameSv: 'Stor schweizisk sennenhund',    nameEn: 'Greater Swiss Mountain Dog',       fciGroup: 2, fciNumber: 58 },
  { slug: 'mastiff',                    nameSv: 'Mastiff',                       nameEn: 'Mastiff',                          fciGroup: 2, fciNumber: 264 },
  { slug: 'miniature_pinscher',         nameSv: 'Dvärg-pinscher',               nameEn: 'Miniature Pinscher',               fciGroup: 2, fciNumber: 185 },
  { slug: 'miniature_schnauzer',        nameSv: 'Dvärg-schnauzer',              nameEn: 'Miniature Schnauzer',              fciGroup: 2, fciNumber: 183 },
  { slug: 'newfoundland',               nameSv: 'Newfoundlandshund',             nameEn: 'Newfoundland',                     fciGroup: 2, fciNumber: 50 },
  { slug: 'pinscher',                   nameSv: 'Pinscher',                      nameEn: 'Pinscher',                         fciGroup: 2, fciNumber: 184 },
  { slug: 'rottweiler',                 nameSv: 'Rottweiler',                    nameEn: 'Rottweiler',                       fciGroup: 2, fciNumber: 147 },
  { slug: 'saint_bernard',              nameSv: 'Sankt Bernhardshund',           nameEn: 'Saint Bernard',                    fciGroup: 2, fciNumber: 61 },
  { slug: 'standard_schnauzer',         nameSv: 'Schnauzer',                     nameEn: 'Standard Schnauzer',               fciGroup: 2, fciNumber: 182 },
  // ── Grupp 3: Terrier ─────────────────────────────────────────────────────
  { slug: 'airedale_terrier',           nameSv: 'Airedaleterrier',               nameEn: 'Airedale Terrier',                 fciGroup: 3, fciNumber: 7 },
  { slug: 'bedlington_terrier',         nameSv: 'Bedlingtonterrier',             nameEn: 'Bedlington Terrier',               fciGroup: 3, fciNumber: 9 },
  { slug: 'border_terrier',             nameSv: 'Borderterrier',                 nameEn: 'Border Terrier',                   fciGroup: 3, fciNumber: 10 },
  { slug: 'bull_terrier',               nameSv: 'Bullterrier',                   nameEn: 'Bull Terrier',                     fciGroup: 3, fciNumber: 11 },
  { slug: 'cairn_terrier',              nameSv: 'Cairnterrier',                  nameEn: 'Cairn Terrier',                    fciGroup: 3, fciNumber: 4 },
  { slug: 'jack_russell_terrier',       nameSv: 'Jack Russell Terrier',          nameEn: 'Jack Russell Terrier',             fciGroup: 3, fciNumber: 345 },
  { slug: 'norfolk_terrier',            nameSv: 'Norfolkterrier',                nameEn: 'Norfolk Terrier',                  fciGroup: 3, fciNumber: 272 },
  { slug: 'norwich_terrier',            nameSv: 'Norwichterrier',                nameEn: 'Norwich Terrier',                  fciGroup: 3, fciNumber: 72 },
  { slug: 'parson_russell_terrier',     nameSv: 'Parson Russell Terrier',        nameEn: 'Parson Russell Terrier',           fciGroup: 3, fciNumber: 339 },
  { slug: 'scottish_terrier',           nameSv: 'Skotsk terrier',                nameEn: 'Scottish Terrier',                 fciGroup: 3, fciNumber: 73 },
  { slug: 'west_highland_white_terrier', nameSv: 'Västhighlandsterrier (Westie)', nameEn: 'West Highland White Terrier',    fciGroup: 3, fciNumber: 85 },
  // ── Grupp 4: Tax ─────────────────────────────────────────────────────────
  { slug: 'dachshund_standard',         nameSv: 'Tax (normalstorlek)',           nameEn: 'Dachshund (Standard)',             fciGroup: 4, fciNumber: 148 },
  { slug: 'dachshund_miniature',        nameSv: 'Dvärgtax',                     nameEn: 'Dachshund (Miniature)',            fciGroup: 4, fciNumber: 148 },
  { slug: 'dachshund_rabbit',           nameSv: 'Kanintax',                     nameEn: 'Dachshund (Rabbit)',               fciGroup: 4, fciNumber: 148 },
  // ── Grupp 5: Spetsar och urtyper ─────────────────────────────────────────
  { slug: 'akita',                      nameSv: 'Akita',                         nameEn: 'Akita',                            fciGroup: 5, fciNumber: 255 },
  { slug: 'alaskan_malamute',           nameSv: 'Alaskan Malamute',             nameEn: 'Alaskan Malamute',                 fciGroup: 5, fciNumber: 243 },
  { slug: 'chow_chow',                  nameSv: 'Chow Chow',                     nameEn: 'Chow Chow',                        fciGroup: 5, fciNumber: 205 },
  { slug: 'finnish_lapphund',           nameSv: 'Finsk lapphund',               nameEn: 'Finnish Lapphund',                 fciGroup: 5, fciNumber: 189 },
  { slug: 'icelandic_sheepdog',         nameSv: 'Islandshund',                   nameEn: 'Icelandic Sheepdog',               fciGroup: 5, fciNumber: 289 },
  { slug: 'norwegian_elkhound',         nameSv: 'Norsk älghund grå',            nameEn: 'Norwegian Elkhound Grey',          fciGroup: 5, fciNumber: 242 },
  { slug: 'pomeranian',                 nameSv: 'Pommeranian',                   nameEn: 'Pomeranian',                       fciGroup: 5, fciNumber: 97 },
  { slug: 'samoyed',                    nameSv: 'Samojed',                       nameEn: 'Samoyed',                          fciGroup: 5, fciNumber: 212 },
  { slug: 'shiba',                      nameSv: 'Shiba',                         nameEn: 'Shiba',                            fciGroup: 5, fciNumber: 257 },
  { slug: 'siberian_husky',             nameSv: 'Sibirisk husky',               nameEn: 'Siberian Husky',                   fciGroup: 5, fciNumber: 270 },
  { slug: 'swedish_lapphund',           nameSv: 'Svensk lapphund',              nameEn: 'Swedish Lapphund',                 fciGroup: 5, fciNumber: 135 },
  { slug: 'swedish_vallhund',           nameSv: 'Västgötaspets',                nameEn: 'Swedish Vallhund',                 fciGroup: 5, fciNumber: 14 },
  // ── Grupp 6: Drevhundar och eftersökshundar ───────────────────────────────
  { slug: 'basset_hound',               nameSv: 'Basset Hound',                  nameEn: 'Basset Hound',                     fciGroup: 6, fciNumber: 163 },
  { slug: 'beagle',                     nameSv: 'Beagle',                        nameEn: 'Beagle',                           fciGroup: 6, fciNumber: 161 },
  { slug: 'bloodhound',                 nameSv: 'Blodhund',                      nameEn: 'Bloodhound',                       fciGroup: 6, fciNumber: 84 },
  { slug: 'dalmatian',                  nameSv: 'Dalmatiner',                    nameEn: 'Dalmatian',                        fciGroup: 6, fciNumber: 153 },
  { slug: 'hamiltons_stovare',          nameSv: 'Hamiltonsstövare',             nameEn: "Hamilton's Hound",                 fciGroup: 6, fciNumber: 41 },
  { slug: 'rhodesian_ridgeback',        nameSv: 'Rhodesian ridgeback',           nameEn: 'Rhodesian Ridgeback',              fciGroup: 6, fciNumber: 146 },
  { slug: 'schillerstovare',            nameSv: 'Schillerstövare',              nameEn: "Schiller's Hound",                 fciGroup: 6, fciNumber: 131 },
  { slug: 'smalandsstovare',            nameSv: 'Smålandsstövare',              nameEn: "Smalands Hound",                   fciGroup: 6, fciNumber: 129 },
  // ── Grupp 7: Stående fågelhundar ─────────────────────────────────────────
  { slug: 'braque_francais',            nameSv: 'Braque Français (Pyrénées)',    nameEn: 'Braque Français (Pyrénées)',       fciGroup: 7, fciNumber: 134 },
  { slug: 'brittany',                   nameSv: 'Brittanyspaniel',               nameEn: 'Brittany',                         fciGroup: 7, fciNumber: 95 },
  { slug: 'english_pointer',            nameSv: 'Pointer',                       nameEn: 'Pointer',                          fciGroup: 7, fciNumber: 1 },
  { slug: 'english_setter',             nameSv: 'Engelsk setter',               nameEn: 'English Setter',                   fciGroup: 7, fciNumber: 2 },
  { slug: 'german_longhaired_pointer',  nameSv: 'Tysk långhårig vorsteh',       nameEn: 'German Longhaired Pointer',        fciGroup: 7, fciNumber: 117 },
  { slug: 'german_shorthaired_pointer', nameSv: 'Tysk korthårig vorsteh',       nameEn: 'German Shorthaired Pointer',       fciGroup: 7, fciNumber: 119 },
  { slug: 'gordon_setter',              nameSv: 'Gordonsetter',                  nameEn: 'Gordon Setter',                    fciGroup: 7, fciNumber: 6 },
  { slug: 'hungarian_vizsla',           nameSv: 'Ungersk vorsteh (Vizsla)',     nameEn: 'Hungarian Vizsla',                 fciGroup: 7, fciNumber: 57 },
  { slug: 'irish_red_setter',           nameSv: 'Irländsk rödsätterhund',       nameEn: 'Irish Red Setter',                 fciGroup: 7, fciNumber: 120 },
  { slug: 'irish_red_white_setter',     nameSv: 'Irländsk rödvit setter',       nameEn: 'Irish Red and White Setter',       fciGroup: 7, fciNumber: 330 },
  { slug: 'weimaraner',                 nameSv: 'Weimaraner',                    nameEn: 'Weimaraner',                       fciGroup: 7, fciNumber: 99 },
  { slug: 'wirehaired_pointing_griffon', nameSv: 'Korthals griffon',            nameEn: 'Wirehaired Pointing Griffon',      fciGroup: 7, fciNumber: 107 },
  // ── Grupp 8: Apporterande, stötande och vattenhundar ─────────────────────
  { slug: 'chesapeake_bay_retriever',   nameSv: 'Chesapeake Bay retriever',     nameEn: 'Chesapeake Bay Retriever',         fciGroup: 8, fciNumber: 263 },
  { slug: 'clumber_spaniel',            nameSv: 'Clumberspaniel',               nameEn: 'Clumber Spaniel',                  fciGroup: 8, fciNumber: 109 },
  { slug: 'cocker_spaniel',             nameSv: 'Cocker spaniel',               nameEn: 'English Cocker Spaniel',           fciGroup: 8, fciNumber: 5 },
  { slug: 'curly_coated_retriever',     nameSv: 'Krullig retriever',            nameEn: 'Curly Coated Retriever',           fciGroup: 8, fciNumber: 110 },
  { slug: 'flat_coated_retriever',      nameSv: 'Flatcoated retriever',         nameEn: 'Flat Coated Retriever',            fciGroup: 8, fciNumber: 116 },
  { slug: 'golden_retriever',           nameSv: 'Golden Retriever',             nameEn: 'Golden Retriever',                 fciGroup: 8, fciNumber: 111 },
  { slug: 'labrador',                   nameSv: 'Labrador Retriever',           nameEn: 'Labrador Retriever',               fciGroup: 8, fciNumber: 122 },
  { slug: 'nova_scotia_retriever',      nameSv: 'Nova Scotia duck tolling retriever', nameEn: 'Nova Scotia Duck Tolling Retriever', fciGroup: 8, fciNumber: 312 },
  { slug: 'portuguese_water_dog',       nameSv: 'Portugisisk vattenhund',       nameEn: 'Portuguese Water Dog',             fciGroup: 8, fciNumber: 37 },
  { slug: 'springer_spaniel_english',   nameSv: 'Engelsk springerspaniel',      nameEn: 'English Springer Spaniel',         fciGroup: 8, fciNumber: 125 },
  // ── Grupp 9: Sällskaps- och tyckhundar ───────────────────────────────────
  { slug: 'bichon_frise',               nameSv: 'Bichon Frisé',                nameEn: 'Bichon Frisé',                    fciGroup: 9, fciNumber: 215 },
  { slug: 'boston_terrier',             nameSv: 'Bostonterrier',                nameEn: 'Boston Terrier',                   fciGroup: 9, fciNumber: 140 },
  { slug: 'cavalier_king_charles',      nameSv: 'Cavalier King Charles Spaniel', nameEn: 'Cavalier King Charles Spaniel',  fciGroup: 9, fciNumber: 136 },
  { slug: 'chihuahua',                  nameSv: 'Chihuahua',                     nameEn: 'Chihuahua',                        fciGroup: 9, fciNumber: 218 },
  { slug: 'french_bulldog',             nameSv: 'Fransk bulldogg',              nameEn: 'French Bulldog',                   fciGroup: 9, fciNumber: 101 },
  { slug: 'havanese',                   nameSv: 'Havaneser',                     nameEn: 'Havanese',                         fciGroup: 9, fciNumber: 250 },
  { slug: 'italian_greyhound',          nameSv: 'Italiensk vinthund',           nameEn: 'Italian Greyhound',                fciGroup: 9, fciNumber: 200 },
  { slug: 'maltese',                    nameSv: 'Malteser',                      nameEn: 'Maltese',                          fciGroup: 9, fciNumber: 65 },
  { slug: 'papillon',                   nameSv: 'Papillon',                      nameEn: 'Papillon',                         fciGroup: 9, fciNumber: 77 },
  { slug: 'poodle_miniature',           nameSv: 'Dvärgpudel',                   nameEn: 'Miniature Poodle',                 fciGroup: 9, fciNumber: 172 },
  { slug: 'poodle_standard',            nameSv: 'Pudel (stor)',                  nameEn: 'Standard Poodle',                  fciGroup: 9, fciNumber: 172 },
  { slug: 'poodle_toy',                 nameSv: 'Toy pudel',                     nameEn: 'Toy Poodle',                       fciGroup: 9, fciNumber: 172 },
  { slug: 'pug',                        nameSv: 'Mops',                          nameEn: 'Pug',                              fciGroup: 9, fciNumber: 253 },
  { slug: 'shih_tzu',                   nameSv: 'Shih Tzu',                      nameEn: 'Shih Tzu',                         fciGroup: 9, fciNumber: 208 },
  // ── Grupp 10: Vinthundar ─────────────────────────────────────────────────
  { slug: 'afghan_hound',               nameSv: 'Afghansk vinthund',            nameEn: 'Afghan Hound',                     fciGroup: 10, fciNumber: 228 },
  { slug: 'borzoi',                     nameSv: 'Borzoj',                        nameEn: 'Borzoi',                           fciGroup: 10, fciNumber: 193 },
  { slug: 'greyhound',                  nameSv: 'Greyhound',                     nameEn: 'Greyhound',                        fciGroup: 10, fciNumber: 158 },
  { slug: 'saluki',                     nameSv: 'Saluki',                        nameEn: 'Saluki',                           fciGroup: 10, fciNumber: 269 },
  { slug: 'whippet',                    nameSv: 'Whippet',                       nameEn: 'Whippet',                          fciGroup: 10, fciNumber: 162 },
]

// Note: FCI recognises ~360 breeds. Add remaining entries following the same
// pattern, sourcing FCI numbers from fci.be/en/nomenclature. Every entry needs
// a unique slug (snake_case, stable — never change after first user saves it).

export function isValidBreed(slug: string): boolean {
  return BREED_REGISTRY.some((b) => b.slug === slug)
}

export function getBreedEntry(slug: string): BreedEntry | undefined {
  return BREED_REGISTRY.find((b) => b.slug === slug)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/breeds/registry.ts
git commit -m "feat(breeds): add FCI breed registry with ~100 entries and helpers"
```

---

### Task 2: Registry tests

**Files:**
- Create: `src/lib/breeds/registry.test.ts`

- [ ] **Step 1: Write the tests**

```ts
// src/lib/breeds/registry.test.ts
import { describe, it, expect } from 'vitest'
import { isValidBreed, getBreedEntry, BREED_REGISTRY } from './registry'

describe('isValidBreed', () => {
  it('returns true for the 4 legacy slugs', () => {
    expect(isValidBreed('labrador')).toBe(true)
    expect(isValidBreed('italian_greyhound')).toBe(true)
    expect(isValidBreed('braque_francais')).toBe(true)
    expect(isValidBreed('miniature_american_shepherd')).toBe(true)
  })

  it('returns true for new breeds', () => {
    expect(isValidBreed('golden_retriever')).toBe(true)
    expect(isValidBreed('border_collie')).toBe(true)
  })

  it('returns false for unknown slugs', () => {
    expect(isValidBreed('fake_breed')).toBe(false)
    expect(isValidBreed('')).toBe(false)
  })
})

describe('getBreedEntry', () => {
  it('returns the correct entry for labrador', () => {
    const entry = getBreedEntry('labrador')
    expect(entry).toBeDefined()
    expect(entry!.fciGroup).toBe(8)
    expect(entry!.fciNumber).toBe(122)
    expect(entry!.nameSv).toBe('Labrador Retriever')
  })

  it('returns undefined for unknown slug', () => {
    expect(getBreedEntry('not_a_breed')).toBeUndefined()
  })
})

describe('BREED_REGISTRY', () => {
  it('covers all 10 FCI groups', () => {
    const groups = new Set(BREED_REGISTRY.map((b) => b.fciGroup))
    expect(groups.size).toBe(10)
    for (let g = 1; g <= 10; g++) {
      expect(groups.has(g as 1)).toBe(true)
    }
  })

  it('has no duplicate slugs', () => {
    const slugs = BREED_REGISTRY.map((b) => b.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npx vitest run src/lib/breeds/registry.test.ts
```

Expected: all green.

- [ ] **Step 3: Commit**

```bash
git add src/lib/breeds/registry.test.ts
git commit -m "test(breeds): registry helpers"
```

---

### Task 3: FCI group profiles

**Files:**
- Create: `src/lib/breeds/fci-groups.ts`

- [ ] **Step 1: Create the file**

```ts
// src/lib/breeds/fci-groups.ts
import type { BreedProfile } from '@/lib/ai/breed-profiles'

export const FCI_GROUP_PROFILES: Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10, BreedProfile> = {
  1: {
    name: 'Vallhund (FCI grupp 1)',
    purpose: 'Valla och styra boskap. Arbetar intensivt nära föraren med hög drivnivå och smart självständigt agerande.',
    temperament: [
      'Intelligent och snabblärd — tar till sig kommandon snabbt',
      'Hög energi och arbetsvilja — behöver dagliga mentala utmaningar',
      'Stark instinkt att styra rörelse — kan valla barn, cyklister, katter',
      'Lojal och kontaktssökande mot sin familj',
    ],
    sensitivity: 'medium',
    suggestedGoals: ['herding', 'impulse_control', 'sport'],
    hiddenGoals: ['hunting'],
    breedSkills: [
      { name: 'Impulskontroll', description: 'Kanal vallningsdriften konstruktivt — bygg en stark "av-knapp" tidigt.', startPhase: 'puppy' },
      { name: 'Fokus på föraren', description: 'Träna ögonkontakt och närkontakt i miljöer med rörliga objekt.', startPhase: 'puppy' },
    ],
    trainingCautions: [
      'Understimulerad vallhund hittar egna projekt: grävning, skällande, destruktion',
      'Vallinstinkten mot barn och cyklister måste kanaliseras tidigt',
    ],
    activityGuidelines: {
      puppy: 'Korta, varierade pass 3–4 ggr/dag. Socialisering mot rörelse och ljud är kritisk.',
      junior: '15–25 min. Bygg grundlydnad, introducera sport-grunder.',
      adolescent: '25–45 min. Sport, nosework, formell lydnad — variera för att undvika tristess.',
    },
  },

  2: {
    name: 'Pinscher, Schnauzer & Molosser (FCI grupp 2)',
    purpose: 'Vakt, skydd och arbete. Kraftig byggnad och beslutsamhet — bred grupp från lekfulla Boxers till tunga Molosser.',
    temperament: [
      'Säker och lugn i sin grundnatur — inte nervöst reaktiv',
      'Kan vara envisa och testa gränser',
      'Kräver tydlig, konsekvent ledning från dag ett',
      'Lojala och skyddande mot familjen',
    ],
    sensitivity: 'medium',
    suggestedGoals: ['everyday_obedience', 'sport'],
    hiddenGoals: ['hunting', 'herding'],
    breedSkills: [
      { name: 'Grundlydnad och impulskontroll', description: 'Sitta, ligg, stanna och inkallning med distraktion. Fundamentet för en trygg stor hund.', startPhase: 'puppy' },
      { name: 'Socialisering', description: 'Bred exponering för människor, hundar och miljöer 8–16 veckor.', startPhase: 'puppy' },
    ],
    trainingCautions: [
      'Hård dominansbaserad träning triggar motstånd — positiv förstärkning är effektivare',
      'Tidig socialisering är avgörande: problem i vuxen ålder är svåra att korrigera',
    ],
    activityGuidelines: {
      puppy: 'Korta pass, fokus på socialisering och grundkommandon.',
      junior: '15–20 min. Grundlydnad, koppelgång.',
      adolescent: '20–40 min. Lydig- hets- och sportklass rekommenderas.',
    },
  },

  3: {
    name: 'Terrier (FCI grupp 3)',
    purpose: 'Jakt på grävande djur. Envis, tapper och självständig — skapad för att arbeta ensam i jord.',
    temperament: [
      'Envis och ihärdig — ger inte upp lätt',
      'Hög jaktalert — kan reagera snabbt på smådjur',
      'Social och livlig, ofta med stor personlighet för sin storlek',
      'Oberoende tänkare — "vad är det för mig i det?" är en vanlig reaktion',
    ],
    sensitivity: 'hardy',
    suggestedGoals: ['impulse_control', 'everyday_obedience', 'nosework'],
    hiddenGoals: ['herding'],
    breedSkills: [
      { name: 'Inkallning', description: 'Bygg en stark inkallning tidigt — jaktalerten gör att hunden lätt stänger av lyssnandet utomhus.', startPhase: 'puppy' },
      { name: 'Nosework', description: 'Kanaliserar jaktinstinkten konstruktivt. Mentalt utmattande och rasenligt.', startPhase: 'puppy' },
    ],
    trainingCautions: [
      'Terriern testar konsekvent om reglerna gäller idag med — var konsekvent',
      'Aldrig lös i oinringat område med smådjur — jaktinstinkten tar över',
    ],
    activityGuidelines: {
      puppy: 'Lekfulla korta pass. Nosework-intro tidigt.',
      junior: '10–15 min. Inkallning, grundlydnad, enkelt doftspår.',
      adolescent: '20–30 min. Nosework, rally, bruksprov.',
    },
  },

  4: {
    name: 'Tax (FCI grupp 4)',
    purpose: 'Jakt på grävlingar och rävar i jord och skog. Lång, låg kropp för att ta sig in i lyor.',
    temperament: [
      'Modig och ihärdig för sin storlek',
      'Självständig och kan vara envis',
      'Engagerad och livlig i träning när motivationen finns',
      'Stark doftinstinkt — följer gärna spår på promenader',
    ],
    sensitivity: 'medium',
    suggestedGoals: ['everyday_obedience', 'nosework'],
    hiddenGoals: ['herding', 'sport'],
    breedSkills: [
      { name: 'Nosework / doftspår', description: 'Naturlig förmåga — utmärkt mental stimulans.', startPhase: 'puppy' },
      { name: 'Koppelgång', description: 'Låg tyngdpunkt och stark dragkraft. Positiv koppelgång kräver tålamod.', startPhase: 'puppy' },
    ],
    trainingCautions: [
      'Ryggproblem är vanliga — inga höga hopp eller trappor för valpen',
      'Hård korrigering fungerar inte — positiv förstärkning och tålamod',
    ],
    activityGuidelines: {
      puppy: 'Korta pass, undvik hopp och backar. Nosework-intro.',
      junior: '10–15 min. Spårarbete, koppelgång.',
      adolescent: '20–30 min. Spårprov, doftarbete.',
    },
  },

  5: {
    name: 'Spetsar och urtyper (FCI grupp 5)',
    purpose: 'Bred grupp: klövviltsjakt (nordiska spetsar), drag (malamute, husky), sällskap (pomeranian, shiba). Gemensamt: ursprunglig typ, stark självständighet.',
    temperament: [
      'Självständig och ibland envisa — jobbar inte alltid för att glädja föraren',
      'Ofta hög röstanvändning (hyla, yla)',
      'Stark jakt- eller driftsinstinkt',
      'Kan vara reserverade mot okända',
    ],
    sensitivity: 'medium',
    suggestedGoals: ['everyday_obedience', 'sport'],
    hiddenGoals: ['herding'],
    breedSkills: [
      { name: 'Inkallning', description: 'Kritisk för säkerhet — spetsar kan springa väldigt fort och längre. Bygg super-positiv association tidigt.', startPhase: 'puppy' },
      { name: 'Socialisering', description: 'Bred exponering mot människor och situationer 8–16 veckor.', startPhase: 'puppy' },
    ],
    trainingCautions: [
      'Repetitiv träning trökar ut spetsar — håll passen varierade och korta',
      'Drag/hyla kan vara svår att träna bort — förebygg istället för att korrigera',
    ],
    activityGuidelines: {
      puppy: 'Korta, lekfulla pass. Socialisering prioritet.',
      junior: '10–20 min. Grundlydnad, inkallning i inhägnat.',
      adolescent: '20–40 min. Dragkjälke (för dragraser), rally, nosework.',
    },
  },

  6: {
    name: 'Drevhundar och eftersökshundar (FCI grupp 6)',
    purpose: 'Driva och spåra vilt med näsan. Arbetar självständigt och ihärdigt på spår — ofta på långa avstånd från jägaren.',
    temperament: [
      'Nyfikna och envetna — doften är allt',
      'Sociala och vanligtvis vänliga mot alla',
      'Lätta att distrahera av spår — inlyssnandet försvinner utomhus',
      'Glada och uthålliga',
    ],
    sensitivity: 'medium',
    suggestedGoals: ['everyday_obedience', 'nosework'],
    hiddenGoals: ['herding'],
    breedSkills: [
      { name: 'Nosework / doftspår', description: 'Naturlig förmåga — fungerar som mental tröttning och kanaliserar jaktalerten.', startPhase: 'puppy' },
      { name: 'Inkallning utomhus', description: 'Svår att återkalla när spåret är intressant. Träna alltid med lång lina ute tills inkallningen är bombsäker.', startPhase: 'puppy' },
    ],
    trainingCautions: [
      'Aldrig lös i oinringat område förrän inkallningen är säker',
      'Tjuvslukhund — hantera maten aktivt och lägg locket på',
    ],
    activityGuidelines: {
      puppy: 'Lekfulla pass, doftintro.',
      junior: '10–20 min. Enkel spårning, grundlydnad.',
      adolescent: '20–40 min. Spårprov, jaktprov.',
    },
  },

  7: {
    name: 'Stående fågelhundar (FCI grupp 7)',
    purpose: 'Söka och stå på fågelvilt. Arbetar tätt med jägaren, hittar fåglar med nos och markerar med stånd.',
    temperament: [
      'Arbetsvillig och entusiastisk i fält',
      'Vanligtvis lyhörda och kontaktssökande',
      'Kan vara känsliga för press — undvik hård träning',
      'Sociala och vänliga',
    ],
    sensitivity: 'soft',
    suggestedGoals: ['hunting', 'everyday_obedience'],
    hiddenGoals: ['herding', 'impulse_control'],
    breedSkills: [
      { name: 'Stånd', description: 'Stanna stilla när fågellukt hittas. Grundas tidigt med positiv förstärkning.', startPhase: 'junior' },
      { name: 'Sökmönster', description: 'Systematiskt sök i terrängen. Byggs upp gradvis med ökande avstånd.', startPhase: 'junior' },
    ],
    trainingCautions: [
      'Hård ton stänger av viljan hos känsliga fågelhundar',
      'Överträna inte ståndet tidigt — det bygger stress',
    ],
    activityGuidelines: {
      puppy: 'Socialisering, marker-träning, mjuk hantering.',
      junior: '15–25 min. Stånd-intro, sökmönster, dummy.',
      adolescent: '30–45 min. Fältprov-förberedelse.',
    },
  },

  8: {
    name: 'Apporterande, stötande och vattenhundar (FCI grupp 8)',
    purpose: 'Apportera nedskjutet vilt på land och i vatten. Arbetar på kommando från jägaren på avstånd.',
    temperament: [
      'Gladlynt, social och mat-motiverad',
      'Läraktig och samarbetsvillig',
      'Energisk och uthållig',
      'Kan distraheras av dofter',
    ],
    sensitivity: 'medium',
    suggestedGoals: ['hunting', 'everyday_obedience'],
    hiddenGoals: ['herding'],
    breedSkills: [
      { name: 'Apportering', description: 'Grundinstinkt — bygg med lek-apportering tidigt. Mjukt gap och leverans till handen.', startPhase: 'puppy' },
      { name: 'Vattenarbete', description: 'Introduceras med lek nära vatten. Ökar till apportering i vatten.', startPhase: 'junior' },
    ],
    trainingCautions: [
      'Hög matmotivation — passa vikten, använd mat som träningsbelöning',
      'Kan bli fixerade på bollen — hantera apporteringstiden',
    ],
    activityGuidelines: {
      puppy: 'Lek-apportering, socialisering, grundkommandon.',
      junior: '15–25 min. Formell apportering, stillasittning.',
      adolescent: '30–45 min. Distansapportering, vattenarbete, jaktprov.',
    },
  },

  9: {
    name: 'Sällskaps- och tyckhundar (FCI grupp 9)',
    purpose: 'Sällskap och avel för estetiska egenskaper. Bred grupp med allt från Chihuahua till Pudel.',
    temperament: [
      'Varierar mycket inom gruppen',
      'Generellt nära och kontaktssökande med ägaren',
      'Kan vara känsliga för stress och förändringar',
      'Ofta intelligenta och träningsbara (särskilt pudlar)',
    ],
    sensitivity: 'soft',
    suggestedGoals: ['everyday_obedience', 'sport'],
    hiddenGoals: ['hunting', 'herding'],
    breedSkills: [
      { name: 'Grundlydnad', description: 'Namn, inkallning, sitt, ligg. Anpassa kravnivå efter rasens fysik.', startPhase: 'puppy' },
      { name: 'Socialisering', description: 'Bred socialisering är kritisk — många sällskapshundar kan bli rädda utan tidig exponering.', startPhase: 'puppy' },
    ],
    trainingCautions: [
      'Hård korrigering skapar rädsla hos känsliga sällskapshundar',
      'Brachycefala raser (mops, franska bulldogg) — begränsa träning i värme',
    ],
    activityGuidelines: {
      puppy: 'Korta, lekfulla pass. Socialisering prioritet.',
      junior: '10–15 min. Grundlydnad, trickträning.',
      adolescent: '15–25 min. Trick, rally, agility-grunder.',
    },
  },

  10: {
    name: 'Vinthundar (FCI grupp 10)',
    purpose: 'Jakt med synfältet på snabbt vilt. Världens snabbaste hundraser — skapad för sprint, inte uthållighet.',
    temperament: [
      'Mjuka och känsliga — reagerar starkt på hård ton',
      'Stark syninstinkt — jaktar vad som rör sig',
      'Kan vara reserverade mot okända',
      'Lugna inomhus men explosiva utomhus',
    ],
    sensitivity: 'soft',
    suggestedGoals: ['everyday_obedience', 'sport'],
    hiddenGoals: ['hunting', 'herding'],
    breedSkills: [
      { name: 'Inkallning', description: 'Bygg super-positiv association tidigt. Träna alltid i inhägnat — syninstinkten tar över vid rörelse.', startPhase: 'puppy' },
      { name: 'Lure coursing', description: 'Springer efter artificiellt byte. Fantastiskt mentalt och fysiskt utlopp för rasen.', startPhase: 'adolescent' },
    ],
    trainingCautions: [
      'Aldrig lös i oinringat område — kan springa mil om jaktalerten triggas',
      'Hård korrigering skapar rädsla',
    ],
    activityGuidelines: {
      puppy: 'Korta lekfulla pass, socialisering.',
      junior: '10–15 min. Inkallning i inhägnat, koppelgång.',
      adolescent: '20–30 min. Lure coursing, rally.',
    },
  },
}

export function getFciGroupProfile(group: number): BreedProfile {
  const key = group as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  return FCI_GROUP_PROFILES[key] ?? FCI_GROUP_PROFILES[9]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/breeds/fci-groups.ts
git commit -m "feat(breeds): FCI group fallback profiles (10 groups)"
```

---

### Task 4: FCI group tests

**Files:**
- Create: `src/lib/breeds/fci-groups.test.ts`

- [ ] **Step 1: Write tests**

```ts
// src/lib/breeds/fci-groups.test.ts
import { describe, it, expect } from 'vitest'
import { FCI_GROUP_PROFILES, getFciGroupProfile } from './fci-groups'

describe('FCI_GROUP_PROFILES', () => {
  it('has exactly 10 groups', () => {
    expect(Object.keys(FCI_GROUP_PROFILES).length).toBe(10)
  })

  it('each group has required BreedProfile fields', () => {
    for (const [group, profile] of Object.entries(FCI_GROUP_PROFILES)) {
      expect(profile.name, `group ${group} missing name`).toBeTruthy()
      expect(profile.sensitivity, `group ${group} missing sensitivity`).toMatch(/soft|medium|hardy/)
      expect(Array.isArray(profile.suggestedGoals), `group ${group} suggestedGoals must be array`).toBe(true)
      expect(Array.isArray(profile.hiddenGoals), `group ${group} hiddenGoals must be array`).toBe(true)
      expect(Array.isArray(profile.breedSkills), `group ${group} breedSkills must be array`).toBe(true)
      expect(profile.activityGuidelines.puppy, `group ${group} missing puppy guideline`).toBeTruthy()
    }
  })
})

describe('getFciGroupProfile', () => {
  it('returns group 8 profile for group 8', () => {
    const profile = getFciGroupProfile(8)
    expect(profile.suggestedGoals).toContain('hunting')
  })

  it('falls back to group 9 for unknown group', () => {
    const profile = getFciGroupProfile(99)
    expect(profile).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run src/lib/breeds/fci-groups.test.ts
```

Expected: all green.

- [ ] **Step 3: Commit**

```bash
git add src/lib/breeds/fci-groups.test.ts
git commit -m "test(breeds): FCI group profile coverage"
```

---

### Task 5: Type change + `resolveBreedProfile`

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/ai/breed-profiles.ts`

- [ ] **Step 1: Write a failing test for `resolveBreedProfile`**

Skapa om filen inte finns, annars lägg till i befintlig:

```ts
// src/lib/ai/breed-profiles.test.ts
import { describe, it, expect } from 'vitest'
import { resolveBreedProfile } from './breed-profiles'

describe('resolveBreedProfile', () => {
  it('returns full profile for labrador', () => {
    const p = resolveBreedProfile('labrador')
    expect(p.name).toBe('Labrador Retriever')
    expect(p.sensitivity).toBe('medium')
  })

  it('returns full profile for italian_greyhound', () => {
    const p = resolveBreedProfile('italian_greyhound')
    expect(p.name).toBe('Italiensk Vinthund')
  })

  it('falls back to FCI group 8 profile for golden_retriever', () => {
    const p = resolveBreedProfile('golden_retriever')
    expect(p.suggestedGoals).toContain('hunting')
  })

  it('falls back to FCI group 1 profile for border_collie', () => {
    const p = resolveBreedProfile('border_collie')
    expect(p.suggestedGoals).toContain('herding')
  })

  it('falls back to group 9 (generic) for completely unknown slug', () => {
    const p = resolveBreedProfile('zzzunknown')
    expect(p).toBeDefined()
    expect(p.suggestedGoals).toContain('everyday_obedience')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/ai/breed-profiles.test.ts
```

Expected: FAIL — `resolveBreedProfile is not a function`.

- [ ] **Step 3: Change `Breed` type in `src/types/index.ts`**

Ändra rad 1:
```ts
// Före
export type Breed = 'labrador' | 'italian_greyhound' | 'braque_francais' | 'miniature_american_shepherd'

// Efter
export type Breed = string
```

`BreedOrGeneral` på rad 8 behåller formen `Breed | 'general'` och fungerar fortfarande.

- [ ] **Step 4: Add `resolveBreedProfile` to `src/lib/ai/breed-profiles.ts`**

Lägg till dessa importer och funktion **längst upp i filen** (efter befintliga importer):

```ts
import { getBreedEntry } from '@/lib/breeds/registry'
import { getFciGroupProfile } from '@/lib/breeds/fci-groups'
```

Ändra BREED_PROFILES-deklarationen:
```ts
// Före
export const BREED_PROFILES: Record<Breed, BreedProfile> = {

// Efter
export const BREED_PROFILES: Partial<Record<string, BreedProfile>> = {
```

Lägg till `resolveBreedProfile` direkt efter `getBreedProfile`:
```ts
export function resolveBreedProfile(slug: string): BreedProfile {
  const full = BREED_PROFILES[slug]
  if (full) return full
  const entry = getBreedEntry(slug)
  if (entry) return getFciGroupProfile(entry.fciGroup)
  return getFciGroupProfile(9)
}
```

Uppdatera `formatBreedProfileShort` och `formatBreedProfile` att använda `resolveBreedProfile` istället för `getBreedProfile`:
```ts
// Före
export function formatBreedProfileShort(breed: Breed): string {
  const p = getBreedProfile(breed)

// Efter
export function formatBreedProfileShort(breed: string): string {
  const p = resolveBreedProfile(breed)
```

```ts
// Före
export function formatBreedProfile(breed: Breed): string {
  const p = getBreedProfile(breed)

// Efter
export function formatBreedProfile(breed: string): string {
  const p = resolveBreedProfile(breed)
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/lib/ai/breed-profiles.test.ts
```

Expected: all green.

- [ ] **Step 6: Run full test suite**

```bash
npm test
```

Expected: all green (or same failures as before this change).

- [ ] **Step 7: Commit**

```bash
git add src/types/index.ts src/lib/ai/breed-profiles.ts src/lib/ai/breed-profiles.test.ts
git commit -m "feat(breeds): Breed=string + resolveBreedProfile with FCI-group fallback"
```

---

### Task 6: Update callers of BREED_PROFILES

**Files:**
- Modify: `src/components/DogProfileForm.tsx`
- Modify: `src/lib/training/week-focus-copy.ts`

- [ ] **Step 1: Update `DogProfileForm.tsx`**

Ändra importraden:
```ts
// Före
import { BREED_PROFILES } from '@/lib/ai/breed-profiles'

// Efter
import { resolveBreedProfile } from '@/lib/ai/breed-profiles'
```

Uppdatera `getGoalsForBreed`:
```ts
// Före
function getGoalsForBreed(breed: Breed | ''): { value: TrainingGoal; label: string }[] {
  if (!breed) return GOALS
  const profile = BREED_PROFILES[breed]
  return GOALS.filter((g) => !profile.hiddenGoals.includes(g.value))
}

// Efter
function getGoalsForBreed(breed: string): { value: TrainingGoal; label: string }[] {
  if (!breed) return GOALS
  const profile = resolveBreedProfile(breed)
  return GOALS.filter((g) => !profile.hiddenGoals.includes(g.value))
}
```

Uppdatera `getDefaultGoalsForBreed`:
```ts
// Före
function getDefaultGoalsForBreed(breed: Breed | ''): TrainingGoal[] {
  if (!breed) return ['everyday_obedience']
  return BREED_PROFILES[breed].suggestedGoals
}

// Efter
function getDefaultGoalsForBreed(breed: string): TrainingGoal[] {
  if (!breed) return ['everyday_obedience']
  return resolveBreedProfile(breed).suggestedGoals
}
```

- [ ] **Step 2: Update `week-focus-copy.ts`**

```ts
// Före
import { BREED_PROFILES } from '@/lib/ai/breed-profiles'

// Efter
import { resolveBreedProfile } from '@/lib/ai/breed-profiles'
```

```ts
// Före
function defaultSubGoals(breed: Breed): string[] {
  const skills = BREED_PROFILES[breed].breedSkills.slice(0, 2)

// Efter
function defaultSubGoals(breed: string): string[] {
  const skills = resolveBreedProfile(breed).breedSkills.slice(0, 2)
```

```ts
// Före
  const breedName = BREED_PROFILES[breed].name

// Efter
  const breedName = resolveBreedProfile(breed).name
```

Ändra signaturen i `buildWeekFocusCopy`:
```ts
// Före
  breed: Breed

// Efter
  breed: string
```

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add src/components/DogProfileForm.tsx src/lib/training/week-focus-copy.ts
git commit -m "refactor: use resolveBreedProfile in DogProfileForm and week-focus-copy"
```

---

### Task 7: BreedPicker component

**Files:**
- Create: `src/components/BreedPicker.tsx`
- Create: `src/components/BreedPicker.module.css`

- [ ] **Step 1: Create CSS module**

```css
/* src/components/BreedPicker.module.css */
.wrapper {
  position: relative;
}

.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-input);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-base);
  font-family: inherit;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.input::placeholder {
  color: var(--color-text-muted);
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-input);
  overflow: hidden;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.option {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: var(--text-base);
  font-family: inherit;
  cursor: pointer;
}

.option:last-child {
  border-bottom: none;
}

.option:hover,
.option:focus {
  background: var(--color-green-50);
  outline: none;
}

.empty {
  padding: var(--space-3) var(--space-4);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.selected {
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-input);
  background: var(--color-green-50);
  color: var(--color-primary);
  font-size: var(--text-base);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  width: 100%;
  font-family: inherit;
}
```

- [ ] **Step 2: Create the component**

```tsx
// src/components/BreedPicker.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { BREED_REGISTRY } from '@/lib/breeds/registry'
import type { BreedEntry } from '@/lib/breeds/registry'
import styles from './BreedPicker.module.css'

interface Props {
  value: string
  onChange: (slug: string) => void
  placeholder?: string
}

export default function BreedPicker({ value, onChange, placeholder = 'Sök ras…' }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const selectedEntry = BREED_REGISTRY.find((b) => b.slug === value)

  const matches: BreedEntry[] = query.length < 1
    ? []
    : BREED_REGISTRY.filter((b) =>
        b.nameSv.toLowerCase().includes(query.toLowerCase()) ||
        b.nameEn.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)

  function handleSelect(entry: BreedEntry) {
    onChange(entry.slug)
    setQuery('')
    setOpen(false)
  }

  function handleClear() {
    onChange('')
    setQuery('')
    setOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (selectedEntry) {
    return (
      <button type="button" onClick={handleClear} className={styles.selected}>
        <span>{selectedEntry.nameSv}</span>
        <span aria-hidden="true">✕</span>
      </button>
    )
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <input
        className={styles.input}
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        aria-label="Sök ras"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {open && query.length > 0 && (
        <div className={styles.dropdown} role="listbox">
          {matches.length === 0 ? (
            <p className={styles.empty}>Hittade ingen ras — kontrollera stavningen</p>
          ) : (
            matches.map((entry) => (
              <button
                key={entry.slug}
                type="button"
                role="option"
                aria-selected={false}
                className={styles.option}
                onMouseDown={() => handleSelect(entry)}
              >
                {entry.nameSv}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write BreedPicker tests**

```tsx
// src/components/BreedPicker.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BreedPicker from './BreedPicker'

describe('BreedPicker', () => {
  it('shows input when no value selected', () => {
    render(<BreedPicker value="" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toBeDefined()
  })

  it('shows selected breed name and clear button when value is set', () => {
    render(<BreedPicker value="labrador" onChange={() => {}} />)
    expect(screen.getByText('Labrador Retriever')).toBeDefined()
    expect(screen.getByRole('button')).toBeDefined()
  })

  it('calls onChange with slug when a result is clicked', () => {
    const onChange = vi.fn()
    render(<BreedPicker value="" onChange={onChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'golden' } })
    const option = screen.getByText('Golden Retriever')
    fireEvent.mouseDown(option)
    expect(onChange).toHaveBeenCalledWith('golden_retriever')
  })

  it('shows empty message when search has no results', () => {
    render(<BreedPicker value="" onChange={() => {}} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'zzzzznotabreed' } })
    expect(screen.getByText(/Hittade ingen ras/)).toBeDefined()
  })

  it('calls onChange with empty string when clear button pressed', () => {
    const onChange = vi.fn()
    render(<BreedPicker value="labrador" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onChange).toHaveBeenCalledWith('')
  })
})
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/components/BreedPicker.test.tsx
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/components/BreedPicker.tsx src/components/BreedPicker.module.css src/components/BreedPicker.test.tsx
git commit -m "feat(breeds): BreedPicker autocomplete component"
```

---

### Task 8: Wire BreedPicker into DogProfileForm + PR 1 final commit

**Files:**
- Modify: `src/components/DogProfileForm.tsx`

- [ ] **Step 1: Add BreedPicker import**

```ts
import BreedPicker from '@/components/BreedPicker'
```

- [ ] **Step 2: Replace the breed radio-button block**

I step 1 (`{step === 1 && ...}`), hitta rasdelen (runt rad 261–281):

```tsx
// Före — hela breed-fältet
<div className={styles.field}>
  <span className={styles.label}>Ras</span>
  <div className={styles.breedList} role="radiogroup" aria-label="Ras">
    {BREEDS.map((b) => {
      const selected = breed === b.value
      return (
        <button
          key={b.value}
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => handleBreedChange(b.value)}
          className={`${styles.breedOption} ${selected ? styles.breedOptionSelected : ''}`}
        >
          <span>{b.label}</span>
          {selected && <SelectionCheck />}
        </button>
      )
    })}
  </div>
</div>

// Efter
<div className={styles.field}>
  <span className={styles.label}>Ras</span>
  <BreedPicker
    value={breed}
    onChange={(slug) => handleBreedChange(slug)}
  />
</div>
```

- [ ] **Step 3: Remove the now-unused `BREEDS` constant**

`BREED_PROFILES`-importen ersattes redan med `resolveBreedProfile` i Task 6. Ta nu bort den exporterade konstanten (ca rad 15–20 i originalet):

```ts
// Ta bort
export const BREEDS: { value: Breed; label: string }[] = [
  { value: 'braque_francais', label: 'Braque Français' },
  { value: 'labrador', label: 'Labrador Retriever' },
  { value: 'italian_greyhound', label: 'Italiensk Vinthund' },
  { value: 'miniature_american_shepherd', label: 'Miniature American Shepherd' },
]
```

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: all green.

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: inga fel.

- [ ] **Step 6: Commit PR 1**

```bash
git add src/components/DogProfileForm.tsx
git commit -m "feat(breeds): wire BreedPicker into onboarding — closes #77 #78"
```

---

## PR 2 — Tasks (BREEDS-3)

---

### Task 9: Top-50 full BreedProfiles

**Files:**
- Modify: `src/lib/ai/breed-profiles.ts`

Lägg till profiler för de vanligaste raserna i Sverige (SKK-statistik). Nedan visas tre kompletta exempelprofiler som mall — bygg resten med samma struktur med FCI-standard och SKK-rasklubbsinformation som källa.

- [ ] **Step 1: Add Golden Retriever profile**

I `BREED_PROFILES`-objektet i `breed-profiles.ts`, lägg till:

```ts
golden_retriever: {
  name: 'Golden Retriever',
  purpose:
    'Apporterande jakthund för land och vatten. Nära besläktad med Labrador men med mjukare, mer känsligt temperament.',
  temperament: [
    'Glad, social och tillgiven — motiveras starkt av beröm och mat',
    'Mjukare och känsligare än Labrador — reagerar negativt på hård ton',
    'Stark vilja att samarbeta och glädja föraren',
    'Energisk och lekfull, behöver daglig rörelse',
    'Kan vara distraherad av dofter och rörelse',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['hunting', 'everyday_obedience'],
  hiddenGoals: ['herding', 'impulse_control'],
  breedSkills: [
    {
      name: 'Apportering (Retrieve)',
      description:
        'Central rasinstinkt. Mjukt gap är viktigt — rasen har naturlig "soft mouth". Grundas med lek-apportering.',
      startPhase: 'puppy',
    },
    {
      name: 'Stillasittning (Steady)',
      description:
        'Sitta stilla vid sidan av jägaren tills kommando ges. Tränas parallellt med apportering.',
      startPhase: 'junior',
    },
    {
      name: 'Vattenarbete',
      description:
        'Naturlig vattenvana. Introduceras med lek. Ökar till apportering i vatten.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Hård ton eller frustration skapar oro och tappad motivation — positiv förstärkning hela vägen',
    'Kan bli tjock — viktkontroll viktigt, använd kibble som träningsmat',
    'Lång valpfas — undvik belastning på leder under 12–18 månader',
  ],
  activityGuidelines: {
    puppy: '5 min/session. Lek-apportering, socialisering, grundkommandon.',
    junior: '15–25 min. Apportering, stillasittning, koppelgång.',
    adolescent: '30–45 min. Fullständiga apporteringssekvenser, vattenarbete.',
  },
},
```

- [ ] **Step 2: Add German Shepherd profile**

```ts
german_shepherd: {
  name: 'Tysk schäfer',
  purpose:
    'Mångsidig arbets- och brukshund. Vakt, spår, räddning, ledarhund. En av världens mest tränade raser.',
  temperament: [
    'Intelligent, lyhörd och snabblärd',
    'Stark lojalitet mot sin familj — kan bli överdrivet skyddande',
    'Hög energinivå och behöver dagliga mentala utmaningar',
    'Kan vara reserverad mot okända — socialisering tidigt är avgörande',
    'Arbetar bäst i nära samarbete med sin förare',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['everyday_obedience', 'sport', 'problem_solving'],
  hiddenGoals: ['hunting', 'herding'],
  breedSkills: [
    {
      name: 'Brukslydnad (IPO/IGP)',
      description:
        'Formell tävlingslydnad med heel, front, distanskommando. Rasen är topprankad internationellt i brukslydnad.',
      startPhase: 'junior',
    },
    {
      name: 'Spårning',
      description:
        'Naturlig spårförmåga. Schäfer används professionellt för eftersök och kriminalspårning.',
      startPhase: 'junior',
    },
    {
      name: 'Skydd (Schutzarbeit)',
      description:
        'Kontrollerad skyddsförmåga — tränas enbart av erfarna förare inom organiserad brukssport.',
      startPhase: 'adolescent',
    },
  ],
  trainingCautions: [
    'Underaktiverad schäfer hittar egna projekt — destruktion, skällande, grävning',
    'Tidig och bred socialisering är kritisk: problem i vuxen ålder är svåra att korrigera',
    'Höftledsproblem vanliga — undvik hård belastning för valpen',
  ],
  activityGuidelines: {
    puppy: '5–10 min/session. Socialisering, namn, grundkommandon.',
    junior: '20–30 min. Grundlydnad, spårgrunder, nosework.',
    adolescent: '30–60 min. Brukssport, spårning, tävlingslydnad.',
  },
},
```

- [ ] **Step 3: Add French Bulldog profile**

```ts
french_bulldog: {
  name: 'Fransk bulldogg',
  purpose: 'Sällskapshund med ursprung från engelska bulldoggar kryssade med franska ratthundar. Idag en av Sveriges vanligaste raser.',
  temperament: [
    'Social, lustig och anknuten till sin familj',
    'Kan vara envis och testa gränser',
    'Moderately energetic — vill ha promenader men inget maratonlopp',
    'Lär sig snabbt med rätt motivation men testar om reglerna gäller',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['everyday_obedience', 'problem_solving'],
  hiddenGoals: ['hunting', 'herding', 'sport'],
  breedSkills: [
    {
      name: 'Grundlydnad',
      description:
        'Namn, inkallning, sitt, ligg. Håll passen korta och roliga — Fransen tröttnar på upprepning.',
      startPhase: 'puppy',
    },
    {
      name: 'Trickträning',
      description:
        'Utmärkt för mental stimulans. Fransen lär sig gärna trick när motivationen är hög.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Brachycefal — begränsa träning i värme och fukt, risk för överhettning',
    'Aldrig motionera hårt i varmt väder — svårt att reglera kroppstemperaturen',
    'Ryggproblem (IVDD) är vanliga — inga höga hopp',
    'Envisa pass utan belöning fungerar inte — håll det roligt och lönsamt',
  ],
  activityGuidelines: {
    puppy: 'Korta, lekfulla pass inomhus. Undvik värme.',
    junior: '10–15 min. Grundkommandon, trickträning.',
    adolescent: '15–20 min. Lydnad, trick, kort promenad morgon/kväll.',
  },
},
```

- [ ] **Step 4: Add remaining profiles**

Lägg till profiler för följande slugs med samma `BreedProfile`-struktur. Använd de tre profilerna ovan + de befintliga 4 som mall. Källmaterial: FCI-standard (fci.be/en/nomenclature) + respektive rasklubb på SKK.

Grupp 1:
- `border_collie`, `german_shepherd`, `shetland_sheepdog`, `australian_shepherd`, `belgian_malinois`

Grupp 2:
- `rottweiler`, `bernese_mountain_dog`, `boxer`, `dobermann`, `miniature_schnauzer`

Grupp 3:
- `jack_russell_terrier`, `west_highland_white_terrier`

Grupp 5:
- `siberian_husky`, `samoyed`, `swedish_lapphund`, `finnish_lapphund`

Grupp 6:
- `beagle`, `hamiltons_stovare`, `rhodesian_ridgeback`, `dalmatian`

Grupp 7:
- `hungarian_vizsla`, `weimaraner`, `german_shorthaired_pointer`, `irish_red_setter`

Grupp 8:
- `golden_retriever`, `flat_coated_retriever`, `cocker_spaniel`, `nova_scotia_retriever`

Grupp 9:
- `french_bulldog`, `cavalier_king_charles`, `poodle_standard`, `poodle_miniature`, `shih_tzu`, `chihuahua`, `pug`, `maltese`, `havanese`, `bichon_frise`

Grupp 10:
- `whippet`, `greyhound`, `afghan_hound`

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/breed-profiles.ts
git commit -m "feat(breeds): top-50 full BreedProfiles"
```

---

### Task 10: Breed profile ingest script

**Files:**
- Create: `scripts/ingest-breed-profiles.ts`

- [ ] **Step 1: Create the ingest script**

```ts
// scripts/ingest-breed-profiles.ts
/**
 * Ingest BreedProfiles from breed-profiles.ts as RAG chunks into breed_chunks.
 *
 * Usage:
 *   npx tsx scripts/ingest-breed-profiles.ts [--breed labrador] [--dry-run]
 *
 * Requires .env.local:
 *   GOOGLE_AI_API_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { BREED_PROFILES } from '../src/lib/ai/breed-profiles'

const BATCH_DELAY_MS = 1200
const DRY_RUN = process.argv.includes('--dry-run')
const ONLY_BREED = process.argv.includes('--breed')
  ? process.argv[process.argv.indexOf('--breed') + 1]
  : null

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

const genAI = new GoogleGenerativeAI(requireEnv('GOOGLE_AI_API_KEY'))
const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

async function embedText(text: string): Promise<number[]> {
  const result = await embedModel.embedContent(text)
  return result.embedding.values
}

function chunksFromProfile(slug: string): { content: string; section: string }[] {
  const p = BREED_PROFILES[slug]
  if (!p) return []

  const chunks: { content: string; section: string }[] = []

  chunks.push({
    section: 'overview',
    content: `RAS: ${p.name}\nÄndamål: ${p.purpose}\nKänslighet: ${p.sensitivity}`,
  })

  chunks.push({
    section: 'temperament',
    content: `RAS: ${p.name} — Temperament & träningsprofil\n${p.temperament.map((t) => `• ${t}`).join('\n')}\n\nVarningar:\n${p.trainingCautions.map((c) => `• ${c}`).join('\n')}`,
  })

  if (p.breedSkills.length > 0) {
    chunks.push({
      section: 'breed_skills',
      content: `RAS: ${p.name} — Rasspecifika färdigheter\n${p.breedSkills.map((s) => `• ${s.name}: ${s.description}`).join('\n')}`,
    })
  }

  chunks.push({
    section: 'activity_guidelines',
    content: `RAS: ${p.name} — Aktivitetsriktlinjer\nValp (8–16v): ${p.activityGuidelines.puppy}\nJunior (4–9mån): ${p.activityGuidelines.junior}\nUngdjur (9–18mån): ${p.activityGuidelines.adolescent}`,
  })

  return chunks
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function ingestBreed(slug: string) {
  const chunks = chunksFromProfile(slug)
  if (chunks.length === 0) {
    console.log(`  ⚠️  No profile for ${slug} — skipping`)
    return
  }
  console.log(`  → ${slug}: ${chunks.length} chunks`)

  if (!DRY_RUN) {
    // Delete existing profile chunks so re-runs are safe
    await supabase.from('breed_chunks')
      .delete()
      .eq('breed', slug)
      .like('source', `breed-profile:${slug}:%`)
  }

  for (const { content, section } of chunks) {
    if (DRY_RUN) {
      console.log(`    [dry-run] ${section}: ${content.slice(0, 60)}…`)
      continue
    }

    const embedding = await embedText(content)
    const { error } = await supabase.from('breed_chunks').insert({
      breed: slug,
      source: `breed-profile:${slug}:${section}`,
      source_url: '',
      doc_version: '1.0',
      page_ref: section,
      content,
      embedding: embedding as unknown as string,
    })

    if (error) throw new Error(`Insert failed for ${slug}/${section}: ${error.message}`)
    await sleep(BATCH_DELAY_MS)
  }
}

async function main() {
  const slugs = ONLY_BREED ? [ONLY_BREED] : Object.keys(BREED_PROFILES)
  console.log(`Ingesting ${slugs.length} breed profiles${DRY_RUN ? ' (dry-run)' : ''}…`)

  for (const slug of slugs) {
    await ingestBreed(slug)
  }

  console.log('Done.')
}

main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Dry-run to verify it works**

```bash
npx tsx scripts/ingest-breed-profiles.ts --dry-run
```

Expected output:
```
Ingesting 50 breed profiles (dry-run)…
  → labrador: 4 chunks
    [dry-run] overview: RAS: Labrador Retriever…
    [dry-run] temperament: RAS: Labrador Retriever — Temperament…
    …
Done.
```

- [ ] **Step 3: Ingest a single breed to verify DB write**

```bash
npx tsx scripts/ingest-breed-profiles.ts --breed labrador
```

Verify i Supabase-dashboard (Table Editor → `breed_chunks`) att 4 nya rader med `breed='labrador'` och `source LIKE 'breed-profile:labrador:%'` har skapats.

- [ ] **Step 4: Ingest all profiles**

```bash
npx tsx scripts/ingest-breed-profiles.ts
```

Ca 4 min (1.2s delay × 50 raser × 4 chunks).

- [ ] **Step 5: Commit**

```bash
git add scripts/ingest-breed-profiles.ts
git commit -m "feat(breeds): breed profile ingest script — closes #79"
```

---

## Klar-kontroll

Innan PR 1 mergas:
- [ ] `npm test` — alla gröna
- [ ] `npx tsc --noEmit` — inga fel
- [ ] Onboarding i dev-läge: välj "Golden Retriever" → kontrollera att mål uppdateras korrekt (ska ge `hunting` + `everyday_obedience`)
- [ ] Välj befintlig ras (Labrador) → kontrollera att full profil fortfarande används

Innan PR 2 mergas:
- [ ] Ingest-scriptet dry-run visar korrekt antal chunks per ras
- [ ] En testras ingested + RAG-sökning ger träff på rätt chunk
