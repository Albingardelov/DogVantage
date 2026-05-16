function toIsoDayKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Beraknar sammanhangande streak av dagar med minst en logg.
 * Streaken lever om hunden har tranat idag eller igar.
 */
export function computeStreak(logs: { created_at: string }[], today = new Date()): number {
  if (logs.length === 0) return 0

  const trainedDays = new Set(
    logs.map((log) => log.created_at.split('T')[0]),
  )

  let streak = 0
  const cursor = new Date(today)

  const todayKey = toIsoDayKey(cursor)
  if (!trainedDays.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1)
    const yesterdayKey = toIsoDayKey(cursor)
    if (!trainedDays.has(yesterdayKey)) return 0
  }

  while (trainedDays.has(toIsoDayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}
