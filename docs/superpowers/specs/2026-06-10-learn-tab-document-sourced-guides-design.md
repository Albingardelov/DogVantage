# Design: Dokumentförankrade guider i Lär-fliken

**Datum:** 2026-06-10
**Status:** Approved

## Bakgrund

Lär-flikens 15 artiklar är hårdkodad AI-skriven text utan källhänvisningar. Appens övriga AI-svar tvingas använda inmatade PDF-dokument via RAG, men Lär-fliken gör det inte. Användaren vill ha konsekvens: alla guider ska vara förankrade i meriterade dokument med synliga källhänvisningar.

Parallellt saknas guider om förarmindset — energihantering, relationsbyggande, korta träningspass och sniff-promenader — vilket är centralt för en ägare med en lättövertrott hund.

---

## Scope

### Ingår
- Ladda ner 2 nya AVSAB position statements och registrera i `ingest-docs.ts`
- Omskriva alla 15 befintliga artiklar med källförankrat innehåll + fotnot
- Lägga till 4 nya artiklar under kategorin Förarmindset
- Strukturera om Lär-sidan med 4 kategoriflikar
- Källfotnot synlig i varje expanderad artikel
- Tab-tillstånd i URL-parametern `?tab=`

### Ingår inte
- Dynamisk RAG-generering av artikeltext
- Böcker som inte har gratis öppna PDFs (McConnell, Clothier, McDevitt)
- Ny databas-tabell eller API-route för artiklar

---

## Nya dokument

| Fil | Källa | URL |
|-----|-------|-----|
| `avsab-punishment-2021.pdf` | AVSAB Position Statement on Use of Punishment | https://avsab.org (exakt URL verifieras vid implementation) |
| `avsab-dominance-2009.pdf` | AVSAB Position Statement on Dominance Theory | https://avsab.org (exakt URL verifieras vid implementation) |

Båda läggs till i `docs/training-guides/` och registreras som `breed: 'general'` i `scripts/ingest-docs.ts`.

---

## Artikelkategorier

### Flik 1 — Valp & Grunder (6 artiklar)
| Artikel | Primärkälla |
|---------|-------------|
| Valpsömn — varför 18 timmar är normalt | Dunbar, Before You Get Your Puppy; AVSAB Puppy Socialization (2024) |
| Socialiseringsfönstret 8–16 veckor | AVSAB Puppy Socialization (2024) |
| Renträna valpen | Dunbar, Before You Get Your Puppy |
| Valpen biter mig — bett-inhibition | Dunbar, Before You Get Your Puppy; Dunbar, After You Get Your Puppy |
| Burträning | Dunbar, Before You Get Your Puppy |
| Ensam hemma — bygg upp tiden | Dunbar, After You Get Your Puppy; Toronto Humane Society Puppy Manual (2023) |

### Flik 2 — Träningsteknik (6 artiklar)
| Artikel | Primärkälla |
|---------|-------------|
| Timing — halv sekund avgör allt | AVSAB Humane Dog Training (2021) |
| Belöning — mer än bara godis | AVSAB Humane Dog Training (2021) |
| Kriterier och progression — split, inte lump | AVSAB Humane Dog Training (2021) |
| Generalisering | AVSAB Humane Dog Training (2021) |
| Grundsignalerna | RSPCA Basic Commands; AKC STAR Puppy |
| Visselpipa och träningsredskap | RSPCA Recall; AKC STAR Puppy |

### Flik 3 — Förarmindset (4 nya artiklar)
| Artikel | Primärkälla |
|---------|-------------|
| Energihantering — läs hunden innan du tränar | AVSAB Humane Dog Training (2021); Dunbar, After You Get Your Puppy |
| Relationsbyggande — vara med hunden utan att kräva | Dunbar, Before You Get Your Puppy; AVSAB Punishment (2021) |
| Korta träningspass — varför 2–3 minuter räcker | AVSAB Humane Dog Training (2021); AKC STAR Puppy |
| Sniff-promenader och decompression | AVSAB Humane Dog Training (2021); Toronto Puppy Manual (2023) |

### Flik 4 — Beteende & Reaktivitet (5 artiklar)
| Artikel | Primärkälla |
|---------|-------------|
| Stresssignaler — läs av din hund | AVSAB Humane Dog Training (2021) |
| Over threshold — när hunden slutar tänka | AVSAB Humane Dog Training (2021) |
| Trigger stacking | AVSAB Humane Dog Training (2021) |
| Look At That (LAT) | AVSAB Humane Dog Training (2021); AVSAB Punishment (2021) |
| BAT & CAT — när LAT inte räcker | AVSAB Humane Dog Training (2021) |

---

## Källfotnot-format

Längst ner i varje expanderad artikel, efter sista sektionen:

```
─────────────────────────────
Källa: AVSAB Humane Dog Training (2021) · Dunbar, After You Get Your Puppy
```

Styled som en diskret fotnot — liten text, subtil separator. Inte länkbar (dokumenten är lokala).

---

## UI-struktur

```
┌─────────────────────────────────────┐
│  Förarguider                        │
│  Kunskapen som gör dig bättre       │
├──────────┬──────────┬───────┬───────┤
│ Valp &   │ Tränings-│ Förar-│ Bete- │
│ Grunder  │ teknik   │ mindset│ ende  │  ← aktiv flik understruken
└──────────┴──────────┴───────┴───────┘
  [accordion-lista för aktiv flik]
  [expanderad artikel med källfotnot]
```

**Tab-state:** `?tab=grunderna|teknik|mindset|beteende` — default `grunderna`.
Befintlig `?article=`-logik behålls för djuplänkar inom en flik.

**Komponentstruktur:**
- `LearnPage` — hanterar `tab` + `expandedId` från searchParams
- `ArticleList` — renderar accordion-lista för given kategori
- `ArticleCard` — expanderbar artikel med källfotnot, identisk med nuvarande card

**CSS:** Flikrad läggs till i befintlig `page.module.css`. Inga nya beroenden.

---

## Implementationsordning

1. Ladda ner + lägg till de 2 nya AVSAB-PDFerna
2. Registrera dem i `ingest-docs.ts`
3. Läs igenom befintliga PDFer för att extrahera faktaunderlag per artikel
4. Omskriva + korreferera alla 15 + 4 nya artiklar i `learn/page.tsx`
5. Refaktorera UI: flikrad + `?tab=` routing
6. Lägga till källfotnot-rendering i ArticleCard
