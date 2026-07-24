# Exercise guide rewrite — design

**Datum:** 2026-07-24  
**Status:** pending user review  
**Scope:** Alla övningar i `exercise-specs.ts` (~24 med guide). Ingen video.

## Problem

Ägare upplever övningsguiderna som för tunna jämfört med bra YouTube-innehåll: för lite konkret *hur* och *varför*, för mycket tränarjargong (“sänk störning”, “höj belöningsvärde”). Dokument/RAG matar chat och veckoplan, men själva Guide-sheet är statisk och abstrakt. Olika metodvarianter funkar olika dagar — appen låtsas idag att det finns ett enda recept.

## Mål

- Varje övning har en guide som känns som en bra instruktör i text: konkret handling + kort motivering.
- Ägaren vet vad som räknas som lyckat och när man ska byta grepp.
- Metodmenyn är liten och kuraterad — inte oändlig AI-improvisation.
- Ingen video i denna iteration.

## Icke-mål

- Video, animationer eller externa klipp.
- Dynamiskt genererade fullängdsguider från RAG.
- Ny fysisk teknik uppfunnen av AI i fält.
- Ombyggnad av progression/ladder/metrics (behålls under huven).

## Källprinciper (hybrid)

| Lager | Källa | Får göra | Får inte |
|-------|--------|----------|----------|
| **Sanning** | Kuraterad text i `exercise-specs` | Setup, steg (hur+därför), lyckokriterium, stop-regler, standard + max 2 varianter | — |
| **Coach** | Session-metrics + fasta regler | Föreslå “Det går inte” → visa variant / sänk svårighet | Hitta på ny metod |
| **AI/docs** | Chat, mikrolektion, struggle-tip | Förklara, motivera, diagnostisera, *välja bland godkända varianter*, parafrasera specs/docs | Ersätta Guide-sheet; påstå nya protokoll utan stöd |

RAG/korpusen är idag mest teori (policy, principer) och otillräcklig som enda källa till procedursteg. Därför skrivs guiden manuellt; docs används till fördjupning och källor.

## Innehållsmodell per övning

Utöka `ExerciseSpec.guide` (eller ersätt fälten bakåtkompatibelt) till:

1. **`todaySummary`** — 1 mening på ägarens språk: vad ni gör idag.
2. **`setup`** — plats, utrustning, belöning, ungefärlig längd (konkreta bullets).
3. **`steps`** — 4–6 steg, varje steg:
   - `how`: exakt vad föraren säger/gör med kroppen
   - `why`: en kort mening om varför steget spelar roll
4. **`successLooksLike`** — hur en lyckad rep *ser ut* (ersätter inte `definition`, kompletterar den i UI).
5. **`whenItFails`** — 3 konkreta “gör istället”-åtgärder (ägarens språk, inte bara “backa nivå”).
6. **`wrapUp`** — när man stoppar och hur man avslutar positivt.
7. **`variants`** — 0–2 kuraterade alternativ till standardspåret:
   - `id`, `label`, `whenToUse` (mismatch-regel), `how` (korta steg), `why`

Behåll oförändrat för plannern: `definition`, `ladder`, `troubleshooting` (kan speglas/omformuleras i UI via `whenItFails`), `goalHints`.

### Språkregler

- Inga råa id:n (`park_low`) synliga i guidetext.
- Undvik tom jargong utan handling (“sänk störning” → “gå 2 meter närmare och ropa när hunden redan tittar”).
- Samma standardspår varje gång ägaren öppnar guiden (muskelminne).
- Variation hör hemma under “Det går inte” / varianter, inte i basguiden.

### Byte av variant

Föreslå byte när:

1. 2–3 missar i rad under rimliga förutsättningar, **eller**
2. Tydlig mismatch (ingen matlust, för hög arousal, frihet vinner ute), **och**
3. Ägaren verkar genomföra tekniken rätt.

Byt **inte** automatiskt vid första miss, ny nivå, eller en stökig park. UI: knapp **“Det går inte”** → max 2 räddningar synliga (varianter och/eller sänk nivå).

## UI

### `ExerciseGuideSheet`

Visa i ordning:

1. Idag gör du detta  
2. Setup  
3. Gör så här (Hur / Därför per steg)  
4. Så vet du att det funkar  
5. Om det inte funkar  
6. Avsluta  
7. (Valfritt avsnitt) Andra sätt — dold bakom “Det går inte” eller expander

Chat-CTA behålls; frågan ska använda övningslabel + success-kriterium, inte rått `criteria_level_id`.

### `ExerciseRow` (kort preview)

Visa `todaySummary` eller första stegets `how` + aktuell ladder-kriteriumtext (som idag). Ingen full guide inline.

### Nivå

En guide per övning. Kort nivåtillägg tillåtet: en mening kopplad till aktiv `criteria_level_id` (“Just nu: inne 2 m — …”) hämtad från ladder `criteria` omformulerad eller `tips` — inte en separat YouTube-lång guide per nivå.

## Leveransomfång

1. **Datamodell** — ny guide-typ i TypeScript; migrera alla befintliga `guide`-objekt.
2. **Innehåll** — skriv om **alla** övningar som har (eller saknar) guide i katalogen, med standardspår + upp till 2 varianter där det är meningsfullt (t.ex. inkallning, koppel, sitt, plats, fokus; enklare övningar kan ha 0–1 variant).
3. **UI** — `ExerciseGuideSheet` (+ preview i `ExerciseRow` om behövs).
4. **Coach-yta** — “Det går inte” visar `variants` / `whenItFails`; session-coach får peka dit vid lower/stop.
5. **AI-gräns** — dokumentera/enforce: chat får rekommendera `variant.id` som finns i spec, inte nya protokoll. (Minimal kodändring i denna fas: tydlig prompt + fallback till spec; ingen ny variantgenerator.)

## Mätning (definition av träffsäker guide)

På samma övning/nivå över 14 dagar:

- Session completion ↑  
- Time-to-first-action ↓ (mål &lt; 60–90 s efter öppnat kort)  
- 1-tap clarity ≥ 80 % “Ja, jag förstod vad jag skulle göra” (om ni lägger till kort feedback)  
- Early quit after reading guide ↓  
- Variant success ≥ 50 % när “Det går inte” används (återupptog + slutförde)

## Risker

| Risk | Mitigering |
|------|------------|
| Stor innehållsinsats | Mall + samma röst för alla övningar; batcha omskrivning |
| För många val | Max 2 varianter; dolda bakom fail-CTA |
| AI kringgår sanningen | Prompt + UI pekar alltid tillbaka till Guide-sheet |
| i18n | Svenska först (nuvarande guide-språk); en-nycklar i senare i18n-pass om behövs |

## Öppen uppföljning (senare, utanför denna spec)

- Tagga chunks med `content_type` / `method` och använd `difficulty` på riktigt.  
- Förbättra how-to-korpus (OCR, inkludera fler procedurdocs).  
- AI-router som *bara* mappar struggle → `variant.id`.
