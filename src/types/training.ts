import type { Breed } from './dog'

export type LatencyBucket = 'lt1s' | '1to3s' | 'gt3s'

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
  focus: number
  obedience: number
  handler_timing?: number
  handler_consistency?: number
  handler_reading?: number
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

export interface Exercise {
  id: string
  label: string
  desc: string
  reps: number
}

export interface DayPlan {
  day: string
  rest?: boolean
  exercises?: Exercise[]
}

export interface WeekPlan {
  days: DayPlan[]
}

export type WeeklyFocusArea = 'engagement' | 'calm' | 'impulse_control' | 'confidence' | 'cooperation'
