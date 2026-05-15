export function getAgeInWeeks(birthdate: string): number {
  const birth = new Date(birthdate).getTime()
  const now = Date.now()
  const days = Math.floor((now - birth) / (1000 * 60 * 60 * 24))
  return Math.floor(days / 7)
}

export type LifeStage = 'puppy' | 'junior' | 'adolescent' | 'adult'

const STAGE_BOUNDARIES = {
  puppy: 16,
  junior: 26,
  adolescent: 52,
} as const

export function getLifeStage(ageWeeks: number | undefined): LifeStage {
  if (typeof ageWeeks !== 'number' || ageWeeks <= 0) return 'adult'
  if (ageWeeks < STAGE_BOUNDARIES.puppy) return 'puppy'
  if (ageWeeks < STAGE_BOUNDARIES.junior) return 'junior'
  if (ageWeeks < STAGE_BOUNDARIES.adolescent) return 'adolescent'
  return 'adult'
}

export const isPuppy = (ageWeeks?: number): boolean => getLifeStage(ageWeeks) === 'puppy'
export const isJunior = (ageWeeks?: number): boolean => getLifeStage(ageWeeks) === 'junior'

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
