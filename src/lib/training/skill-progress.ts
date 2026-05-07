export interface MetricRow {
  exercise_id: string
  date: string
  success_count: number
  fail_count: number
  criteria_level_id: string | null
}

export interface WeekBucket {
  week_start: string
  success_rate: number | null
  attempts: number
}

export interface SkillProgress {
  exercise_id: string
  label: string
  total_attempts: number
  overall_success_rate: number
  delta: number | null
  latest_criteria_level_id: string | null
  weeks: WeekBucket[]
}

export interface AggregateOptions {
  exerciseLabels: Record<string, string>
  endDate: Date
  weeks?: number
  topN?: number
}

export function isoMondayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  const day = d.getUTCDay()
  const offsetToMonday = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + offsetToMonday)
  return d.toISOString().slice(0, 10)
}

export function aggregateSkillProgress(
  rows: MetricRow[],
  opts: AggregateOptions
): SkillProgress[] {
  const weeks = Math.max(1, opts.weeks ?? 4)
  const topN = Math.max(1, opts.topN ?? 5)

  const todayMonday = isoMondayOf(opts.endDate.toISOString().slice(0, 10))
  const weekStarts: string[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(`${todayMonday}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() - i * 7)
    weekStarts.push(d.toISOString().slice(0, 10))
  }
  const earliestWeek = weekStarts[0]

  const byExercise: Record<string, MetricRow[]> = {}
  for (const row of rows) {
    if (row.date < earliestWeek) continue
    ;(byExercise[row.exercise_id] ??= []).push(row)
  }

  const results: SkillProgress[] = []
  for (const [exerciseId, exRows] of Object.entries(byExercise)) {
    let totalSuccess = 0
    let totalAttempts = 0
    let latestDate = ''
    let latestCriteriaId: string | null = null

    const byWeek: Record<string, { s: number; a: number }> = {}
    for (const ws of weekStarts) byWeek[ws] = { s: 0, a: 0 }

    for (const row of exRows) {
      const ws = isoMondayOf(row.date)
      if (byWeek[ws]) {
        byWeek[ws].s += row.success_count
        byWeek[ws].a += row.success_count + row.fail_count
      }
      totalSuccess += row.success_count
      totalAttempts += row.success_count + row.fail_count
      if (row.criteria_level_id && row.date >= latestDate) {
        latestDate = row.date
        latestCriteriaId = row.criteria_level_id
      }
    }

    if (totalAttempts === 0) continue

    const weekBuckets: WeekBucket[] = weekStarts.map((ws) => ({
      week_start: ws,
      attempts: byWeek[ws].a,
      success_rate: byWeek[ws].a > 0 ? byWeek[ws].s / byWeek[ws].a : null,
    }))

    const half = Math.floor(weekBuckets.length / 2)
    const firstHalf = weekBuckets.slice(0, half).filter((w) => w.success_rate !== null)
    const lastHalf = weekBuckets.slice(half).filter((w) => w.success_rate !== null)
    let delta: number | null = null
    if (firstHalf.length > 0 && lastHalf.length > 0) {
      const f = firstHalf.reduce((acc, w) => acc + (w.success_rate ?? 0), 0) / firstHalf.length
      const l = lastHalf.reduce((acc, w) => acc + (w.success_rate ?? 0), 0) / lastHalf.length
      delta = l - f
    }

    results.push({
      exercise_id: exerciseId,
      label: opts.exerciseLabels[exerciseId] ?? exerciseId,
      total_attempts: totalAttempts,
      overall_success_rate: totalSuccess / totalAttempts,
      delta,
      latest_criteria_level_id: latestCriteriaId,
      weeks: weekBuckets,
    })
  }

  results.sort((a, b) => b.total_attempts - a.total_attempts)
  return results.slice(0, topN)
}
