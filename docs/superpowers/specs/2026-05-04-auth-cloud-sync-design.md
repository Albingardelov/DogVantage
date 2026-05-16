# Auth + Cloud Sync Implementation Design

## Goal

Replace localStorage-based identity with Supabase Auth (email + password). Move DogProfile and dog photo to the cloud so data survives device switches. Scope: auth only — environment context and progress visualization are separate sub-projects.

## Architecture

**Auth method:** Email + password via Supabase Auth.

**Onboarding flow (new users):** The onboarding wizard is unchanged until the final step, which becomes a "Skapa konto" screen — email field, password field, submit button. On submit: `supabase.auth.signUp()` → save DogProfile to `dog_profiles` table → redirect to `/dashboard`.

**Login flow (returning users):** The landing page (`/`) is a server component that checks for an active session via `createSupabaseServer()`. Logged-in users are redirected server-side to `/dashboard` (no flash). Logged-out users see a landing with two options: "Kom igång" (starts wizard) and "Logga in" (goes to `/login`). `/login` is a standalone page: email + password + forgot-password link (Supabase handles reset email).

**Route protection:** Next.js middleware at `src/middleware.ts` refreshes the Supabase auth token on every request and redirects unauthenticated users to `/login` for protected routes.

- Protected: `/dashboard`, `/calendar`, `/profile`, `/assessment`, `/learn`
- Public: `/`, `/login`, `/api/training/*`, `/api/chat/*`

**No data migration.** The app has no real users yet. Existing anonymous `dog_key` records in `session_logs` are abandoned. The `dog_key` column is dropped.

---

## Data Model

### New table: `dog_profiles`

```sql
create table dog_profiles (
  user_id     uuid primary key references auth.users on delete cascade,
  name        text not null,
  breed       text not null,
  birthdate   date not null,
  training_week int not null default 1,
  onboarding  jsonb,
  assessment  jsonb,
  created_at  timestamptz not null default now()
);

alter table dog_profiles enable row level security;

create policy "Users can read and write their own profile"
  on dog_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### Modified table: `session_logs`

- Add column: `user_id uuid references auth.users`
- Drop column: `dog_key`
- Update RLS to use `user_id = auth.uid()`

```sql
alter table session_logs add column user_id uuid references auth.users;
alter table session_logs drop column dog_key;

drop policy if exists "..." on session_logs;
create policy "Users can read and write their own logs"
  on session_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### Photo storage

Supabase Storage bucket `dog-photos` (private). Path: `{user_id}/avatar`. `src/lib/dog/photo.ts` is rewritten to upload to Storage on save and fetch a short-lived signed URL (60 min TTL) on read. The signed URL is passed to `<Avatar>` and `<img>` instead of a base64 data URL.

---

## Supabase Client Architecture

Three client types replace the current single client in `src/lib/supabase/client.ts`:

**`src/lib/supabase/browser.ts`** — client components only.
```ts
import { createBrowserClient } from '@supabase/ssr'
export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**`src/lib/supabase/server.ts`** — API routes and server components. Reads cookies to restore the user session.
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export function createSupabaseServer() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => cookies.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
      } }
  )
}
```

**Admin client** (stays in `client.ts`) — service role, for RAG/ingest only. Never used for user-scoped data.

---

## Files Created or Modified

| File | Change |
|------|--------|
| `src/lib/supabase/browser.ts` | New — browser client |
| `src/lib/supabase/server.ts` | New — server client from cookies |
| `src/lib/supabase/client.ts` | Keep admin client only, remove anon client |
| `src/lib/supabase/dog-profiles.ts` | New — getProfile / saveProfile / updateProfile |
| `src/lib/dog/profile.ts` | Rewrite: calls dog-profiles lib instead of localStorage |
| `src/lib/dog/photo.ts` | Rewrite: upload/download via Supabase Storage |
| `src/middleware.ts` | New — token refresh + route protection |
| `src/app/login/page.tsx` | New — email + password login form |
| `src/app/login/page.module.css` | New |
| `src/components/DogProfileForm.tsx` | Replace final step with "Skapa konto" |
| `src/app/page.tsx` | Show landing (not wizard) if logged out |
| `src/lib/supabase/session-logs.ts` | Use user_id from session, drop dog_key |
| `src/app/api/logs/route.ts` | Read user_id from server-side session |
| `src/components/ProfileGuard.tsx` | Check auth session, not localStorage |

---

## Out of scope

- Forgot-password UI (Supabase sends reset email, standard redirect flow)
- Google OAuth
- Environment context in session logging (separate sub-project)
- Progress visualization / weekly summary (separate sub-project)
