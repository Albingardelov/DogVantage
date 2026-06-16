# AI-svar på valt språk (Fas 2a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Få AI-genererat innehåll (chatt, mikrolektion, coach-tips) att svara på användarens valda språk (sv/en) via prompt-injektion, med locale-medvetna cache-nycklar och lokaliserade säkerhetssvar.

**Architecture:** En ren `languageDirective(locale)` i i18n-kärnan injiceras i varje LLM-system-prompt. Klienten skickar `locale` till AI-endpointsen; servern validerar och trådar det till generatorerna och in i cache-nycklarna så att språk aldrig korsar varandra. Säkerhetssvaren (kortsluter före LLM) blir locale-uppslagna.

**Tech Stack:** Next 16 (App Router), TypeScript, Groq (chat/JSON), Supabase (training_cache), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-17-ai-response-locale-design.md`

---

## Task 1: `languageDirective`-hjälpare

**Files:** Create `src/i18n/language-directive.ts`, `src/i18n/language-directive.test.ts`.

- [ ] **Step 1: Write failing test** `src/i18n/language-directive.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { languageDirective } from './language-directive'

describe('languageDirective', () => {
  it('returns a Swedish directive for sv', () => {
    expect(languageDirective('sv')).toBe('Svara på svenska.')
  })
  it('returns an English directive for en', () => {
    expect(languageDirective('en')).toBe('Always answer in English.')
  })
  it('returns a German directive for de', () => {
    expect(languageDirective('de')).toBe('Antworte immer auf Deutsch.')
  })
})
```

- [ ] **Step 2: Run it — expect FAIL (module not found).**

Run: `npx vitest run src/i18n/language-directive.test.ts`

- [ ] **Step 3: Implement `src/i18n/language-directive.ts`**

```typescript
import type { Locale } from './config'

const DIRECTIVES: Record<Locale, string> = {
  sv: 'Svara på svenska.',
  en: 'Always answer in English.',
  de: 'Antworte immer auf Deutsch.',
}

export function languageDirective(locale: Locale): string {
  return DIRECTIVES[locale]
}
```

- [ ] **Step 4: Run it — expect PASS (3 tests).**

- [ ] **Step 5: Commit**

```bash
git add src/i18n/language-directive.ts src/i18n/language-directive.test.ts
git commit -m "feat(i18n): languageDirective helper for LLM prompts"
```

---

## Task 2: Lokaliserade säkerhetssvar

**Files:** Modify `src/lib/ai/safety-guards.ts`; Create `src/lib/ai/safety-guards.test.ts`.

Context: `safety-guards.ts` currently exports `VET_RESPONSE` and `BEHAVIOR_RESPONSE` as single Swedish `TrainingResult` constants, plus `detectHealthIssue`/`detectBehaviorEmergency`. We replace the two constants with locale getters; keep the detectors unchanged.

- [ ] **Step 1: Write failing test** `src/lib/ai/safety-guards.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { vetResponse, behaviorResponse } from './safety-guards'

describe('localized safety responses', () => {
  it('vetResponse is Swedish for sv and English for en', () => {
    expect(vetResponse('sv').content).toContain('veterinär')
    expect(vetResponse('en').content).toContain('veterinarian')
  })
  it('behaviorResponse is Swedish for sv and English for en', () => {
    expect(behaviorResponse('sv').content).toContain('beteendekonsulent')
    expect(behaviorResponse('en').content).toContain('behaviour consultant')
  })
  it('falls back to English for de (not actively translated)', () => {
    expect(vetResponse('de').content).toContain('veterinarian')
  })
})
```

- [ ] **Step 2: Run it — expect FAIL (`vetResponse`/`behaviorResponse` not exported).**

- [ ] **Step 3: Refactor `src/lib/ai/safety-guards.ts`**

Replace the `export const VET_RESPONSE: TrainingResult = {...}` block with locale variants + getter. Keep the existing Swedish text as the `sv` value:

```typescript
const VET_RESPONSES: Partial<Record<Locale, TrainingResult>> = {
  sv: {
    content:
      'Det verkar handla om ett hälsoproblem. DogVantage ger inte medicinska råd — kontakta din veterinär.',
    source: '',
    source_url: '',
    attributionNote: 'Fast svar vid hälsoindikation — inte från dina dokument.',
  },
  en: {
    content:
      'This sounds like a health issue. DogVantage does not give medical advice — please contact your veterinarian.',
    source: '',
    source_url: '',
    attributionNote: 'Fixed response for a health indication — not from your documents.',
  },
}

export function vetResponse(locale: Locale): TrainingResult {
  return VET_RESPONSES[locale] ?? VET_RESPONSES.en!
}
```

Replace the `export const BEHAVIOR_RESPONSE: TrainingResult = {...}` block with:

```typescript
const BEHAVIOR_RESPONSES: Partial<Record<Locale, TrainingResult>> = {
  sv: {
    content:
      'Det du beskriver låter som ett beteendeproblem som ligger utanför det DogVantage kan hjälpa med säkert. ' +
      'Bett, morrning, resursförsvar och panik är inte träningsfel — det är signaler som behöver bedömas av en certifierad beteendekonsulent som kan möta er fysiskt och bygga ett individanpassat program.\n\n' +
      'Hitta hjälp via:\n' +
      '• SBBK — Sveriges Bästa Beteendekonsulter (sbbk.se)\n' +
      '• IAABC — internationell organisation med certifierade konsulter (iaabc.org)\n' +
      '• Din veterinär kan också remittera till en beteendeveterinär.\n\n' +
      'Fortsätt gärna träna grundlydnad och vardagliga moment i appen, men prioritera professionell hjälp för det beskrivna beteendet.',
    source: '',
    source_url: '',
    attributionNote: 'Fast svar vid beteende-emergency — inte från dina dokument.',
  },
  en: {
    content:
      'What you are describing sounds like a behaviour problem that is outside what DogVantage can safely help with. ' +
      'Biting, growling, resource guarding and panic are not training mistakes — they are signals that need to be assessed by a certified behaviour consultant who can meet you in person and build an individual programme.\n\n' +
      'Find help via:\n' +
      '• IAABC — international organisation of certified consultants (iaabc.org)\n' +
      '• Your veterinarian can also refer you to a veterinary behaviourist.\n\n' +
      'Please keep training basic obedience and everyday skills in the app, but prioritise professional help for the behaviour described.',
    source: '',
    source_url: '',
    attributionNote: 'Fixed response for a behaviour emergency — not from your documents.',
  },
}

export function behaviorResponse(locale: Locale): TrainingResult {
  return BEHAVIOR_RESPONSES[locale] ?? BEHAVIOR_RESPONSES.en!
}
```

Add the import at the top of the file: `import type { Locale } from '@/i18n/config'`. Keep `detectHealthIssue`, `detectBehaviorEmergency`, and all keyword arrays unchanged.

- [ ] **Step 4: Run the test — expect PASS (3 tests).**

- [ ] **Step 5: Typecheck** — `npx tsc --noEmit` will FAIL where `rag.ts` still imports `VET_RESPONSE`/`BEHAVIOR_RESPONSE`. That is expected; Task 3 updates rag.ts. Commit Tasks 2+3 together (do not commit a broken typecheck). Proceed to Task 3.

---

## Task 3: `queryRAG` språk + säkerhetssvar

**Files:** Modify `src/lib/ai/rag.ts`; Create `src/lib/ai/rag.locale.test.ts`.

- [ ] **Step 1: Add `locale` to `QueryRAGOptions` and use the directive**

In `src/lib/ai/rag.ts`:
- Add imports:
```typescript
import { languageDirective } from '@/i18n/language-directive'
import { vetResponse, behaviorResponse } from '@/lib/ai/safety-guards'
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config'
```
- Remove `VET_RESPONSE, BEHAVIOR_RESPONSE` from the existing `safety-guards` import (keep `detectHealthIssue`, `detectBehaviorEmergency`).
- Add `locale?: Locale` to the `QueryRAGOptions` interface.
- At the top of `queryRAG`, resolve it: `const locale = opts.locale ?? DEFAULT_LOCALE`.
- Replace the two guard returns:
```typescript
  if (detectHealthIssue(query)) return vetResponse(locale)
  ...
  if (detectBehaviorEmergency(query) || detectBehaviorEmergency(onboardingContext)) {
    return behaviorResponse(locale)
  }
```
- In the `systemPrompt` template, replace the literal `Regler: svara på svenska,` with the directive. Change the final rules line to:
```typescript
Regler: ${languageDirective(locale)} Anpassa till hundens ålder i veckor. ${lengthRule} ${responseFormat} ${documentContext ? 'Nämn källnamn om KÄLLDOKUMENT finns — annars påstå inte att du citerar ett dokument.' : 'Påstå inte att du citerar ett dokument.'}`
```
(Keep the rest of the prompt unchanged; only the output-language directive is now locale-driven.)

- [ ] **Step 2: Write the test** `src/lib/ai/rag.locale.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const createMock = vi.fn()
vi.mock('@/lib/ai/client', () => ({
  getGroqClient: () => ({ chat: { completions: { create: createMock } } }),
  GROQ_MODEL: 'test-model',
  AI_TIMEOUTS: { chat: 1000 },
}))
vi.mock('@/lib/ai/embed', () => ({ embedText: vi.fn().mockRejectedValue(new Error('no embed in test')) }))

import { queryRAG } from './rag'

beforeEach(() => {
  createMock.mockReset()
  createMock.mockResolvedValue({ choices: [{ message: { content: 'ok' } }], usage: null })
})

describe('queryRAG locale', () => {
  it('injects the English directive into the system prompt when locale=en', async () => {
    await queryRAG('how do I teach sit', 'labrador', [], 20, [], undefined, { locale: 'en' })
    const systemMsg = createMock.mock.calls[0][0].messages[0].content as string
    expect(systemMsg).toContain('Always answer in English.')
  })

  it('returns the English vet response for a health query without calling the LLM', async () => {
    const res = await queryRAG('min hund kräks blod och är sjuk', 'labrador', [], 20, [], undefined, { locale: 'en' })
    expect(res.content).toContain('veterinarian')
    expect(createMock).not.toHaveBeenCalled()
  })
})
```

> Note: the second test relies on `detectHealthIssue` matching the query. If it does not match the chosen words, open `safety-guards.ts`, read `VET_KEYWORDS`, and use a query containing a real keyword so the guard triggers.

- [ ] **Step 3: Run the test — expect PASS (2 tests).**

Run: `npx vitest run src/lib/ai/rag.locale.test.ts`

- [ ] **Step 4: Typecheck + commit Tasks 2 and 3 together**

Run: `npx tsc --noEmit && npx vitest run src/lib/ai/safety-guards.test.ts src/lib/ai/rag.locale.test.ts`
Expected: clean, all pass.

```bash
git add src/lib/ai/safety-guards.ts src/lib/ai/safety-guards.test.ts src/lib/ai/rag.ts src/lib/ai/rag.locale.test.ts
git commit -m "feat(ai): locale-driven language directive + localized safety responses"
```

---

## Task 4: Chatt-cache med locale

**Files:** Modify `src/lib/supabase/training-cache.ts`; Create `src/lib/supabase/chat-cache-key.test.ts`.

- [ ] **Step 1: Make `chatCacheKey` locale-aware and exported**

In `src/lib/supabase/training-cache.ts`:
- Add an import: `import { type Locale } from '@/i18n/config'`
- Bump `const CHAT_CACHE_VERSION = 'v1'` to `'v2'` (so old language-less keys never collide).
- Change `chatCacheKey` to take and include `locale`, and `export` it:
```typescript
export function chatCacheKey(query: string, breed: Breed, locale: Locale, ageWeeks?: number): string {
  const hash = shortHash(`${normalizeChatQuery(query)}|${breed}|${locale}|${ageBucket(ageWeeks)}`)
  return `chatcache_${CHAT_CACHE_VERSION}_${hash}`
}
```
- Add `locale: Locale` to `getCachedChat`, `setCachedChat`, and `touchCacheEntry` (place it before the optional `ageWeeks` param) and pass it through to `chatCacheKey(query, breed, locale, ageWeeks)` in each.

Example signatures after the change:
```typescript
export async function getCachedChat(query: string, breed: Breed, locale: Locale, ageWeeks?: number): Promise<TrainingResult | null>
export async function setCachedChat(query: string, breed: Breed, locale: Locale, result: TrainingResult, ageWeeks?: number): Promise<void>
export async function touchCacheEntry(query: string, breed: Breed, locale: Locale, ageWeeks?: number): Promise<void>
```
Update each function body's `chatCacheKey(...)` call to pass `locale`. (Note `setCachedChat` keeps `result` after `locale`.)

- [ ] **Step 2: Write the test** `src/lib/supabase/chat-cache-key.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { chatCacheKey } from './training-cache'

describe('chatCacheKey', () => {
  it('produces different keys per locale for the same query', () => {
    const sv = chatCacheKey('Hur lär jag sitt?', 'labrador', 'sv', 20)
    const en = chatCacheKey('Hur lär jag sitt?', 'labrador', 'en', 20)
    expect(sv).not.toBe(en)
  })
  it('is stable for the same inputs', () => {
    expect(chatCacheKey('q', 'labrador', 'en', 20)).toBe(chatCacheKey('q', 'labrador', 'en', 20))
  })
  it('uses the v2 namespace', () => {
    expect(chatCacheKey('q', 'labrador', 'en', 20)).toMatch(/^chatcache_v2_/)
  })
})
```

- [ ] **Step 3: Run it — expect FAIL first (not exported / wrong signature), then implement above, then PASS.**

Run: `npx vitest run src/lib/supabase/chat-cache-key.test.ts`

- [ ] **Step 4: Typecheck** — `npx tsc --noEmit` will FAIL at the chat route (still calls the 3 functions without `locale`). Expected; Task 5 fixes the route. Commit Tasks 4+5 together.

---

## Task 5: Chatt-route trådar locale

**Files:** Modify `src/app/api/chat/route.ts`.

- [ ] **Step 1: Parse `locale` from the request body**

The handler currently does `const { query } = await req.json() as { query: string }`. Change it to also read `locale`, and validate:
```typescript
import { isSupportedLocale, DEFAULT_LOCALE } from '@/i18n/config'
```
```typescript
      const body = await req.json() as { query?: string; locale?: string }
      const query = body.query
      const locale = isSupportedLocale(body.locale) ? body.locale : DEFAULT_LOCALE
      if (!query) {
        return NextResponse.json({ error: 'query required' }, { status: 400 })
      }
```
(Preserve the existing `if (!query)` guard behaviour.)

- [ ] **Step 2: Thread `locale` into the cache reads/writes and queryRAG**

- `getCachedChat(query, breed, ageWeeks)` → `getCachedChat(query, breed, locale, ageWeeks)`
- `touchCacheEntry(query, breed, ageWeeks)` → `touchCacheEntry(query, breed, locale, ageWeeks)`
- `setCachedChat(query, breed, result, ageWeeks)` → `setCachedChat(query, breed, locale, result, ageWeeks)`
- `queryRAG(query, breed, logStrings, ageWeeks, metricsStrings, chatContext, { history, dogStateContext })` → add `locale` to the opts object: `{ history, dogStateContext, locale }`

- [ ] **Step 3: Typecheck + tests + commit Tasks 4 and 5 together**

Run: `npx tsc --noEmit && npx vitest run src/lib/supabase/chat-cache-key.test.ts`
Expected: clean, pass.

```bash
git add src/lib/supabase/training-cache.ts src/lib/supabase/chat-cache-key.test.ts src/app/api/chat/route.ts
git commit -m "feat(ai): locale-aware chat cache + thread locale through chat route"
```

---

## Task 6: Doc-learning (mikrolektion + coach-tips) språk + cache

**Files:** Modify `src/lib/ai/doc-learning.ts`; Create `src/lib/ai/doc-learning-cache-key.test.ts`.

- [ ] **Step 1: Add exported cache-key helpers and write the failing test** `src/lib/ai/doc-learning-cache-key.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { microLessonCacheKey, struggleAdviceCacheKey } from './doc-learning'

describe('doc-learning cache keys include locale', () => {
  it('micro-lesson key differs per locale', () => {
    expect(microLessonCacheKey('en', 'labrador', 'puppy', 'sitt'))
      .not.toBe(microLessonCacheKey('sv', 'labrador', 'puppy', 'sitt'))
  })
  it('struggle-advice key differs per locale', () => {
    expect(struggleAdviceCacheKey('en', 'labrador', 'sitt'))
      .not.toBe(struggleAdviceCacheKey('sv', 'labrador', 'sitt'))
  })
})
```

- [ ] **Step 2: Run it — expect FAIL (helpers not exported).**

- [ ] **Step 3: Implement helpers + thread locale in `src/lib/ai/doc-learning.ts`**

Add imports:
```typescript
import { languageDirective } from '@/i18n/language-directive'
import type { Locale } from '@/i18n/config'
```
Add the two exported key helpers (near the other internals):
```typescript
export function microLessonCacheKey(locale: Locale, breed: Breed, lifeStage: string, exerciseId: string): string {
  return `mlesson_v2_${locale}_${breed}_${lifeStage}_${exerciseId}`
}

export function struggleAdviceCacheKey(locale: Locale, breed: Breed, exerciseId: string): string {
  return `coach_v2_${locale}_${breed}_${exerciseId}`
}
```
In `getMicroLesson`, add `locale: Locale` as the last parameter, replace the inline `cacheKey` with `microLessonCacheKey(locale, breed, lifeStage, exerciseId)`, and make the system prompt language-driven — replace the first system line:
```typescript
        `Du är en hundträningslärare. ${languageDirective(locale)} Skriv en mikrolektion om "${label}" för en ${breed} (${lifeStage}).`,
```
(Remove the hardcoded "på svenska". The JSON-format instruction line stays.)

In `getStruggleAdvice`, add `locale: Locale` as the last parameter, replace the inline `cacheKey` with `struggleAdviceCacheKey(locale, breed, exerciseId)`, and replace the second system line:
```typescript
        `${languageDirective(locale)} Skriv 2–3 meningar: varför det troligen händer och EN konkret justering till nästa pass.`,
```
(Remove the hardcoded "på svenska".)

- [ ] **Step 4: Run the test — expect PASS (2 tests). Typecheck will FAIL at the callers (`getMicroLesson`/`getStruggleAdvice` now need `locale`). Expected; Task 7 fixes the routes. Commit Tasks 6+7 together.**

Run: `npx vitest run src/lib/ai/doc-learning-cache-key.test.ts`

---

## Task 7: Routes + klienter trådar locale (mikrolektion, logs, chatt-klient)

**Files:** Modify `src/app/api/training/micro-lesson/route.ts`, `src/app/api/logs/route.ts`, `src/components/ChatInterface.tsx`, `src/components/MicroLessonCard.tsx`, `src/components/SessionLogForm.tsx`.

- [ ] **Step 1: Micro-lesson route reads `locale` from the query string**

In `src/app/api/training/micro-lesson/route.ts`, add import `import { isSupportedLocale, DEFAULT_LOCALE } from '@/i18n/config'`. Inside the handler, resolve locale and pass it:
```typescript
    const localeParam = req.nextUrl.searchParams.get('locale')
    const locale = isSupportedLocale(localeParam) ? localeParam : DEFAULT_LOCALE
```
Change `getMicroLesson(breed, lifeStage, exerciseId)` → `getMicroLesson(breed, lifeStage, exerciseId, locale)`.

- [ ] **Step 2: Logs route reads `locale` and passes to coach advice**

In `src/app/api/logs/route.ts`, add the same import. Read locale from the parsed body (the route already parses a JSON body for the log — add `locale` to that destructure; if it reads `await req.json()`, capture `locale` from it). Resolve `const locale = isSupportedLocale(body.locale) ? body.locale : DEFAULT_LOCALE`. Change `getStruggleAdvice(dog.breed as Breed, struggling.id)` → `getStruggleAdvice(dog.breed as Breed, struggling.id, locale)`.

- [ ] **Step 3: Clients send locale**

`src/components/ChatInterface.tsx` (line ~68) — the `apiFetch('/api/chat', TrainingResultSchema, { ... })` call sends a JSON body. Add `const { i18n } = useTranslation()` (import `useTranslation` from `react-i18next`) and include `locale: i18n.language` in the POST body alongside `query`.

`src/components/MicroLessonCard.tsx` (line ~34) — append the locale to the URL: add `useTranslation`, then change the URL to `` `/api/training/micro-lesson?dogId=${encodeURIComponent(dogId)}&locale=${i18n.language}` ``.

`src/components/SessionLogForm.tsx` — the form POSTs to `/api/logs`. Add `useTranslation` and include `locale: i18n.language` in that POST body. (Find the `fetch('/api/logs'` / `apiFetch('/api/logs'` call and add the field to its JSON body.)

- [ ] **Step 4: Typecheck + full suite + commit Tasks 6 and 7 together**

Run: `npx tsc --noEmit && npx vitest run`
Expected: clean, all green (existing 346+ tests plus the new ones).

```bash
git add src/lib/ai/doc-learning.ts src/lib/ai/doc-learning-cache-key.test.ts src/app/api/training/micro-lesson/route.ts src/app/api/logs/route.ts src/components/ChatInterface.tsx src/components/MicroLessonCard.tsx src/components/SessionLogForm.tsx
git commit -m "feat(ai): thread locale through micro-lesson, logs, and AI clients"
```

---

## Task 8: Helhetsverifiering

- [ ] **Step 1: Full suite + types**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests pass, no type errors.

- [ ] **Step 2: Manual verification**

Run `npm run dev`, set the app language to English (Profile → Language → English), then:
- Ask the chat a question → the answer comes back in English.
- Re-ask the exact same question → still English (the cache key includes locale; no Swedish cached answer leaks).
- Trigger a health-flag question (e.g. mentions vomiting/illness) → the English vet-referral safety response appears.
- Switch back to Svenska → the same question now answers in Swedish (separate cache entry).
- The daily micro-lesson and post-session coach tip render in the selected language.

- [ ] **Step 3: Final commit if manual fixes were needed**

```bash
git add -A
git commit -m "fix(ai): fas 2a manual verification adjustments"
```
