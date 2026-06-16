# i18n — UI-skal Fas 1

**Datum:** 2026-06-16
**Status:** Design, väntar på godkännande

## Bakgrund

DogVantage har tre locale-filer (`src/i18n/locales/{sv,en,de}.json`, 97 nycklar var, i18next-formade) men **ingen i18n-wiring** — inget bibliotek, ingen provider, ingen locale-upplösning. All UI-text renderas som hårdkodad svenska. Appen är en PWA idag; en Expo/React Native-app är planerad (RN-0-monorepogrunden är designad på `react-native`-branchen men inte mergad till `main`).

Styrande princip från RN-0: plattformsoberoende affärslogik ska bo i `packages/core` med en tvingande plattformsgräns, så att web och RN delar den. **i18n ska byggas efter samma princip — en gång, återanvändbart av RN.**

## Mål

- UI-skalet (de befintliga 97 nycklarna) renderas på **sv / en / de**.
- Användaren kan byta språk; valet persisteras och gäller på alla enheter.
- i18n-kärnan är **plattformsoberoende** (ingen Next/Supabase-import) så den kan lyftas till `packages/core` utan omskrivning.

## Avgränsning

**Ingår (Fas 1):**
- i18next + react-i18next wiring för web (server + klient).
- Locale-upplösning + persistens (profil-kolumn + enhetscache + enhetsspråk).
- Språkväljare i Profil-vyn.
- Migrering av hårdkodade strängar till `t()` **endast** i de vyer de 97 nycklarna täcker (nav, billing, dashboard, profile, chat, calendar, learn, common, apiErrors).

**Ingår INTE (senare faser):**
- Översättning av innehåll: guide-artiklar (`src/app/learn/articles.ts`), övningar/`exercise-specs`, copy utanför de 97 nycklarna.
- Flerspråkig RAG/chatt (kräver översatta källdokument eller språkspecifik retrieval).
- Den faktiska monorepo-flytten av i18n-modulen till `packages/core` (görs när RN-0 mergats; modulen byggs nu så flytten blir ren).
- URL-/path-baserad locale-routing (`/sv`, `/en`) — medvetet bortvalt: fungerar inte i RN och kräver omtag av hela route-trädet.

## Bibliotek: i18next + react-i18next

Enda valet som körs på **både web och React Native** och matchar de befintliga JSON-filernas format (`{{var}}`-interpolation, `_one`/`_other`-plural). `next-intl` förkastas: Next/web-only, kan inte återanvändas i RN eller flyttas till `packages/core`.

## Arkitektur

### Plattformsoberoende kärna — `src/i18n/`
Ren modul utan Next/Supabase/React-Native-import:
- `src/i18n/locales/{sv,en,de}.json` — befintliga kataloger (oförändrade).
- `src/i18n/config.ts` — `SUPPORTED_LOCALES = ['sv','en','de'] as const`, `DEFAULT_LOCALE = 'sv'`, `FALLBACK_LOCALE = 'en'`, typ `Locale`.
- `src/i18n/messages.ts` — importerar de tre katalogerna och exporterar `resources` i i18next-format.
- `src/i18n/create-instance.ts` — `createI18nInstance(locale: Locale)` som skapar en isolerad, fristående i18next-instans (används av klient-providern nu; samma factory återanvänds av RN/servern senare). Inga globala sidoeffekter.

Denna modul är det som senare flyttas till `packages/core/i18n`.

### Web-integration (Next 16 App Router) — klient-only för Fas 1
Alla vyer vi översätter denna fas (`dashboard`, `chat`, `calendar`, `learn`, `profile`, `BottomNav`, billing) är **redan `'use client'`**, och appen wrappar allt i en befintlig klient-`AppProviders`. Därför räcker en **klient-side provider** — ingen server-RSC-/per-request-maskineri behövs (det var den flaggade risken; den utgår).
- `src/i18n/I18nProvider.tsx` (`'use client'`) — initierar en klient-i18next-instans via `createI18nInstance(resolveLocale(...))` och wrappar `I18nextProvider`. Monteras i `src/components/AppProviders.tsx` runt resten. Klientkomponenter använder `useTranslation()` från react-i18next.
- En server-`getT(locale)` för server-komponenter byggs **först när en server-komponent faktiskt behöver översättning** (senare fas) — YAGNI nu.
- `<html lang="sv">` i root-layouten lämnas oförändrad i Fas 1 (server-komponent som inte känner klientens locale); kan sättas dynamiskt senare. Påverkar inte synliga strängar.

### Locale-upplösning — `src/i18n/resolve-locale.ts`
Plattformsoberoende ren funktion `resolveLocale(inputs): Locale` med ordning:
1. `user_settings.locale` om inloggad och satt (hämtas klient-side)
2. enhetscache (web: `localStorage['dv.locale']`; RN: `AsyncStorage` senare)
3. enhetsspråk (web: `navigator.language`; RN: `expo-localization` senare) om det matchar `SUPPORTED_LOCALES`
4. `FALLBACK_LOCALE` (`en`)

`DEFAULT_LOCALE` (`sv`) och `FALLBACK_LOCALE` (`en`) är inte i konflikt: `sv` är källspråket och kolumn-defaulten (bevarar nuvarande beteende för befintliga svenska användare, som alltid träffar steg 1), medan `en` bara används i steg 4 för en **anonym** besökare vars enhetsspråk inte stöds — det internationellt mest universella valet.

Plattformsspecifika läsare (localStorage / AsyncStorage) injiceras in i funktionen — själva funktionen är ren och delbar. Ingen cookie behövs eftersom renderingen är klient-side i Fas 1; sanningskällan är `user_settings.locale`, med enhetscachen som snabb lokal spegel.

## Datamodell

Locale är per **användare**. Appen har ingen `profiles`-tabell men har en `user_settings`-tabell (kolumner idag: `user_id`, `active_dog_id`, `updated_at`). Migration `026_user_settings_locale.sql`:
```sql
alter table public.user_settings add column if not exists locale text not null default 'sv';
```
RLS oförändrad (raden ägs redan av användaren). Värdet begränsas i applikationslagret till `SUPPORTED_LOCALES`.

## Språkväljare

- En kontroll i Profil-vyn (`src/app/profile`): tre val (Svenska / English / Deutsch).
- Vid byte: `PATCH /api/account` (withAuth) uppdaterar `user_settings.locale` (validerar mot `SUPPORTED_LOCALES`), uppdaterar enhetscache (`localStorage`), och byter språk i klient-instansen direkt (`i18n.changeLanguage`).
- Använder `t('profile.*')`-nycklar (några nya nycklar för väljaren läggs till i alla tre katalogerna).

## Felhantering

- Saknad nyckel → i18next fallback till `FALLBACK_LOCALE`, aldrig råa nyckelnamn i UI. `returnNull: false`, `fallbackLng: 'en'`.
- Ogiltigt locale-värde (cache/cookie/DB manipulerat) → faller igenom upplösningskedjan till fallback.
- Profil-PATCH som misslyckas → språket byts ändå lokalt (cache), men ett diskret fel visas; nästa lyckade sync rättar DB.

## Test

- **Enhet (`resolve-locale.test.ts`):** alla fyra stegen i ordning, ogiltigt värde ignoreras, ej stödd `navigator.language` hoppas över.
- **Enhet (i18n-kärna):** interpolation (`{{days}}`), plural (`_one`/`_other`), fallback för saknad nyckel.
- **Komponent:** en vy (t.ex. `BottomNav` eller billing-paywall) renderad via provider på sv/en/de ger rätt strängar; `changeLanguage` uppdaterar live.
- **Migration:** kolumnen finns, default `sv`, befintliga rader får `sv`.

## Filer som berörs (preliminärt)

- `src/i18n/config.ts`, `messages.ts`, `create-instance.ts`, `resolve-locale.ts`, `I18nProvider.tsx` (nya)
- `src/i18n/locales/{sv,en,de}.json` (nya nycklar för språkväljaren; `nav.skills` saknas och läggs till)
- `src/components/AppProviders.tsx` (montera `I18nProvider` runt befintliga providers)
- `src/app/profile/page.tsx` (språkväljare)
- `src/app/api/account/route.ts` (ny `PATCH` för `locale`)
- `supabase/migrations/026_user_settings_locale.sql`
- `package.json` (`i18next`, `react-i18next`)
- De UI-vyer vars strängar täcks av de 97 nycklarna (nav/billing/dashboard/profile/chat/calendar/learn) — hårdkodad svenska → `t()`
