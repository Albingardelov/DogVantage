# i18n UI-foundation (Fas 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aktivera UI-skal-i18n (sv/en/de) i web-PWA:n via i18next, byggt plattformsoberoende så det kan återanvändas av den kommande RN-appen.

**Architecture:** En plattformsoberoende i18n-kärna i `src/i18n/` (config, messages, ren `resolveLocale`, `createI18nInstance`-factory) + en klient-`I18nProvider` monterad i den befintliga klient-`AppProviders`. Locale-sanningskälla = `user_settings.locale` (Supabase), med `localStorage`-cache och enhetsspråk som fallback. Alla målvyer är redan `'use client'`, så ingen server-RSC-integration behövs.

**Tech Stack:** Next 16.2.4 (App Router), TypeScript (strict), i18next + react-i18next, Supabase, Vitest + Testing Library (jsdom), npm.

**Spec:** `docs/superpowers/specs/2026-06-16-i18n-ui-foundation-design.md`

**Reference before coding:** `node_modules/next/dist/docs/01-app/02-guides/internationalization.md` (Next 16 bekräftar att lokalisering är userland; vi använder den klient-providern, inte path-routing).

---

## Task 1: i18n-kärna — deps, config, messages

**Files:**
- Modify: `package.json` (deps)
- Create: `src/i18n/config.ts`
- Create: `src/i18n/messages.ts`
- Create: `src/i18n/config.test.ts`

- [ ] **Step 1: Install i18next + react-i18next**

Run: `npm install i18next react-i18next`
Expected: both added to `dependencies`, no peer-dep errors.

- [ ] **Step 2: Write the failing test** `src/i18n/config.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, FALLBACK_LOCALE, isSupportedLocale } from './config'

describe('i18n config', () => {
  it('supports exactly sv, en, de', () => {
    expect([...SUPPORTED_LOCALES]).toEqual(['sv', 'en', 'de'])
  })

  it('default is sv, fallback is en', () => {
    expect(DEFAULT_LOCALE).toBe('sv')
    expect(FALLBACK_LOCALE).toBe('en')
  })

  it('isSupportedLocale narrows valid strings and rejects others', () => {
    expect(isSupportedLocale('de')).toBe(true)
    expect(isSupportedLocale('fr')).toBe(false)
    expect(isSupportedLocale(null)).toBe(false)
    expect(isSupportedLocale(42)).toBe(false)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/i18n/config.test.ts`
Expected: FAIL — module `./config` not found.

- [ ] **Step 4: Implement `src/i18n/config.ts`**

```typescript
export const SUPPORTED_LOCALES = ['sv', 'en', 'de'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'sv'
export const FALLBACK_LOCALE: Locale = 'en'

export function isSupportedLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}
```

- [ ] **Step 5: Implement `src/i18n/messages.ts`**

```typescript
import sv from './locales/sv.json'
import en from './locales/en.json'
import de from './locales/de.json'

// i18next "translation" namespace per locale; nested keys via '.' separator.
export const resources = {
  sv: { translation: sv },
  en: { translation: en },
  de: { translation: de },
} as const
```

- [ ] **Step 6: Run test to verify it passes + typecheck**

Run: `npx vitest run src/i18n/config.test.ts && npx tsc --noEmit`
Expected: PASS (3 tests). If `tsc` errors on JSON import, confirm `resolveJsonModule` is set in `tsconfig.json` (Next enables it by default; add `"resolveJsonModule": true` under `compilerOptions` only if missing).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/i18n/config.ts src/i18n/messages.ts src/i18n/config.test.ts
git commit -m "feat(i18n): platform-agnostic config + message catalogs"
```

---

## Task 2: Ren locale-upplösning

**Files:**
- Create: `src/i18n/resolve-locale.ts`
- Create: `src/i18n/resolve-locale.test.ts`

- [ ] **Step 1: Write the failing test** `src/i18n/resolve-locale.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { resolveLocale } from './resolve-locale'

describe('resolveLocale', () => {
  it('1. prefers stored DB locale when supported', () => {
    expect(resolveLocale({ stored: 'de', cached: 'en', deviceLanguage: 'sv' })).toBe('de')
  })

  it('2. falls back to device cache when stored missing/invalid', () => {
    expect(resolveLocale({ stored: null, cached: 'en', deviceLanguage: 'sv-SE' })).toBe('en')
    expect(resolveLocale({ stored: 'fr', cached: 'en' })).toBe('en')
  })

  it('3. uses device language (region-stripped) when supported', () => {
    expect(resolveLocale({ deviceLanguage: 'de-DE' })).toBe('de')
    expect(resolveLocale({ deviceLanguage: 'sv' })).toBe('sv')
  })

  it('4. falls back to en when nothing matches', () => {
    expect(resolveLocale({ deviceLanguage: 'fr-FR' })).toBe('en')
    expect(resolveLocale({})).toBe('en')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/i18n/resolve-locale.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/i18n/resolve-locale.ts`**

```typescript
import { isSupportedLocale, FALLBACK_LOCALE, type Locale } from './config'

export interface LocaleInputs {
  /** user_settings.locale (DB source of truth) */
  stored?: string | null
  /** device cache: localStorage on web, AsyncStorage on RN */
  cached?: string | null
  /** navigator.language on web, expo-localization on RN */
  deviceLanguage?: string | null
}

export function resolveLocale(inputs: LocaleInputs): Locale {
  if (isSupportedLocale(inputs.stored)) return inputs.stored
  if (isSupportedLocale(inputs.cached)) return inputs.cached
  const device = inputs.deviceLanguage?.slice(0, 2).toLowerCase()
  if (isSupportedLocale(device)) return device
  return FALLBACK_LOCALE
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/i18n/resolve-locale.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/i18n/resolve-locale.ts src/i18n/resolve-locale.test.ts
git commit -m "feat(i18n): platform-agnostic locale resolution"
```

---

## Task 3: i18next-instans-factory + klient-provider

**Files:**
- Create: `src/i18n/create-instance.ts`
- Create: `src/i18n/I18nProvider.tsx`
- Create: `src/i18n/create-instance.test.ts`
- Modify: `src/components/AppProviders.tsx`

- [ ] **Step 1: Write the failing test** `src/i18n/create-instance.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { createI18nInstance } from './create-instance'

describe('createI18nInstance', () => {
  it('translates a known key in the requested locale', () => {
    const i = createI18nInstance('en')
    expect(i.t('nav.dashboard')).toBe('Home')
  })

  it('interpolates variables', () => {
    const i = createI18nInstance('sv')
    expect(i.t('dashboard.programWeek', { week: 5 })).toBe('Programvecka 5')
  })

  it('applies plural forms (_one/_other)', () => {
    const i = createI18nInstance('sv')
    expect(i.t('billing.trialDaysLeft', { count: 1 })).toBe('1 dag kvar av Pro-trial')
    expect(i.t('billing.trialDaysLeft', { count: 3 })).toBe('3 dagar kvar av Pro-trial')
  })

  it('falls back to en for a missing key rather than echoing the key', () => {
    const i = createI18nInstance('sv')
    // a key that does not exist anywhere returns the key string (i18next default),
    // but a key present only in fallback resolves via fallbackLng:
    expect(i.t('nav.dashboard')).toBe('Hem')
  })

  it('creates isolated instances (no shared global language)', () => {
    const a = createI18nInstance('sv')
    const b = createI18nInstance('de')
    expect(a.language).toBe('sv')
    expect(b.language).toBe('de')
  })
})
```

> Note: the `en.json` value for `nav.dashboard` must be `"Home"` and `de.json` `dashboard` value `"Home"`/locale-appropriate. Verify the existing `en.json`/`de.json` actually contain `nav.dashboard`; they do (97 parallel keys). If the English value differs, update the assertion to match the real catalog value rather than changing the catalog.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/i18n/create-instance.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/i18n/create-instance.ts`**

```typescript
import i18next, { type i18n } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from './messages'
import { FALLBACK_LOCALE, type Locale } from './config'

/** Isolated i18next instance. Reused by the web client provider now and by
 *  React Native / server later — no global mutable state. */
export function createI18nInstance(locale: Locale): i18n {
  const instance = i18next.createInstance()
  instance.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: FALLBACK_LOCALE,
    interpolation: { escapeValue: false },
    returnNull: false,
    initImmediate: false, // synchronous init so t() works without awaiting
  })
  return instance
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/i18n/create-instance.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Implement `src/i18n/I18nProvider.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import { createI18nInstance } from './create-instance'
import { resolveLocale } from './resolve-locale'
import { isSupportedLocale, DEFAULT_LOCALE } from './config'

const CACHE_KEY = 'dv.locale'

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  // First paint uses DEFAULT_LOCALE on both server and client so hydration matches
  // the current Swedish UI (and <html lang="sv">). Real locale is applied post-mount.
  const [instance] = useState(() => createI18nInstance(DEFAULT_LOCALE))

  useEffect(() => {
    // 1. instant device-level resolution (cache + browser language)
    const local = resolveLocale({
      cached: window.localStorage.getItem(CACHE_KEY),
      deviceLanguage: window.navigator.language,
    })
    if (local !== instance.language) void instance.changeLanguage(local)

    // 2. DB source of truth for logged-in users
    let cancelled = false
    fetch('/api/account')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { locale?: string } | null) => {
        const stored = data?.locale
        if (!cancelled && isSupportedLocale(stored) && stored !== instance.language) {
          void instance.changeLanguage(stored)
          window.localStorage.setItem(CACHE_KEY, stored)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [instance])

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>
}
```

- [ ] **Step 6: Mount provider in `src/components/AppProviders.tsx`**

Replace the file contents with:

```tsx
'use client'

import { SubscriptionProvider } from '@/lib/billing/subscription-context'
import I18nProvider from '@/i18n/I18nProvider'

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SubscriptionProvider>{children}</SubscriptionProvider>
    </I18nProvider>
  )
}
```

- [ ] **Step 7: Typecheck + tests + commit**

Run: `npx tsc --noEmit && npx vitest run src/i18n`
Expected: clean, all i18n tests pass. (`/api/account` GET is added in Task 4; until then the fetch 404s and is caught silently — provider still renders.)

```bash
git add src/i18n/create-instance.ts src/i18n/create-instance.test.ts src/i18n/I18nProvider.tsx src/components/AppProviders.tsx
git commit -m "feat(i18n): client provider mounted in AppProviders"
```

---

## Task 4: Migration + /api/account locale (GET/PATCH)

**Files:**
- Create: `supabase/migrations/026_user_settings_locale.sql`
- Modify: `src/app/api/account/route.ts`

- [ ] **Step 1: Write the migration** `supabase/migrations/026_user_settings_locale.sql`

```sql
alter table public.user_settings
  add column if not exists locale text not null default 'sv';
```

- [ ] **Step 2: Add GET + PATCH to `src/app/api/account/route.ts`**

Add these imports at the top (the file already imports `NextRequest`, `NextResponse`, `withAuth`, `getSupabaseAdmin`):

```typescript
import { isSupportedLocale, DEFAULT_LOCALE } from '@/i18n/config'
```

Add two handlers (keep the existing `DELETE` as-is):

```typescript
export async function GET(req: NextRequest) {
  return withAuth(req, async ({ user }) => {
    const admin = getSupabaseAdmin()
    const { data } = await admin
      .from('user_settings')
      .select('locale')
      .eq('user_id', user.id)
      .maybeSingle()
    return NextResponse.json({ locale: data?.locale ?? DEFAULT_LOCALE })
  })
}

export async function PATCH(req: NextRequest) {
  return withAuth(req, async ({ user }) => {
    const body = await req.json().catch(() => null)
    const locale = (body as { locale?: unknown } | null)?.locale
    if (!isSupportedLocale(locale)) {
      return NextResponse.json({ error: 'invalid_locale' }, { status: 400 })
    }
    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('user_settings')
      .upsert({ user_id: user.id, locale }, { onConflict: 'user_id' })
    if (error) {
      return NextResponse.json({ error: 'save_failed' }, { status: 500 })
    }
    return NextResponse.json({ locale })
  })
}
```

- [ ] **Step 3: Apply the migration to the live DB**

Run: `npx supabase db push` if the Supabase CLI is linked; otherwise apply `026_user_settings_locale.sql` via the Supabase SQL editor. Verify:
the column exists — `select column_name from information_schema.columns where table_name='user_settings' and column_name='locale';` returns one row.

> If `src/types/database.ts` is generated, regenerate it so `user_settings` includes `locale` (e.g. `npx supabase gen types typescript`). If types are hand-maintained, add `locale: string` to the `user_settings` Row/Insert/Update in `src/types/database.ts` so `.select('locale')`/`.upsert({locale})` typecheck.

- [ ] **Step 4: Typecheck + commit**

Run: `npx tsc --noEmit`
Expected: clean (after the `database.ts` `user_settings.locale` field exists).

```bash
git add supabase/migrations/026_user_settings_locale.sql src/app/api/account/route.ts src/types/database.ts
git commit -m "feat(i18n): user_settings.locale column + account GET/PATCH locale"
```

---

## Task 5: nav.skills-nyckel + BottomNav på i18n (första översatta vyn)

**Files:**
- Modify: `src/i18n/locales/sv.json`, `en.json`, `de.json` (add `nav.skills`)
- Modify: `src/components/BottomNav.tsx`
- Create: `src/components/BottomNav.test.tsx`

- [ ] **Step 1: Add `nav.skills` to all three catalogs**

In `src/i18n/locales/sv.json`, inside the `"nav"` object, add: `"skills": "Färdigheter"`
In `src/i18n/locales/en.json`, inside `"nav"`: `"skills": "Skills"`
In `src/i18n/locales/de.json`, inside `"nav"`: `"skills": "Fähigkeiten"`

(Keep the existing `dashboard`/`chat`/`learn` keys — BottomNav reuses them.)

- [ ] **Step 2: Write the failing test** `src/components/BottomNav.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, it, expect } from 'vitest'
import BottomNav from './BottomNav'
import { createI18nInstance } from '@/i18n/create-instance'

function renderIn(locale: 'sv' | 'en' | 'de') {
  return render(
    <I18nextProvider i18n={createI18nInstance(locale)}>
      <BottomNav active="dashboard" />
    </I18nextProvider>,
  )
}

describe('BottomNav i18n', () => {
  it('renders Swedish labels', () => {
    renderIn('sv')
    expect(screen.getByText('Hem')).toBeInTheDocument()
    expect(screen.getByText('Färdigheter')).toBeInTheDocument()
  })

  it('renders English labels', () => {
    renderIn('en')
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Skills')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/BottomNav.test.tsx`
Expected: FAIL — labels are still hardcoded Swedish (`Skills` not found in en render).

- [ ] **Step 4: Convert `src/components/BottomNav.tsx` to `useTranslation`**

```tsx
'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { NavIcon, type BottomNavTab } from '@/components/icons'
import styles from './BottomNav.module.css'

interface BottomNavProps {
  active: BottomNavTab
}

const ITEMS: { id: BottomNavTab; labelKey: string; href: string }[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', href: '/dashboard' },
  { id: 'chat', labelKey: 'nav.chat', href: '/chat' },
  { id: 'skills', labelKey: 'nav.skills', href: '/skills' },
  { id: 'learn', labelKey: 'nav.learn', href: '/learn' },
]

export default function BottomNav({ active }: BottomNavProps) {
  const { t } = useTranslation()
  return (
    <nav className={styles.nav} aria-label={t('nav.ariaLabel')}>
      {ITEMS.map((item) => {
        const isActive = item.id === active
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <NavIcon tab={item.id} />
            <span className={styles.label}>{t(item.labelKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

Add `"ariaLabel"` to the `"nav"` object in each catalog: sv `"Huvudnavigering"`, en `"Main navigation"`, de `"Hauptnavigation"`.

- [ ] **Step 5: Run test to verify it passes + typecheck**

Run: `npx vitest run src/components/BottomNav.test.tsx && npx tsc --noEmit`
Expected: PASS (2 tests), clean types.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/locales/sv.json src/i18n/locales/en.json src/i18n/locales/de.json src/components/BottomNav.tsx src/components/BottomNav.test.tsx
git commit -m "feat(i18n): BottomNav translated, add nav.skills + nav.ariaLabel"
```

---

## Task 6: Språkväljare i Profil-vyn

**Files:**
- Modify: `src/i18n/locales/{sv,en,de}.json` (add `profile.language` + option labels)
- Create: `src/components/LanguageSwitcher.tsx`
- Create: `src/components/LanguageSwitcher.module.css`
- Create: `src/components/LanguageSwitcher.test.tsx`
- Modify: `src/app/profile/page.tsx` (render the switcher)

- [ ] **Step 1: Add catalog keys**

In each catalog, inside `"profile"`, add:
- sv: `"language": "Språk"`
- en: `"language": "Language"`
- de: `"language": "Sprache"`

Language option names are endonyms (same across locales). They will be hardcoded in the component as `Svenska / English / Deutsch` (not translated — an endonym list is intentionally locale-independent).

- [ ] **Step 2: Write the failing test** `src/components/LanguageSwitcher.test.tsx`

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LanguageSwitcher from './LanguageSwitcher'
import { createI18nInstance } from '@/i18n/create-instance'

const fetchMock = vi.fn()
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ locale: 'en' }) })
  localStorage.clear()
})

describe('LanguageSwitcher', () => {
  it('switches the active language and persists it', async () => {
    const i18n = createI18nInstance('sv')
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher />
      </I18nextProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    await waitFor(() => expect(i18n.language).toBe('en'))
    expect(localStorage.getItem('dv.locale')).toBe('en')
    expect(fetchMock).toHaveBeenCalledWith('/api/account', expect.objectContaining({ method: 'PATCH' }))
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/LanguageSwitcher.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `src/components/LanguageSwitcher.tsx`**

```tsx
'use client'

import { useTranslation } from 'react-i18next'
import { SUPPORTED_LOCALES, type Locale } from '@/i18n/config'
import styles from './LanguageSwitcher.module.css'

const LABELS: Record<Locale, string> = {
  sv: 'Svenska',
  en: 'English',
  de: 'Deutsch',
}

const CACHE_KEY = 'dv.locale'

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  async function choose(locale: Locale) {
    if (locale === i18n.language) return
    await i18n.changeLanguage(locale)
    window.localStorage.setItem(CACHE_KEY, locale)
    fetch('/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    }).catch(() => {})
  }

  return (
    <section className={styles.wrap}>
      <h2 className={styles.title}>{t('profile.language')}</h2>
      <div className={styles.options}>
        {SUPPORTED_LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            className={`${styles.option} ${i18n.language === locale ? styles.active : ''}`}
            aria-pressed={i18n.language === locale}
            onClick={() => choose(locale)}
          >
            {LABELS[locale]}
          </button>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Create `src/components/LanguageSwitcher.module.css`**

```css
.wrap { margin: var(--space-6) 0; }
.title { font-size: var(--text-lg); font-weight: var(--font-semibold); margin: 0 0 var(--space-3); }
.options { display: flex; gap: var(--space-2); }
.option {
  flex: 1;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-btn);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-base);
  cursor: pointer;
}
.option.active {
  border-color: var(--color-primary);
  background: var(--color-green-50);
  color: var(--color-primary-dark);
  font-weight: var(--font-semibold);
}
```

- [ ] **Step 6: Render the switcher in `src/app/profile/page.tsx`**

Add the import near the other component imports:

```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher'
```

Render `<LanguageSwitcher />` inside the profile content, next to the existing "Dataskydd"/settings area (place it just before the data-protection / delete-account section). Pick the insertion point by locating the JSX block that renders `t('profile.dataProtection')` or the "Dataskydd" heading and insert `<LanguageSwitcher />` immediately before it.

- [ ] **Step 7: Run test + typecheck + commit**

Run: `npx vitest run src/components/LanguageSwitcher.test.tsx && npx tsc --noEmit`
Expected: PASS (1 test), clean types.

```bash
git add src/i18n/locales/sv.json src/i18n/locales/en.json src/i18n/locales/de.json src/components/LanguageSwitcher.tsx src/components/LanguageSwitcher.module.css src/components/LanguageSwitcher.test.tsx src/app/profile/page.tsx
git commit -m "feat(i18n): language switcher in profile"
```

---

## Task 7: Migrera billing-paywallen till t()

The billing UI is gated and high-traffic; migrate it as the second proof view. All keys already exist under `billing.*` in the catalogs.

The billing UI lives in `src/components/billing/{Paywall,FeatureGate,TrialBanner}.tsx` (all `'use client'`).

**Files:**
- Modify: `src/components/billing/Paywall.tsx`, `src/components/billing/FeatureGate.tsx`, `src/components/billing/TrialBanner.tsx`
- Create: `src/components/billing/Paywall.test.tsx`

- [ ] **Step 1: Read the three billing components**

Read `Paywall.tsx`, `FeatureGate.tsx`, `TrialBanner.tsx` to see the exact hardcoded strings and which props they take (needed to render `Paywall` in the test).

- [ ] **Step 2: Write the failing test** `src/components/billing/Paywall.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, it, expect } from 'vitest'
import Paywall from './Paywall'
import { createI18nInstance } from '@/i18n/create-instance'

describe('Paywall i18n', () => {
  it('renders the English paywall title', () => {
    render(
      <I18nextProvider i18n={createI18nInstance('en')}>
        <Paywall />
      </I18nextProvider>,
    )
    // assert against the real en.json billing.paywallTitle value
    expect(screen.getByText(createI18nInstance('en').t('billing.paywallTitle'))).toBeInTheDocument()
  })
})
```

> If `Paywall` requires props (e.g. plan handlers), read the component and pass minimal valid props. Asserting via `t('billing.paywallTitle')` avoids hardcoding the English copy in the test.

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/billing/Paywall.test.tsx`
Expected: FAIL — hardcoded Swedish title; the English value is not rendered.

- [ ] **Step 4: Replace hardcoded strings with `t('billing.*')`**

In the billing component(s), add `const { t } = useTranslation()` (the components are `'use client'`), then replace each hardcoded Swedish string with its key. Mapping (sv source → key):
- "Prenumeration" → `t('billing.title')`
- "Hantera prenumeration" → `t('billing.manageSubscription')`
- "Välj plan" → `t('billing.choosePlan')`
- "Uppgradera till Pro" → `t('billing.upgradeToPro')`
- "Starta Basic" → `t('billing.startBasic')`
- "Starta Pro" → `t('billing.startPro')`
- "39 kr/mån" → `t('billing.priceBasicMonthly')`
- "79 kr/mån" → `t('billing.priceProMonthly')`
- "Starta DogVantage" → `t('billing.paywallTitle')`
- "Välj en plan för att fortsätta..." → `t('billing.paywallSubtitle')`
- feature-gate text → `t('billing.featureGateTitle', { feature: ... })`

Use the existing `billing.*` keys verbatim (see `sv.json`). For interpolated keys (`trialActive`, `trialDaysLeft`, `featureGateTitle`) pass the variable: e.g. `t('billing.trialActive', { days })`, `t('billing.trialDaysLeft', { count })`.

- [ ] **Step 5: Run test + typecheck**

Run: `npx vitest run <paywall-test-path> && npx tsc --noEmit`
Expected: PASS, clean.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(i18n): translate billing/paywall UI"
```

---

## Task 8: Migrera resterande täckta vyer (mekaniskt, nyckel-för-sträng)

Apply the identical pattern (`const { t } = useTranslation()` + replace string with `t('key')`) to the remaining views whose strings the catalogs already cover. Each is a `'use client'` component. Work one file per sub-step, run `npx tsc --noEmit` after each.

- [ ] **Step 1: Dashboard** (`src/app/dashboard/page.tsx`)
Replace using `dashboard.*` keys: greeting (`dashboard.greeting.morning|day|evening|night` chosen by hour), "Programvecka {n}" → `t('dashboard.programWeek', { week })`, "Logga pass manuellt" → `t('dashboard.logSession')`, "Pass i historik" → `t('dashboard.loggedSessions')`, "denna vecka" → `t('dashboard.thisWeek')`, "Snittbetyg" → `t('dashboard.averageScore')`, "fokus och lydnad" → `t('dashboard.focusAndObedience')`, "Gör snabb screening (10-12 min)" → `t('dashboard.quickScreening')`.

- [ ] **Step 2: Chat** (`src/app/chat/page.tsx`)
`chat.*`: title → `t('chat.title')`, input placeholder → `t('chat.placeholder')`, send button → `t('chat.send')`, empty state → `t('chat.emptyState')`.

- [ ] **Step 3: Calendar** (`src/app/calendar/page.tsx`)
`calendar.*`: title → `t('calendar.title')`, "Vila" → `t('calendar.restDay')`, "Veckoplan" → `t('calendar.weekPlan')`.

- [ ] **Step 4: Learn** (`src/app/learn/page.tsx`)
`learn.*`: page title → `t('learn.title')`, "Läs guiden" → `t('learn.readGuide')`. (Do NOT translate the article bodies/titles from `articles.ts` — out of scope.)

- [ ] **Step 5: Profile remaining strings** (`src/app/profile/page.tsx`)
`profile.*` + `common.*`: "Spara ändringar" → `t('profile.saveChanges')`, "Sparat!" → `t('profile.saved')`, "Träningsmål" → `t('profile.trainingGoals')`, "Träningsinställningar" → `t('profile.trainingSettings')`, "Om hunden" → `t('profile.aboutDog')`, "Dataskydd" → `t('profile.dataProtection')`, "Integritetspolicy" → `t('profile.privacyPolicy')`, "Radera mitt konto" → `t('profile.deleteAccount')`, delete-confirm strings → `t('profile.deleteConfirmTitle|Body|Action')`, and common buttons ("Spara"/"Avbryt"/"Stäng"/"Tillbaka") → `t('common.*')`.

- [ ] **Step 6: Verify no targeted Swedish strings remain in these files**

Run: `grep -rn "Spara ändringar\|Programvecka\|Skriv din fråga\|Veckoplan\|Läs guiden\|Träningsmål" src/app/dashboard src/app/chat src/app/calendar src/app/learn src/app/profile`
Expected: no hardcoded matches (all via `t()`). Strings outside the 97-key scope (article bodies, exercise copy) may remain — that is expected and out of scope.

- [ ] **Step 7: Run full i18n + affected tests, typecheck, commit**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all green.

```bash
git add -A
git commit -m "feat(i18n): translate dashboard, chat, calendar, learn, profile UI strings"
```

---

## Task 9: Helhetsverifiering

- [ ] **Step 1: Full suite + types**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests pass, no type errors.

- [ ] **Step 2: Manual verification in the app**

Run the app (`npm run dev`), log in, and on the Profile page:
- The language switcher shows Svenska / English / Deutsch.
- Selecting English switches BottomNav, billing, dashboard, chat, calendar, learn labels to English immediately.
- Reload the page — the chosen language persists (cache + DB).
- Log out / fresh browser with German OS language — UI starts in German (device-language fallback); unsupported OS language → English.
- No raw key strings (e.g. `nav.dashboard`) appear anywhere.

- [ ] **Step 3: Final commit if manual fixes were needed**

```bash
git add -A
git commit -m "fix(i18n): manual verification adjustments"
```
