# Monthly Calendar View — Design Spec
Date: 2026-05-04

## Overview

A dedicated calendar page (`/calendar`) giving the user a monthly overview of their training history and upcoming planned sessions. Accessed by tapping the "Programvecka X" badge in the dashboard header.

## Entry Point

The `weekBadge` element in `src/app/dashboard/page.tsx` becomes a `<Link href="/calendar">` instead of a plain `<span>`. No other navigation changes — bottom nav stays as-is (Hem / Chatt / Logg).

## Calendar Page (`/calendar`)

### Layout

```
[← Back]  Maj 2026  [←] [→]
┌─────────────────────────────┐
│  Mån  Tis  Ons  Tor  Fre  Lör  Sön │
│   …   …    •    …    ○    …    …   │
│   …   ●    …    …    •    …    …   │
│   …   …    …    ●    …    …    …   │
│   …   …    ◌    …    …    ◌    …   │
└─────────────────────────────┘
[ Day detail panel — slides up on tap ]
```

- Month header with left/right arrows for prev/next month
- 7-column grid, weeks as rows
- Days outside current month shown dimmed/empty
- Today's cell has a distinct ring/highlight

### Day Cell Indicators

| State | Visual |
|---|---|
| Logged — rating "good" | Filled green dot |
| Logged — rating "mixed" | Filled yellow dot |
| Logged — rating "bad" | Filled red dot |
| Past training day, no log | Small gray outline circle |
| Upcoming planned training day | Small faded green dot |
| Rest day (past or future) | Nothing |
| Today | Cell outlined/highlighted regardless of other state |

"Past training day" = a date before today where the current weekly pattern indicates a training day but no session log exists.

### Day Detail Panel

Rendered below the grid. Appears when user taps a day cell. Defaults to today on initial load.

**For logged days:**
- Date + weekday name
- Rating badge (Bra / Blandat / Svårt) with color
- Focus N/5 and Obedience N/5
- List of exercises with label and success rate (e.g. "Inkallning — 3/4 lyckade (75%)")
- Notes if present

**For future planned training days:**
- "Planerad träningsdag" label
- Weekday training indicator only — no exercise details (avoids extra AI calls)

**For future rest days:**
- "Vilodag"

**For past days with no log and no planned training (i.e. rest day):**
- "Vilodag"

**For past days with no log but a training day was planned:**
- "Inget pass loggat"

## Data Sources

### Session logs
Fetched once on mount via existing `GET /api/logs?breed=X` (returns all logs, up to 30). Keyed by date string (`created_at.split('T')[0]`) for O(1) lookup per cell.

### Week plan pattern
Fetched once via existing `GET /api/training/week?breed=X&week=Y&ageWeeks=Z&goals=...`. The 7-day `days` array is inspected to determine which weekday names are training days vs rest days. This pattern is projected forward/backward to cover the full displayed month — no additional AI calls.

### No new API endpoints required.

## Architecture

### New files
- `src/app/calendar/page.tsx` — page component (client component wrapped in ProfileGuard)
- `src/app/calendar/page.module.css` — styles

### Modified files
- `src/app/dashboard/page.tsx` — `weekBadge` becomes a `<Link href="/calendar">`

### Data model assumptions
- `SessionLog.exercises` (added in recent session) may be undefined for older logs — handle gracefully (show no exercise list)
- `SessionLog.created_at` is an ISO timestamp; date extracted as `created_at.slice(0, 10)`
- Week plan days array always has exactly 7 entries (Mon–Sun), `rest: true` for rest days

## Component Breakdown

```
CalendarPage
  ProfileGuard
  └── CalendarView
        ├── header (back button, month title, prev/next arrows)
        ├── CalendarGrid
        │     └── DayCell × 28–42
        └── DayDetailPanel (selected day)
```

`CalendarGrid` and `DayCell` are local sub-components within `page.tsx`. `DayDetailPanel` is also local. No new shared components needed — this feature is self-contained.

## State

```typescript
const [selectedDate, setSelectedDate] = useState<string>(todayStr)   // YYYY-MM-DD
const [viewMonth, setViewMonth] = useState<{ year: number; month: number }>({...})
const [logs, setLogs] = useState<Record<string, SessionLog>>({})      // date → log
const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null)
const [loading, setLoading] = useState(true)
```

## Edge Cases

- No session logs at all: calendar shows only planned/rest indicators
- Week plan fetch fails: fall back to no future indicators (graceful)
- Month with 4 vs 5 vs 6 weeks: grid renders correct number of rows
- Dog with no `onboarding.goals`: goals omitted from week plan fetch URL
- `exercises` field missing on older logs: detail panel skips exercise list
