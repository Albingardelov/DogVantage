# RN-8 slim: Navigation & BottomNav (PWA parity) — design

**Datum:** 2026-08-05  
**Status:** approved — implemented on rn-0  
**Branch:** `rn-0` (local only — never merge RN UI into `main` until explicitly decided)  
**Issues:** #39 (RN-8), enables #32 (RN-1)  
**Depends on:** #31 RN-0 (done locally)

## Problem

Mobilappen är ett bare Expo-skelett (`App.tsx`). Utan samma navigationsskal som PWA:n går det inte att bygga auth eller skärmar med visuell/IA-paritet. RN-8-ticketen (#39) beskriver också en **inaktuell** tab-ordning (Hem / Schema / Lär / Profil) som **inte** matchar nuvarande PWA.

## Mål

- Expo Router-skal som **navigerar och ser ut som PWA:ns BottomNav**.
- Fungerar på **olika telefoner** (iOS + Android, små/stora, notch / home indicator).
- Placeholder-innehåll per tab — riktiga skärmar kommer i RN-2/3/6/SKILLS/LEARN.
- Förbereder AuthGuard-hooks för RN-1 utan att implementera auth här.

## Icke-mål (denna ticket)

- Login/register/session (RN-1)
- Riktig dashboard, chat, skills, learn-innehåll
- Full i18n (RN-i18n) — svenska etiketter som speglar PWA `sv.json` räcker
- Paywall / onboarding-gate (senare, speglar `ProfileGuard`)
- Push, offline, EAS store builds

## Beslut

| Ämne | Beslut |
|------|--------|
| Tab-ordning | **Exakt PWA:** Hem · Chatt · Färdigheter · Guider (`dashboard` / `chat` / `skills` / `learn`) |
| Etiketter (sv) | Hem / Chatt / Färdigheter / Guider (från `nav.*` i PWA) |
| Profil / kalender / logg | Utanför tab-bar, som webben: stack-rutter (+ logg som modal) |
| Navigation | Expo Router (file-based) |
| Ikoner | Samma semantik som PWA `NavIcon` (Phosphor-motsvarigheter via `@expo/vector-icons` MaterialCommunityIcons **eller** enkel SVG-port av befintliga paths — välj det som ger närmast PWA-utseende; dokumentera i plan) |
| Färg | PWA tokens: primary `#2d6a4f`, surface/border/text från `src/styles/tokens.css` → `apps/mobile/src/theme/tokens.ts` |
| Safe areas | `react-native-safe-area-context`; tab bar `paddingBottom: max(token, inset)` |
| Auth i root | **Stub:** ingen redirect i RN-8; root Stack visar tabs. RN-1 lägger AuthProvider + redirect |
| Scheme | `dogvantage` i `app.json` (redan förberedd för deep links / senare auth-callback) |

## Informationsarkitektur

```
app/
  _layout.tsx                 Stack (headerShown: false), SafeAreaProvider
  index.tsx                   Redirect → /(tabs)/dashboard  (eller tabs index)
  (tabs)/
    _layout.tsx               Bottom tabs = PWA BottomNav
    dashboard.tsx             Placeholder “Hem”
    chat.tsx                  Placeholder “Chatt”
    skills.tsx                Placeholder “Färdigheter”
    learn.tsx                 Placeholder “Guider”
  (auth)/                     Tomma wrappers / placeholder login|register (RN-1 fyller)
    _layout.tsx
    login.tsx                 Minimal “Kommer i RN-1” eller tom
    register.tsx
  profile.tsx                 Placeholder (nås via länk senare; ej tab)
  calendar.tsx                Placeholder
  onboarding/index.tsx        Placeholder
  log.tsx                     Modal presentation
  +not-found.tsx
```

**Tab-bar regler (PWA-paritet)**

- 4 tabs, lika flex-bredd
- Aktiv: `color-primary` + semibold label
- Inaktiv: muted text
- Top border + surface bakgrund
- Safe-area inset under tabs
- Touch target ≥ 44×44 pt

## Enhetsstöd (“alla telefoner”)

- **iOS + Android** via Expo Go / dev client
- Safe area: notch, Dynamic Island, Android gesture bar
- Layout: ingen horisontell scroll; placeholders centrerade med padding
- Typografi: system default RN font OK tills brand fonts portas; labels `text-xs`-motsvarighet (~11–12)
- Verifiera manuellt på minst: smal iPhone SE-klass, vanlig Android, en stor telefon (sim eller enhet)

## Auth-förberedelse (utan att bygga RN-1)

- Mapp `(auth)/` och `scheme: dogvantage` skapas
- Root layout **redirectar inte** ännu (annars går det inte att titta på tabs utan session)
- Kommentar/TODO i root: RN-1 kopplar `AuthProvider` + `Redirect` till `/(auth)/login`

## Acceptans

- [ ] App startar utan crash på iOS och Android (Expo)
- [ ] BottomNav visar 4 tabs med PWA-etiketter (Hem / Chatt / Färdigheter / Guider)
- [ ] Aktiv tab markeras; växling fungerar
- [ ] Safe area: tabs sitter ovanför home indicator / systemnav
- [ ] `/log` öppnas som modal och stängs med back/gesture
- [ ] Placeholder-skärmar syns per tab
- [ ] Inget merge/push till `main`

## Definition of done

`pnpm --filter mobile start` → växla alla 4 tabs → öppna log-modal (dev-knapp eller deep link) → stäng → tabs kvarstår. Visuellt jämförbar med PWA BottomNav (ordning, etiketter, primary-färg, safe area).
