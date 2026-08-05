export function todayDateKey(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function emptyMetrics() {
  return {
    success_count: 0,
    fail_count: 0,
    latency_bucket: null as null,
    criteria_level_id: null as null,
  }
}
