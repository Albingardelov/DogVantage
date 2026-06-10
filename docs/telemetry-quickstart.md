# Telemetry Quickstart (Day 1)

Use this with `docs/telemetry-week-plan-playbook.md`.

## Pin These 3 Charts First

1. **Fallback Rate (15m rolling)**
   - Source: `telemetry:plan-validator`
   - Metric: `% usedFallback=true`
   - Why: fastest signal that AI descriptions are violating rules.

2. **Cache Hit Rate (15m rolling)**
   - Source: `telemetry:week-plan-api`
   - Metric: `% cacheHit=true`
   - Why: catches cache/key regressions and cost/latency drift.

3. **Top Violation Codes (24h stacked)**
   - Source: `telemetry:plan-validator.violationCodes`
   - Metric: summed count by code
   - Why: tells you exactly which rule is breaking after changes.

## Day-1 Alert Levels

- **Fallback spike (warning)**
  - Condition: fallback rate > 5% for 15 min
- **Fallback critical**
  - Condition: fallback rate > 10% for 10 min
- **Cache degradation**
  - Condition: cache hit rate < 60% for 30 min
- **Cache write error**
  - Condition: any `cacheWriteFailed=true` in 10 min

## Fast Interpretation

- High fallback + stable cache hit
  - Likely prompt/validator mismatch after planner changes.
- High fallback + low cache hit
  - Likely cache key/version/invalidation change plus quality issue.
- Violation code dominated by one rule
  - Fix that rule or description prompt constraint first.

## Daily 5-Minute Check

1. Open dashboard and check fallback trend last 24h.
2. Compare current `planVersion` to previous.
3. Review top 3 violation codes.
4. If any alert fired, freeze planner tweaks until root cause is clear.
