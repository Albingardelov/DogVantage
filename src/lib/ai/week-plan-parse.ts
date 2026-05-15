import type { Exercise, WeekPlan } from '@/types'

function syncRepsFromDesc(exercise: Exercise): Exercise {
  const match = exercise.desc?.match(/^(\d+)\s*[×x]/i)
  if (match) return { ...exercise, reps: Number(match[1]) }
  return exercise
}

export function parseWeekPlan(raw: string): WeekPlan | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!Array.isArray(parsed.days) || parsed.days.length !== 7) return null
    const plan = parsed as unknown as WeekPlan
    plan.days = plan.days.map((d) => ({
      ...d,
      exercises: d.exercises?.map(syncRepsFromDesc),
    }))
    return plan
  } catch {
    return null
  }
}
