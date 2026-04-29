export type Breed = 'labrador' | 'italian_greyhound' | 'braque_francais'

/**
 * 'general' is used for documents that apply to all breeds
 * (e.g. general puppy training guides, positive reinforcement methodology).
 * Not a user-selectable breed — only used internally for RAG indexing.
 */
export type BreedOrGeneral = Breed | 'general'

export interface DogProfile {
  name: string
  breed: Breed
  birthdate: string // ISO 8601, e.g. "2024-10-15"
  /**
   * Stable identifier for this dog's data in storage/DB.
   * Needed to separate training progress between dogs of the same breed.
   */
  dogKey?: string
  /**
   * "Programvecka" – weeks since starting in the app / baseline assessment.
   * Separate from biological age (derived from birthdate).
   */
  trainingWeek?: number
  onboarding?: OnboardingPrefs
  assessment?: AssessmentState
}

export type TrainingGoal =
  | 'everyday_obedience'
  | 'sport'
  | 'hunting'
  | 'problem_solving'

export type TrainingEnvironment =
  | 'city'
  | 'suburb'
  | 'rural'

export type RewardPreference =
  | 'food'
  | 'toy'
  | 'social'
  | 'mixed'

export interface OnboardingPrefs {
  goal: TrainingGoal
  environment: TrainingEnvironment
  rewardPreference: RewardPreference
  /**
   * If true, user reports the dog reliably takes rewards outdoors.
   */
  takesRewardsOutdoors: boolean
}

export interface AssessmentState {
  status: 'not_started' | 'completed'
  completed_at?: string // ISO timestamp
}

export interface ChunkMatch {
  id: string
  content: string
  source: string
  source_url: string
  doc_version: string
  page_ref: string
  similarity: number
}

export interface TrainingResult {
  content: string
  source: string
  source_url: string // empty string if unknown — used for "Läs originalet" link
}

export type LatencyBucket = 'lt1s' | '1to3s' | 'gt3s'

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export type QuickRating = 'good' | 'mixed' | 'bad'

export interface SessionLog {
  id: string
  breed: Breed
  week_number: number
  quick_rating: QuickRating
  focus: number      // 1–5
  obedience: number  // 1–5
  notes?: string     // valfri fritext
  created_at: string
}

export interface DailyExerciseMetrics {
  success_count: number
  fail_count: number
  latency_bucket: LatencyBucket | null
  criteria_level_id: string | null
  notes?: string
}

export interface ChunkSource {
  source: string
  doc_version: string
  page_ref: string
  source_url: string
}

export interface Exercise {
  id: string      // slug, e.g. "inkallning"
  label: string   // display name, e.g. "Inkallning"
  desc: string    // short instruction, max 8 words
  reps: number    // 1–5
}

export interface DayPlan {
  day: string          // "Måndag" | "Tisdag" | "Onsdag" | "Torsdag" | "Fredag" | "Lördag" | "Söndag"
  rest?: boolean
  exercises?: Exercise[]
}

export interface WeekPlan {
  days: DayPlan[]      // always exactly 7 items
}
