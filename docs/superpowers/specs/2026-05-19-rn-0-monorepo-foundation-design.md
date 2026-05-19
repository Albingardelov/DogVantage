# RN-0: Monorepo-grund — Design

**Datum:** 2026-05-19
**Ticket:** RN-0 (GitHub issue #31)
**Branch:** `react-native`
**Status:** Godkänd design — redo för implementationsplan

## Syfte

Omstrukturera DogVantage-repot till en monorepo så att den befintliga
Next.js-webbappen och en kommande Expo/React Native-app kan dela
plattformsoberoende affärslogik via `packages/core`.

RN-0 levererar **endast struktur** — ingen RN-funktionalitet, inga skärmar,
ingen auth, ingen state management. Allt sådant byggs i RN-1 och framåt.

## Mål och icke-mål

**Mål**
- pnpm + Turborepo-monorepo med `apps/web`, `apps/mobile`, `packages/core`.
- Webbappen fungerar exakt som tidigare (bygg, dev, alla tester gröna).
- En bar Expo-app som bootar och kan importera från `@dogvantage/core`.
- En *tvingande* plattformsgräns runt `packages/core` som inte kan ruttna.

**Icke-mål**
- RN-skärmar, navigation, auth, state management, offline, push (RN-1+).
- Vercel-omkonfiguration — appen är inte deployad.
- Att splittra Supabase/React-kopplade filer (skjuts till när en RN-ticket
  faktiskt behöver logiken).

## Ansats

**Approach A — ren fil-extraktion utan fil-splittring.**

Regel: en fil som *redan* är 100 % plattformsoberoende flyttas till
`packages/core`. En fil med Supabase-, React- eller Next-koppling stannar
helt i `apps/web`. Inga filer splittras i RN-0.

Övervägda alternativ:
- *Approach B — full ren extraktion med fil-splittring.* Förkastad: gör RN-0
  till en mycket större och riskablare diff, och kräver att vi gissar vad
  mobilen behöver innan RN-2/RN-3 finns. Bryter mot YAGNI.
- *Approach C — flytta hela kataloger med dependency injection.* Förkastad:
  bygger ett spekulativt abstraktionslager för en strukturticket.

Poängen är inte att `packages/core` är *fullt* från dag ett, utan att gränsen
är *korrekt och tvingande*. Mer logik dras in i core när en specifik
RN-ticket behöver den.

## Målstruktur

```
DogVantage/
  apps/
    web/        ← nuvarande Next.js-app (src, public, configs)
    mobile/     ← bar Expo-app, bootar bara
  packages/
    core/       ← plattformsoberoende delad TypeScript
  package.json          (workspace-root)
  pnpm-workspace.yaml
  turbo.json
  tsconfig.base.json
```

## Komponenter

### 1. Paketmigrering och kodflytt

- Radera `package-lock.json`, skapa `pnpm-workspace.yaml` (`apps/*`, `packages/*`).
- `git mv` hela `src/`, `public/`, `next.config.ts`, `vercel.json`,
  `vitest.config.ts`, `vitest.setup.ts`, `next-env.d.ts` in i `apps/web/`.
- Två separata verifierings-checkpoints:
  1. Webbappen bygger och testar grönt efter pnpm-migreringen (före flytt).
  2. Webbappen bygger och testar grönt igen efter core-extraktionen.

### 2. `packages/core` — innehåll

Regelbaserat urval, **inte** handlistat — implementeraren verifierar varje fil
mot regeln (handlistor i de befintliga ticketsen visade sig felaktiga).

Förväntad uppsättning:
- **Flyttas till core (pure):** `types/*` inklusive Zod-scheman (`zod` är ett
  tillåtet core-beroende), `lib/dog/age.ts`, `lib/dog/behavior.ts`, merparten
  av `lib/training/*` (exercise-specs, goal-exercises, weekly-focus,
  progression-rules, developmental-context, homecoming-plan, streak,
  skill-progress m.fl.), `lib/utils/*` — med tillhörande testfiler.
- **Stannar i `apps/web` (kopplade):** `lib/dog/profile.ts`, `lib/dog/photo.ts`,
  `lib/dog/active-dog-context.tsx` (React-context), `lib/training/week-orchestrator.ts`,
  `lib/training/week-focus-copy.ts`, hela `lib/supabase/`, hela `lib/ai/`.

Verifieringsregel vid flytt: filen får inte importera `react`, `next`,
`@supabase/*`, Node-inbyggda moduler, eller läsa `process.env`.

### 3. Tvingande core-gräns (robusthetskärnan)

- `packages/core/package.json` har **inga** `react`-, `next`- eller
  `@supabase/*`-beroenden. En oren import failar därmed typecheck/bygge direkt.
- `core` läser **aldrig** `process.env`. Konfiguration (t.ex. Supabase-URL)
  injiceras av respektive app. Detta löser skillnaden `NEXT_PUBLIC_*` (web)
  mot `EXPO_PUBLIC_*` (mobile).
- En lätt import-boundary-kontroll (dependency-cruiser) körs i CI så att
  gränsen inte kan ruttna när epiken växer.

### 4. TypeScript

- `tsconfig.base.json` i roten med strikta inställningar
  (`strict`, `noUncheckedIndexedAccess`, m.m.).
- Varje workspace har en egen `tsconfig.json` som `extends` basen.
- Project references: `apps/web` och `apps/mobile` refererar `packages/core`.
- `@dogvantage/core` resolvas via pnpm workspace-länk.

### 5. `apps/mobile`-scaffold

- `create-expo-app` med `blank-typescript`-mallen, Expo SDK 52+.
- `expo-router` installeras men **inga skärmar** skapas (RN-1/RN-8 äger dem).
- Appen bootar och importerar en funktion från `@dogvantage/core` för att
  bevisa att workspace-länken fungerar.

### 6. Turborepo-pipeline

- `turbo.json` med `build`-, `lint`-, `test`- och `dev`-tasks.
- `core#build` är upstream-beroende av både `web` och `mobile`.

### 7. Test

- `apps/web` behåller sin egen vitest-config.
- `packages/core` får en **egen** vitest-config för de flyttade testerna.
- Alla 88+ tester ska vara gröna, nu uppdelade mellan web och core.

## Oåterkalleliga beslut som registreras i RN-0

Dessa skrivs ned men implementeras inte i RN-0. De är billiga att besluta nu
och dyra att retrofitta.

- **Auth-transport:** mobilen pratar direkt med Supabase-klienten för vanlig
  CRUD (RLS skyddar datan). Webb-API:t anropas endast för det som kräver
  serverhemligheter (AI-chat, AI-veckoplan, Stripe, kontoradering). De
  rutterna får bearer-token-stöd i en senare ticket (RN-AUTH-API). RN-0
  säkerställer endast att cores datalager är klient-injicerbart.
- **Deep-link-scheme:** `dogvantage://` (redan använt i de övriga ticketsen).
- **Crash-reporting och OTA:** beslut att anta Sentry + EAS Update i en senare
  ticket (RN-OBS). RN-0 reserverar endast beslutet — ingen wiring.
- **Kanonisk produktionsdomän:** ÖPPET BESLUT. Inte bestämt ännu
  (`dogvantage.se` mot `dogvantage.vercel.app`). App-identifieraren
  (`se.dogvantage.app` föreslagen) är provisorisk tills domänen är låst.
  **Blockerare:** domänen måste låsas innan RN-1 (deep links) och
  RN-9/STORE-1 (butikslistningar).

## Definition of done

- `pnpm install` från roten installerar alla workspaces.
- `pnpm --filter web dev` startar webbappen utan fel.
- `pnpm --filter web build` bygger utan fel.
- `pnpm --filter web test` kör alla tester gröna.
- `pnpm --filter core test` kör de flyttade testerna gröna.
- `cd apps/mobile && npx expo start` startar Expo dev-servern.
- `import { ... } from '@dogvantage/core'` fungerar i både `web` och `mobile`.
- En medvetet oren import i `packages/core` failar bygget (bevisar gränsen).
- Commit pushad till `react-native`-branchen.

## Kontext: bredare RN-epik-fynd (utanför RN-0)

En agent-analys av alla 15 RN-tickets identifierade arbete som ligger utanför
RN-0 men som påverkar epikens sekvensering. Dessa hanteras separat (användaren
valde att spec:a RN-0 direkt), men registreras här så de inte tappas bort:

- **RN-0.5** — refaktor som separerar ren logik från Supabase-koppling, så att
  mer kod kan flyttas till core senare.
- **RN-AUTH-API** — bearer-token-stöd i webb-API:t (`withAuth`); annars
  returnerar alla server-anrop från mobilen 401.
- **RN-CONTRACT** — delad typad `apiClient` + Zod-kontrakt i `packages/core`;
  flera skärm-tickets har idag faktiskt felaktiga API-kontrakt.
- **RN-10** — iOS-build (EAS iOS, Apple Developer, App Store Connect). RN-9 är
  Android-only men STORE-1 kräver Apple TestFlight — de motsäger varandra.
- **RN-OBS** — crash-reporting (Sentry) + OTA-updates (EAS Update).
- **CI-ticket** — GitHub Actions för monorepo build/test.
- **RN-PAY-1** bör granskas om: "Netflix-modellen" med utlänkning för
  prenumeration är en betydande App Store-rejektrisk (anti-steering).
- **STORE-1** bör delas i Play Store-compliance respektive App Store-compliance.
- **RN-8 mot RN-1** överlappar — båda skapar `app/_layout.tsx` och en
  auth-guard. RN-1 bör äga all auth-logik; RN-8 levererar bara strukturella
  placeholders.
