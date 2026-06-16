# AI-svar på valt språk (Fas 2a)

**Datum:** 2026-06-17
**Status:** Design, väntar på godkännande

## Bakgrund

Fas 1 gav UI-skalet i18n (sv/en). Innehållet är fortfarande svenskt. Fas 2 delas i två: **2a** (det här) gör AI-*genererat* innehåll flerspråkigt via prompt-injektion; **2b** (separat) för-översätter statiskt innehåll (artiklar, övningskriterier, deterministisk coach-copy).

Insikten bakom 2a: chatten, mikrolektionerna och coach-tipsen produceras av en LLM i stunden. Då behöver vi inte för-översätta — vi säger bara åt modellen att svara på användarens språk. Bonus: en stor del av den ingesterade RAG-korpusen är redan engelska original, så engelska svar blir extra välgrundade. Scope: **sv + en** (tyska bortvalt).

## Mål

- Chatten, dagens mikrolektion och coach-tipset svarar på det språk användaren valt i appen.
- Inget cachat svar läcker mellan språk.
- Ingen för-översättning av AI-innehåll; ingen beroende av att migration 026 körts.

## Avgränsning

**Ingår:** `queryRAG` (chatt), `getMicroLesson`, `getCoachTip` — språkstyrning + cache-nyckel + lokaliserade säkerhetssvar. Klienterna skickar med `locale`.

**Ingår INTE:** statiskt innehåll (artiklar `articles.ts`, övningar `exercise-specs.ts`, deterministisk `session-coach.ts`) = Fas 2b. Tyska. UI-katalogdrift (Fas 1.5). `getExerciseSources` (returnerar språkneutrala källreferenser — rörs inte).

## Locale-källa

Klienten skickar `locale` (från `i18n.language`) i request-body till AI-endpointsen. Servern validerar med `isSupportedLocale` och faller tillbaka på `DEFAULT_LOCALE` (`sv`). Detta gör svaret konsekvent med UI-språket och undviker beroende av `user_settings.locale` (migration 026 ej applicerad).

## Komponenter

### 1. Språkdirektiv i prompten — `src/lib/ai/rag.ts`
- `queryRAG(...)` får en ny parameter `locale: Locale` (sist i signaturen, default `DEFAULT_LOCALE` för bakåtkompatibilitet).
- En ren hjälpfunktion `languageDirective(locale): string` returnerar t.ex. `'Svara på svenska.'` / `'Always answer in English.'`.
- I `systemPrompt` ersätts den hårdkodade `Regler: svara på svenska, ...` med direktivet från `languageDirective(locale)` (övriga regler/format-strängar kan vara kvar som instruktioner — modellen följer output-direktivet).

### 2. Lokaliserade säkerhetssvar — `src/lib/ai/rag.ts`
- `VET_RESPONSE` och `BEHAVIOR_RESPONSE` (kortsluter före LLM vid hälso-/beteendenödläge) blir locale-uppslagna: en `Record<Locale, TrainingResult>` (eller en getter `vetResponse(locale)` / `behaviorResponse(locale)`). En engelsk användare får den engelska varianten.

### 3. Doc-learning-generering — `src/lib/ai/doc-learning.ts`
- `getMicroLesson(breed, lifeStage, exerciseId, locale)` och `getCoachTip(..., locale)` får `locale`:
  - System-prompten skriver på rätt språk (`languageDirective` återanvänds; den nuvarande "Skriv ... på svenska" blir locale-styrd).
  - **Cache-nyckeln utökas med locale**: `mlesson_v1_{breed}_{lifeStage}_{exercise}` → `mlesson_v1_{locale}_{breed}_{lifeStage}_{exercise}` (och motsvarande för coach-tip). Annars serveras fel språk ur cachen.

### 4. Chatt-cache med locale — `src/lib/supabase/training-cache.ts`
- `getCachedChat`, `setCachedChat`, `touchCacheEntry` får `locale` som del av cache-nyckeln (samma fråga på sv och en är olika cache-poster).

### 5. Route + klient
- `src/app/api/chat/route.ts`: läs `locale` ur request-body (validera, default `sv`), skicka till `queryRAG` och till de tre cache-funktionerna.
- Mikrolektion-routen (`/api/training/micro-lesson`): läs `locale` ur query/body, skicka till `getMicroLesson`.
- Klienterna (chatt-komponenten och mikrolektion-hämtningen) skickar med aktuell `i18n.language`.

## Datamodell

Ingen DB-ändring. `training_cache`-poster får nu locale i sin nyckel-sträng (ingen schema-ändring; nyckeln är redan en text-kolumn). Befintliga cachade (svenska) poster blir helt enkelt "missar" för en-användare och regenereras — inga gamla poster tas bort.

## Felhantering

- Ogiltigt/saknat `locale` i request → `DEFAULT_LOCALE` (`sv`).
- Befintlig cache utan locale-suffix: behandlas som cache-miss för det nya nyckelformatet; regenereras vid behov. Inget raderas.
- LLM-fel/timeout: oförändrat beteende (befintlig felhantering), bara på rätt språk om det var ett genererat svar.

## Test

- **Enhet:** `languageDirective('sv')` / `('en')` ger rätt sträng; `queryRAG`-prompt innehåller engelskt direktiv när `locale='en'` (verifiera via en exponerad prompt-byggare eller genom att mocka Groq och inspektera `system`-meddelandet).
- **Enhet:** säkerhetssvar — `locale='en'` → engelsk `VET_RESPONSE`/`BEHAVIOR_RESPONSE` (kortslutning sker före LLM).
- **Enhet:** cache-nyckel skiljer `sv` från `en` (chatt + mikrolektion + coach-tip).
- **Enhet:** route defaultar till `sv` vid saknat/ogiltigt locale.

## Filer som berörs (preliminärt)

- `src/lib/ai/rag.ts` (locale-param, `languageDirective`, lokaliserade säkerhetssvar)
- `src/lib/ai/doc-learning.ts` (locale i `getMicroLesson`/`getCoachTip` + cache-nycklar)
- `src/lib/supabase/training-cache.ts` (locale i chatt-cache-nyckel)
- `src/app/api/chat/route.ts` (läs + tråda locale)
- `src/app/api/training/micro-lesson/route.ts` (läs + tråda locale)
- chatt-klientkomponenten + mikrolektion-hämtningen (skicka `i18n.language`)
- `src/i18n/config.ts` återanvänds (`Locale`, `isSupportedLocale`, `DEFAULT_LOCALE`)
