# Handoff: Dashboard-header — "Kompakt hjälte" (Variant B)

## Överblick
Dashboard-headern (gröna toppen på `/dashboard`) kändes stökig: allt staplades i en vänsterkolumn, "Logga ut" radbröts till en framträdande knapp, tre olika piller-stilar konkurrerade, och fas-kortet var skevt inriktat. Variant B städar upp det:

- **Rad 1:** avatar + hälsning/namn (med chevron för hund-byte) + liten streak-chip + **logga ut som ikon**.
- **Rad 2:** en **fas-hjälte** — fas-namn med **ring-progress**, en tappbar vecko-rad, och "nästa fas"-text.

Rent presentationellt. Samma funktioner och data (hund-byte, programvecka, streak, fas-progress, logga ut, profil). Inga API/Zod-ändringar.

## Designreferens (facit)
`prototype/Dashboard-header (B).html` — öppna i webbläsare. Visar B i två tillstånd: standard ("Stoffe") och ett **långt namn + streak 7** (namnet klipps med ellipsis, layouten håller). Avatar-cirkeln är en bild-slot där du kan släppa in ett riktigt foto för att se känslan.

## Filer att ändra
| Källa i paketet | Mål |
|---|---|
| `corrected/page.module.header.css` | Ersätt **header-klasserna** i `src/app/dashboard/page.module.css` (`.header`, `.decorCircle`, `.headerContent`, `.headerText`, `.greeting`, `.dogName`, `.weekBadge*`). Allt utanför headern lämnas orört. |
| `corrected/DashboardHeader.tsx.snippet.tsx` | Ersätt `<header className={styles.header}>…</header>` i `src/app/dashboard/page.tsx` (nuvarande rader ~292–345). |

### Tre småfixar i stödkomponenter
1. **Ikoner** — lägg till två i `src/components/icons/ui-icons.tsx` (Phosphor finns redan som beroende):
   ```ts
   import { CaretDown, SignOut } from '@phosphor-icons/react'
   export const IconCaretDown = makeIcon(CaretDown)
   export const IconSignOut   = makeIcon(SignOut)
   ```
   …och exportera dem i `src/components/icons/index.ts` om filen re-exporterar.

2. **DogSwitcher** (`DogSwitcher.module.css`) — namnet ska se ut som en rubrik, inte ett tungt pill. Ändra `.chip`:
   ```diff
   .chip {
     display: inline-flex; align-items: center; gap: 5px;
   - background: rgb(255 255 255 / 0.15);
   - border-radius: 20px;
   - padding: 2px 10px 2px 2px;
   + background: none;
   + padding: 0;
     border: none; color: #fff;
   - font-size: var(--text-lg);
   + font-size: var(--text-xl);
     font-weight: var(--font-bold); cursor: pointer;
   }
   - .chip:hover { background: rgb(255 255 255 / 0.25); }
   + .chip:hover { opacity: 0.85; }
   ```
   Byt även chevron-ikonen till `IconCaretDown`, och se till att den initiala "S"-avataren inuti chippen tas bort (avataren visas nu separat till vänster i rad 1). Sheet/overlay-delen är oförändrad.

3. **ProgramWeekTimeline** — dess data (fas-namn, intervall, nästa fas, % klart) flyttar in i fas-hjälten. Enklast: låt komponenten exportera värdena (`phaseName`, `phasePct` 0–1, `weekRange`, `nextPhaseLabel`, `weeksToNext`) via en liten hook eller props, och rendera dem i `.phase`-blocket. Den gamla timeline-markupen tas bort ur headern. **Ingen logik ändras — bara var värdena visas.**

> `StreakBadge` behövs inte längre i headern (ersatt av `.streakMini`). Behåll komponenten om den används på andra ytor.

## Mått & stil (för referens — allt finns i `corrected/`)
- Header-padding `var(--space-5)`. Avatar 50px med 2px vit ring (`rgb(255 255 255 / 0.6)`).
- Namn `var(--text-xl)`/`bold`, ellipsis vid långa namn. Hälsning `var(--text-xs)`, 80 % vit.
- Streak-chip: accent-tint `rgb(244 162 97 / 0.2)`, text `#fbd9b6`. Logga ut: 36px rund ikon-knapp, `rgb(255 255 255 / 0.1)`.
- Fas-kort: `rgb(255 255 255 / 0.1)`, radie `var(--radius-card)`. Ring 46px, fyllning `var(--color-primary-light)` `#52b788`, spår 20 % vit. Vecko-rad `rgb(255 255 255 / 0.12)`.

## Edge cases (verifierade i prototypen)
- **Långa hundnamn** klipps med ellipsis; chevron och övriga element behåller plats.
- **Streak = 0** → chippen döljs (`{streak > 0 && …}`), så "0 dagar i rad" skräpar inte. Visa den bara när det finns en streak att fira.
- Ring vid 0 % visar tom ring + "0%".

## Filer i paketet
- `corrected/page.module.header.css`, `corrected/DashboardHeader.tsx.snippet.tsx` — att klistra in
- `prototype/Dashboard-header (B).html` (+ `ios-frame.jsx`, `ex-shared.jsx`, `image-slot.js`) — visuell referens
