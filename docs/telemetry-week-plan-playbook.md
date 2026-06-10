# Week Plan Telemetry Playbook

This playbook covers the two telemetry events now emitted by planning:

- `telemetry:week-plan-api` (API-level source/cache telemetry)
- `telemetry:plan-validator` (validator compliance + fallback telemetry)

Use these for dashboards, alerts, and release checks after planner/rule updates.

## Event Schemas

### `telemetry:week-plan-api`

Fields:

- `source`: `"cache"` or `"generated"`
- `cacheHit`: `boolean`
- `cacheWriteFailed`: `boolean` (optional)
- `dogId`: `string`
- `breed`: `string`
- `trainingWeek`: `number`
- `ageWeeks`: `number | null`
- `planVersion`: `string`
- `hasFocusAreas`: `boolean`
- `hasPriorities`: `boolean`
- `hasProgressionRule`: `boolean`
- `cacheScope`: `string | null`

### `telemetry:plan-validator`

Fields:

- `breed`: `string`
- `trainingWeek`: `number`
- `ok`: `boolean`
- `violationCount`: `number`
- `violationCodes`: `Record<string, number>`
- `usedFallback`: `boolean`

## KPI Dashboards (build these first)

1. `fallback_rate`
   - `sum(usedFallback=true) / total(plan-validator events)`
2. `cache_hit_rate`
   - `sum(cacheHit=true) / total(week-plan-api events)`
3. `top_violation_codes`
   - Sum of `violationCodes.*` by code
4. `fallback_by_plan_version`
   - Group fallback rate by `planVersion`
5. `fallback_by_breed`
   - Group fallback rate by `breed`

## Suggested Alerts

- **High fallback rate**
  - Trigger: fallback rate > 5% for 15 minutes
- **Cache regression**
  - Trigger: cache hit rate < 60% for 30 minutes
- **Rule regression spike**
  - Trigger: any single `violationCode` > 2x baseline over last 24h
- **Cache write health**
  - Trigger: `cacheWriteFailed` count > 0 for 10 minutes

## Query Templates

Below are portable patterns. Adapt syntax for your log backend.

### A) Fallback rate (last 1h)

```sql
-- Pseudo SQL / Axiom-like
SELECT
  100.0 * SUM(CASE WHEN usedFallback = true THEN 1 ELSE 0 END) / COUNT(*) AS fallback_rate_pct
FROM logs
WHERE event = 'telemetry:plan-validator'
  AND timestamp > now() - interval '1 hour';
```

### B) Cache hit rate (last 1h)

```sql
SELECT
  100.0 * SUM(CASE WHEN cacheHit = true THEN 1 ELSE 0 END) / COUNT(*) AS cache_hit_rate_pct
FROM logs
WHERE event = 'telemetry:week-plan-api'
  AND timestamp > now() - interval '1 hour';
```

### C) Top violation codes (last 24h)

```sql
-- If your backend supports object expansion/unnest:
SELECT code, SUM(count) AS total
FROM logs
CROSS JOIN UNNEST_OBJECT(violationCodes) AS (code, count)
WHERE event = 'telemetry:plan-validator'
  AND timestamp > now() - interval '24 hour'
GROUP BY code
ORDER BY total DESC
LIMIT 10;
```

### D) Fallback segmented by plan version and breed

```sql
SELECT
  planVersion,
  breed,
  COUNT(*) AS total,
  SUM(CASE WHEN usedFallback = true THEN 1 ELSE 0 END) AS fallback_count,
  100.0 * SUM(CASE WHEN usedFallback = true THEN 1 ELSE 0 END) / COUNT(*) AS fallback_rate_pct
FROM logs
WHERE event = 'telemetry:plan-validator'
  AND timestamp > now() - interval '24 hour'
GROUP BY planVersion, breed
ORDER BY fallback_rate_pct DESC;
```

## Release Checklist (for planner/rule changes)

1. Deploy to canary cohort.
2. Monitor 60 minutes:
   - fallback rate
   - cache hit rate
   - top violation code deltas
3. Compare vs previous `planVersion`.
4. Roll forward only if:
   - fallback rate not worse than baseline + 2 percentage points
   - no new high-severity violation code spikes
   - cache write failures remain at 0

## Violation Codes Reference

Current validator codes:

- `day_count`
- `day_order`
- `rest_count`
- `rest_has_exercises`
- `exercise_count_per_day`
- `exercise_not_allowed`
- `exercise_reps_invalid`
- `missing_fri_pairing`
- `progression_regress_mismatch`
- `progression_advance_mismatch`
- `exercise_repetition_limit`
- `reactive_missing_lat`
- `reactive_day_after_lat_not_calm`

If new validator rules are added, update this list and add a matching chart.
