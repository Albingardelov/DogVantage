import type {
  Breed,
  TrainingGoal,
  DogSex,
  CastrationStatus,
  HouseholdPet,
} from '@/types/dog'
import type { WeeklyFocusArea } from '@/lib/training/weekly-focus'
import type { LifeStage } from '@/lib/dog/age'

export interface WeekPlanContext {
  breed: Breed
  trainingWeek: number
  ageWeeks: number | undefined
  lifeStage: LifeStage
  goals: TrainingGoal[]
  onboardingContext: string | undefined
  performanceSummary: string | undefined
  customExercises: { exercise_id: string; label: string }[]
  householdPets: HouseholdPet[]
  weeklyFocus: WeeklyFocusArea[]
  dogSex: DogSex | undefined
  castrationStatus: CastrationStatus | undefined
  isInHeat: boolean
  skenfasActive: boolean
  progressionRule: string | null
  isReactive: boolean
  hasCats: boolean
  hasOutdoorCats: boolean
  hasSmallAnimals: boolean
  hasLivestock: boolean
  isMasAdult: boolean
  isIntactMaleAdolescent: boolean
}

export type RuleBuilder = (ctx: WeekPlanContext) => string | null
