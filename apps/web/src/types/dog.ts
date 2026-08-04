export type Breed = string

export type DogSex = 'male' | 'female'

export type CastrationStatus = 'intact' | 'castrated' | 'unknown'

export const ALL_GOALS = [
  'everyday_obedience',
  'sport',
  'hunting',
  'herding',
  'impulse_control',
  'nosework',
  'problem_solving',
] as const

export type TrainingGoal = typeof ALL_GOALS[number]

export function isGoal(v: unknown): v is TrainingGoal {
  return typeof v === 'string' && (ALL_GOALS as readonly string[]).includes(v)
}

export type TrainingEnvironment = 'city' | 'suburb' | 'rural'

export type RewardPreference = 'food' | 'toy' | 'social' | 'mixed'

export interface DogProfile {
  id?: string
  name: string
  breed: Breed
  birthdate: string
  trainingWeek?: number
  sex?: DogSex
  castrationStatus?: CastrationStatus
  onboarding?: OnboardingPrefs
  assessment?: AssessmentState
}

export interface OnboardingPrefs {
  goals: TrainingGoal[]
  environment: TrainingEnvironment
  rewardPreference: RewardPreference
  takesRewardsOutdoors: boolean
  householdPets?: HouseholdPet[]
  ownerNotes?: string
  homecomeDate?: string
  trainingBackground?: TrainingBackground
}

export type TriggerType =
  | 'cars'
  | 'cyclists'
  | 'runners'
  | 'children'
  | 'skateboards'
  | 'other_dogs'
  | 'animals'
  | 'loud_sounds'
  | 'strangers'

export type LeashBehavior =
  | 'not_yet_out'
  | 'calm'
  | 'pulls_some'
  | 'pulls_hard_reactive'

export type NewEnvironmentReaction = 'not_yet_out' | 'curious' | 'cautious' | 'avoidant'

export type TrainingBackground = 'beginner' | 'some_training' | 'experienced'

export type HouseholdPet =
  | 'cats_indoor'
  | 'cats_outdoor'
  | 'dogs'
  | 'small_animals'
  | 'livestock'

export interface BehaviorProfile {
  triggers: TriggerType[]
  leashBehavior: LeashBehavior
  newEnvironmentReaction: NewEnvironmentReaction
  trainingBackground: TrainingBackground
  householdPets: HouseholdPet[]
  problemNotes?: string
}

export interface AssessmentState {
  status: 'not_started' | 'completed'
  completed_at?: string
  behaviorProfile?: BehaviorProfile
}
