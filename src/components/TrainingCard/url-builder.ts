import type { Breed, HouseholdPet, RewardPreference, TrainingEnvironment, TrainingGoal } from '@/types'

export interface WeekPlanUrlParams {
  breed: Breed
  trainingWeek: number
  ageWeeks: number
  dogId: string
  goals?: TrainingGoal[]
  environment?: TrainingEnvironment
  rewardPreference?: RewardPreference
  takesRewardsOutdoors?: boolean
  behaviorContext?: string
  householdPets?: HouseholdPet[]
}

/**
 * Builds the `/api/training/week` URL with all optional query params.
 * Previously inlined as a 9-ternary template literal — extracted so
 * each parameter is testable and readable.
 */
export function buildWeekPlanUrl(p: WeekPlanUrlParams): string {
  const params = new URLSearchParams()
  params.set('breed', p.breed)
  params.set('week', String(p.trainingWeek))
  params.set('ageWeeks', String(p.ageWeeks))
  params.set('dogId', p.dogId)
  if (p.goals && p.goals.length > 0) params.set('goals', p.goals.join(','))
  if (p.environment) params.set('environment', p.environment)
  if (p.rewardPreference) params.set('rewardPreference', p.rewardPreference)
  if (p.takesRewardsOutdoors != null) params.set('takesRewardsOutdoors', String(p.takesRewardsOutdoors))
  if (p.behaviorContext) params.set('behaviorContext', p.behaviorContext)
  if (p.householdPets && p.householdPets.length > 0) params.set('householdPets', p.householdPets.join(','))
  return `/api/training/week?${params.toString()}`
}
