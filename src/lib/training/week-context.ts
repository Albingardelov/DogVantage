import { getLifeStage } from '@/lib/dog/age'
import type {
  Breed,
  CastrationStatus,
  DogSex,
  HouseholdPet,
  TrainingGoal,
} from '@/types/dog'
import type { WeeklyFocusArea } from '@/lib/training/weekly-focus'
import type { WeekPlanContext } from './rules'

export interface WeekPlanInput {
  breed: Breed
  trainingWeek: number
  ageWeeks?: number
  goals?: TrainingGoal[]
  onboardingContext?: string
  performanceSummary?: string
  customExercises?: Array<{ exercise_id: string; label: string }>
  householdPets?: HouseholdPet[]
  weeklyFocus?: WeeklyFocusArea[]
  dogSex?: DogSex
  castrationStatus?: CastrationStatus
  isInHeat?: boolean
  skenfasActive?: boolean
  progressionRule?: string | null
}

export function buildWeekContext(input: WeekPlanInput): WeekPlanContext {
  const ageWeeks = input.ageWeeks
  const householdPets = input.householdPets ?? []
  const hasCats = householdPets.some((p) => p === 'cats_indoor' || p === 'cats_outdoor')
  const hasOutdoorCats = householdPets.includes('cats_outdoor')
  const hasSmallAnimals = householdPets.includes('small_animals')
  const hasLivestock = householdPets.includes('livestock')
  const isMasAdult =
    input.breed === 'miniature_american_shepherd' &&
    !(typeof ageWeeks === 'number' && ageWeeks < 26)
  const isIntactMaleAdolescent =
    input.dogSex === 'male' &&
    input.castrationStatus === 'intact' &&
    typeof ageWeeks === 'number' &&
    ageWeeks >= 28 && ageWeeks <= 78

  return {
    breed: input.breed,
    trainingWeek: input.trainingWeek,
    ageWeeks,
    lifeStage: getLifeStage(ageWeeks),
    goals: input.goals ?? [],
    onboardingContext: input.onboardingContext,
    performanceSummary: input.performanceSummary,
    customExercises: input.customExercises ?? [],
    householdPets,
    weeklyFocus: input.weeklyFocus ?? [],
    dogSex: input.dogSex,
    castrationStatus: input.castrationStatus,
    isInHeat: Boolean(input.isInHeat),
    skenfasActive: Boolean(input.skenfasActive),
    progressionRule: input.progressionRule ?? null,
    isReactive: detectReactive(input.onboardingContext),
    hasCats,
    hasOutdoorCats,
    hasSmallAnimals,
    hasLivestock,
    isMasAdult,
    isIntactMaleAdolescent,
  }
}

function detectReactive(text: string | undefined): boolean {
  if (!text) return false
  return (
    text.includes('Drar hårt eller reagerar') ||
    text.includes('pulls_hard_reactive') ||
    /reaktiv|skäller på/i.test(text)
  )
}
