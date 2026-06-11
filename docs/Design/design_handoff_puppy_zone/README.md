# Handoff: Valp-zon — brand-justering

## Överblick
Den nya valp-zonen (daglig incheckning grön/gul/röd → anpassat pass) är **funktionellt klar och bra** — det här paketet rör **bara designen** så den linjerar med resten av DogVantage. Ingen logik, inga props, inga API-anrop, inga Zod-scheman ändras.

**De 5 fynden från granskningen är åtgärdade** i `corrected/`. Du kan i princip ersätta tre filer + ändra en rad.

## Vad som ändrats (fynd → fix)

| # | Fynd | Åtgärd |
|---|------|--------|
| 1 | **Off-brand färger** (`#22c55e`/`#eab308`/`#ef4444`, grått `#6b7280`) | Allt går nu via `tokens.css`. Trafikljus-semantiken bevaras: grön = `--color-primary` (#2d6a4f), gul = `--color-accent` (#f4a261), röd = `--color-error` (#d62828). Muted-text = `--color-text-muted`. |
| 2 | **Odefinierade CSS-vars** `var(--surface)` / `var(--text-primary)` | Bytta till `var(--color-surface)` / `var(--color-text)` som finns i `tokens.css`. |
| 3 | **Emoji 🟢🟡🔴** | Borttagna. Använder nu **ditt ikonbibliotek** (`@/components/icons` + Phosphor `Smiley` / `SmileyMeh` / `SmileySad` via `DvIcon`, `weight="fill"`) i en vit ikon-cirkel. Samma mönster som `StreakBadge`/`RatingIcon`. |
| 4 | **Kort-skugga/mönster avviker** | `box-shadow` → `var(--shadow-sm)`, radie → `var(--radius-card)`, knapp → samma stil som `TrainingCard .weekBtn`, spacing via `--space-*`. |
| 5 | **Gul = Tailwind-amber** | Gul-zonen bygger nu på accent: tint `#fdf1e6`, kant `#f7e0cb`, text `#9a5a22` (mörkare accent för WCAG-kontrast). |

## Filer att byta ut / ändra
Lägg filerna i `corrected/` på motsvarande plats i repot:

| Källa i paketet | Ersätter |
|---|---|
| `corrected/PuppyDayCard.module.css` | `src/components/PuppyDayCard/PuppyDayCard.module.css` (full ersättning) |
| `corrected/ZoneCheckIn.tsx` | `src/components/PuppyDayCard/ZoneCheckIn.tsx` (full ersättning) |
| `corrected/RecoveryCard.tsx` | `src/components/PuppyDayCard/RecoveryCard.tsx` (full ersättning) |
| `corrected/PuppyDayCard.tsx.patch.md` | en (1) rads ändring i `src/components/PuppyDayCard/PuppyDayCard.tsx` (`ZONE_COLORS`) |

> **Verifiera att dessa tokens finns** i `src/styles/tokens.css` (de gör det i nuvarande repo): `--color-surface`, `--color-text`, `--color-text-muted`, `--color-bg`, `--color-bg-alt`, `--color-border`, `--color-primary`, `--color-accent`, `--color-error`, `--color-green-50`, `--color-green-100`, `--radius-card`, `--radius-input`, `--radius-md`, `--radius-full`, `--shadow-sm`, `--space-2/4/5/6`, `--text-xs/sm/base/lg`, `--font-semibold/bold`, `--transition-fast`. Tre tints (`#fdf1e6`, `#f7e0cb`, `#fbeaea`) och gul-textfärgen `#9a5a22` är medvetet hårdkodade — lägg gärna in dem som `--color-accent-50` / `--color-error-50` om ni vill formalisera dem.

## Designreferens (visuellt facit)
`prototype/Valp-zon – designgranskning.html` — öppna i webbläsare. Vänster kolumn = som det var byggt, höger = målbilden (det som `corrected/` implementerar). Alla fyra lägen visas: incheckning, grön dag, gul dag, röd dag.

## Noterbart
- **Övningskorten** inuti grön/gul dag renderas av delade `ExerciseRow`. Den har en egen omdesign ("Bold ring") i ett separat handoff-paket — gör den först eller parallellt, så blir valp-läget helt enhetligt. Den här leveransen rör inte `ExerciseRow`.
- Ikon-storlek: `DvIcon size="lg"` = 24px (passar 40px-cirkeln). `weight="fill"` matchar mocken; `"duotone"` är också on-brand (som `RatingIcon`) om ni hellre vill ha det.
- Inga nya beroenden. `Smiley`/`SmileyMeh`/`SmileySad` finns redan importerade i `ui-icons.tsx`.

## Filer i paketet
- `corrected/` — färdiga filer att klistra in (se tabell ovan)
- `prototype/Valp-zon – designgranskning.html` — visuell jämförelse (kräver internet för React/fonts via CDN)
- `prototype/puppy-review.jsx`, `ex-shared.jsx`, `ios-frame.jsx` — stödfiler för prototypen (ej för produktion)
