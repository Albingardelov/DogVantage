# DogVantage — Design Spec
**Date:** 2026-04-29  
**Uppdaterad:** 2026-04-29 (efter analys från rasklubbs-ordförande, nybörjarägare och hundtränare)  
**Status:** Approved

---

## Overview

DogVantage är en PWA för rasspecifik hundträning — "Preglife för hundägare". Appen anpassar träningsscheman och milstolpar automatiskt baserat på hundens exakta ålder och rasens egenskaper. All AI-driven rådgivning är grundad i validerade källdokument från rasklubbar (RAS, jaktprovsregler etc.).

**Scope för MVP:** Proof of concept med 3 raser, ett fåtal testare, ingen inloggning.

---

## Stack

| Komponent | Teknik |
|-----------|--------|
| Frontend | Next.js 15 (App Router) |
| Styling | CSS Modules (en `.module.css` per komponent) |
| PWA | @serwist/next (manifest + installationsbar, ingen offline-cache) |
| Backend/DB | Supabase (PostgreSQL + pgvector) |
| Auth | Ingen i MVP — localStorage. Designad för att lägga till Supabase Auth senare. |
| AI/LLM | Google Gemini 2.0 Flash |
| Embeddings | Google text-embedding-004 (gratis) |
| Hosting | Vercel |

**Motivering för Gemini:** 1 500 gratis anrop/dag räcker för POC-skala. Inget kreditkort krävs för att komma igång. Lätt att byta till OpenAI senare då API-kontraktet är isolerat i ett eget lager.

---

## CSS-arkitektur

**Regler som gäller hela projektet:**
- Varje komponent har en egen `.module.css`-fil i samma mapp som `.tsx`-filen
- Ingen inline-styling (`style={{}}`) tillåts — undantag: dynamiska värden som inte kan uttryckas i CSS (t.ex. `style={{ '--progress': value }}`)
- Inga utility-klasser insprängda i JSX (ingen Tailwind i klassnamn)
- Global fil `src/styles/tokens.css` definierar design tokens (färger, spacing, typografi, radier) som CSS custom properties
- `src/styles/globals.css` importerar tokens + CSS reset, ingenting mer

**Filnamnsmönster:**
```
src/components/TrainingCard/
  TrainingCard.tsx
  TrainingCard.module.css

src/components/ChatInterface/
  ChatInterface.tsx
  ChatInterface.module.css
```

**Tokens-exempel:**
```css
/* src/styles/tokens.css */
:root {
  --color-primary: #000000;
  --color-text: #111111;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-surface: #ffffff;
  --color-surface-raised: #f9fafb;
  --color-success: #16a34a;
  --color-error: #dc2626;

  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);

  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}
```

---

## Datamodell

### localStorage (klientside, ingen auth i MVP)
```typescript
interface DogProfile {
  name: string
  breed: "labrador" | "italian_greyhound" | "braque_francais"
  birthdate: string // ISO 8601
}
```

### Supabase: `breed_chunks`
RAG-källdata från ras-PDF:er. Inkluderar dokumentversion och sidreferens för spårbar källcitation.
```sql
CREATE TABLE breed_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed       text NOT NULL,
  source      text NOT NULL,        -- filnamn, t.ex. "RAS_labrador_2023.pdf"
  doc_version text NOT NULL DEFAULT '',  -- t.ex. "2023-rev2"
  page_ref    text NOT NULL DEFAULT '',  -- t.ex. "s. 12, Socialisering"
  content     text NOT NULL,
  embedding   vector(768) NOT NULL  -- text-embedding-004
);
```

### Supabase: `training_cache`
Cachar Gemini-svar per ras och vecka för att spara tokens och ge snabbare svar.
```sql
CREATE TABLE training_cache (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed       text NOT NULL,
  week_number int  NOT NULL,
  content     text NOT NULL,
  source      text NOT NULL DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  UNIQUE(breed, week_number)
);
-- Cachen används bara när inga personliga session_logs finns (generell baslinje).
-- Med session_logs genereras alltid ett anpassat svar.
```

### Supabase: `session_logs`
Hybrid-loggning per träningspass: snabbbetyg + skalor + valfri fritext. Loggarna skickas med i nästa RAG-anrop för adaptiv personalisering.
```sql
CREATE TABLE session_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed        text NOT NULL,
  week_number  int  NOT NULL,
  quick_rating text NOT NULL CHECK (quick_rating IN ('good', 'mixed', 'bad')),
  focus        int  NOT NULL CHECK (focus BETWEEN 1 AND 5),
  obedience    int  NOT NULL CHECK (obedience BETWEEN 1 AND 5),
  notes        text,               -- valfri fritext, t.ex. "tappade fokus efter 15 min"
  created_at   timestamptz DEFAULT now()
);
```

**Loggning ska ta max 20 sekunder** — snabbknappar för quick_rating, slider/stjärnor för focus/obedience, fritext är valfri.

**Ingen koppling till användare i MVP** — de 5 senaste loggarna per ras används som kontext.

---

## Sidor & Användarflöde

```
/                 — Landningssida med CTA: "Kom igång"
/onboarding       — Registrera hund (namn, ras, födelsedatum) → localStorage
/dashboard        — Veckovy: hundens ålder + AI-genererad träningsuppgift + loggformulär
/chat             — Fri chatt mot RAG-pipeline, historik i sessionStorage
/admin/ingest     — Intern sida: ladda upp PDF → chunka → embedda → Supabase
```

**Redirectlogik:** Om `dogProfile` saknas i localStorage redirectas användaren alltid till `/onboarding`.

**Flöde ny användare:** `/ → /onboarding → /dashboard`

---

## Träningsuppgift — Logik

1. Beräkna hundens ålder i veckor: `Math.floor(daysSinceBirth / 7)`
2. Hämta de 5 senaste `session_logs` för rasen
3. Om inga loggar finns → kolla `training_cache` → returnera cachat svar om det finns
4. Om loggar finns, eller ingen cache → kör adaptiv RAG-pipeline
5. Spara i cache (bara om inga loggar) → returnera svar + källcitation
6. Visa uppgift med källdokument, version och sidreferens

**Adaptiv logik:** Session_logs formateras som strukturerad kontext i prompten och ger AI:n underlag för att justera svårighetsgrad, duration och fokusområde.

---

## RAG-pipeline

### Ingestion (körs en gång per ras-dokument via /admin/ingest)
```
PDF (+ metadata: doc_version, page_ref per chunk)
  → chunka text (2000 tecken, 200 overlap)
  → embed varje chunk med text-embedding-004 → vector(768)
  → INSERT INTO breed_chunks
```

### Query (per användaranrop)
```
(fråga eller veckonummer) + ras + session_logs
  → embed med text-embedding-004
  → pgvector cosine similarity search → top 5 chunks
  → veterinärspärr: om frågan matchar hälsonyckelord → returnera fast svar
  → bygg prompt med systemroll + chunks + session_logs + fråga
  → Gemini 2.0 Flash
  → returnera svar + källcitation (source, doc_version, page_ref)
```

### Systemprompt
```
Du är en expert på hundträning specialiserad på [ras].
Basera dina svar ENBART på följande källdokument från rasklubben.
Om svaret inte finns i källorna, säg det tydligt.
Svara på svenska.

Källdokument ([doc_version]):
[chunk 1] (s. X)
[chunk 2] (s. Y)
...

[Om session_logs finns:]
Senaste träningspass:
- Vecka X: Betyg: [good/mixed/bad], Fokus: [1-5]/5, Lydnad: [1-5]/5[. Notes: "..."]
- Vecka Y: ...

Anpassa rekommendationen utifrån hundens faktiska prestation ovan.
Citat källan exakt (dokumentnamn, version, sida) i ditt svar.
```

### Veterinärspärr
Om frågan innehåller nyckelord som: `haltar`, `kräks`, `äter inte`, `blöder`, `veterinär`, `sjuk`, `ont`, `skada` — returnera direkt utan RAG:

```
"Det verkar handla om ett hälsoproblem. DogVantage ger inte medicinska råd — kontakta din veterinär."
```

---

## CSS-arkitektur & Komponentstruktur

- Varje komponent är en egen mapp med `Component.tsx` + `Component.module.css`
- Inga stora filer — om en komponent överstiger ~150 rader, dela upp den
- Ingen affärslogik i komponenter — den tillhör `src/lib/`
- Props-interface definieras i samma fil som komponenten

---

## Isolering & Utbytbarhet

- **AI-lagret** är isolerat i `lib/ai/` — Gemini kan bytas mot OpenAI utan att röra UI eller datamodell
- **Affärslogik** (åldersberäkning, träningslogik) läggs i `lib/dog/` separerat från React-komponenter — förbereder för React Native-flytt
- **Auth** läggs till genom att ersätta `localStorage`-anropen med Supabase Auth-anrop, utan att ändra resten av appen

---

## Framtidsplan (utanför MVP-scope)

- Supabase Auth (konton, synkad data)
- Fler raser (dynamiskt via admin-gränssnitt)
- React Native-app som återanvänder samma backend
- Push-notiser för veckans träningsuppgift
- **Gamification:** bocka av inlärda moment (kräver loggat pass, inte bara klick). Poäng för antal loggade pass — inte för avbockade moment, för att undvika forcerad inlärning
- **Kursledarläge:** tränare kan följa kursdeltagares loggar och lägga till kommentarer
- Exportfunktion av träningsloggar (CSV) inför utställning/jaktprov
- Versionspanel för rasklubbar: uppdatera RAS-dokument utan att ta ner appen
