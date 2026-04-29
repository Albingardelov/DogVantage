# Handoff: DogVantage – Full App Redesign

## Overview
En fullständig hi-fi redesign av DogVantage PWA-appen. Designen täcker alla skärmar: Landing, Onboarding (3 steg), Dashboard, Chatt och Träningslogg. Fokus ligger på en varm, personlig känsla där hundens foto är i centrum.

## About the Design Files
Filerna i detta paket är **HTML-designprototyper** skapade som visuella och interaktiva referenser — inte produktionskod. Uppgiften är att **återskapa dessa designs i den befintliga Next.js-kodbasen** med dess etablerade mönster (App Router, CSS Modules, befintliga komponenter i `src/components/`). Ersätt inte befintlig logik — fokusera på att applicera den nya visuella stilen ovanpå den fungerande koden.

## Fidelity
**High-fidelity (hifi)** — Pixel-perfect mockups med slutliga färger, typografi, spacing och interaktioner. Återskapa UI:t exakt enligt prototypen med kodbas­ens befintliga bibliotek och mönster.

---

## Design Tokens

Dessa ersätter/utökar befintliga tokens i `src/styles/tokens.css`:

```css
:root {
  /* Backgrounds */
  --color-bg: #faf8f4;          /* Varm krämvit (ersätter #f8f9fa) */
  --color-bg-alt: #f2ede5;      /* Sekundär bakgrund */
  --color-surface: #ffffff;

  /* Brand */
  --color-primary: #2d6a4f;     /* Oförändrad */
  --color-primary-dark: #1b4332;
  --color-primary-light: #52b788;
  --color-accent: #f4a261;      /* Oförändrad */
  --color-accent-light: #fde8d4;

  /* Text */
  --color-text: #1c1917;        /* Varm svart (ersätter #1a1a2e) */
  --color-text-muted: #78716c;  /* Varm grå */

  /* Borders */
  --color-border: #e7e0d8;      /* Varm border */

  /* Greens (nya) */
  --color-green-100: #d8f0e5;
  --color-green-50: #edf8f2;

  /* Shadows */
  --shadow-sm: 0 2px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);

  /* Radius */
  --radius-card: 16px;
  --radius-btn: 14px;
  --radius-input: 12px;

  /* Font */
  --font-sans: 'DM Sans', system-ui, sans-serif;
}
```

Lägg till Google Font-import i `src/app/layout.tsx`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />
```

---

## Screens / Views

### 1. Landing Page (`src/app/page.tsx`)

**Layout:** Flex column, full viewport height.

**Hero-sektion (övre ~55%):**
- Bakgrund: gradient `linear-gradient(160deg, #1b4332 0%, #2d6a4f 60%, #52b788 100%)`
- Padding: 52px 28px 40px
- Dekorativa cirklar: position absolute, `rgba(255,255,255,0.06)`, 180px och 120px diameter
- Hundfoton: 120×120px cirkel, `rgba(255,255,255,0.12)` bakgrund, `3px solid rgba(255,255,255,0.2)` border — visa hundens foto om profil finns, annars emoji-placeholder 🐕
- Titel "DogVantage": 32px, weight 700, vit, centrerad, letter-spacing -0.5px
- Tagline: 15px, `rgba(255,255,255,0.8)`, centrerad, line-height 1.5

**Feature-lista (mellerst):**
- Padding 28px 24px
- 3 rader med icon-box (44×44px, border-radius 12px, `--color-green-50` bakgrund, emoji 20px) + text
- Titel: 15px weight 600, beskrivning: 13px `--color-text-muted`
- Gap mellan rader: 20px

**CTA (nedre):**
- Padding 0 24px 40px
- Primärknapp: full bredd, 16px padding, border-radius 14px, `--color-primary`, vit text 16px weight 600, `box-shadow: 0 4px 16px rgba(45,106,79,0.35)`
- Sekundär ghost-knapp: "Jag har redan ett konto", `--color-text-muted`, 15px

---

### 2. Onboarding (`src/app/onboarding/page.tsx` + `src/components/DogProfileForm.tsx`)

3-stegs flow med progressindikator längst upp.

**Progress bar:**
- 3 rektanglar, height 4px, border-radius 2px, gap 6px
- Aktiva/passerade: `--color-primary`, kommande: `--color-border`
- Steg-counter: "Steg X av 3", 12px, muted, ovanför rubrik

**Steg 1 – Foto:**
- Cirkulär upload-zon: 180×180px, `border: 3px dashed`, `border-color: --color-border` (dashed när tom, `--color-primary` solid när foto valt)
- Bakgrund: `--color-bg-alt` utan foto, transparent med foto
- Kameraikon (SVG) + "Välj foto"-text när tom
- `<input type="file" accept="image/*">` dold, aktiveras via onClick
- "Hoppa över"-länk nedanför
- Spara foto i `localStorage` som base64 (nyckel: `dogPhoto`)

**Steg 2 – Namn & Ras:**
- Textinput för namn: padding 14px 16px, border-radius 12px, `1.5px solid --color-border`, focus → border `--color-primary`
- Ras-väljare: 3 knappar (en per ras), stacked, `2px solid`, vald → `--color-green-50` bakgrund + `--color-primary` border + bockmarkering
- Raser: Braque Français, Labrador Retriever, Italiensk Vinthund

**Steg 3 – Födelsedag:**
- `<input type="date">` med samma stil som textinput
- Preview-kort: visar beräknad vecka i realtid — `--color-green-50` bakgrund, 24px bold primärfärgad siffra

**Footer (alla steg):**
- "Fortsätt"-knapp (disabled = grå `--color-border`, aktiv = `--color-primary`)
- Sista steget: "Starta appen →"

---

### 3. Dashboard (`src/app/dashboard/page.tsx`)

**Header (gradient):**
- Bakgrund: `linear-gradient(160deg, #1b4332 0%, #2d6a4f 100%)`
- Padding: 20px 24px 28px
- Vänster: "God morgon!"-label (12px, `rgba(255,255,255,0.65)`), hundens namn (22px weight 700, vit), vecka-badge (inline-flex, `rgba(255,255,255,0.15)` bakgrund, rounded, 12px)
- Höger: `Avatar`-komponent (se nedan), 64×64px

**Avatar-komponent** (ny, återanvänds på alla skärmar):
```tsx
// Visar hundfoton eller initialbokstav
interface AvatarProps { photo?: string | null; name: string; size?: number }
// Cirkel, photo = objectFit cover; annars gradient #52b788→#2d6a4f med initial-bokstav i vitt
// Border: 3px solid white, box-shadow: --shadow-sm
```

**Träningskort:**
- `--color-surface`, border-radius 16px, shadow
- Header: `--color-green-50` bakgrund, border-bottom `--color-green-100`, 12px 16px padding
  - Vänster: "Veckans träning" 13px weight 600 `--color-primary`
  - Höger: "RAS-baserat"-badge, 11px, `--color-green-100` bakgrund, `--color-primary-light` text, rounded
- Body: 16px padding
  - Rubrik: 15px weight 700
  - Brödtext: 14px `--color-text-muted` line-height 1.6
  - "Fråga om träningen"-knapp: full bredd, `--color-green-50` bakgrund, `--color-green-100` border, `--color-primary` text, pil →

**Snabbstatistik (2-kolumns grid, gap 12px):**
- 2 kort: "Pass loggade" (primary-färgad siffra) och "Snittbetyg" (accent-färgad)
- border-radius 14px, padding 16px

**CTA-knapp (logga pass):**
- Full bredd, `--color-accent` bakgrund, vit text, `box-shadow: 0 4px 16px rgba(244,162,97,0.35)`
- Ersätts med `SessionLogForm` när klickad

**Bottom navigation** (ny komponent):
- Position absolute bottom 0, full bredd
- `--color-surface` bakgrund, `1px solid --color-border` top, padding-bottom 20px (safe area)
- 3 tabs: Hem (hus-ikon), Chatt (bubbla-ikon), Logg (lista-ikon)
- Aktiv tab: `--color-primary` färg + weight 600; inaktiv: `--color-text-muted`
- Font-size på label: 11px

---

### 4. Chatt (`src/app/chat/page.tsx` + `src/components/ChatInterface.tsx`)

**Header:**
- `--color-surface`, border-bottom
- Avatar (36px) + "Träningsassistenten" (15px weight 700) + "● Online" (12px `--color-primary-light`)

**Meddelandebubbor:**
- Användarbubbla: höger, `--color-primary` bakgrund, vit text, border-bottom-right-radius 4px
- Modellbubbla: vänster, `--color-surface` bakgrund, `--color-text`, border-bottom-left-radius 4px
- Padding: 12px 14px, border-radius 16px, max-width 75%
- Modell-avatar: 28×28px cirkel med 🐾, `--color-green-50` bakgrund, `--color-green-100` border, visas till vänster om bubblan

**Typing indicator:**
- 3 punkter, 7×7px, `--color-text-muted`, bounce-animation (keyframes: translateY 0 → -4px → 0, 1.2s, stagger 0.2s per punkt)

**Snabbfrågor (visas tills 3+ meddelanden):**
- Horisontell scroll-rad med chips
- `--color-surface` bakgrund, `1.5px solid --color-border`, border-radius 20px, 8px 12px padding
- Font-size 12px, whitespace nowrap

**Input:**
- Textarea (rows=1) + skicka-knapp (44×44px, `--color-primary`, border-radius 12px, pil-ikon)
- padding-bottom: 76px (för bottom nav)

---

### 5. Träningslogg (`src/app/dashboard/page.tsx` – ny vy, eller ny route `/log`)

**Header:**
- `--color-surface`, border-bottom
- Avatar (36px) + "Namn:s logg" + antal loggade pass

**Mini-stapeldiagram:**
- 7 staplar (en per dag), flex + align-items flex-end, height 40px
- Staplar: `--color-green-100`, senaste dag `--color-primary`
- border-radius 4px, auto-bredd med flex: 1, gap 4px
- "Fokus senaste 7 dagarna" label, 11px muted

**Loggkort:**
- `--color-surface`, border-radius 14px, shadow
- `border-left: 4px solid` (grön=bra, orange=blandat, röd=dåligt)
- Emoji (22px) + betyg-label + datum
- Fokus & Lydnad: rad med 5 prickar (7×7px cirklar, fyllda/tomma)
- Noteringar: kursiv text, 13px, separator ovan

---

## Komponenter att skapa / uppdatera

### Ny: `Avatar` (`src/components/Avatar.tsx`)
```tsx
interface AvatarProps {
  photo?: string | null
  name: string
  size?: number
}
```
Läs foto från `localStorage` med nyckel `dogPhoto` om `photo`-prop ej skickas.

### Ny: `BottomNav` (`src/components/BottomNav.tsx`)
```tsx
interface BottomNavProps {
  active: 'dashboard' | 'chat' | 'log'
}
```
Använd `next/link` för navigation.

### Uppdatera: `DogProfileForm` (`src/components/DogProfileForm.tsx`)
- Lägg till foto-uppladdningssteg som steg 1
- Spara foto i `localStorage` som `dogPhoto`-nyckel (base64)
- Gör om till 3-stegs wizard med progressindikator

### Uppdatera: `TrainingCard` (`src/components/TrainingCard.tsx`)
- Lägg till grön header-sektion med "RAS-baserat"-badge
- "Fråga om träningen"-knapp som navigerar till `/chat`

### Uppdatera: `SessionLogForm` (`src/components/SessionLogForm.tsx`)
- Ersätt emoji-knappar med ny stil (se prototyp)
- Ersätt sliders med accentColor `--color-primary`
- Lägg till "Spara pass" + "Avbryt" side-by-side

---

## Interaktioner & Animationer

| Element | Beteende |
|---|---|
| Onboarding steg | Fade/slide ingen animation krävs, räcker med conditional render |
| Typing indicator | CSS `@keyframes bounce`, translateY 0→-4px, 1.2s infinite, stagger 0.2s |
| CTA-knappar | `transition: transform 0.1s` + `active: scale(0.98)` |
| Input focus | `border-color` transition 0.2s till `--color-primary` |
| Logg-sparad | Success-state: ✅ + "Pass sparat!" visas 1s, sedan döljs formuläret |

---

## Assets

- **Hundfoton:** Lagras lokalt i `localStorage` som base64 (nyckel: `dogPhoto`). Läses upp och visas via Avatar-komponenten.
- **Ikoner:** Ritade som inline SVG (stroke-baserade, strokeWidth 2, strokeLinecap round). Inga externa icon-bibliotek behövs.
- **Typsnitt:** DM Sans via Google Fonts — lägg till i `layout.tsx`.

---

## Filer i detta paket

- `README.md` — denna fil
- `DogVantage Prototype.html` — komplett interaktiv prototyp (alla skärmar)

---

## Implementeringsordning (rekommenderad)

1. Uppdatera `tokens.css` med nya designvärden + DM Sans
2. Skapa `Avatar`-komponenten
3. Skapa `BottomNav`-komponenten
4. Uppdatera `DogProfileForm` med foto-steg
5. Uppdatera `TrainingCard` och `SessionLogForm`
6. Uppdatera `page.module.css` för Dashboard och Landing
7. Lägg till logg-vy (ny route `/log` eller tab i Dashboard)
