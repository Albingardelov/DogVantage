# Handoff: DogVantage – Full App Redesign

## Overview
En fullständig hi-fi redesign av DogVantage PWA-appen. Designen täcker alla skärmar: Landing, Onboarding (3 steg), Dashboard, Chatt och Träningslogg. Fokus är en varm, personlig känsla där hundens foto är i centrum, med ett AI-genererat interaktivt träningssystem.

## About the Design Files
Filerna i detta paket är **HTML-designprototyper** — interaktiva visuella referenser, inte produktionskod. Uppgiften är att **återskapa dessa designs i den befintliga Next.js-kodbasen** (`src/app/`, `src/components/`, `src/styles/`) med dess etablerade mönster (App Router, CSS Modules). Ersätt inte befintlig affärslogik — applicera den nya visuella stilen och de nya komponenterna ovanpå den fungerande koden.

## Fidelity
**High-fidelity (hifi)** — Pixel-perfect mockups med slutliga färger, typografi, spacing och interaktioner.

---

## Design Tokens

Ersätt/utöka `src/styles/tokens.css`:

```css
:root {
  --color-bg: #faf8f4;
  --color-bg-alt: #f2ede5;
  --color-surface: #ffffff;
  --color-primary: #2d6a4f;
  --color-primary-dark: #1b4332;
  --color-primary-light: #52b788;
  --color-accent: #f4a261;
  --color-accent-light: #fde8d4;
  --color-text: #1c1917;
  --color-text-muted: #78716c;
  --color-border: #e7e0d8;
  --color-green-100: #d8f0e5;
  --color-green-50: #edf8f2;
  --shadow-sm: 0 2px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
  --radius-card: 16px;
  --radius-btn: 14px;
  --radius-input: 12px;
  --font-sans: 'DM Sans', system-ui, sans-serif;
}
```

Lägg till i `src/app/layout.tsx` (`<head>`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />
```

---

## Ny arkitektur: Träningssystem

Detta är den viktigaste nya funktionen. Förstå detta flöde innan du implementerar:

### Flöde
1. **Ett AI-anrop** per vecka genererar hela veckoschemat (7 dagar)
2. **Dashboard** filtrerar ut enbart **idag** ur den planen och visar som klickbara övningar
3. **Veckovy** visar hela planen (samma cachade data, inget extra anrop)

### API-endpoint: `POST /api/training/week`

Skapa en ny endpoint (eller utöka `/api/training`) som returnerar:

```typescript
interface WeekPlan {
  days: DayPlan[]
}

interface DayPlan {
  day: string          // "Måndag" | "Tisdag" | ... | "Söndag"
  rest?: boolean       // true = vilodag
  exercises?: Exercise[]
}

interface Exercise {
  id: string           // lowercase, inga mellanslag
  label: string        // övningens namn
  desc: string         // kort instruktion, max 8 ord
  reps: number         // antal repetitioner (1–5)
}
```

**Prompt till AI (använd RAG mot RAS-dokumenten):**
```
Skapa ett komplett veckoschema för vecka {weekNumber} för en {breedLabel}.
Returnera JSON med 7 dagar (Måndag–Söndag).
2–3 övningar per träningsdag, rest: true på vilodagar.
Anpassa övningarna efter vecka {weekNumber} och rasens egenskaper.
```

### Caching
Cachea veckoplanerna i Supabase eller `localStorage` med nyckel `week_plan_w{weekNumber}_{breed}`. Planen behöver inte regenereras förrän nästa vecka.

### Daglig progress
Spara avklarade reps per dag i Supabase (`session_logs`-tabellen eller ny `daily_progress`-tabell):
- Nyckel: `(user_id, date, exercise_id)`
- Värde: antal avklarade reps

---

## Screens / Views

### 1. Landing Page (`src/app/page.tsx`)

**Hero (övre ~55% av viewport):**
- Bakgrund: `linear-gradient(160deg, #1b4332 0%, #2d6a4f 60%, #52b788 100%)`
- Padding: `52px 28px 40px`
- 2 dekorativa cirklar: `position: absolute`, `rgba(255,255,255,0.06)`, 180px och 120px
- Hundcirkel: 120×120px, `rgba(255,255,255,0.12)` bakgrund, `3px solid rgba(255,255,255,0.2)` border — visa hundfoton om profil finns
- Titel: 32px, weight 700, vit, letter-spacing -0.5px
- Tagline: 15px, `rgba(255,255,255,0.8)`, line-height 1.5

**Features (3 rader):**
- Icon-box: 44×44px, border-radius 12px, `--color-green-50`, emoji 20px
- Titel: 15px weight 600; beskrivning: 13px muted; gap 20px

**CTA:**
- Primärknapp: full bredd, padding 16px, border-radius 14px, `--color-primary`, `box-shadow: 0 4px 16px rgba(45,106,79,0.35)`
- Ghost-knapp: "Jag har redan ett konto", muted

---

### 2. Onboarding – 3-stegs wizard (`src/app/onboarding/` + `src/components/DogProfileForm.tsx`)

**Progress bar (alltid synlig):**
- 3 rektanglar, 4px höga, gap 6px, border-radius 2px
- Aktiva/passerade: `--color-primary`; kommande: `--color-border`

**Steg 1 – Foto:**
- Cirkulär upload-zon: 180×180px
- Tom: `border: 3px dashed --color-border`, `--color-bg-alt` bakgrund, kameraikon + "Välj foto"
- Med foto: `border: 3px solid --color-primary`, foto som `objectFit: cover`
- `<input type="file" accept="image/*">` dold, triggas via onClick
- Spara i `localStorage` som base64, nyckel: `dogPhoto`
- "Hoppa över"-länk (foto är valfritt)

**Steg 2 – Namn & Ras:**
- Textinput: padding 14px 16px, border-radius 12px, focus-border `--color-primary`
- Ras-knappar (3 st, stacked): `2px solid`, vald = `--color-green-50` bakgrund + `--color-primary` border + ✓

**Steg 3 – Födelsedag:**
- `<input type="date">`, samma stil
- Preview-kort: visar beräknad vecka i realtid, `--color-green-50` bakgrund

**Footer:**
- "Fortsätt"-knapp (disabled = grå); sista steget = "Starta appen →"

---

### 3. Dashboard (`src/app/dashboard/page.tsx`)

**Header (gradient):**
- `linear-gradient(160deg, #1b4332 0%, #2d6a4f 100%)`
- Padding: 20px 24px 28px
- Vänster: "God morgon!" (12px, `rgba(255,255,255,0.65)`), hundens namn (22px, bold, vit), vecka-badge
- Höger: `<Avatar>` 64px

**Träningskort – "Dagens pass":**
Se separat sektion nedan.

**Snabbstatistik (2-kolumns grid, gap 12px):**
- 2 kort: `--color-surface`, border-radius 14px, padding 16px
- "Pass loggade": stor siffra i `--color-primary`
- "Snittbetyg": stor siffra i `--color-accent`

**Logga träningspass (auto-trigger):**
- Ingen manuell logg-knapp behövs
- När sista repen på sista övningen bockas av → `onAllDone()`-callback anropas efter 400ms delay
- `SessionLogCard` glider upp automatiskt med `slideUp`-animation
- Manuell "Logga träningspass"-knapp visas fortfarande som fallback om man vill logga utan att klara alla övningar

**Bottom navigation:** se nedan

---

### 3a. Träningskort – Dagens pass (ny komponent: `TrainingCard.tsx`)

```
┌─────────────────────────────────┐
│ Dagens pass          3/4 klara │  ← grön header
├────────────────────────── ──────┤
│ ████████░░░░░░░░░░░░░░░░░░░░░ │  ← progress bar (3px)
├─────────────────────────────────┤
│ 📣 Inkallning                   │
│    Kalla på hunden med glad röst│  ● ● ○  2/3 ←klickbar
├─────────────────────────────────┤
│ 🐾 Sitt                    ✓   │  ← klar = grön bock
├─────────────────────────────────┤
│ 😴 Ligg                        │
│    Bygg upp tid gradvis    ● ○ ○│
├─────────────────────────────────┤
│ [Fråga om dagens pass →]        │
│  Visa hela veckans schema →     │
└─────────────────────────────────┘
```

**ExerciseRow-komponenten:**
- Flex row, padding 13px 16px, border-bottom `1px solid --color-border`
- Ikon-box: 38×38px, border-radius 10px, `--color-bg-alt` (klar = `--color-green-100`)
- Namn: 14px weight 600 (klar = `--color-primary` + line-through)
- Beskrivning: 12px muted, max 8 ord
- Prick-räknare (höger): klickbar, en prick per rep, fylld = `--color-primary`, tom = `--color-border`; nästa att fylla har `2px solid --color-primary` border
- Klar: ersätt prickarna med grön bock-cirkel (32×32px, `--color-primary`)
- Vilodag: stor 😴-emoji + "Vilodag idag" + förklaringstext

**Veckovy (overlay/modal):**
- Full-screen overlay ovanpå dashboarden
- Tillbaka-pil i vänstra hörnet
- 7 dagsort, varje dag = ett kort med övningslista
- Vilodagar: grå badge "Vilodag"
- Idag: `2px solid --color-primary` border + grön rubrik + "· idag"-label

---

### 4. Chatt (`src/app/chat/page.tsx` + `src/components/ChatInterface.tsx`)

**Header:**
- `<Avatar>` (36px) + "Träningsassistenten" + "● Online" (`--color-primary-light`)

**Meddelandebubbor:**
- Användarbubbla: höger, `--color-primary`, vit text, border-bottom-right-radius 4px
- Modellbubbla: vänster, `--color-surface`, border-bottom-left-radius 4px
- Padding 12px 14px, border-radius 16px, max-width 75%
- Modell-avatar: 28×28px 🐾-cirkel, `--color-green-50`

**Typing indicator:**
- 3 punkter, 7×7px, bounce-animation
- `@keyframes bounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }`
- Stagger: 0s, 0.2s, 0.4s; duration 1.2s infinite

**Snabbfrågor (föreslagna):**
- Horisontell scroll, chips med `border: 1.5px solid --color-border`, border-radius 20px
- Visas tills användaren skickat 3+ meddelanden

**Input:**
- Textarea (rows=1) + skicka-knapp (44×44px, `--color-primary`)
- padding-bottom: 76px (för bottom nav)

---

### 5. Träningslogg

**Header:** `<Avatar>` 36px + "Namn:s logg" + antal pass

**Mini-stapeldiagram:**
- 7 staplar, flex + align-items flex-end, height 40px
- `--color-green-100` normalt, `--color-primary` = idag
- border-radius 4px; gap 4px

**Loggkort:**
- `--color-surface`, border-radius 14px
- `border-left: 4px solid` (grön/orange/röd beroende på betyg)
- Fokus & Lydnad: 5 prickar (7×7px)
- Noteringar: kursiv 13px muted

---

## Komponenter att skapa / uppdatera

### Ny: `src/components/Avatar.tsx`
```tsx
interface AvatarProps {
  photo?: string | null   // base64 eller URL
  name: string
  size?: number           // default 48
}
// Visar foto (objectFit cover) eller gradient-cirkel med initial-bokstav
// Gradient: linear-gradient(135deg, #52b788, #2d6a4f)
// Border: 3px solid white; box-shadow: --shadow-sm
// Försök läsa från localStorage('dogPhoto') om photo-prop saknas
```

### Ny: `src/components/BottomNav.tsx`
```tsx
type Tab = 'dashboard' | 'chat' | 'log'
interface BottomNavProps { active: Tab }
// position: fixed, bottom 0, full bredd
// padding-bottom: env(safe-area-inset-bottom, 16px) för PWA
// 3 tabs med SVG-ikoner (hus, pratbubbla, lista)
// Aktiv: --color-primary + weight 600; inaktiv: --color-text-muted
// Font-size label: 11px; gap ikon-label: 3px
```

### Ny: `src/components/TrainingCard.tsx` (ersätter befintlig)
Se beskrivning under "Dagens pass" ovan.

```tsx
interface TrainingCardProps {
  weekNumber: number
  breed: Breed
  onAskAboutTraining: () => void  // navigera till /chat
  onShowWeek: () => void
}
```

**Datahämtning:**
- `GET /api/training/week?breed=X&week=Y` → `WeekPlan`
- Filtrera `days` på dagens veckodag (svenska: Måndag–Söndag)
- Cachea i SWR eller React state; invalidera vid veckoskifte

**Progresslagring:**
- `PATCH /api/training/progress` med `{ date, exerciseId, count }`
- Läs tillbaka via `GET /api/training/progress?date=today`

### Uppdatera: `src/components/DogProfileForm.tsx`
- Gör om till 3-stegs wizard (se onboarding ovan)
- Steg 1: foto-upload (spara i localStorage som base64, nyckel `dogPhoto`)

### Uppdatera: `src/components/SessionLogForm.tsx`
- Emoji-rating-knappar: flex row, 3 knappar, vald = `--color-green-50` bakgrund
- Sliders: `accentColor: --color-primary`
- "Spara" + "Avbryt" side-by-side

---

## Interaktioner & Animationer

| Element | Beteende |
|---|---|
### Auto-trigger logg efter avslutat pass

När användaren bockar av sista repen på sista övningen ska loggformuläret triggas automatiskt:

```tsx
// I TrainingCard-komponenten
function tap(exerciseId: string, total: number) {
  const next = { ...counts, [exerciseId]: Math.min((counts[exerciseId] || 0) + 1, total) }
  saveCounts(next)
  
  const nowDone = exercises.filter(e => (next[e.id] || 0) >= e.total).length
  if (nowDone === exercises.length) {
    setTimeout(() => onAllDone(), 400) // liten delay för känsla
  }
}
```

I `DashboardPage`:
```tsx
<TrainingCard
  ...
  onAllDone={() => setShowLog(true)}
/>

{showLog && (
  <div style={{ animation: 'slideUp 0.35s ease' }}>
    <SessionLogForm ... />
  </div>
)}
```

CSS-animation:
```css
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Flöde: bocka av alla reps → 🎉-banner i träningskortet → loggformulär glider upp → betygsätt → sparat.

| Klar-animation | Prickar ersätts av grön bock; rad-bakgrund `--color-green-50` med `transition background 0.25s` |
| Progress bar | `width` transition `0.4s ease` |
| Typing indicator | CSS keyframes bounce, 1.2s, stagger 0.2s |
| Veckovyer-overlay | Slide-in från botten eller fade; `position: fixed; inset: 0; z-index: 50` |
| Alla knappar | `transition: transform 0.1s`; `active: scale(0.97)` |
| Input focus | `border-color` transition 0.2s → `--color-primary` |

---

## PWA-specifikt

Appen ska fungera som PWA (redan `src/app/manifest.ts`):

- **Bottom nav**: använd `env(safe-area-inset-bottom)` för padding så nav inte täcks av home indicator
- **Viewport**: `viewport-fit=cover` i manifest
- **Offline**: träningsplanen är cachad i localStorage — appen ska visa cached data offline
- **Scrollbars**: dölj med `scrollbar-width: none` + `::-webkit-scrollbar { display: none }`

---

## Implementeringsordning

1. `tokens.css` + DM Sans
2. `Avatar`-komponenten
3. `BottomNav`-komponenten  
4. `/api/training/week`-endpoint (AI + RAG + cache)
5. `/api/training/progress`-endpoint (läs/skriv daglig progress)
6. Ny `TrainingCard` med `ExerciseRow` och veckovyer-overlay
7. Uppdatera `DogProfileForm` till 3-stegs wizard med foto
8. Uppdatera `SessionLogForm`
9. Landing page + Dashboard layout
10. Chatt-skärmen
11. Logg-skärmen

---

## Filer i paketet

- `README.md` — denna fil
- `DogVantage Prototype.html` — komplett interaktiv prototyp (alla skärmar + AI-genererade övningar)
- `ios-frame.jsx` — iOS-ram som används i prototypen (referens, används ej i produktion)
