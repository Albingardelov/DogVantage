export function getAgeInWeeks(birthdate: string): number {
  const birth = new Date(birthdate).getTime()
  const now = Date.now()
  const days = Math.floor((now - birth) / (1000 * 60 * 60 * 24))
  return Math.floor(days / 7)
}
