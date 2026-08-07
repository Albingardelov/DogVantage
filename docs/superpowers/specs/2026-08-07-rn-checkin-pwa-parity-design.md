# RN-CHECKIN — Design (PWA parity, thin)

**Date:** 2026-08-07  
**Branch:** `rn-0` (local worktree — do not merge to `main` until store path allows)  
**Ticket:** #86  
**Status:** Approved in chat (approach A); awaiting spec file review before plan/implement

## Context

Mobile dashboard (RN-3) shows today’s exercises and per-rep logging but does **not** run the PWA daily adaptive loop: zone/energy/time check-in, plan scaling, heat banners, or dog-state. Goal: clone that loop with the same APIs and core logic, without porting the entire web `TrainingCard`.

**Parity program order (agreed):** CHECKIN → ASSESS → SKILLS → LEARN → MICRO → i18n.

## Goals

- User can complete a daily check-in on mobile; result persists and matches web for the same `dogId`.
- Today’s exercise list on mobile is scaled with the same `scaleDayPlan` rules as the PWA when a check-in exists.
- Intact females see heat status and can start/end a cycle via the same heat API as web.
- Light dog-state readout on dashboard (status line), not full InsightCard (deferred to RN-MICRO).

## Non-goals

- Full `TrainingCard` port (swap candidates, criteria levels, coach badges, puppy-only ZoneCheckIn UI).
- TanStack Query / offline mutation queue (RN-SCALE-*).
- i18n `t()` extraction (RN-i18n) — Swedish copy OK, mirror existing mobile screens.
- Assessment, Skills, Learn, MicroLessonCard, InsightCard.

## Approach

**Thin parity (A):** Reuse web HTTP contracts + `@dogvantage/core` (`scaleDayPlan`, types). Native chips UI matching `DayCheckInCard` options. Same hook style as `use-training-session` / `apiFetch` + Bearer.

## API contracts (existing)

All require `dogId` + `Authorization: Bearer`.

### Check-in — `GET/POST /api/training/checkin`

- **GET** `?dogId=&date=YYYY-MM-DD` → `{ zone, handlerEnergy, minutesAvailable }` (nulls if missing).
- **GET** `?dogId=&from=&to=` → `{ zones }` (calendar; optional, not required for MVP).
- **POST** body: `{ dogId, date, zone: 'green'|'yellow'|'red', handlerEnergy?: 'low'|'ok'|'high', minutesAvailable?: 0–120 }` → `{ ok: true }`.

### Heat — `GET/POST/DELETE /api/training/heat?dogId=`

- **GET** → `{ isInHeat, active, lastEnded, skenfasActive }`.
- **POST** → start cycle (ends previous if any).
- **DELETE** → end cycle.

Show heat UI only when dog is female and not spayed/neutered (match web dashboard gating).

### Dog-state — `GET /api/training/dog-state?dogId=`

- Read-only summary for a compact status line. Do not implement focus PUT or InsightCard actions here.

## UX

1. Dashboard loads active dog + week plan + today’s check-in + heat (if applicable) + optional dog-state in parallel.
2. If no check-in for today → show **DayCheckInCard** above the exercise list (zone → energy → time → Spara). Dismiss optional if web allows; prefer require zone at minimum before save (match web: all three selected before enable save).
3. After save → refetch check-in; hide full card; show compact summary; recompute scaled exercises.
4. Exercise list uses scaled day plan when `dayCheckIn` is set; otherwise unscaled week plan (current behavior).
5. Heat banner: informational copy only (“rådfråga veterinär” if needed — never claim veterinary diagnosis). Actions: Starta löpning / Avsluta.
6. Dog-state: one muted line under meta if payload has a displayable field; fail soft if API errors.

## Files to add/change

| Path | Role |
|------|------|
| `apps/mobile/src/components/training/DayCheckInCard.tsx` | Chip UI for zone/energy/time |
| `apps/mobile/src/components/training/HeatBanner.tsx` | Heat status + start/end |
| `apps/mobile/src/hooks/use-day-checkin.ts` | Load/save today’s check-in |
| `apps/mobile/src/hooks/use-heat.ts` | Load/mutate heat (gated) |
| `apps/mobile/src/hooks/use-dog-state.ts` | Optional GET summary |
| `apps/mobile/src/hooks/use-training-session.ts` | Integrate check-in → `scaleDayPlan` for `today` |
| `apps/mobile/app/(tabs)/dashboard.tsx` | Render check-in, heat, status, scaled list |
| `.superpowers/sdd/progress.md` | Mark CHECKIN done when shipped |

## Acceptance

- [ ] Check-in on mobile appears when loading same dog’s check-in on web (same date).
- [ ] Changing zone to red/yellow changes displayed exercises / scale note like web for same inputs.
- [ ] Heat start/end on mobile matches web state for intact female.
- [ ] No price / subscribe copy; no IAP.
- [ ] `tsc` clean for `apps/mobile`.

## Risks

- Web may gate heat on sex/castration fields — mobile must use same rules or banner never shows.
- `scaleDayPlan` needs a well-typed `DayCheckInState`; map API nulls carefully.
- Double-fetch on dashboard focus — acceptable; match existing `useFocusEffect` patterns.

## Follow-ups (later tickets)

ASSESS → SKILLS → LEARN → MICRO (InsightCard / micro-lessons) → i18n.
