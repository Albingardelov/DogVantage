# Multi-dog UI — Design Spec
**Tickets:** #43 (ActiveDogContext + switcher), #45 (lägg till hund), #44 (API dogId)
**Date:** 2026-05-07

---

## Scope

Enable a user to have multiple dog profiles, switch between them from the Dashboard, and add new dogs without re-onboarding. All per-dog API routes use the dog's `id` (uuid) instead of the user's `id`.

---

## 1. ActiveDogContext

### Location
`src/lib/dog/active-dog-context.tsx`

### What it does
- On mount: fetches all `dog_profiles` rows for the logged-in user (ordered by `created_at ASC`)
- Reads `user_settings.active_dog_id` to determine which dog is active
- If `active_dog_id` is NULL or missing: defaults to the first dog
- If no dogs exist: sets `activeDog = null` (ProfileGuard redirects to onboarding as today)

### Exposed interface
```ts
interface ActiveDogContextValue {
  activeDog: DogProfile | null
  allDogs: DogProfile[]
  switchDog: (id: string) => Promise<void>
  isLoading: boolean
}
```

`switchDog(id)`:
1. Updates `user_settings` via upsert (`user_id`, `active_dog_id`, `updated_at`)
2. Sets local state immediately (optimistic)

### Placement
Wrapped inside `ProfileGuard` (replaces the current single `getDogProfile()` call). All children receive the context.

### Hook
```ts
// src/lib/dog/use-active-dog.ts
export function useActiveDog(): ActiveDogContextValue
```

---

## 2. DogSwitcher Component

### Location
`src/components/DogSwitcher.tsx` + `DogSwitcher.module.css`

### Trigger
A pressable chip in the Dashboard header showing the active dog's name and a chevron-down icon. Only rendered when `allDogs.length >= 1`.

### Bottomsheet (modal)
- Opens on chip press
- Lists all dogs: avatar + name, checkmark on active
- "Lägg till hund" button at the bottom
- Closes on backdrop press or after selection

### Behavior
- Selecting a dog calls `switchDog(id)` and closes the sheet
- The sheet shows a loading state while `switchDog` resolves
- After switch: Dashboard re-fetches training plan automatically (TrainingCard already re-fetches when its `breed`/`dogKey` props change)

---

## 3. Dashboard Header Change

Current header renders: `[Avatar] [Greeting + dog name]`

Updated: dog name becomes a `<button>` styled as a chip, with `▾` icon appended. Chip only appears as interactive when `allDogs.length > 1` OR when the "add dog" flow should be accessible (always show it for discoverability).

No layout changes — the chip replaces the plain `<span>` for the dog name.

---

## 4. Add Dog Flow — ticket #45

### Entry point
"Lägg till hund" button inside DogSwitcher bottomsheet.

### Implementation
- Renders `DogProfileForm` inside a full-screen modal/sheet (same component used in `/onboarding`)
- On submit: calls `saveProfile(newProfile, userId)` which already does `insert` (not upsert)
- On success: calls `switchDog(newDog.id)` to make the new dog active, closes modal
- `allDogs` in context is refreshed (re-fetch or append to local state)

### DogProfileForm reuse
`DogProfileForm` already accepts an `onComplete` callback. No changes needed to the form itself — just wrap it in a modal.

---

## 5. API Routes — ticket #44

### Routes to update
| Route | Method | Change |
|-------|--------|--------|
| `/api/training/week` | GET | `dogKey` → `dogId` query param |
| `/api/training/metrics` | GET + PATCH | `dogKey` → `dogId` |
| `/api/training/progress` | GET + PATCH | `dogKey` → `dogId` |
| `/api/chat` | POST | `dogKey` → `dogId` in body |

### Security pattern (applied to all)
```ts
const { data: dog } = await supabase
  .from('dog_profiles')
  .select('id, breed, training_week, onboarding, assessment')
  .eq('id', dogId)
  .eq('user_id', user.id)
  .single()
if (!dog) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
```

### DB queries
All `.eq('dog_key', dogKey)` calls in `daily-exercise-metrics.ts`, `daily-progress.ts`, and `training-cache.ts` are updated to `.eq('dog_id', dogId)`.

### training-cache.ts
`weekPlanCacheKey` receives `dogId` instead of `userId`. The embedded key string changes from `..._<userId>_...` to `..._<dogId>_...`. Existing cache entries are invalidated naturally (miss → regenerate).

---

## 6. Client-side dogId propagation

After #44, the client needs to pass `dogId` (= `activeDog.id`) to all API calls.

- `TrainingCard`: prop `dogKey: string` renamed to `dogId: string`
- `ChatInterface`: prop `dogKey?: string` renamed to `dogId?: string`
- All fetch calls updated to send `dogId`

---

## 7. Error handling

- `switchDog` failure: optimistic update is rolled back, toast/console error shown
- "Lägg till hund" failure: form shows error message, modal stays open
- Route returns 403 for unknown dogId: client shows generic error (same as today's error states)

---

## Out of scope

- Renaming or deleting a dog profile (separate ticket if needed)
- Per-dog custom exercises (custom_exercises stays user-scoped for now)
- Dog profile photo/avatar customisation
