# Auth + Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace localStorage-based identity with Supabase Auth (email + password) so DogProfile and session logs survive device switches.

**Architecture:** `@supabase/ssr` provides browser and server Supabase clients. DogProfile moves from localStorage to a `dog_profiles` Supabase table keyed by `user_id`. Photos move to Supabase Storage. The onboarding wizard gains a final "Skapa konto" step. Middleware protects all app routes and refreshes auth tokens.

**Tech Stack:** Next.js 16 App Router, `@supabase/supabase-js` ^2.105.1, `@supabase/ssr` (to install), Supabase Auth, Supabase Storage, Vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/supabase/browser.ts` | Create | Browser-side Supabase client (singleton) |
| `src/lib/supabase/server.ts` | Create | Server-side Supabase client from cookies |
| `src/lib/supabase/client.ts` | Modify | Keep `getSupabaseAdmin()` only; remove `getSupabase()` |
| `src/lib/supabase/dog-profiles.ts` | Create | `getProfile` / `saveProfile` / `updateProfile` |
| `src/lib/dog/profile.ts` | Rewrite | Async wrapper over dog-profiles lib |
| `src/lib/dog/profile.test.ts` | Rewrite | Tests for new async API (mock Supabase) |
| `src/lib/dog/photo.ts` | Rewrite | Upload/download via Supabase Storage |
| `src/middleware.ts` | Create | Token refresh + redirect unauthenticated users |
| `src/app/login/page.tsx` | Create | Email + password login form |
| `src/app/login/page.module.css` | Create | Login page styles |
| `src/components/DogProfileForm.tsx` | Modify | Add step 4 "Skapa konto" (email + password) |
| `src/app/page.tsx` | Modify | Server component — redirect logged-in users to /dashboard |
| `src/components/ProfileGuard.tsx` | Modify | Check auth session; fetch profile from DB |
| `src/lib/supabase/session-logs.ts` | Modify | Use `user_id` instead of `dog_key` |
| `src/app/api/logs/route.ts` | Modify | Extract `user_id` from server-side session |
| `src/app/profile/page.tsx` | Modify | Add logout button; make save async |
| `supabase/migrations/001_auth_setup.sql` | Create | SQL: dog_profiles table, session_logs update, RLS |

---

## Task 1: Install @supabase/ssr and create Supabase client files

**Files:**
- Create: `src/lib/supabase/browser.ts`
- Create: `src/lib/supabase/server.ts`
- Modify: `src/lib/supabase/client.ts`

- [ ] **Step 1: Install @supabase/ssr**

```bash
npm install @supabase/ssr
```

Expected: package added to `node_modules/@supabase/ssr`, `package.json` updated.

- [ ] **Step 2: Create browser client**

Create `src/lib/supabase/browser.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'

export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

- [ ] **Step 3: Create server client**

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Read-only cookie store in middleware context — safe to ignore
          }
        },
      },
    }
  )
}
```

- [ ] **Step 4: Strip getSupabase() from client.ts**

Open `src/lib/supabase/client.ts`. Remove `_supabase`, `getSupabase`, and the anon-key path. Keep only `_supabaseAdmin` and `getSupabaseAdmin`. Result:

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _supabaseAdmin: SupabaseClient<any> | null = null

function requireEnv(name: string, value: string | undefined): string {
  if (value && value.length > 0) return value
  throw new Error(`${name} is required.`)
}

export function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin
  const url = requireEnv('supabaseUrl', process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = requireEnv('supabaseAnonKey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  _supabaseAdmin = createClient<any>(url, serviceKey ?? anonKey)
  return _supabaseAdmin
}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/browser.ts src/lib/supabase/server.ts src/lib/supabase/client.ts package.json package-lock.json
git commit -m "feat: install @supabase/ssr and create browser/server clients"
```

---

## Task 2: Database migrations

**Files:**
- Create: `supabase/migrations/001_auth_setup.sql`

- [ ] **Step 1: Create SQL migration file**

Create `supabase/migrations/001_auth_setup.sql`:

```sql
-- dog_profiles: one row per authenticated user
create table if not exists dog_profiles (
  user_id      uuid primary key references auth.users on delete cascade,
  name         text not null,
  breed        text not null,
  birthdate    date not null,
  training_week int not null default 1,
  onboarding   jsonb,
  assessment   jsonb,
  created_at   timestamptz not null default now()
);

alter table dog_profiles enable row level security;

create policy "Users manage their own profile"
  on dog_profiles for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- session_logs: add user_id, drop dog_key
alter table session_logs add column if not exists user_id uuid references auth.users;
alter table session_logs drop column if exists dog_key;

-- RLS on session_logs (drop existing open policies first)
drop policy if exists "Allow all" on session_logs;
drop policy if exists "Public access" on session_logs;

alter table session_logs enable row level security;

create policy "Users manage their own logs"
  on session_logs for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 2: Apply in Supabase dashboard**

Open the Supabase project → SQL Editor → paste the content of `supabase/migrations/001_auth_setup.sql` → Run.

Expected: no errors. Tables `dog_profiles` visible in Table Editor.

- [ ] **Step 3: Create dog-photos storage bucket**

In Supabase dashboard → Storage → New bucket:
- Name: `dog-photos`
- Public: **off** (private)

Then run in SQL Editor:

```sql
create policy "Users manage their own photo"
  on storage.objects for all
  using  (bucket_id = 'dog-photos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'dog-photos' and auth.uid()::text = (storage.foldername(name))[1]);
```

- [ ] **Step 4: Disable email confirmation (Supabase dashboard)**

Supabase dashboard → Authentication → Providers → Email → disable "Confirm email". This lets users log in immediately after signup without verifying their email.

- [ ] **Step 5: Commit SQL file**

```bash
mkdir -p supabase/migrations
git add supabase/migrations/001_auth_setup.sql
git commit -m "feat: add dog_profiles table, update session_logs for auth"
```

---

## Task 3: dog-profiles library

**Files:**
- Create: `src/lib/supabase/dog-profiles.ts`

- [ ] **Step 1: Create the library**

Create `src/lib/supabase/dog-profiles.ts`:

```ts
import { supabaseBrowser } from './browser'
import type { DogProfile } from '@/types'

interface DbProfile {
  user_id: string
  name: string
  breed: string
  birthdate: string
  training_week: number
  onboarding: DogProfile['onboarding'] | null
  assessment: DogProfile['assessment'] | null
}

function dbToProfile(row: DbProfile): DogProfile {
  return {
    name: row.name,
    breed: row.breed as DogProfile['breed'],
    birthdate: row.birthdate,
    trainingWeek: row.training_week,
    onboarding: row.onboarding ?? undefined,
    assessment: row.assessment ?? undefined,
  }
}

export async function getProfile(): Promise<DogProfile | null> {
  const { data, error } = await supabaseBrowser
    .from('dog_profiles')
    .select('*')
    .single()
  if (error || !data) return null
  return dbToProfile(data as DbProfile)
}

export async function saveProfile(profile: DogProfile, userId: string): Promise<void> {
  const row = {
    user_id: userId,
    name: profile.name,
    breed: profile.breed,
    birthdate: profile.birthdate,
    training_week: profile.trainingWeek ?? 1,
    onboarding: profile.onboarding ?? null,
    assessment: profile.assessment ?? null,
  }
  const { error } = await supabaseBrowser
    .from('dog_profiles')
    .upsert(row, { onConflict: 'user_id' })
  if (error) throw new Error(`Failed to save profile: ${error.message}`)
}

export async function updateProfile(fields: Partial<DogProfile>): Promise<void> {
  const updates: Record<string, unknown> = {}
  if (fields.trainingWeek !== undefined) updates.training_week = fields.trainingWeek
  if (fields.onboarding !== undefined) updates.onboarding = fields.onboarding
  if (fields.assessment !== undefined) updates.assessment = fields.assessment
  if (fields.name !== undefined) updates.name = fields.name

  const { error } = await supabaseBrowser
    .from('dog_profiles')
    .update(updates)
    .eq('user_id', (await supabaseBrowser.auth.getUser()).data.user?.id ?? '')
  if (error) throw new Error(`Failed to update profile: ${error.message}`)
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/dog-profiles.ts
git commit -m "feat: add dog-profiles library for Supabase CRUD"
```

---

## Task 4: Rewrite profile.ts and its tests

**Files:**
- Modify: `src/lib/dog/profile.ts`
- Modify: `src/lib/dog/profile.test.ts`

- [ ] **Step 1: Rewrite profile.test.ts**

Replace the entire content of `src/lib/dog/profile.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetProfile = vi.fn()
const mockSaveProfile = vi.fn()
const mockUpdateProfile = vi.fn()

vi.mock('@/lib/supabase/dog-profiles', () => ({
  getProfile: mockGetProfile,
  saveProfile: mockSaveProfile,
  updateProfile: mockUpdateProfile,
}))

import { getDogProfile, saveDogProfile, updateDogProfile } from './profile'
import type { DogProfile } from '@/types'

const mockProfile: DogProfile = {
  name: 'Rex',
  breed: 'labrador',
  birthdate: '2024-10-15',
  trainingWeek: 1,
  onboarding: {
    goals: ['everyday_obedience'],
    environment: 'suburb',
    rewardPreference: 'mixed',
    takesRewardsOutdoors: true,
  },
  assessment: { status: 'not_started' },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getDogProfile', () => {
  it('returns null when getProfile returns null', async () => {
    mockGetProfile.mockResolvedValue(null)
    expect(await getDogProfile()).toBeNull()
  })

  it('returns the profile from DB', async () => {
    mockGetProfile.mockResolvedValue(mockProfile)
    expect(await getDogProfile()).toEqual(mockProfile)
  })
})

describe('saveDogProfile', () => {
  it('calls saveProfile with the profile and userId', async () => {
    mockSaveProfile.mockResolvedValue(undefined)
    await saveDogProfile(mockProfile, 'user-abc')
    expect(mockSaveProfile).toHaveBeenCalledWith(mockProfile, 'user-abc')
  })
})

describe('updateDogProfile', () => {
  it('calls updateProfile with the fields', async () => {
    mockUpdateProfile.mockResolvedValue(undefined)
    await updateDogProfile({ trainingWeek: 3 })
    expect(mockUpdateProfile).toHaveBeenCalledWith({ trainingWeek: 3 })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/dog/profile.test.ts
```

Expected: FAIL — `getDogProfile`, `saveDogProfile`, `updateDogProfile` not found / wrong signature.

- [ ] **Step 3: Rewrite profile.ts**

Replace the entire content of `src/lib/dog/profile.ts`:

```ts
import { getProfile, saveProfile, updateProfile } from '@/lib/supabase/dog-profiles'
import type { DogProfile } from '@/types'

export async function getDogProfile(): Promise<DogProfile | null> {
  return getProfile()
}

export async function saveDogProfile(profile: DogProfile, userId: string): Promise<void> {
  return saveProfile(profile, userId)
}

export async function updateDogProfile(fields: Partial<DogProfile>): Promise<void> {
  return updateProfile(fields)
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/dog/profile.test.ts
```

Expected: PASS — 3 passing tests.

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: errors about callers of `getDogProfile` / `saveDogProfile` — these will be fixed in later tasks. Note which files are broken; don't fix yet.

- [ ] **Step 6: Commit**

```bash
git add src/lib/dog/profile.ts src/lib/dog/profile.test.ts
git commit -m "feat: rewrite profile.ts to use Supabase DB instead of localStorage"
```

---

## Task 5: Rewrite photo.ts for Supabase Storage

**Files:**
- Modify: `src/lib/dog/photo.ts`

- [ ] **Step 1: Rewrite photo.ts**

Replace the entire content of `src/lib/dog/photo.ts`:

```ts
import { supabaseBrowser } from '@/lib/supabase/browser'

const BUCKET = 'dog-photos'

function getPhotoPath(userId: string): string {
  return `${userId}/avatar`
}

export async function saveDogPhoto(dataUrl: string): Promise<void> {
  const { data: { user } } = await supabaseBrowser.auth.getUser()
  if (!user) return

  // Convert base64 data URL to Blob
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: mime })

  await supabaseBrowser.storage
    .from(BUCKET)
    .upload(getPhotoPath(user.id), blob, { upsert: true, contentType: mime })
}

export async function getDogPhoto(): Promise<string | null> {
  const { data: { user } } = await supabaseBrowser.auth.getUser()
  if (!user) return null

  const { data, error } = await supabaseBrowser.storage
    .from(BUCKET)
    .createSignedUrl(getPhotoPath(user.id), 3600)
  if (error || !data) return null
  return data.signedUrl
}

export async function clearDogPhoto(): Promise<void> {
  const { data: { user } } = await supabaseBrowser.auth.getUser()
  if (!user) return
  await supabaseBrowser.storage
    .from(BUCKET)
    .remove([getPhotoPath(user.id)])
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: errors at callers of `saveDogPhoto` / `getDogPhoto` / `clearDogPhoto` (they weren't async before). Note which files. Don't fix yet.

- [ ] **Step 3: Commit**

```bash
git add src/lib/dog/photo.ts
git commit -m "feat: rewrite photo.ts to use Supabase Storage"
```

---

## Task 6: Middleware — route protection + token refresh

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create middleware**

Create `src/middleware.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/dashboard', '/calendar', '/profile', '/assessment', '/learn', '/log', '/chat']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the session — must call getUser() not getSession()
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/).*)'],
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no new errors from this file.

- [ ] **Step 3: Manual test**

Start dev server: `npm run dev`

Navigate to `http://localhost:3000/dashboard` while logged out.

Expected: redirected to `/login`.

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add middleware for auth token refresh and route protection"
```

---

## Task 7: Login page

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/page.module.css`

- [ ] **Step 1: Create login page**

Create `src/app/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase/browser'
import styles from './page.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Fel e-post eller lösenord.')
        return
      }
      router.replace('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>Välkommen tillbaka</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>E-post</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Lösenord</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} className={styles.btn}>
            {loading ? 'Loggar in…' : 'Logga in'}
          </button>
        </form>
        <p className={styles.sub}>
          Inget konto?{' '}
          <Link href="/onboarding" className={styles.link}>Kom igång</Link>
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Create login page CSS**

Create `src/app/login/page.module.css`:

```css
.main {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: var(--space-6);
}

.card {
  width: 100%;
  max-width: 26rem;
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: var(--space-8) var(--space-6);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text);
  text-align: center;
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text);
}

.input {
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-input);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--text-md);
  width: 100%;
  transition: border-color var(--transition-base);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.error {
  font-size: var(--text-sm);
  color: #dc2626;
  margin: 0;
}

.btn {
  padding: var(--space-4);
  border-radius: var(--radius-btn);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn:hover:not(:disabled) { background: var(--color-primary-dark); }
.btn:disabled { background: var(--color-border); color: var(--color-text-muted); cursor: not-allowed; }

.sub {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-align: center;
  margin: 0;
}

.link {
  color: var(--color-primary);
  font-weight: var(--font-semibold);
  text-decoration: none;
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 4: Manual test**

Navigate to `http://localhost:3000/login`. Verify the form renders. Try submitting with wrong credentials — expect "Fel e-post eller lösenord." error.

- [ ] **Step 5: Commit**

```bash
git add src/app/login/page.tsx src/app/login/page.module.css
git commit -m "feat: add login page with email + password"
```

---

## Task 8: Add signup step to DogProfileForm

**Files:**
- Modify: `src/components/DogProfileForm.tsx`

The current wizard has 4 steps (indices 0–3). Step 3 is the preferences step — its footer button says "Starta appen →" and calls `finish()`. We add step 4 (index 4) as "Skapa konto" with email + password.

- [ ] **Step 1: Update constants at top of DogProfileForm.tsx**

In `src/components/DogProfileForm.tsx`, change:

```ts
const TOTAL_STEPS = 4
const STEP_TITLES = ['Lägg till ett foto', 'Om din hund', 'När är hunden född?', 'Hur vill du använda appen?']
```

to:

```ts
const TOTAL_STEPS = 5
const STEP_TITLES = ['Lägg till ett foto', 'Om din hund', 'När är hunden född?', 'Hur vill du använda appen?', 'Skapa konto']
```

- [ ] **Step 2: Add email/password state**

In the component, after `const [householdPets, setHouseholdPets] = useState<HouseholdPet[]>([])`, add:

```ts
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [authError, setAuthError] = useState<string | null>(null)
const [submitting, setSubmitting] = useState(false)
```

- [ ] **Step 3: Update canContinue array**

Change:

```ts
const canContinue = [
  true,
  name.trim().length > 0 && breed.length > 0,
  birthdate.length > 0,
  true,
]
```

to:

```ts
const canContinue = [
  true,
  name.trim().length > 0 && breed.length > 0,
  birthdate.length > 0,
  true,
  email.includes('@') && password.length >= 6,
]
```

- [ ] **Step 4: Update imports at top of DogProfileForm.tsx**

Add `saveDogPhoto` is already imported. Add `supabaseBrowser` and the new async `saveDogProfile`:

```ts
import { supabaseBrowser } from '@/lib/supabase/browser'
import { saveDogProfile } from '@/lib/dog/profile'
import { saveDogPhoto } from '@/lib/dog/photo'
```

(These replace the existing imports of the same names — `saveDogProfile` and `saveDogPhoto` are still imported, just now async.)

- [ ] **Step 5: Replace finish() with async signUpAndSave()**

Replace the `finish()` function:

```ts
async function signUpAndSave() {
  if (!name.trim() || !breed || !birthdate) return
  setAuthError(null)
  setSubmitting(true)
  try {
    const { data, error } = await supabaseBrowser.auth.signUp({ email, password })
    if (error || !data.user) {
      setAuthError(error?.message ?? 'Något gick fel. Försök igen.')
      return
    }
    const onboarding: OnboardingPrefs = {
      goals,
      environment,
      rewardPreference,
      takesRewardsOutdoors,
      householdPets: householdPets.length > 0 ? householdPets : undefined,
    }
    const profile: DogProfile = {
      name: name.trim(),
      breed,
      birthdate,
      trainingWeek: 1,
      onboarding,
      assessment: { status: 'not_started' },
    }
    await saveDogProfile(profile, data.user.id)
    if (photo) await saveDogPhoto(photo)
    router.replace('/dashboard')
  } finally {
    setSubmitting(false)
  }
}
```

- [ ] **Step 6: Update handleNext to call signUpAndSave**

Change:

```ts
function handleNext() {
  if (step < TOTAL_STEPS - 1) {
    setStep((s) => s + 1)
    return
  }
  finish()
}
```

to:

```ts
function handleNext() {
  if (step < TOTAL_STEPS - 1) {
    setStep((s) => s + 1)
    return
  }
  signUpAndSave()
}
```

- [ ] **Step 7: Add step 4 JSX in the .body section**

After the closing `}` of `{step === 3 && (...)}`, add:

```tsx
{step === 4 && (
  <div className={styles.stepFields}>
    <p className={styles.lead}>
      Skapa ett konto för att spara din hunds profil och träningshistorik.
    </p>
    <div className={styles.field}>
      <label htmlFor="signup-email" className={styles.label}>E-post</label>
      <input
        id="signup-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={styles.input}
        placeholder="din@email.se"
      />
    </div>
    <div className={styles.field}>
      <label htmlFor="signup-password" className={styles.label}>Lösenord (minst 6 tecken)</label>
      <input
        id="signup-password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={styles.input}
        placeholder="••••••••"
      />
    </div>
    {authError && (
      <p style={{ color: '#dc2626', fontSize: 'var(--text-sm)', margin: 0 }}>{authError}</p>
    )}
  </div>
)}
```

- [ ] **Step 8: Update footer button label for step 4**

Find the footer button label:

```tsx
{step < TOTAL_STEPS - 1 ? 'Fortsätt' : 'Starta appen →'}
```

Change to:

```tsx
{step < TOTAL_STEPS - 1 ? 'Fortsätt' : submitting ? 'Skapar konto…' : 'Skapa konto →'}
```

Also disable the button while submitting:

```tsx
disabled={!canContinue[step] || submitting}
```

- [ ] **Step 9: Type-check**

```bash
npx tsc --noEmit
```

Expected: errors from callers of the old synchronous `saveDogProfile` and `saveDogPhoto` in other files — note them, don't fix yet. No new errors in DogProfileForm.tsx itself.

- [ ] **Step 10: Manual test**

Run `npm run dev`, navigate to `http://localhost:3000/onboarding`, complete all steps, enter email + password on step 4, click "Skapa konto →".

Expected: account created in Supabase Auth, profile row in `dog_profiles`, redirect to `/dashboard`.

- [ ] **Step 11: Commit**

```bash
git add src/components/DogProfileForm.tsx
git commit -m "feat: add signup step to onboarding wizard"
```

---

## Task 9: Update landing page (server-side session check)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Rewrite page.tsx as a server component**

Replace the entire content of `src/app/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import styles from './page.module.css'

const FEATURES: { icon: string; title: string; desc: string }[] = [
  {
    icon: '📅',
    title: 'Veckovis schema',
    desc: 'Träning anpassad efter valpdagar och ras',
  },
  {
    icon: '📖',
    title: 'Direkt från RAS',
    desc: 'Råd hämtade från rasklubbens officiella dokument',
  },
  {
    icon: '✍️',
    title: 'Följ din hunds framsteg',
    desc: 'Logga pass och se hur träningen utvecklas',
  },
]

export default async function LandingPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.decorCircleLg} aria-hidden="true" />
        <div className={styles.decorCircleSm} aria-hidden="true" />

        <div className={styles.heroPhoto} aria-hidden="true">🐕</div>

        <h1 className={styles.title}>DogVantage</h1>
        <p className={styles.tagline}>
          Träningsplan anpassad för din hund — baserad på rasklubbens egna dokument.
        </p>
      </section>

      <ul className={styles.features}>
        {FEATURES.map((f) => (
          <li key={f.title} className={styles.featureRow}>
            <span className={styles.featureIcon} aria-hidden="true">{f.icon}</span>
            <div className={styles.featureText}>
              <span className={styles.featureTitle}>{f.title}</span>
              <span className={styles.featureDesc}>{f.desc}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        <Link href="/onboarding" className={styles.btnPrimary}>
          Kom igång
        </Link>
        <Link href="/login" className={styles.btnGhost}>
          Logga in
        </Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no new errors from this file.

- [ ] **Step 3: Manual test**

Navigate to `http://localhost:3000/` while logged out. Expected: landing page with "Kom igång" and "Logga in".

Navigate while logged in. Expected: redirect to `/dashboard`.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: landing page redirects logged-in users to dashboard"
```

---

## Task 10: Update ProfileGuard

**Files:**
- Modify: `src/components/ProfileGuard.tsx`

ProfileGuard wraps all protected pages. It now checks the Supabase auth session (client-side) and fetches the profile from DB. If not authenticated → redirect to `/login`. If no profile → redirect to `/onboarding`.

- [ ] **Step 1: Rewrite ProfileGuard.tsx**

Replace the entire content of `src/components/ProfileGuard.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { getDogProfile } from '@/lib/dog/profile'
import styles from './ProfileGuard.module.css'

export default function ProfileGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      const profile = await getDogProfile()
      if (!profile) {
        router.replace('/onboarding')
        return
      }
      setReady(true)
    }
    check()
  }, [router])

  if (!ready) {
    return (
      <div className={styles.loader} aria-label="Laddar…">
        <span className={styles.spinner} />
      </div>
    )
  }

  return <>{children}</>
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors from ProfileGuard.

- [ ] **Step 3: Commit**

```bash
git add src/components/ProfileGuard.tsx
git commit -m "feat: ProfileGuard checks Supabase auth session"
```

---

## Task 11: Update session-logs and logs API

**Files:**
- Modify: `src/lib/supabase/session-logs.ts`
- Modify: `src/app/api/logs/route.ts`

- [ ] **Step 1: Rewrite session-logs.ts**

Replace `src/lib/supabase/session-logs.ts`:

```ts
import { getSupabaseAdmin } from './client'
import type { Breed, SessionLog, QuickRating, ExerciseSummary } from '@/types'

export async function saveSessionLog(log: {
  user_id: string
  breed: Breed
  week_number: number
  quick_rating: QuickRating
  focus: number
  obedience: number
  handler_timing?: number
  handler_consistency?: number
  handler_reading?: number
  notes?: string
  exercises?: ExerciseSummary[]
}): Promise<SessionLog> {
  const { data, error } = await getSupabaseAdmin()
    .from('session_logs')
    .insert(log)
    .select()
    .single()

  if (error) throw new Error(`Failed to save session log: ${error.message}`)
  return data as SessionLog
}

export async function getRecentLogs(
  breed: Breed,
  weekNumber: number,
  userId: string,
  limit = 5
): Promise<SessionLog[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('session_logs')
    .select('*')
    .eq('breed', breed)
    .eq('week_number', weekNumber)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch session logs: ${error.message}`)
  return (data ?? []) as SessionLog[]
}

export async function getAllLogs(breed: Breed, userId: string, limit = 30): Promise<SessionLog[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('session_logs')
    .select('*')
    .eq('breed', breed)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch session logs: ${error.message}`)
  return (data ?? []) as SessionLog[]
}

export function formatLogsForPrompt(logs: SessionLog[]): string[] {
  return logs.map((log) => {
    const ratingMap: Record<QuickRating, string> = {
      good: 'Bra',
      mixed: 'Blandat',
      bad: 'Dåligt',
    }
    const parts = [
      `Vecka ${log.week_number}: ${ratingMap[log.quick_rating]}`,
      `fokus ${log.focus}/5`,
      `lydnad ${log.obedience}/5`,
    ]
    if (log.exercises && log.exercises.length > 0) {
      const exerciseParts = log.exercises.map((ex) => {
        const attempts = ex.success_count + ex.fail_count
        const rate = attempts > 0 ? Math.round((ex.success_count / attempts) * 100) : null
        return rate !== null ? `${ex.label} ${rate}%` : ex.label
      })
      parts.push(`övningar: ${exerciseParts.join(', ')}`)
    }
    if (log.notes) parts.push(`"${log.notes}"`)
    return parts.join(', ')
  })
}
```

- [ ] **Step 2: Rewrite src/app/api/logs/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { saveSessionLog, getRecentLogs, getAllLogs } from '@/lib/supabase/session-logs'
import type { Breed, QuickRating, ExerciseSummary } from '@/types'

async function getUserId(req: NextRequest): Promise<string | null> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    breed: Breed
    week_number: number
    quick_rating: QuickRating
    focus: number
    obedience: number
    handler_timing?: number
    handler_consistency?: number
    handler_reading?: number
    notes?: string
    exercises?: ExerciseSummary[]
  }

  const { breed, week_number, quick_rating, focus, obedience,
          handler_timing, handler_consistency, handler_reading, notes, exercises } = body

  if (!breed || typeof week_number !== 'number' || !quick_rating ||
      typeof focus !== 'number' || typeof obedience !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const log = await saveSessionLog({
    user_id: userId, breed, week_number, quick_rating, focus, obedience,
    handler_timing, handler_consistency, handler_reading, notes, exercises,
  })
  return NextResponse.json(log, { status: 201 })
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const breed = searchParams.get('breed') as Breed | null
  const weekParam = searchParams.get('week')

  if (!breed) return NextResponse.json({ error: 'breed required' }, { status: 400 })

  if (weekParam !== null) {
    const weekNumber = Number(weekParam)
    if (!Number.isFinite(weekNumber)) {
      return NextResponse.json({ error: 'invalid week' }, { status: 400 })
    }
    const logs = await getRecentLogs(breed, weekNumber, userId)
    return NextResponse.json(logs)
  }

  const logs = await getAllLogs(breed, userId)
  return NextResponse.json(logs)
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: errors in callers of `getRecentLogs` / `getAllLogs` that still pass `dogKey` — fix by removing the `dogKey` argument from those callers. Search: `grep -rn "dogKey\|dog_key" src/` and update any remaining references.

- [ ] **Step 4: Fix remaining dogKey references**

Run:
```bash
grep -rn "dogKey\|dog_key" src/ --include="*.ts" --include="*.tsx"
```

For each result in non-library files (components, pages, other API routes), remove the `dogKey`/`dog_key` argument from function calls and fetch URL params. The `user_id` is now extracted server-side automatically.

- [ ] **Step 5: Type-check again**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/session-logs.ts src/app/api/logs/route.ts
git commit -m "feat: session logs now use user_id from auth session"
```

---

## Task 12: Update callers of getDogProfile / saveDogProfile + add logout

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/calendar/page.tsx`
- Modify: `src/app/profile/page.tsx`

All three pages call `getDogProfile()` in a `useEffect`. They also need to handle `saveDogProfile` / `updateDogProfile` being async.

- [ ] **Step 1: Update dashboard/page.tsx**

Find the `useEffect` that calls `getDogProfile()` in `src/app/dashboard/page.tsx`:

```ts
useEffect(() => {
  const p = getDogProfile()
  if (p) setProfile(p)
}, [])
```

Change to:

```ts
useEffect(() => {
  getDogProfile().then(p => { if (p) setProfile(p) })
}, [])
```

Also remove the `dogKey` prop from `<TrainingCard>` if it's using `profile.dogKey` — change `dogKey={profile.dogKey ?? 'default'}` to `dogKey="default"`.

- [ ] **Step 2: Update calendar/page.tsx**

Find the `useEffect` that calls `getDogProfile()` in `src/app/calendar/page.tsx`:

```ts
useEffect(() => {
  const p = getDogProfile()
  if (p) setProfile(p)
}, [])
```

Change to:

```ts
useEffect(() => {
  getDogProfile().then(p => { if (p) setProfile(p) })
}, [])
```

- [ ] **Step 3: Update profile/page.tsx**

Find the `useEffect` that calls `getDogProfile()`. Change to async pattern:

```ts
useEffect(() => {
  getDogProfile().then(p => {
    if (!p) return
    setProfile(p)
    setGoals(p.onboarding?.goals ?? ['everyday_obedience'])
    setEnvironment(p.onboarding?.environment ?? 'suburb')
    setRewardPreference(p.onboarding?.rewardPreference ?? 'mixed')
    setTakesRewardsOutdoors(p.onboarding?.takesRewardsOutdoors ?? true)
  })
}, [])
```

Find the save handler that calls `saveDogProfile(updated)`. Change to use `updateDogProfile`:

```ts
// Replace import
import { getDogProfile, updateDogProfile } from '@/lib/dog/profile'

// Replace save call
async function handleSave() {
  await updateDogProfile({ onboarding: { goals, environment, rewardPreference, takesRewardsOutdoors } })
  setSaved(true)
  setTimeout(() => setSaved(false), 2000)
}
```

- [ ] **Step 4: Add logout button to profile page**

In the profile page JSX, add a logout button at the bottom of the page (before `<BottomNav>`):

```tsx
import { supabaseBrowser } from '@/lib/supabase/browser'

// Inside ProfileView component:
async function handleLogout() {
  await supabaseBrowser.auth.signOut()
  window.location.href = '/'
}

// In JSX, before </main>:
<button
  type="button"
  onClick={handleLogout}
  className={styles.logoutBtn}
>
  Logga ut
</button>
```

Add to `src/app/profile/page.module.css`:

```css
.logoutBtn {
  margin: var(--space-4) var(--space-6);
  padding: var(--space-3) var(--space-4);
  background: none;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-btn);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  width: calc(100% - 2 * var(--space-6));
  transition: border-color var(--transition-fast), color var(--transition-fast);
}

.logoutBtn:hover {
  border-color: #dc2626;
  color: #dc2626;
}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Manual end-to-end test**

1. Visit `/` — see landing page
2. Click "Kom igång" → complete onboarding → enter email + password → "Skapa konto →"
3. Expect redirect to `/dashboard`
4. Verify profile row in Supabase Table Editor → `dog_profiles`
5. Reload page — still on dashboard (session persists)
6. Open `/profile` → click "Logga ut"
7. Expect redirect to `/`
8. Click "Logga in" → enter credentials → redirect to `/dashboard`

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/calendar/page.tsx src/app/profile/page.tsx
git commit -m "feat: update all getDogProfile callers to async + add logout"
```

---

## Task 13: Fix Avatar (photo loading)

**Files:**
- Modify: `src/components/Avatar.tsx`

`Avatar` calls `getDogPhoto()` synchronously in a `useEffect` (line 23: `setStoredPhoto(getDogPhoto())`). After Task 5, `getDogPhoto()` returns `Promise<string | null>`, so the call must be awaited. The rest of the component is unchanged.

- [ ] **Step 1: Fix the async call in Avatar.tsx**

In `src/components/Avatar.tsx`, change the `useEffect` (lines 21–25):

```ts
useEffect(() => {
  if (!explicitPhotoProvided) {
    setStoredPhoto(getDogPhoto())
  }
}, [explicitPhotoProvided])
```

to:

```ts
useEffect(() => {
  if (!explicitPhotoProvided) {
    getDogPhoto().then(url => setStoredPhoto(url))
  }
}, [explicitPhotoProvided])
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Avatar.tsx
git commit -m "feat: Avatar awaits async getDogPhoto from Supabase Storage"
```

---

## Self-Review Checklist (run before declaring done)

```bash
npx tsc --noEmit      # zero errors
npx vitest run        # all tests pass
```

Manual smoke test:
- [ ] `/` logged out → landing
- [ ] `/dashboard` logged out → redirect to `/login`
- [ ] Login with valid credentials → `/dashboard`
- [ ] Login with wrong credentials → error message
- [ ] Complete onboarding → signup → `/dashboard`
- [ ] Session persists on page reload
- [ ] Logout → `/`
- [ ] Profile in Supabase `dog_profiles` table matches what was entered
- [ ] Session log saved with `user_id` after logging a training session
