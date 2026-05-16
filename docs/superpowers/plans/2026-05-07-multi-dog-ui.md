# Multi-dog UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user have multiple dog profiles, switch between them from the Dashboard, add new dogs, and wire all API routes to use `dogId` instead of the generic `dogKey`.

**Architecture:** A React context (`ActiveDogContext`) wraps all protected views via `ProfileGuard`, exposing the active dog and a `switchDog` function. A `DogSwitcher` chip in the Dashboard header opens a bottomsheet for switching/adding dogs. API routes are updated to accept `dogId` (the `dog_profiles.id` UUID) and verify ownership before querying data.

**Tech Stack:** Next.js App Router, React context, Supabase browser client, TypeScript, CSS Modules

---

## File Map

| Action | File |
|--------|------|
| Create | `src/lib/supabase/user-settings.ts` |
| Modify | `src/lib/supabase/dog-profiles.ts` |
| Modify | `src/lib/dog/profile.ts` |
| Create | `src/lib/dog/active-dog-context.tsx` |
| Modify | `src/components/ProfileGuard.tsx` |
| Create | `src/components/DogSwitcher.tsx` |
| Create | `src/components/DogSwitcher.module.css` |
| Create | `src/components/AddDogModal.tsx` |
| Create | `src/components/AddDogModal.module.css` |
| Modify | `src/app/dashboard/page.tsx` |
| Modify | `src/lib/supabase/daily-exercise-metrics.ts` |
| Modify | `src/lib/supabase/daily-progress.ts` |
| Modify | `src/lib/supabase/training-cache.ts` |
| Modify | `src/app/api/training/week/route.ts` |
| Modify | `src/app/api/training/metrics/route.ts` |
| Modify | `src/app/api/training/progress/route.ts` |
| Modify | `src/app/api/chat/route.ts` |
| Modify | `src/components/TrainingCard/TrainingCard.tsx` |
| Modify | `src/components/ChatInterface.tsx` |
| Modify | `src/app/api/account/route.ts` |

---

## Task 1: user-settings Supabase helper

**Files:**
- Create: `src/lib/supabase/user-settings.ts`

- [ ] **Create `src/lib/supabase/user-settings.ts`**

```ts
import { getSupabaseBrowser } from './browser'

export async function getActiveDogId(): Promise<string | null> {
  const { data } = await getSupabaseBrowser()
    .from('user_settings')
    .select('active_dog_id')
    .single()
  return data?.active_dog_id ?? null
}

export async function setActiveDogId(userId: string, dogId: string): Promise<void> {
  const { error } = await getSupabaseBrowser()
    .from('user_settings')
    .upsert({ user_id: userId, active_dog_id: dogId, updated_at: new Date().toISOString() })
  if (error) throw new Error(`setActiveDogId failed: ${error.message}`)
}
```

- [ ] **Add `getAllProfiles` to `src/lib/supabase/dog-profiles.ts`**

Add after the existing `updateProfile` function:

```ts
export async function getAllProfiles(): Promise<DogProfile[]> {
  const { data, error } = await getSupabaseBrowser()
    .from('dog_profiles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return (data as DbProfile[]).map(dbToProfile)
}
```

- [ ] **Export `getAllProfiles` from `src/lib/dog/profile.ts`**

Add:
```ts
import { getProfile, saveProfile, updateProfile, getAllProfiles } from '@/lib/supabase/dog-profiles'

export async function getAllDogProfiles(): Promise<DogProfile[]> {
  return getAllProfiles()
}
```

- [ ] **Commit**
```bash
git add src/lib/supabase/user-settings.ts src/lib/supabase/dog-profiles.ts src/lib/dog/profile.ts
git commit -m "feat: add getAllProfiles and user-settings helpers"
```

---

## Task 2: ActiveDogContext

**Files:**
- Create: `src/lib/dog/active-dog-context.tsx`

- [ ] **Create `src/lib/dog/active-dog-context.tsx`**

```tsx
'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getAllDogProfiles } from './profile'
import { getActiveDogId, setActiveDogId } from '@/lib/supabase/user-settings'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import type { DogProfile } from '@/types'

interface ActiveDogContextValue {
  activeDog: DogProfile | null
  allDogs: DogProfile[]
  switchDog: (id: string) => Promise<void>
  refreshDogs: () => Promise<void>
  isLoading: boolean
}

const ActiveDogContext = createContext<ActiveDogContextValue | null>(null)

export function ActiveDogProvider({ children }: { children: React.ReactNode }) {
  const [allDogs, setAllDogs] = useState<DogProfile[]>([])
  const [activeDogId, setActiveDogIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadDogs = useCallback(async () => {
    const [dogs, activeId] = await Promise.all([
      getAllDogProfiles(),
      getActiveDogId(),
    ])
    setAllDogs(dogs)
    // Use stored active id, or fall back to first dog
    const resolved = activeId && dogs.some((d) => d.id === activeId)
      ? activeId
      : dogs[0]?.id ?? null
    setActiveDogIdState(resolved)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadDogs().catch((e) => console.error('[ActiveDogProvider]', e))
  }, [loadDogs])

  const switchDog = useCallback(async (id: string) => {
    const { data: { user } } = await getSupabaseBrowser().auth.getUser()
    if (!user) return
    setActiveDogIdState(id) // optimistic
    await setActiveDogId(user.id, id)
  }, [])

  const refreshDogs = useCallback(async () => {
    const dogs = await getAllDogProfiles()
    setAllDogs(dogs)
  }, [])

  const activeDog = allDogs.find((d) => d.id === activeDogId) ?? allDogs[0] ?? null

  return (
    <ActiveDogContext.Provider value={{ activeDog, allDogs, switchDog, refreshDogs, isLoading }}>
      {children}
    </ActiveDogContext.Provider>
  )
}

export function useActiveDog(): ActiveDogContextValue {
  const ctx = useContext(ActiveDogContext)
  if (!ctx) throw new Error('useActiveDog must be used inside ActiveDogProvider')
  return ctx
}
```

- [ ] **Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | grep -v "^\.next/"
```
Expected: no errors

- [ ] **Commit**
```bash
git add src/lib/dog/active-dog-context.tsx
git commit -m "feat: add ActiveDogContext and useActiveDog hook"
```

---

## Task 3: Wire ActiveDogProvider into ProfileGuard

**Files:**
- Modify: `src/components/ProfileGuard.tsx`

ProfileGuard currently calls `getDogProfile()` and redirects to `/onboarding` if null. We replace that logic with `ActiveDogProvider` — the provider itself handles loading all dogs.

- [ ] **Rewrite `src/components/ProfileGuard.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import { ActiveDogProvider, useActiveDog } from '@/lib/dog/active-dog-context'
import styles from './ProfileGuard.module.css'

export default function ProfileGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    getSupabaseBrowser().auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login')
      else setAuthed(true)
    }).catch(() => router.replace('/login'))
  }, [router])

  if (!authed) {
    return (
      <div className={styles.loader} aria-label="Laddar…">
        <span className={styles.spinner} />
      </div>
    )
  }

  return (
    <ActiveDogProvider>
      <ProfileGuardInner>{children}</ProfileGuardInner>
    </ActiveDogProvider>
  )
}

function ProfileGuardInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { activeDog, isLoading } = useActiveDog()

  useEffect(() => {
    if (!isLoading && !activeDog) {
      router.replace('/onboarding')
    }
  }, [isLoading, activeDog, router])

  if (isLoading) {
    return (
      <div className={styles.loader} aria-label="Laddar…">
        <span className={styles.spinner} />
      </div>
    )
  }

  if (!activeDog) return null

  return <>{children}</>
}
```

- [ ] **Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | grep -v "^\.next/"
```
Expected: no errors

- [ ] **Commit**
```bash
git add src/components/ProfileGuard.tsx
git commit -m "feat: wrap ProfileGuard with ActiveDogProvider"
```

---

## Task 4: DogSwitcher component

**Files:**
- Create: `src/components/DogSwitcher.tsx`
- Create: `src/components/DogSwitcher.module.css`

- [ ] **Create `src/components/DogSwitcher.module.css`**

```css
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgb(255 255 255 / 0.15);
  border: none;
  border-radius: 20px;
  color: #fff;
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  padding: 2px 10px 2px 2px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.chip:hover {
  background: rgb(255 255 255 / 0.25);
}

.chevron {
  opacity: 0.8;
  flex-shrink: 0;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.45);
  display: flex;
  align-items: flex-end;
  z-index: 50;
}

.sheet {
  width: 100%;
  max-width: var(--max-width);
  margin: 0 auto;
  background: var(--color-surface);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sheetTitle {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-2);
}

.dogRow {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-input);
  border: 2px solid transparent;
  background: var(--color-bg);
  cursor: pointer;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text);
  text-align: left;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.dogRowActive {
  border-color: var(--color-primary);
  background: var(--color-green-50);
  color: var(--color-primary);
  font-weight: var(--font-semibold);
}

.check {
  margin-left: auto;
  color: var(--color-primary);
}

.addBtn {
  margin-top: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-input);
  border: 2px dashed var(--color-border);
  background: none;
  color: var(--color-primary);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  text-align: left;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.addBtn:hover {
  border-color: var(--color-primary);
  background: var(--color-green-50);
}
```

- [ ] **Create `src/components/DogSwitcher.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useActiveDog } from '@/lib/dog/active-dog-context'
import Avatar from './Avatar'
import styles from './DogSwitcher.module.css'

interface DogSwitcherProps {
  onAddDog: () => void
}

export default function DogSwitcher({ onAddDog }: DogSwitcherProps) {
  const { activeDog, allDogs, switchDog } = useActiveDog()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)

  if (!activeDog) return null

  async function handleSwitch(id: string) {
    if (id === activeDog!.id || switching) return
    setSwitching(id)
    try {
      await switchDog(id)
    } finally {
      setSwitching(null)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.chip}
        onClick={() => setOpen(true)}
        aria-label="Byt hund"
      >
        <Avatar name={activeDog.name} size={28} />
        {activeDog.name}
        <ChevronDown className={styles.chevron} />
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <p className={styles.sheetTitle}>Välj hund</p>
            {allDogs.map((dog) => {
              const isActive = dog.id === activeDog.id
              return (
                <button
                  key={dog.id}
                  type="button"
                  className={`${styles.dogRow} ${isActive ? styles.dogRowActive : ''}`}
                  onClick={() => handleSwitch(dog.id!)}
                  disabled={switching !== null}
                >
                  <Avatar name={dog.name} size={32} />
                  <span>{dog.name}</span>
                  {isActive && <span className={styles.check} aria-hidden="true">✓</span>}
                </button>
              )
            })}
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => { setOpen(false); onAddDog() }}
            >
              + Lägg till hund
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
```

- [ ] **Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | grep -v "^\.next/"
```
Expected: no errors

- [ ] **Commit**
```bash
git add src/components/DogSwitcher.tsx src/components/DogSwitcher.module.css
git commit -m "feat: add DogSwitcher chip and bottomsheet"
```

---

## Task 5: Integrate DogSwitcher into Dashboard header

**Files:**
- Modify: `src/app/dashboard/page.tsx`

The dashboard currently loads `profile` via `getDogProfile()`. Switch it to use `useActiveDog()` — the context is already provided by ProfileGuard.

- [ ] **Update `src/app/dashboard/page.tsx`**

At the top of the `Dashboard` function component, replace:
```ts
// OLD — remove these lines:
const [profile, setProfile] = useState<DogProfile | null>(null)
// ... useEffect that calls getDogProfile()
```

With:
```ts
const { activeDog: profile, allDogs } = useActiveDog()
```

Add the import at the top:
```ts
import { useActiveDog } from '@/lib/dog/active-dog-context'
```

Add state for AddDogModal:
```ts
const [showAddDog, setShowAddDog] = useState(false)
```

Add the import:
```ts
import AddDogModal from '@/components/AddDogModal'
```

In the header section, replace the plain dog name `<h1>`:
```tsx
// OLD:
<h1 className={styles.dogName}>{dogName}</h1>

// NEW:
<DogSwitcher onAddDog={() => setShowAddDog(true)} />
```

Add the import:
```ts
import DogSwitcher from '@/components/DogSwitcher'
```

At the bottom of the JSX (before closing `</main>`), add:
```tsx
{showAddDog && <AddDogModal onClose={() => setShowAddDog(false)} />}
```

Remove the `getDogProfile` import if no longer used elsewhere in the file.

- [ ] **Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | grep -v "^\.next/"
```
Expected: no errors

- [ ] **Commit**
```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: integrate DogSwitcher into dashboard header"
```

---

## Task 6: AddDogModal — add dog flow

**Files:**
- Create: `src/components/AddDogModal.tsx`
- Create: `src/components/AddDogModal.module.css`

`DogProfileForm` is tightly coupled to the onboarding flow (handles auth signup, routing, photo upload). For adding a second dog we need a simpler form: just name, breed, birthdate, and basic preferences.

- [ ] **Create `src/components/AddDogModal.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 50;
}

.sheet {
  width: 100%;
  max-width: var(--max-width);
  margin: 0 auto;
  background: var(--color-bg);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  max-height: 92dvh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-5) var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
}

.title {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-text);
  flex: 1;
}

.closeBtn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--text-xl);
  line-height: 1;
  padding: 4px;
}

.body {
  padding: var(--space-5);
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
  border: 2px solid var(--color-border);
  border-radius: var(--radius-input);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-base);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.optionList {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.optionBtn {
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-input);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.optionBtnSelected {
  border-color: var(--color-primary);
  background: var(--color-green-50);
  color: var(--color-primary);
  font-weight: var(--font-semibold);
}

.saveBtn {
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

.saveBtn:disabled {
  background: var(--color-border);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.error {
  font-size: var(--text-sm);
  color: #dc2626;
  text-align: center;
}
```

- [ ] **Create `src/components/AddDogModal.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useActiveDog } from '@/lib/dog/active-dog-context'
import { saveDogProfile } from '@/lib/dog/profile'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import { BREEDS, GOALS, ENVIRONMENTS, REWARDS } from '@/components/DogProfileForm'
import type { Breed, TrainingGoal, TrainingEnvironment, RewardPreference } from '@/types'
import styles from './AddDogModal.module.css'

interface Props {
  onClose: () => void
}

export default function AddDogModal({ onClose }: Props) {
  const { switchDog, refreshDogs } = useActiveDog()

  const [name, setName] = useState('')
  const [breed, setBreed] = useState<Breed | ''>('')
  const [birthdate, setBirthdate] = useState('')
  const [goals, setGoals] = useState<TrainingGoal[]>(['everyday_obedience'])
  const [environment, setEnvironment] = useState<TrainingEnvironment>('suburb')
  const [rewardPreference, setRewardPreference] = useState<RewardPreference>('mixed')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSave = name.trim() && breed && birthdate

  async function handleSave() {
    if (!canSave || saving) return
    setSaving(true)
    setError(null)
    try {
      const { data: { user } } = await getSupabaseBrowser().auth.getUser()
      if (!user) throw new Error('Inte inloggad')

      const saved = await saveDogProfile({
        name: name.trim(),
        breed: breed as Breed,
        birthdate,
        trainingWeek: 1,
        onboarding: {
          goals,
          environment,
          rewardPreference,
          takesRewardsOutdoors: true,
        },
      }, user.id)

      await refreshDogs()
      if (saved.id) await switchDog(saved.id)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Något gick fel')
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Lägg till hund</span>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Stäng">✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="dog-name">Hundens namn</label>
            <input
              id="dog-name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="T.ex. Bella"
              maxLength={40}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Ras</span>
            <div className={styles.optionList}>
              {BREEDS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  className={`${styles.optionBtn} ${breed === b.value ? styles.optionBtnSelected : ''}`}
                  onClick={() => setBreed(b.value)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="dog-birthdate">Födelsedag</label>
            <input
              id="dog-birthdate"
              type="date"
              className={styles.input}
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Träningsmål</span>
            <div className={styles.optionList}>
              {GOALS.map((g) => {
                const selected = goals.includes(g.value)
                return (
                  <button
                    key={g.value}
                    type="button"
                    className={`${styles.optionBtn} ${selected ? styles.optionBtnSelected : ''}`}
                    onClick={() => setGoals((prev) =>
                      prev.includes(g.value)
                        ? prev.length > 1 ? prev.filter((x) => x !== g.value) : prev
                        : [...prev, g.value]
                    )}
                  >
                    {g.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Träningsmiljö</span>
            <div className={styles.optionList}>
              {ENVIRONMENTS.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  className={`${styles.optionBtn} ${environment === e.value ? styles.optionBtnSelected : ''}`}
                  onClick={() => setEnvironment(e.value)}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Belöning</span>
            <div className={styles.optionList}>
              {REWARDS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`${styles.optionBtn} ${rewardPreference === r.value ? styles.optionBtnSelected : ''}`}
                  onClick={() => setRewardPreference(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={!canSave || saving}
          >
            {saving ? 'Sparar…' : 'Lägg till hund'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

Note: `BREEDS` is not currently exported from `DogProfileForm`. Add this export there:
```ts
// In src/components/DogProfileForm.tsx, change:
const BREEDS = [...]
// to:
export const BREEDS: { value: Breed; label: string }[] = [...]
```

- [ ] **Export BREEDS from DogProfileForm**

In `src/components/DogProfileForm.tsx` line 14, change `const BREEDS` to `export const BREEDS`.

- [ ] **Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | grep -v "^\.next/"
```
Expected: no errors

- [ ] **Commit**
```bash
git add src/components/AddDogModal.tsx src/components/AddDogModal.module.css src/components/DogProfileForm.tsx
git commit -m "feat: add AddDogModal for second-dog onboarding flow"
```

---

## Task 7: Update DB query helpers to use dogId

**Files:**
- Modify: `src/lib/supabase/daily-exercise-metrics.ts`
- Modify: `src/lib/supabase/daily-progress.ts`
- Modify: `src/lib/supabase/training-cache.ts`

Strategy: writes set both `dog_key` (= dogId as string, preserves existing PK conflict key) and `dog_id` (= dogId as uuid). Reads query by `dog_id`. This avoids a new UNIQUE constraint migration.

- [ ] **Rewrite `src/lib/supabase/daily-exercise-metrics.ts`**

```ts
import { getSupabaseAdmin } from './client'
import type { Breed } from '@/types'
import type { DailyExerciseMetrics, LatencyBucket } from '@/types'

type Row = {
  exercise_id: string
  success_count: number
  fail_count: number
  latency_bucket: LatencyBucket | null
  criteria_level_id: string | null
  notes: string | null
}

export async function getMetrics(
  breed: Breed,
  date: string,
  dogId: string
): Promise<Record<string, DailyExerciseMetrics>> {
  const { data, error } = await getSupabaseAdmin()
    .from('daily_exercise_metrics')
    .select('exercise_id, success_count, fail_count, latency_bucket, criteria_level_id, notes')
    .eq('dog_id', dogId)
    .eq('breed', breed)
    .eq('date', date)

  if (error) throw new Error(`Metrics fetch failed: ${error.message}`)

  const rows = (data ?? []) as unknown as Row[]
  return Object.fromEntries(rows.map((r) => [r.exercise_id, {
    success_count: r.success_count ?? 0,
    fail_count: r.fail_count ?? 0,
    latency_bucket: (r.latency_bucket ?? null) as LatencyBucket | null,
    criteria_level_id: r.criteria_level_id ?? null,
    notes: r.notes ?? undefined,
  } satisfies DailyExerciseMetrics]))
}

export async function upsertMetrics(
  breed: Breed,
  date: string,
  dogId: string,
  exerciseId: string,
  patch: Partial<DailyExerciseMetrics>
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('daily_exercise_metrics')
    .upsert(
      {
        dog_key: dogId,
        dog_id: dogId,
        breed,
        date,
        exercise_id: exerciseId,
        success_count: patch.success_count,
        fail_count: patch.fail_count,
        latency_bucket: patch.latency_bucket ?? null,
        criteria_level_id: patch.criteria_level_id ?? null,
        notes: patch.notes ?? null,
      },
      { onConflict: 'dog_key,breed,date,exercise_id' }
    )

  if (error) throw new Error(`Metrics upsert failed: ${error.message}`)
}
```

- [ ] **Rewrite `src/lib/supabase/daily-progress.ts`**

```ts
import { getSupabaseAdmin } from './client'
import type { Breed } from '@/types'

export async function getProgress(
  breed: Breed,
  date: string,
  dogId: string
): Promise<Record<string, number>> {
  const { data, error } = await getSupabaseAdmin()
    .from('daily_progress')
    .select('exercise_id, reps_done')
    .eq('dog_id', dogId)
    .eq('breed', breed)
    .eq('date', date)

  if (error) throw new Error(`Progress fetch failed: ${error.message}`)
  return Object.fromEntries((data ?? []).map((r) => [r.exercise_id as string, r.reps_done as number]))
}

export async function upsertProgress(
  breed: Breed,
  date: string,
  dogId: string,
  exerciseId: string,
  repsDone: number
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('daily_progress')
    .upsert(
      { dog_key: dogId, dog_id: dogId, breed, date, exercise_id: exerciseId, reps_done: repsDone },
      { onConflict: 'dog_key,breed,date,exercise_id' }
    )

  if (error) throw new Error(`Progress upsert failed: ${error.message}`)
}
```

- [ ] **Update `training-cache.ts` — replace `userId` param with `dogId`**

In `src/lib/supabase/training-cache.ts`, rename the `userId` parameter in `weekPlanCacheKey`, `getCachedWeekPlan`, and `setCachedWeekPlan` to `dogId`:

```ts
function weekPlanCacheKey(
  breed: Breed,
  ageWeeks?: number,
  goals?: string[],
  dateKey?: string,
  dogId?: string,          // was: userId
  onboardingHash?: string,
  customHash?: string,
  planVersion?: string,
): string {
  const parts = [`weekplan`, breed, ageBucket(ageWeeks), goalsBucket(goals)]
  if (dogId) parts.push(dogId)
  if (onboardingHash) parts.push(`o${onboardingHash}`)
  if (customHash) parts.push(`c${customHash}`)
  if (planVersion) parts.push(planVersion)
  if (dateKey) parts.push(dateKey)
  return parts.join('_')
}

export async function getCachedWeekPlan(
  breed: Breed,
  weekNumber: number,
  ageWeeks?: number,
  goals?: string[],
  dateKey?: string,
  dogId?: string,          // was: userId
  onboardingContext?: string,
  customIds?: string[],
  planVersion?: string,
): Promise<WeekPlan | null> { /* body unchanged — just replace userId with dogId */ }

export async function setCachedWeekPlan(
  breed: Breed,
  weekNumber: number,
  plan: WeekPlan,
  ageWeeks?: number,
  goals?: string[],
  dateKey?: string,
  dogId?: string,          // was: userId
  onboardingContext?: string,
  customIds?: string[],
  planVersion?: string,
): Promise<void> { /* body unchanged — just replace userId with dogId */ }
```

- [ ] **Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | grep -v "^\.next/"
```
Expected: errors only in route files (not yet updated) — that's fine

- [ ] **Commit**
```bash
git add src/lib/supabase/daily-exercise-metrics.ts src/lib/supabase/daily-progress.ts src/lib/supabase/training-cache.ts
git commit -m "feat: DB helpers use dogId instead of dogKey/userId"
```

---

## Task 8: Update API routes to accept and validate dogId

**Files:**
- Modify: `src/app/api/training/week/route.ts`
- Modify: `src/app/api/training/metrics/route.ts`
- Modify: `src/app/api/training/progress/route.ts`
- Modify: `src/app/api/chat/route.ts`

All routes share the same ownership-check pattern:

```ts
// Helper used in each route — add inline, not a shared file
async function resolveDog(supabase: Awaited<ReturnType<typeof createSupabaseServer>>, dogId: string, userId: string) {
  const { data } = await supabase
    .from('dog_profiles')
    .select('id, breed, training_week, onboarding, assessment')
    .eq('id', dogId)
    .eq('user_id', userId)
    .single()
  return data
}
```

- [ ] **Update `src/app/api/training/week/route.ts`**

Replace `const dogKey = p.get('dogKey') ?? undefined` with:
```ts
const dogId = p.get('dogId')
if (!dogId) return NextResponse.json({ error: 'dogId required' }, { status: 400 })

const dog = await (async () => {
  const { data } = await supabase
    .from('dog_profiles')
    .select('id')
    .eq('id', dogId)
    .eq('user_id', user.id)
    .single()
  return data
})()
if (!dog) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
```

Replace `userId` with `dogId` in both `getCachedWeekPlan` and `setCachedWeekPlan` calls.

- [ ] **Update `src/app/api/training/metrics/route.ts`**

In `parsePatch`: rename `dogKey` to `dogId`, change fallback from `'default'` to `''`, add validation that it's a non-empty string.

In `GET`: replace `dogKey` param with `dogId`. Add ownership check:
```ts
const dogId = req.nextUrl.searchParams.get('dogId')
if (!dogId) return NextResponse.json({ error: 'dogId required' }, { status: 400 })
const { data: dog } = await (await createSupabaseServer())
  .from('dog_profiles').select('id').eq('id', dogId).eq('user_id', user.id).single()
if (!dog) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
const metrics = await getMetrics(breed, date, dogId)
```

In `PATCH`: same ownership check using `parsed.dogId`.

- [ ] **Update `src/app/api/training/progress/route.ts`**

Same pattern as metrics: replace `dogKey` → `dogId` in both GET and PATCH, add ownership check.

- [ ] **Update `src/app/api/chat/route.ts`**

In the `POST` body destructuring, replace `dogKey` with `dogId`:
```ts
const { query, breed, weekNumber, ageWeeks, trainingWeek, dogId, onboardingContext } = await req.json() as {
  ...
  dogId?: string
  ...
}
// ...
const metrics = await getMetrics(breed, todayDateString(), dogId ?? '')
```

- [ ] **Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | grep -v "^\.next/"
```
Expected: errors only in client components not yet updated

- [ ] **Commit**
```bash
git add src/app/api/training/week/route.ts src/app/api/training/metrics/route.ts src/app/api/training/progress/route.ts src/app/api/chat/route.ts
git commit -m "feat: API routes use dogId with ownership verification"
```

---

## Task 9: Update client-side components to send dogId

**Files:**
- Modify: `src/components/TrainingCard/TrainingCard.tsx`
- Modify: `src/components/ChatInterface.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/assessment/page.tsx`
- Modify: `src/app/chat/page.tsx`

- [ ] **Update `src/components/TrainingCard/TrainingCard.tsx`**

Rename prop `dogKey: string` → `dogId: string` in the `Props` interface and all usages within the file. Replace `dogKey=` with `dogId=` in the 3 fetch calls and 2 body JSON calls.

- [ ] **Update `src/components/ChatInterface.tsx`**

Rename prop `dogKey?: string` → `dogId?: string`. Update the fetch body: `dogKey` → `dogId`.

- [ ] **Update `src/app/dashboard/page.tsx`**

Replace `dogKey={profile.id ?? 'default'}` with `dogId={profile.id ?? ''}` on the `<TrainingCard>`.

- [ ] **Update `src/app/assessment/page.tsx`**

Replace `dogKey: profile.id ?? 'default'` with `dogId: profile.id ?? ''`.

- [ ] **Update `src/app/chat/page.tsx`**

Replace `dogKey={profile.id}` with `dogId={profile.id}`.

- [ ] **Verify TypeScript — expect clean**
```bash
npx tsc --noEmit 2>&1 | grep -v "^\.next/"
```
Expected: no errors

- [ ] **Commit**
```bash
git add src/components/TrainingCard/TrainingCard.tsx src/components/ChatInterface.tsx src/app/dashboard/page.tsx src/app/assessment/page.tsx src/app/chat/page.tsx
git commit -m "feat: client components send dogId to API routes"
```

---

## Task 10: Update account deletion to handle multiple dogs (#46)

**Files:**
- Modify: `src/app/api/account/route.ts`

- [ ] **Rewrite `src/app/api/account/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

export async function DELETE() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()

  // Collect all dog ids for this user
  const { data: dogs } = await admin
    .from('dog_profiles')
    .select('id')
    .eq('user_id', user.id)

  const dogIds = (dogs ?? []).map((d: { id: string }) => d.id)

  await Promise.allSettled([
    dogIds.length > 0 && admin.from('session_logs').delete().in('dog_id', dogIds),
    dogIds.length > 0 && admin.from('daily_exercise_metrics').delete().in('dog_id', dogIds),
    dogIds.length > 0 && admin.from('daily_progress').delete().in('dog_id', dogIds),
    dogIds.length > 0 && admin.from('training_cache').delete().in('dog_id', dogIds),
    admin.from('custom_exercises').delete().eq('user_id', user.id),
    admin.from('user_settings').delete().eq('user_id', user.id),
    admin.from('dog_profiles').delete().eq('user_id', user.id),
  ])

  await admin.auth.admin.deleteUser(user.id)

  return NextResponse.json({ deleted: true })
}
```

- [ ] **Verify TypeScript — expect clean**
```bash
npx tsc --noEmit 2>&1 | grep -v "^\.next/"
```
Expected: no errors

- [ ] **Commit**
```bash
git add src/app/api/account/route.ts
git commit -m "feat: account deletion handles all dogs (ticket #46)"
```

---

## Task 11: Final push

- [ ] **Push all commits**
```bash
git push
```

- [ ] **Manual smoke test**
  1. Open `/dashboard` — dog name should show as a chip with chevron
  2. Tap chip — bottomsheet opens showing the dog and "Lägg till hund" button
  3. Tap "Lägg till hund" — AddDogModal opens
  4. Fill in name, breed, birthdate — tap "Lägg till hund"
  5. Dashboard switches to new dog, training plan loads fresh
  6. Tap chip again — both dogs listed, active marked with ✓
  7. Switch back to original dog — plan loads
