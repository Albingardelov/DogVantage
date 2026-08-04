import type { HandlerDimension } from '../../lib/training/handler-feedback'
import type { ExerciseProgressionDecision } from '../../lib/training/progression-rules'

export interface HandlerAverages {
  timing: number | null
  consistency: number | null
  reading: number | null
  sampleSize: number
}

export interface QuizStats {
  answered: number
  correct: number
}

export interface HandlerStruggle {
  struggling: boolean
  dimensions: HandlerDimension[]
  reason: string | null
}

const DIMENSION_THRESHOLD = 3.0
const MIN_HANDLER_SAMPLES = 3
const QUIZ_ACCURACY_THRESHOLD = 0.5
const MIN_QUIZ_ANSWERED = 5

const DIMENSION_LABELS: Record<HandlerDimension, string> = {
  timing: 'timing',
  consistency: 'konsekvens',
  reading: 'avläsning av hunden',
}

export function computeHandlerStruggle(
  handler: HandlerAverages,
  quiz: QuizStats | null,
): HandlerStruggle {
  const dimensions: HandlerDimension[] = []
  if (handler.sampleSize >= MIN_HANDLER_SAMPLES) {
    const candidates: Array<[HandlerDimension, number | null]> = [
      ['timing', handler.timing],
      ['consistency', handler.consistency],
      ['reading', handler.reading],
    ]
    for (const [dim, avg] of candidates) {
      if (typeof avg === 'number' && avg < DIMENSION_THRESHOLD) dimensions.push(dim)
    }
  }

  const quizWeak =
    quiz !== null &&
    quiz.answered >= MIN_QUIZ_ANSWERED &&
    quiz.correct / quiz.answered < QUIZ_ACCURACY_THRESHOLD

  const struggling = dimensions.length > 0 || quizWeak
  if (!struggling) return { struggling: false, dimensions: [], reason: null }

  const reason = dimensions.length > 0
    ? `Vi stabiliserar en vecka — fokus på din ${DIMENSION_LABELS[dimensions[0]]}.`
    : 'Vi stabiliserar en vecka — repetera grunderna i kursen först.'

  return { struggling, dimensions, reason }
}

export function dampAdvances(
  decisions: ExerciseProgressionDecision[],
  struggle: HandlerStruggle,
): ExerciseProgressionDecision[] {
  if (!struggle.struggling) return decisions
  return decisions.map((d) =>
    d.decision === 'advance'
      ? { ...d, decision: 'hold' as const, reason: struggle.reason ?? d.reason }
      : d,
  )
}
