export function getAgeInWeeks(birthdate: string): number {
  const birth = new Date(birthdate).getTime()
  const now = Date.now()
  const days = Math.floor((now - birth) / (1000 * 60 * 60 * 24))
  return Math.floor(days / 7)
}

/** Days until the dog comes home. Negative = already home. */
export function daysUntilHomecoming(homecomeDate: string): number {
  const home = new Date(homecomeDate)
  home.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((home.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/** Training week derived from homecoming date. Week 1 = day 0–6, week 2 = day 7–13, etc. */
export function trainingWeekFromHomecoming(homecomeDate: string): number {
  const days = -daysUntilHomecoming(homecomeDate)
  if (days < 0) return 1
  return Math.floor(days / 7) + 1
}
