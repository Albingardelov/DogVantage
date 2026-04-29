# DogVantage — Design Spec
**Date:** 2026-04-29  
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
| Styling | Tailwind CSS |
| PWA | @serwist/next (manifest + installationsbar, ingen offline-cache) |
| Backend/DB | Supabase (PostgreSQL + pgvector) |
| Auth | Ingen i MVP — localStorage. Designad för att lägga till Supabase Auth senare. |
| AI/LLM | Google Gemini 2.0 Flash |
| Embeddings | Google text-embedding-004 (gratis) |
| Hosting | Vercel |

**Motivering för Gemini:** 1 500 gratis anrop/dag räcker för POC-skala. Inget kreditkort krävs för att komma igång. Lätt att byta till OpenAI senare då API-kontraktet är isolerat i ett eget lager.

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
RAG-källdata från ras-PDF:er.
```sql
CREATE TABLE breed_chunks (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed     text NOT NULL,
  source    text NOT NULL,        -- filnamn, t.ex. "RAS_labrador_2023.pdf"
  content   text NOT NULL,        -- råtext från chunk
  embedding vector(768) NOT NULL  -- text-embedding-004
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
-- Cachen är permanent i MVP. Ras + vecka är deterministisk data som inte förändras.
-- Invalidering läggs till om/när ras-dokumenten uppdateras.
```

### Supabase: `session_logs`
Användaren skriver fritt hur ett träningspass gick direkt på träningskortet. Loggarna skickas med i nästa RAG-anrop för att ge AI:n kontext om hundens faktiska prestation.
```sql
CREATE TABLE session_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed       text NOT NULL,
  week_number int  NOT NULL,
  notes       text NOT NULL,  -- fritext, t.ex. "tappade fokus efter 15 min"
  created_at  timestamptz DEFAULT now()
);
```
**Ingen koppling till användare i MVP** — för POC med ett fåtal testare hämtas de 5 senaste loggarna per ras och används som kontext.

---

## Sidor & Användarflöde

```
/                 — Landningssida med CTA: "Kom igång"
/onboarding       — Registrera hund (namn, ras, födelsedatum) → localStorage
/dashboard        — Veckovy: hundens ålder + AI-genererad träningsuppgift
/chat             — Fri chatt mot RAG-pipeline, historik i sessionStorage
/admin/ingest     — Intern sida: ladda upp PDF → chunka → embedda → Supabase
```

**Redirectlogik:** Om `dogProfile` saknas i localStorage redirectas användaren alltid till `/onboarding`.

**Flöde ny användare:** `/ → /onboarding → /dashboard`

---

## Träningsuppgift — Logik

1. Beräkna hundens ålder i veckor: `Math.floor(daysSinceBirth / 7)`
2. Hämta de 5 senaste `session_logs` för rasen
3. Kolla `training_cache` för `(breed, week_number)` **— men bara om inga nya loggar finns sedan cachen skapades**
4. **Cache hit (utan nya loggar):** returnera cachat svar direkt
5. **Cache miss eller nya loggar:** kör adaptiv RAG-pipeline → spara i cache → returnera svar
6. Visa uppgift + källreferens

**Adaptiv logik:** Om det finns session_logs skickas de med i prompten så AI:n kan justera svårighetsgrad, duration eller fokusområde baserat på hundens verkliga prestation.

---

## RAG-pipeline

### Ingestion (körs en gång per ras-dokument via /admin/ingest)
```
PDF
  → chunka text (500 tokens per chunk, 50 tokens overlap)
  → embed varje chunk med text-embedding-004 → vector(768)
  → INSERT INTO breed_chunks
```

### Query (per användaranrop)
```
(fråga eller veckonummer) + ras
  → embed med text-embedding-004
  → pgvector cosine similarity search → top 5 chunks
  → bygg prompt med systemroll + chunks + fråga
  → Gemini 2.0 Flash
  → returnera svar + källreferens
```

### Systemprompt
```
Du är en expert på hundträning specialiserad på [ras].
Basera dina svar ENBART på följande källdokument från [ras-klubb].
Om svaret inte finns i källorna, säg det tydligt.
Svara på svenska.

Källdokument:
[chunk 1]
[chunk 2]
...

[Om session_logs finns:]
Tidigare träningspasset för denna hund:
- Vecka X: "[fritext från användaren]"
- Vecka Y: "[fritext från användaren]"

Anpassa rekommendationen utifrån hundens faktiska prestation ovan.
```

---

## Isolering & Utbytbarhet

- **AI-lagret** är isolerat i `lib/ai/` — Gemini kan bytas mot OpenAI utan att röra UI eller datamodell.
- **Affärslogik** (åldersberäkning, träningslogik) läggs i `lib/dog/` separerat från React-komponenter — förbereder för React Native-flytt.
- **Auth** läggs till genom att ersätta `localStorage`-anropen med Supabase Auth-anrop, utan att ändra resten av appen.

---

## Framtidsplan (utanför MVP-scope)

- Supabase Auth (konton, synkad data)
- Fler raser (dynamiskt via admin-gränssnitt)
- React Native-app som återanvänder samma backend
- Push-notiser för veckans träningsuppgift
