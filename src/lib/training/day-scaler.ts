import type { Exercise } from '@/types'
import {
  buildYellowExercise,
  selectYellowExercise,
  type PuppyZone,
} from '@/lib/training/puppy-zone'

export type HandlerEnergy = 'low' | 'ok' | 'high'

export interface DayCheckInState {
  zone: PuppyZone | null
  handlerEnergy: HandlerEnergy | null
  minutesAvailable: number | null
}

export type DayScaleMode = 'full' | 'trimmed' | 'calm' | 'rest'

export interface ScaledDay {
  mode: DayScaleMode
  exercises: Exercise[]
  note: string | null
}

const SHORT_SESSION_MINUTES = 10

export function scaleDayPlan(
  exercises: Exercise[],
  checkIn: DayCheckInState | null,
  options: {
    metrics?: Record<string, { success_count: number; fail_count: number }>
    priorityIds?: string[]
  } = {},
): ScaledDay {
  if (!checkIn || exercises.length === 0) {
    return { mode: 'full', exercises, note: null }
  }

  if (checkIn.zone === 'red') {
    return {
      mode: 'rest',
      exercises: [],
      note: 'Röd dag — vila, sniffpromenad och återhämtning är dagens träning.',
    }
  }
  if (checkIn.zone === 'yellow') {
    return {
      mode: 'calm',
      exercises: [buildYellowExercise(selectYellowExercise(options.metrics ?? {}))],
      note: 'Gul dag — kort och lugnt, en enkel vinst räcker.',
    }
  }

  const shortOnTime =
    typeof checkIn.minutesAvailable === 'number' &&
    checkIn.minutesAvailable < SHORT_SESSION_MINUTES
  if (checkIn.handlerEnergy === 'low' || shortOnTime) {
    const prioritized = (options.priorityIds ?? [])
      .map((id) => exercises.find((e) => e.id === id))
      .find((e): e is Exercise => Boolean(e))
    return {
      mode: 'trimmed',
      exercises: [prioritized ?? exercises[0]],
      note: 'Ont om tid eller energi — en fokuserad övning slår tre stressade.',
    }
  }

  return { mode: 'full', exercises, note: null }
}
