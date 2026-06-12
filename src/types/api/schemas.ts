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
  reps: z.number().default(3),
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

export const TrainingDaysResponseSchema = z.object({
  days: z.array(z.string()),
})

export const DailyExerciseMetricsSchema = z.object({
  success_count: z.number(),
  fail_count: z.number(),
  latency_bucket: z.enum(['lt1s', '1to3s', 'gt3s']).nullable(),
  criteria_level_id: z.string().nullable(),
  notes: z.string().optional(),
})

export const MetricsMapSchema = z.record(z.string(), DailyExerciseMetricsSchema)

export const ExerciseSourcesResponseSchema = z.object({
  sources: z.record(z.string(), z.array(TrainingSourceRefSchema)),
})

export const MicroLessonSchema = z.object({
  title: z.string(),
  body: z.string(),
  exerciseId: z.string(),
  exerciseLabel: z.string(),
  sources: z.array(TrainingSourceRefSchema),
})

export const MicroLessonResponseSchema = z.object({
  lesson: MicroLessonSchema.nullable(),
})

export const CoachTipSchema = z.object({
  exerciseId: z.string(),
  exerciseLabel: z.string(),
  advice: z.string(),
  sources: z.array(TrainingSourceRefSchema),
})

export const CurriculumModuleSchema = z.object({
  id: z.string(),
  order: z.number(),
  title: z.string(),
  goal: z.string(),
  exerciseId: z.string().optional(),
  readMinutes: z.number(),
  summary: z.string(),
  body: z.string(),
  keyPoints: z.array(z.string()),
  sources: z.array(TrainingSourceRefSchema),
  completed: z.boolean().optional(),
  unlocked: z.boolean().optional(),
  recommended: z.boolean().optional(),
  recommendationReason: z.string().nullable().optional(),
  reviewSuggested: z.boolean().optional(),
})

export const CurriculumOverviewSchema = z.object({
  lifeStage: z.enum(['puppy', 'junior', 'adolescent', 'adult']),
  modules: z.array(CurriculumModuleSchema),
  completedCount: z.number(),
})

export const QuizQuestionSchema = z.object({
  cardKey: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  correctIndex: z.number(),
  explanation: z.string(),
})

export const QuizSessionSchema = z.object({
  contextKey: z.string(),
  title: z.string(),
  questions: z.array(QuizQuestionSchema),
})

export const QuizSessionResponseSchema = z.object({
  session: QuizSessionSchema.nullable(),
})

export const QuizGradeResultSchema = z.object({
  cardKey: z.string(),
  correct: z.boolean(),
  correctIndex: z.number(),
  explanation: z.string(),
  nextReviewDays: z.number(),
})

export const QuizGradeResponseSchema = z.object({
  results: z.array(QuizGradeResultSchema),
  correctCount: z.number(),
  total: z.number(),
})

export const DayCheckInResponseSchema = z.object({
  zone: z.enum(['green', 'yellow', 'red']).nullable(),
  handlerEnergy: z.enum(['low', 'ok', 'high']).nullable(),
  minutesAvailable: z.number().nullable(),
})

export const ProgressMapSchema = z.record(z.string(), z.number())

export const DogStateExerciseStatSchema = z.object({
  exerciseId: z.string(),
  successRate: z.number(),
  attempts: z.number(),
})

export const DogStateEnvExerciseStatSchema = z.object({
  exerciseId: z.string(),
  environment: z.enum(['home', 'outdoor', 'park', 'mixed']),
  successRate: z.number(),
  attempts: z.number(),
})

export const DogStatePayloadSchema = z.object({
  version: z.literal(1),
  weakExercises: z.array(DogStateExerciseStatSchema),
  strongExercises: z.array(DogStateExerciseStatSchema),
  environmentDifficulty: z.record(z.string(), z.number()),
  environmentByExercise: z.array(DogStateEnvExerciseStatSchema).optional(),
  handler: z.object({
    timing: z.number().nullable(),
    consistency: z.number().nullable(),
    reading: z.number().nullable(),
    sampleSize: z.number(),
  }),
  zoneSummary: z.object({
    greenDays: z.number(),
    yellowDays: z.number(),
    redDays: z.number(),
    window: z.literal(14),
  }),
  thresholdAdjustments: z.record(z.string(), z.number()),
})

export const ChatHistoryMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  created_at: z.string(),
})

export const ChatHistoryResponseSchema = z.object({
  messages: z.array(ChatHistoryMessageSchema),
})

export const WeeklyFocusResponseSchema = z.object({
  isoWeek: z.string(),
  areas: z.array(z.string()),
  exerciseIds: z.array(z.string()),
})

export type TrainingResultDTO = z.infer<typeof TrainingResultSchema>
export type WeekPlanDTO = z.infer<typeof WeekPlanSchema>
export type SessionLogDTO = z.infer<typeof SessionLogSchema>
