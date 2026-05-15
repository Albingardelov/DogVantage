import { z } from 'zod'

export const TrainingSourceRefSchema = z.object({
  source: z.string(),
  source_url: z.string().optional().default(''),
  doc_version: z.string().optional().default(''),
  page_ref: z.string().optional().default(''),
})

export const TrainingResultSchema = z.object({
  content: z.string(),
  source: z.string().optional().default(''),
  source_url: z.string().optional().default(''),
  sources: z.array(TrainingSourceRefSchema).optional(),
  attributionNote: z.string().optional(),
})

export const ExerciseSchema = z.object({
  id: z.string(),
  label: z.string(),
  desc: z.string(),
  reps: z.number(),
})

export const DayPlanSchema = z.object({
  day: z.string(),
  rest: z.boolean().optional(),
  exercises: z.array(ExerciseSchema).optional(),
})

export const WeekPlanSchema = z.object({
  days: z.array(DayPlanSchema),
})

export const SessionLogSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  breed: z.string(),
  week_number: z.number(),
  quick_rating: z.enum(['good', 'mixed', 'bad']),
  focus: z.number(),
  obedience: z.number(),
  handler_timing: z.number().nullable().optional().transform((v) => v ?? undefined),
  handler_consistency: z.number().nullable().optional().transform((v) => v ?? undefined),
  handler_reading: z.number().nullable().optional().transform((v) => v ?? undefined),
  notes: z.string().nullable().optional().transform((v) => v ?? undefined),
  exercises: z.array(z.object({
    id: z.string(),
    label: z.string(),
    success_count: z.number(),
    fail_count: z.number(),
    latency_bucket: z.enum(['lt1s', '1to3s', 'gt3s']).nullable(),
    criteria_level_id: z.string().nullable(),
  })).nullable().optional().transform((v) => v ?? undefined),
  created_at: z.string(),
})

export const SessionLogArraySchema = z.array(SessionLogSchema)

export const DailyExerciseMetricsSchema = z.object({
  success_count: z.number(),
  fail_count: z.number(),
  latency_bucket: z.enum(['lt1s', '1to3s', 'gt3s']).nullable(),
  criteria_level_id: z.string().nullable(),
  notes: z.string().optional(),
})

export const MetricsMapSchema = z.record(z.string(), DailyExerciseMetricsSchema)
export const ProgressMapSchema = z.record(z.string(), z.number())

export type TrainingResultDTO = z.infer<typeof TrainingResultSchema>
export type WeekPlanDTO = z.infer<typeof WeekPlanSchema>
export type SessionLogDTO = z.infer<typeof SessionLogSchema>
