# RN-8 Slim Navigation (PWA Parity) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or implement inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace bare `App.tsx` with Expo Router + BottomNav matching the PWA (Hem · Chatt · Färdigheter · Guider), safe on varied phones; placeholders only; no auth redirect yet.

**Architecture:** File-based Expo Router under `apps/mobile/app/`. Root Stack hosts `(tabs)`, modal `log`, and stub routes (`(auth)`, profile, calendar, onboarding). Theme tokens ported from PWA `tokens.css`. Tab icons via `@expo/vector-icons` Ionicons mapped to PWA Phosphor semantics (House / ChatCircle / Medal / BookOpen).

**Tech Stack:** Expo SDK 57, expo-router, react-native-safe-area-context, react-native-screens, @expo/vector-icons (bundled with Expo).

## Global Constraints

- Branch `rn-0` only — never push/merge RN UI to `main` without explicit ask
- Tab order/labels: Hem / Chatt / Färdigheter / Guider (`dashboard` / `chat` / `skills` / `learn`)
- Primary `#2d6a4f`; surface `#ffffff`; muted `#5c5752`; bg `#faf8f4`; border `#e7e0d8`
- Safe-area padding on tab bar; touch targets ≥ 44pt
- No AuthProvider redirect in this ticket (RN-1)
- Swedish hard-coded labels matching PWA `sv.json` `nav.*`

## File Structure

**Create:**
- `apps/mobile/src/theme/tokens.ts` — color/spacing tokens
- `apps/mobile/src/components/NavIcon.tsx` — tab icons
- `apps/mobile/src/components/PlaceholderScreen.tsx` — shared placeholder
- `apps/mobile/app/_layout.tsx` — root Stack + SafeAreaProvider
- `apps/mobile/app/index.tsx` — Redirect to `/(tabs)/dashboard`
- `apps/mobile/app/(tabs)/_layout.tsx` — Bottom tabs
- `apps/mobile/app/(tabs)/dashboard.tsx`, `chat.tsx`, `skills.tsx`, `learn.tsx`
- `apps/mobile/app/(auth)/_layout.tsx`, `login.tsx`, `register.tsx`
- `apps/mobile/app/profile.tsx`, `calendar.tsx`, `log.tsx`, `+not-found.tsx`
- `apps/mobile/app/onboarding/index.tsx`

**Modify:**
- `apps/mobile/package.json` — `"main": "expo-router/entry"`
- `apps/mobile/app.json` — `scheme: "dogvantage"`, name DogVantage
- `apps/mobile/tsconfig.json` — `@/*` paths if needed

**Delete / stop using:**
- `apps/mobile/App.tsx`, `apps/mobile/index.ts` (entry becomes expo-router)

---

### Task 1: Expo Router entry + theme tokens

**Files:**
- Create: `apps/mobile/src/theme/tokens.ts`
- Modify: `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/tsconfig.json`
- Delete: `apps/mobile/index.ts` (after main points at expo-router), keep `App.tsx` deleted once `app/` exists

- [ ] **Step 1: Write tokens**

```ts
// apps/mobile/src/theme/tokens.ts
export const colors = {
  bg: '#faf8f4',
  bgAlt: '#f2ede5',
  surface: '#ffffff',
  primary: '#2d6a4f',
  primaryDark: '#1b4332',
  primaryLight: '#52b788',
  text: '#1c1917',
  textMuted: '#5c5752',
  border: '#e7e0d8',
  error: '#d62828',
} as const

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
} as const

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 18,
  xl: 22,
} as const
```

- [ ] **Step 2: Point package at expo-router; set scheme**

`package.json` → `"main": "expo-router/entry"`  
`app.json` → add `"scheme": "dogvantage"`, `"name": "DogVantage"`  
`tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile && git commit -m "feat(mobile): Expo Router entry and PWA theme tokens"
```

---

### Task 2: NavIcon + PlaceholderScreen

**Files:**
- Create: `apps/mobile/src/components/NavIcon.tsx`
- Create: `apps/mobile/src/components/PlaceholderScreen.tsx`

- [ ] **Step 1: NavIcon** — Ionicons: `home-outline`, `chatbubble-outline`, `medal-outline`, `book-outline` (active: filled variants `home`, `chatbubble`, `medal`, `book`)

- [ ] **Step 2: PlaceholderScreen** — SafeAreaView edges top; title + subtitle; optional `Link` to `/log` on dashboard only for modal smoke test

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(mobile): NavIcon and placeholder screen primitives"
```

---

### Task 3: Root + tabs layouts and screens

**Files:** all `apps/mobile/app/**` listed above

- [ ] **Step 1: Root `_layout.tsx`** — `SafeAreaProvider`, `Stack` with `(tabs)`, `(auth)`, `onboarding`, `profile`, `calendar`, `log` (`presentation: 'modal'`), `+not-found`. Comment: RN-1 AuthProvider.

- [ ] **Step 2: `(tabs)/_layout.tsx`** — 4 Tabs, PWA colors, `tabBarStyle` borderTop + safe area, labels Hem/Chatt/Färdigheter/Guider, `headerShown: false`

- [ ] **Step 3: Tab screens + stubs + log modal with close via `router.back()`**

- [ ] **Step 4: Remove `App.tsx` / `index.ts`; `tsc --noEmit`; `expo start` smoke**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(mobile): PWA-parity BottomNav via Expo Router tabs"
```

---

### Task 4: DoD verification

- [ ] `pnpm --filter mobile exec tsc --noEmit` PASS
- [ ] Metro starts; tabs switch; log modal opens from Hem CTA and closes
- [ ] Update `.superpowers/sdd/progress.md`
- [ ] Confirm still on `rn-0`, not pushed to `main`
