export type Breed = 'labrador' | 'italian_greyhound' | 'braque_francais' | 'miniature_american_shepherd'

/**
 * 'general' is used for documents that apply to all breeds
 * (e.g. general puppy training guides, positive reinforcement methodology).
 * Not a user-selectable breed — only used internally for RAG indexing.
 */
export type BreedOrGeneral = Breed | 'general'

export type DogSex = 'male' | 'female'

export type CastrationStatus = 'intact' | 'castrated' | 'unknown'

export interface DogProfile {
  id?: string        // dog_profiles.id (uuid); undefined until first save
  name: string
  breed: Breed
  birthdate: string  // ISO 8601, e.g. "2024-10-15"
  /**
   * "Programvecka" – weeks since starting in the app / baseline assessment.
   * Separate from biological age (derived from birthdate).
   */
  trainingWeek?: number
  sex?: DogSex
  castrationStatus?: CastrationStatus
  onboarding?: OnboardingPrefs
  assessment?: AssessmentState
}

export type TrainingGoal =
  | 'everyday_obedience'
  | 'sport'
  | 'hunting'
  | 'herding'
  | 'impulse_control'
  | 'nosework'
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
  goals: TrainingGoal[]
  environment: TrainingEnvironment
  rewardPreference: RewardPreference
  /**
   * If true, user reports the dog reliably takes rewards outdoors.
   */
  takesRewardsOutdoors: boolean
  /** Other animals living in the same household — captured at onboarding */
  householdPets?: HouseholdPet[]
  /** Free-text owner notes about the dog's specific needs, fears, or focus areas */
  ownerNotes?: string
  /** ISO date when the dog comes home — training schedule starts from this date */
  homecomeDate?: string
  /** Handler's experience level — captured at onboarding so beginner guidance can fire from day one (assessment may refine it later) */
  trainingBackground?: TrainingBackground
}

// ─── Behavior profile (collected in assessment step 1) ───────────────────────

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

/** How the dog behaves on leash in general */
export type LeashBehavior =
  | 'calm'                  // Slakt koppel, lugnt
  | 'pulls_some'            // Drar lite, men hanterbart
  | 'pulls_hard_reactive'   // Drar konstant eller reaktiv/skäller

/** How the dog reacts to new environments and people */
export type NewEnvironmentReaction =
  | 'curious'   // Nyfiken och trygg
  | 'cautious'  // Lite försiktig, men lugnar ner sig
  | 'avoidant'  // Undviker eller verkar rädd

/** Handler's experience level */
export type TrainingBackground =
  | 'beginner'        // Nybörjare — aldrig tränat strukturerat
  | 'some_training'   // Lite tränad / gått valp- eller lydnadskurs
  | 'experienced'     // Erfaren — tävlat eller tränat länge

/** Other animals living in the same household */
export type HouseholdPet =
  | 'cats_indoor'   // Innekatter (kontrollerad miljö)
  | 'cats_outdoor'  // Katter som är ute / kan smita ut
  | 'dogs'          // Andra hundar
  | 'small_animals' // Kanin, fågel, gnagare m.m.
  | 'livestock'     // Gårdsdjur: häst, får, höns etc.

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
  completed_at?: string // ISO timestamp
  behaviorProfile?: BehaviorProfile
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

/** Utvalt dokument för bakåtkompatibilitet + UI (primär källa). */
export interface TrainingSourceRef {
  source: string
  source_url: string
  doc_version: string
  page_ref: string
}

export interface TrainingResult {
  content: string
  source: string
  source_url: string // empty string if unknown — primär källa / "Läs originalet"
  /** Alla unika RAG-träffar denna förfrågan (för källista i chatten). */
  sources?: TrainingSourceRef[]
  /**
   * Kort förklaring när inga dokument chunks använts, så användaren inte tror att svaret citerar PDF:er.
   */
  attributionNote?: string
}

export type LatencyBucket = 'lt1s' | '1to3s' | 'gt3s'

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
  sources?: TrainingSourceRef[]
  attributionNote?: string
}

export type QuickRating = 'good' | 'mixed' | 'bad'

export interface ExerciseSummary {
  id: string
  label: string
  success_count: number
  fail_count: number
  latency_bucket: LatencyBucket | null
  criteria_level_id: string | null
}

export interface SessionLog {
  id: string
  user_id: string
  breed: Breed
  week_number: number
  quick_rating: QuickRating
  focus: number           // 1–5
  obedience: number       // 1–5
  handler_timing?: number       // 1–5 förarens timing
  handler_consistency?: number  // 1–5 förarens konsekvens
  handler_reading?: number      // 1–5 förarens förmåga att läsa hunden
  notes?: string
  exercises?: ExerciseSummary[]
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
