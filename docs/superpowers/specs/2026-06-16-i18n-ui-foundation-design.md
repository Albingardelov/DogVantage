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
- `src/i18n/create-instance.ts` — `createI18nInstance(locale: Locale)` som skapar en isolerad i18next-instans (för per-request-bruk på servern och för klient-provider). Inga globala sidoeffekter.

Denna modul är det som senare flyttas till `packages/core/i18n`.

### Web-integration (Next 16 App Router)
- **Server (RSC):** `src/i18n/server.ts` — `getT(locale)` skapar en per-request-instans via `createI18nInstance` och returnerar `t`. Ingen delad muterbar global (säkert under concurrent requests).
- **Klient:** `src/i18n/I18nProvider.tsx` (`'use client'`) — tar `locale` + initierar en klient-i18next-instans och wrappar `I18nextProvider`. Monteras i `src/app/layout.tsx` med upplöst locale. Klientkomponenter använder `useTranslation()` från react-i18next.

> Next 16-specifik integration (RSC + per-request-instans, hur `layout.tsx` får locale serverside) verifieras mot `node_modules/next/dist/docs/` i implementationsplanen innan kod skrivs.

### Locale-upplösning — `src/i18n/resolve-locale.ts`
Plattformsoberoende ren funktion `resolveLocale(inputs): Locale` med ordning:
1. `profile.locale` om inloggad och satt
2. enhetscache (web: `localStorage['dv.locale']`; RN: `AsyncStorage` senare)
3. enhetsspråk (web: `navigator.language`; RN: `expo-localization` senare) om det matchar `SUPPORTED_LOCALES`
4. `FALLBACK_LOCALE` (`en`)

`DEFAULT_LOCALE` (`sv`) och `FALLBACK_LOCALE` (`en`) är inte i konflikt: `sv` är källspråket och kolumn-defaulten (bevarar nuvarande beteende för befintliga svenska användare, som alltid träffar steg 1), medan `en` bara används i steg 4 för en **anonym** besökare vars enhetsspråk inte stöds — det internationellt mest universella valet.

Plattformsspecifika läsare (localStorage / cookie för SSR / AsyncStorage) injiceras in i funktionen — själva funktionen är ren och delbar. På web speglas valt språk även till en cookie (`dv.locale`) **enbart som SSR-render-hint** så servern kan rendera rätt språk vid första laddning; sanningskällan förblir `profile.locale`.

## Datamodell

Supabase-migration `026_profile_locale.sql`:
```sql
alter table profiles add column if not exists locale text not null default 'sv';
```
RLS oförändrad (användaren äger redan sin profilrad). Värdet begränsas i applikationslagret till `SUPPORTED_LOCALES`.

## Språkväljare

- En kontroll i Profil-vyn (`src/app/profile`): tre val (Svenska / English / Deutsch).
- Vid byte: PATCH till profil-API:t som uppdaterar `profiles.locale` (validerar mot `SUPPORTED_LOCALES`), uppdaterar enhetscache + cookie, och byter språk i klient-instansen direkt (`i18n.changeLanguage`).
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

- `src/i18n/config.ts`, `messages.ts`, `create-instance.ts`, `server.ts`, `resolve-locale.ts`, `I18nProvider.tsx` (nya)
- `src/i18n/locales/{sv,en,de}.json` (nya nycklar för språkväljaren)
- `src/app/layout.tsx` (montera provider med upplöst locale)
- `src/app/profile/*` (språkväljare)
- profil-API-route (PATCH `locale`)
- `supabase/migrations/026_profile_locale.sql`
- `package.json` (`i18next`, `react-i18next`)
- De UI-vyer vars strängar täcks av de 97 nycklarna (nav/billing/dashboard/profile/chat/calendar/learn) — hårdkodad svenska → `t()`
