# RN-0: Monorepo Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the DogVantage repo into a pnpm + Turborepo monorepo (`apps/web`, `apps/mobile`, `packages/core`) so the Next.js web app and a future Expo app share platform-pure business logic.

**Architecture:** The current single Next.js app moves wholesale into `apps/web`. Platform-pure modules (types, pure `lib/dog`, pure `lib/training`, `lib/utils`) move into `packages/core`, consumed as TypeScript source via a workspace symlink. `packages/core` declares no React/Next/Supabase dependencies, so any impure import fails the build — a self-enforcing boundary. A bare Expo app is scaffolded that boots and imports from `@dogvantage/core`.

**Tech Stack:** pnpm workspaces, Turborepo 2.x, TypeScript 5, Next.js 16.2.4, React 19.2.4, Expo SDK 52+, Vitest 4, dependency-cruiser.

**Key conventions:**
- `packages/core` consumes its own modules via **relative imports** (no path alias) so any bundler resolves it without extra config. This is a deliberate refinement of design spec §6: formal TS project references are omitted — workspace source resolution + the Turbo task graph give the same correctness without a build artifact.
- `tsconfig.base.json` keeps strictness equal to the current web app (`strict: true`). `noUncheckedIndexedAccess` from spec §6 is **deferred** — enabling it now would cascade type errors through existing web code. Flagged for the user; tightening is a follow-up.
- The web app's tsconfig keeps its `@/*` alias for its own remaining code. Imports of moved modules become `@dogvantage/core`.

---

## File Structure

**Created at repo root:**
- `pnpm-workspace.yaml` — workspace package globs
- `.npmrc` — `node-linker=hoisted` (required for Expo + pnpm)
- `package.json` — workspace root (turbo scripts only)
- `turbo.json` — task pipeline
- `tsconfig.base.json` — shared compiler options

**`apps/web/`** — the entire current app, moved unchanged then re-pointed at `@dogvantage/core`.

**`packages/core/`:**
- `package.json` — `@dogvantage/core`, zero platform deps
- `tsconfig.json`, `vitest.config.ts`, `.dependency-cruiser.cjs`
- `src/index.ts` — public barrel
- `src/types/`, `src/lib/dog/`, `src/lib/training/`, `src/lib/utils/` — moved pure modules

**`apps/mobile/`** — bare Expo app: `metro.config.js` for monorepo resolution, `App.tsx` importing from `@dogvantage/core`.

---

## Task 1: Branch + move the web app into `apps/web`

Moves the existing app into `apps/web` and establishes the pnpm workspace root. End state: `pnpm install` works and the web app builds and tests exactly as before.

**Files:**
- Create: `pnpm-workspace.yaml`, `.npmrc`, `package.json` (new root)
- Move: `src/`, `public/`, `scripts/`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `vitest.setup.ts`, `vercel.json`, `package.json`, `.env.example` → `apps/web/`
- Delete: `package-lock.json`

- [ ] **Step 1: Create the branch**

```bash
git checkout -b react-native
```

- [ ] **Step 2: Move the app into `apps/web`**

```bash
mkdir -p apps/web
git mv src public scripts next.config.ts tsconfig.json vitest.config.ts vitest.setup.ts vercel.json package.json apps/web/
git mv .env.example apps/web/.env.example
```

- [ ] **Step 3: Move the untracked local env file**

`.env.local` is gitignored (untracked), so use plain `mv`. Next.js loads it from the app root.

```bash
mv .env.local apps/web/.env.local
```

- [ ] **Step 4: Remove stale npm/build artifacts**

```bash
rm -f package-lock.json
rm -rf node_modules .next next-env.d.ts tsconfig.tsbuildinfo
```

- [ ] **Step 5: Rename the web package**

Edit `apps/web/package.json` — change the `"name"` field so `pnpm --filter web` works:

```json
"name": "web",
```

Leave all other fields (`version`, `scripts`, `dependencies`, `devDependencies`) unchanged.

- [ ] **Step 6: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 7: Create `.npmrc`**

`node-linker=hoisted` is required for Expo's Metro bundler to resolve dependencies under pnpm.

```
node-linker=hoisted
```

- [ ] **Step 8: Create the root `package.json`**

Run `pnpm --version` first and put that exact version in `packageManager`.

```json
{
  "name": "dogvantage-monorepo",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@<your-pnpm-version>",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.3.0"
  }
}
```

- [ ] **Step 9: Install**

Run: `pnpm install`
Expected: installs `web` workspace + root `turbo`, creates `pnpm-lock.yaml`, no errors.

- [ ] **Step 10: Verify the web app still builds**

Run: `pnpm --filter web build`
Expected: Next.js build completes with no errors.

- [ ] **Step 11: Verify the web tests still pass**

Run: `pnpm --filter web test`
Expected: all existing tests pass (88+ tests green).

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore(monorepo): move web app into apps/web, add pnpm workspace root"
```

---

## Task 2: Root tooling — `turbo.json` and `tsconfig.base.json`

Adds the Turborepo pipeline and a shared TS base config. End state: `pnpm build` builds the web app through Turbo.

**Files:**
- Create: `turbo.json`, `tsconfig.base.json`
- Modify: `apps/web/tsconfig.json`

- [ ] **Step 1: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

- [ ] **Step 2: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "incremental": true
  }
}
```

- [ ] **Step 3: Make `apps/web/tsconfig.json` extend the base**

Replace the file with the version below. It keeps every web-specific setting (DOM libs, JSX, the `next` plugin, the `@/*` alias, the include globs) and adds `extends`. Settings now inherited from the base are removed from `compilerOptions`.

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "jsx": "react-jsx",
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] },
    "types": ["vitest/globals"]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Verify the build through Turbo**

Run: `pnpm build`
Expected: Turbo runs `web#build`, Next.js build completes with no errors.

- [ ] **Step 5: Verify type-checking is unchanged**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: no type errors (confirms the base config didn't change web's strictness).

- [ ] **Step 6: Commit**

```bash
git add turbo.json tsconfig.base.json apps/web/tsconfig.json
git commit -m "chore(monorepo): add Turborepo pipeline and shared tsconfig base"
```

---

## Task 3: Create the `packages/core` skeleton

Creates the empty shared package and wires it as a dependency of `web`. No code moves yet.

**Files:**
- Create: `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/vitest.config.ts`, `packages/core/.dependency-cruiser.cjs`, `packages/core/src/index.ts`
- Modify: `apps/web/package.json`

- [ ] **Step 1: Create `packages/core/package.json`**

It declares **no** `react`, `next`, or `@supabase/*` dependencies — that absence is the boundary.

```json
{
  "name": "@dogvantage/core",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "react-native": "./src/index.ts",
  "scripts": {
    "test": "vitest run --passWithNoTests",
    "lint": "depcruise src --config .dependency-cruiser.cjs"
  },
  "dependencies": {
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "typescript": "^5",
    "vitest": "^4.1.5",
    "dependency-cruiser": "^16.0.0"
  }
}
```

- [ ] **Step 2: Create `packages/core/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Create `packages/core/vitest.config.ts`**

Core is pure logic — `node` environment, no jsdom, no React plugin.

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
})
```

- [ ] **Step 4: Create `packages/core/.dependency-cruiser.cjs`**

```js
module.exports = {
  forbidden: [
    {
      name: 'core-stays-platform-pure',
      severity: 'error',
      comment:
        'packages/core must not import React, Next.js, Supabase, or Node built-ins.',
      from: { path: '^src' },
      to: {
        path: 'node_modules/(react|react-dom|next|@supabase)/|^(fs|path|os|crypto|child_process|node:)',
      },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
  },
}
```

- [ ] **Step 5: Create `packages/core/src/index.ts`**

```ts
export const CORE_PACKAGE_NAME = '@dogvantage/core'
```

- [ ] **Step 6: Add `@dogvantage/core` as a web dependency**

In `apps/web/package.json`, add to `"dependencies"`:

```json
"@dogvantage/core": "workspace:*",
```

- [ ] **Step 7: Install and verify the link**

Run: `pnpm install`
Expected: `@dogvantage/core` is symlinked into `apps/web/node_modules`, no errors.

- [ ] **Step 8: Verify core's own checks run**

Run: `pnpm --filter @dogvantage/core test && pnpm --filter @dogvantage/core lint`
Expected: test passes (no tests yet — `--passWithNoTests`), depcruise reports no violations.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore(core): scaffold @dogvantage/core package with enforced purity boundary"
```

---

## Task 4: Move shared types into `packages/core`

Moves `src/types/` into core and re-points all web imports at `@dogvantage/core`.

**Files:**
- Move: `apps/web/src/types/` → `packages/core/src/types/`
- Modify: `packages/core/src/index.ts`, plus every web file importing `@/types*`

- [ ] **Step 1: Move the directory**

```bash
git mv apps/web/src/types packages/core/src/types
```

- [ ] **Step 2: Convert `@/` imports inside the moved files to relative paths**

`@/` previously meant `apps/web/src/`; inside core the equivalent root is `packages/core/src/`. Apply the `../` count matching each file's depth below `src/`:

```bash
sed -i "s|'@/|'../|g" packages/core/src/types/*.ts
sed -i "s|'@/|'../../|g" packages/core/src/types/api/*.ts
```

- [ ] **Step 3: Update the core barrel**

Replace `packages/core/src/index.ts` with:

```ts
export * from './types'
export * from './types/database'
export * from './types/api/schemas'
```

- [ ] **Step 4: Verify core type-checks**

Run: `pnpm --filter @dogvantage/core exec tsc --noEmit`
Expected: no errors. If `tsc` reports a duplicate export between `./types` and `./types/api/schemas`, change that line to a named re-export (`export { SymbolA, SymbolB } from './types/api/schemas'`) for the colliding symbols only.

- [ ] **Step 5: Re-point web imports at the package**

Order matters — rewrite the specific subpaths before the bare `@/types`:

```bash
grep -rl "from '@/types" apps/web/src | xargs sed -i \
  -e "s|from '@/types/api/schemas'|from '@dogvantage/core'|g" \
  -e "s|from '@/types/database'|from '@dogvantage/core'|g" \
  -e "s|from '@/types/dog'|from '@dogvantage/core'|g" \
  -e "s|from '@/types'|from '@dogvantage/core'|g"
```

- [ ] **Step 6: Verify no `@/types` imports remain in web**

Run: `grep -rn "from '@/types" apps/web/src || echo "clean"`
Expected: `clean`.

- [ ] **Step 7: Verify the web app builds and tests pass**

Run: `pnpm --filter web build && pnpm --filter web test`
Expected: build succeeds, all tests green.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(core): move shared types into @dogvantage/core"
```

---

## Task 5: Move `lib/utils` into `packages/core`

**Files:**
- Move: `apps/web/src/lib/utils/` → `packages/core/src/lib/utils/`
- Modify: `packages/core/src/index.ts`, web files importing `@/lib/utils/*`

- [ ] **Step 1: Move the directory**

```bash
git mv apps/web/src/lib/utils packages/core/src/lib/utils
```

- [ ] **Step 2: Convert `@/` imports inside the moved files**

Files sit at `packages/core/src/lib/utils/` (depth 3 below `src`):

```bash
sed -i "s|'@/|'../../../|g" packages/core/src/lib/utils/*.ts
```

- [ ] **Step 3: Add `lib/utils` to the core barrel**

Append to `packages/core/src/index.ts`:

```ts
export * from './lib/utils/slugify'
```

- [ ] **Step 4: Verify core type-checks and tests pass**

Run: `pnpm --filter @dogvantage/core exec tsc --noEmit && pnpm --filter @dogvantage/core test`
Expected: no type errors; the moved `slugify` test runs and passes.

- [ ] **Step 5: Re-point web imports**

```bash
grep -rl "from '@/lib/utils/" apps/web/src | xargs sed -i \
  -e "s|from '@/lib/utils/[a-zA-Z-]*'|from '@dogvantage/core'|g"
```

- [ ] **Step 6: Verify web build + tests**

Run: `grep -rn "from '@/lib/utils/" apps/web/src || echo "clean"` then `pnpm --filter web build && pnpm --filter web test`
Expected: `clean`, then build succeeds and all tests green.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(core): move lib/utils into @dogvantage/core"
```

---

## Task 6: Move pure `lib/dog` modules into `packages/core`

Moves only the platform-pure files: `age.ts`, `age.test.ts`, `behavior.ts`. `profile.ts`, `photo.ts`, `active-dog-context.tsx`, `build-behavior-context.ts`, and `profile.test.ts` stay in `apps/web` (Supabase/React coupling).

**Files:**
- Move: `apps/web/src/lib/dog/{age.ts,age.test.ts,behavior.ts}` → `packages/core/src/lib/dog/`
- Modify: `packages/core/src/index.ts`, web files importing the moved modules

- [ ] **Step 1: Confirm purity before moving**

Run: `grep -nE "@/lib/supabase|@/lib/ai|next/|'next'|node:" apps/web/src/lib/dog/age.ts apps/web/src/lib/dog/behavior.ts || echo "pure"`
Expected: `pure`. If any line prints, stop — that file is not platform-pure and must not move.

- [ ] **Step 2: Move the pure files**

```bash
mkdir -p packages/core/src/lib/dog
git mv apps/web/src/lib/dog/age.ts apps/web/src/lib/dog/age.test.ts apps/web/src/lib/dog/behavior.ts packages/core/src/lib/dog/
```

- [ ] **Step 3: Convert `@/` imports inside the moved files**

Files sit at `packages/core/src/lib/dog/` (depth 3):

```bash
sed -i "s|'@/|'../../../|g" packages/core/src/lib/dog/*.ts
```

- [ ] **Step 4: Add to the core barrel**

Append to `packages/core/src/index.ts`:

```ts
export * from './lib/dog/age'
export * from './lib/dog/behavior'
```

- [ ] **Step 5: Verify core type-checks and tests pass**

Run: `pnpm --filter @dogvantage/core exec tsc --noEmit && pnpm --filter @dogvantage/core test`
Expected: no type errors; `age.test.ts` runs and passes.

- [ ] **Step 6: Re-point web imports**

This also rewrites the web files that stay (`profile.ts`, `build-behavior-context.ts`, etc.) where they import `age`/`behavior`.

```bash
grep -rl "from '@/lib/dog/age'\|from '@/lib/dog/behavior'" apps/web/src | xargs sed -i \
  -e "s|from '@/lib/dog/age'|from '@dogvantage/core'|g" \
  -e "s|from '@/lib/dog/behavior'|from '@dogvantage/core'|g"
```

- [ ] **Step 7: Verify web build + tests**

Run: `pnpm --filter web build && pnpm --filter web test`
Expected: build succeeds, all tests green.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(core): move pure lib/dog modules (age, behavior) into @dogvantage/core"
```

---

## Task 7: Move pure `lib/training` modules into `packages/core`

Moves the platform-pure training modules and the `rules/` subdirectory. **Stays in `apps/web`:** `week-orchestrator.ts`, `week-focus-copy.ts`, `week-focus-copy.test.ts` (Supabase/Next coupling).

**Files:**
- Move into `packages/core/src/lib/training/`: `assessment-week.ts`, `developmental-context.ts`, `developmental-context.test.ts`, `exercise-specs.ts`, `goal-exercises.ts`, `handler-feedback.ts`, `handler-feedback.test.ts`, `homecoming-plan.ts`, `progression-rules.ts`, `progression-rules.test.ts`, `skill-progress.ts`, `skill-progress.test.ts`, `streak.ts`, `streak.test.ts`, `week-context.ts`, `weekly-focus.ts`, `weekly-focus.test.ts`, and the whole `rules/` directory
- Modify: `packages/core/src/index.ts`, web files importing the moved modules

- [ ] **Step 1: Confirm purity before moving**

```bash
grep -rlnE "@/lib/supabase|@/lib/ai|next/|'next'|node:" apps/web/src/lib/training/*.ts apps/web/src/lib/training/rules/*.ts
```
Expected output: only `week-orchestrator.ts` and `week-focus-copy.ts`. If any other file appears, stop and exclude it from the move.

- [ ] **Step 2: Move the pure files and the `rules/` directory**

```bash
mkdir -p packages/core/src/lib/training
cd apps/web/src/lib/training
git mv assessment-week.ts developmental-context.ts developmental-context.test.ts \
  exercise-specs.ts goal-exercises.ts handler-feedback.ts handler-feedback.test.ts \
  homecoming-plan.ts progression-rules.ts progression-rules.test.ts skill-progress.ts \
  skill-progress.test.ts streak.ts streak.test.ts week-context.ts weekly-focus.ts \
  weekly-focus.test.ts rules \
  ../../../../../packages/core/src/lib/training/
cd -
```

- [ ] **Step 3: Convert `@/` imports inside the moved files**

Files directly in `training/` are at depth 3; files in `training/rules/` are at depth 4:

```bash
sed -i "s|'@/|'../../../|g" packages/core/src/lib/training/*.ts
sed -i "s|'@/|'../../../../|g" packages/core/src/lib/training/rules/*.ts
```

- [ ] **Step 4: Add to the core barrel**

Append to `packages/core/src/index.ts`:

```ts
export * from './lib/training/assessment-week'
export * from './lib/training/developmental-context'
export * from './lib/training/exercise-specs'
export * from './lib/training/goal-exercises'
export * from './lib/training/handler-feedback'
export * from './lib/training/homecoming-plan'
export * from './lib/training/progression-rules'
export * from './lib/training/skill-progress'
export * from './lib/training/streak'
export * from './lib/training/week-context'
export * from './lib/training/weekly-focus'
export * from './lib/training/rules'
```

- [ ] **Step 5: Verify core type-checks and tests pass**

Run: `pnpm --filter @dogvantage/core exec tsc --noEmit && pnpm --filter @dogvantage/core test`
Expected: no type errors. If `tsc` reports a duplicate export, change the colliding `export *` line to a named re-export of the non-colliding symbols only. All moved `*.test.ts` files run and pass.

- [ ] **Step 6: Re-point web imports**

```bash
grep -rl "from '@/lib/training/" apps/web/src | xargs sed -i -E \
  "s|from '@/lib/training/(assessment-week\|developmental-context\|exercise-specs\|goal-exercises\|handler-feedback\|homecoming-plan\|progression-rules\|skill-progress\|streak\|week-context\|weekly-focus)'|from '@dogvantage/core'|g"
grep -rl "from '@/lib/training/rules" apps/web/src | xargs sed -i -E \
  "s|from '@/lib/training/rules[a-zA-Z/-]*'|from '@dogvantage/core'|g"
```

- [ ] **Step 7: Verify the only remaining `@/lib/training` imports are the two that stayed**

Run: `grep -rhoE "from '@/lib/training/[a-zA-Z/-]*'" apps/web/src | sort -u`
Expected: only `week-orchestrator` and `week-focus-copy` paths (these files reference each other and themselves stayed in web).

- [ ] **Step 8: Verify web build + tests**

Run: `pnpm --filter web build && pnpm --filter web test`
Expected: build succeeds, all tests green.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(core): move pure lib/training modules into @dogvantage/core"
```

---

## Task 8: Prove the purity boundary holds

Verifies that an impure import into `packages/core` is rejected — both by dependency-cruiser and by the TypeScript build (core has no `@supabase/*` dependency to resolve).

**Files:**
- Modify (temporarily, then revert): `packages/core/src/index.ts`

- [ ] **Step 1: Run the boundary check on the clean tree**

Run: `pnpm --filter @dogvantage/core lint`
Expected: PASS — no violations.

- [ ] **Step 2: Introduce a deliberate impure import**

Add this line to the top of `packages/core/src/index.ts`:

```ts
import { createClient } from '@supabase/supabase-js'
```

- [ ] **Step 3: Verify the boundary check now fails**

Run: `pnpm --filter @dogvantage/core lint`
Expected: FAIL — reports a `core-stays-platform-pure` violation.

- [ ] **Step 4: Verify the type build also fails**

Run: `pnpm --filter @dogvantage/core exec tsc --noEmit`
Expected: FAIL — `Cannot find module '@supabase/supabase-js'` (core declares no such dependency).

- [ ] **Step 5: Revert the impure import**

Remove the line added in Step 2. `packages/core/src/index.ts` must return to exactly its Task 7 state.

- [ ] **Step 6: Confirm the clean state passes again**

Run: `pnpm --filter @dogvantage/core lint && pnpm --filter @dogvantage/core exec tsc --noEmit`
Expected: both PASS.

- [ ] **Step 7: Wire the boundary check into Turbo's lint task**

Confirm `pnpm lint` runs core's lint. Run: `pnpm lint`
Expected: Turbo runs `@dogvantage/core#lint` (and `web#lint` if defined); no violations.

- [ ] **Step 8: Commit**

No source change remains; this commit records that the boundary was verified via the reverted experiment. If `git status` shows no changes, skip the commit and note the verification in Task 10 instead.

---

## Task 9: Scaffold the bare Expo app

Creates `apps/mobile` as a bare Expo app that boots and imports from `@dogvantage/core`. No screens, no navigation, no auth — those are RN-1/RN-8.

**Files:**
- Create (via `create-expo-app`): `apps/mobile/*`
- Create: `apps/mobile/metro.config.js`
- Modify: `apps/mobile/App.tsx`, `apps/mobile/package.json`

- [ ] **Step 1: Scaffold the Expo app**

```bash
npx create-expo-app@latest apps/mobile --template blank-typescript
```

- [ ] **Step 2: Confirm the package name**

`apps/mobile/package.json` should have `"name": "mobile"`. If `create-expo-app` named it differently, edit it to `"name": "mobile"` so `pnpm --filter mobile` works.

- [ ] **Step 3: Add `@dogvantage/core` and Expo Router deps**

In `apps/mobile/package.json`, add to `"dependencies"`:

```json
"@dogvantage/core": "workspace:*",
```

Then install Expo Router and its required peers (installed now so RN-8 only has to configure routing, per design spec §7):

```bash
pnpm --filter mobile exec npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants
```

- [ ] **Step 4: Create `apps/mobile/metro.config.js`**

Required so Metro resolves `@dogvantage/core` from outside `apps/mobile`.

```js
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)
config.watchFolders = [monorepoRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

module.exports = config
```

- [ ] **Step 5: Make `App.tsx` import from core**

Replace `apps/mobile/App.tsx` with:

```tsx
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import { CORE_PACKAGE_NAME, getLifeStage } from '@dogvantage/core'

export default function App() {
  return (
    <View style={styles.container}>
      <Text>DogVantage mobile</Text>
      <Text>Shared package: {CORE_PACKAGE_NAME}</Text>
      <Text>Core import works: lifeStage(12w) = {getLifeStage(12)}</Text>
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
})
```

Note: `getLifeStage` is the function exported from `packages/core/src/lib/dog/age.ts`. If its exported name differs, run `grep "export" packages/core/src/lib/dog/age.ts` and use any exported pure function that takes a number — the point is only to prove the cross-package import resolves.

- [ ] **Step 6: Install**

Run: `pnpm install`
Expected: `mobile` workspace resolves, `@dogvantage/core` symlinked, no errors.

- [ ] **Step 7: Verify the Expo dev server starts**

Run: `pnpm --filter mobile exec npx expo start`
Expected: Metro bundler starts and prints a QR code with no resolution errors. Stop it with Ctrl+C.

- [ ] **Step 8: Verify mobile type-checks**

Run: `pnpm --filter mobile exec tsc --noEmit`
Expected: no type errors (confirms `@dogvantage/core` types resolve in the Expo app).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(mobile): scaffold bare Expo app importing @dogvantage/core"
```

---

## Task 10: Final Definition-of-Done verification

Runs the full RN-0 acceptance checklist end to end.

- [ ] **Step 1: Clean install from root**

Run: `rm -rf node_modules apps/*/node_modules packages/*/node_modules && pnpm install`
Expected: all three workspaces install with no errors.

- [ ] **Step 2: Web builds, tests, type-checks**

Run: `pnpm --filter web build && pnpm --filter web test && pnpm --filter web exec tsc --noEmit`
Expected: all pass; full existing test suite green.

- [ ] **Step 3: Core tests, lint, type-check**

Run: `pnpm --filter @dogvantage/core test && pnpm --filter @dogvantage/core lint && pnpm --filter @dogvantage/core exec tsc --noEmit`
Expected: moved tests pass, no boundary violations, no type errors.

- [ ] **Step 4: Turbo orchestration works**

Run: `pnpm build && pnpm test`
Expected: Turbo runs tasks across workspaces successfully.

- [ ] **Step 5: Expo dev server starts**

Run: `pnpm --filter mobile exec npx expo start` — confirm Metro starts cleanly, then Ctrl+C.

- [ ] **Step 6: Confirm the shared import works in both apps**

- Web: `grep -rl "from '@dogvantage/core'" apps/web/src | head` — non-empty.
- Mobile: `apps/mobile/App.tsx` imports from `@dogvantage/core` and `tsc --noEmit` passed in Task 9.

- [ ] **Step 7: Push the branch**

```bash
git push -u origin react-native
```

Expected: branch `react-native` published with all RN-0 commits.

---

## Self-Review

**Spec coverage:**
- §1 Ansats (Approach A, no file-splitting) → Tasks 4–7 move whole pure files only ✓
- §2 Målstruktur → Tasks 1, 3, 9 ✓
- §3 Migrering + kodflytt, two checkpoints → Task 1 (post-pnpm) + Tasks 4–7 (post-extraction) ✓
- §4 Core-innehåll, rule-based with verification → Tasks 6/7 Step 1 purity grep ✓
- §5 Tvingande gräns (no platform deps, no `process.env`, depcruise) → Task 3 + Task 8 ✓
- §6 TypeScript base + per-workspace tsconfig → Task 2, 3. *Deviation:* formal project references and `noUncheckedIndexedAccess` omitted — documented at the top of this plan and in the conventions block. Flag for user.
- §7 Expo scaffold, expo-router installed, no screens → Task 9 ✓
- §8 Turborepo pipeline → Task 2 ✓
- §9 Test split web/core → Tasks 3, 4–7 ✓
- §10 Recorded decisions → captured in the design spec; no code in RN-0 ✓
- §12 DoD → Task 10 ✓

**Placeholder scan:** No "TBD"/"implement later". The duplicate-export contingencies (Tasks 4, 7) and the `getLifeStage` name note (Task 9) give a concrete detection command and fallback action — not placeholders.

**Type consistency:** Barrel export paths in Tasks 4–7 match the moved directory layout. `CORE_PACKAGE_NAME` defined in Task 3 Step 5, consumed in Task 9 Step 5. Package name `@dogvantage/core` and workspace filter `web` / `mobile` / `@dogvantage/core` used consistently.

**Known deviations to confirm with the user:** (1) no formal TS project references, (2) `noUncheckedIndexedAccess` deferred, (3) `apps/mobile/tsconfig.json` keeps Expo's own base rather than the repo base, per Expo convention. None change RN-0's deliverable scope.
