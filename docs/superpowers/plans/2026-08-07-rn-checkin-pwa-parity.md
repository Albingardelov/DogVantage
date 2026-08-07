# RN-CHECKIN Implementation Plan

> **For agentic workers:** Implement task-by-task on `rn-0`. Spec: `docs/superpowers/specs/2026-08-07-rn-checkin-pwa-parity-design.md`.

**Goal:** Add daily check-in, plan scaling, heat banner, and light dog-state on mobile dashboard (PWA thin parity).

**Architecture:** Bearer `apiFetch` to existing `/api/training/checkin|heat|dog-state`; scale with `@dogvantage/core` `scaleDayPlan`; wire into `useTrainingSession` + dashboard UI.

**Tech Stack:** Expo Router, React Native, `@dogvantage/core`, Supabase JWT via existing auth.

## Global Constraints

- Work only in `.worktrees/rn-0`; do not push/merge to `main`.
- Swedish hardcoded copy (no i18n yet).
- No IAP/price copy; heat text must not claim veterinary diagnosis.
- Heat UI only if `sex === 'female' && castrationStatus === 'intact'`.
- Zone required to save check-in; energy/minutes optional (match web).

### Task 1: Hooks + scale in training session

**Files:**
- Create: `apps/mobile/src/hooks/use-day-checkin.ts`
- Create: `apps/mobile/src/hooks/use-heat.ts`
- Create: `apps/mobile/src/hooks/use-dog-state.ts`
- Modify: `apps/mobile/src/hooks/use-training-session.ts`

- [ ] Implement hooks with `apiFetch` + Bearer
- [ ] After week plan load, fetch check-in; set `today` from `scaleDayPlan` on raw day’s exercises
- [ ] Expose `checkIn`, `saveCheckIn`, `dismissCheckIn`, `scaleNote`, heat + dogState helpers from session or separate hooks used by dashboard
- [ ] `pnpm exec tsc --noEmit` in apps/mobile

### Task 2: UI components + dashboard

**Files:**
- Create: `apps/mobile/src/components/training/DayCheckInCard.tsx`
- Create: `apps/mobile/src/components/training/HeatBanner.tsx`
- Modify: `apps/mobile/app/(tabs)/dashboard.tsx`
- Modify: `.superpowers/sdd/progress.md`

- [ ] DayCheckInCard chips + Starta dagen / Hoppa över
- [ ] HeatBanner start/end
- [ ] Dog-state one-liner if present
- [ ] Show scale note when mode ≠ full
- [ ] tsc + commit

### Task 3: Commit

```bash
git commit -m "feat(mobile): RN-CHECKIN daily check-in, heat, and plan scaling"
```
