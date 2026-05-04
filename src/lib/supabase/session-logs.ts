import { getSupabaseAdmin } from './client'
import type { Breed, SessionLog, QuickRating, ExerciseSummary } from '@/types'

export async function saveSessionLog(log: {
  breed: Breed
  dog_key?: string
  week_number: number
  quick_rating: QuickRating
  focus: number
  obedience: number
  handler_timing?: number
  handler_consistency?: number
  handler_reading?: number
  notes?: string
  exercises?: ExerciseSummary[]
}): Promise<SessionLog> {
  const { data, error } = await getSupabaseAdmin()
    .from('session_logs')
    .insert(log)
    .select()
    .single()

  if (error) throw new Error(`Failed to save session log: ${error.message}`)
  return data as SessionLog
}

export async function getRecentLogs(
  breed: Breed,
  weekNumber: number,
  limit = 5,
  dogKey?: string
): Promise<SessionLog[]> {
  let query = getSupabaseAdmin()
    .from('session_logs')
    .select('*')
    .eq('breed', breed)
    .eq('week_number', weekNumber)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (dogKey) query = query.eq('dog_key', dogKey)

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch session logs: ${error.message}`)
  return (data ?? []) as SessionLog[]
}

export async function getAllLogs(breed: Breed, limit = 30, dogKey?: string): Promise<SessionLog[]> {
  let query = getSupabaseAdmin()
    .from('session_logs')
    .select('*')
    .eq('breed', breed)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (dogKey) query = query.eq('dog_key', dogKey)

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch session logs: ${error.message}`)
  return (data ?? []) as SessionLog[]
}

export function formatLogsForPrompt(logs: SessionLog[]): string[] {
  return logs.map((log) => {
    const ratingMap: Record<QuickRating, string> = {
      good: 'Bra',
      mixed: 'Blandat',
      bad: 'Dåligt',
    }
    const parts = [
      `Vecka ${log.week_number}: ${ratingMap[log.quick_rating]}`,
      `fokus ${log.focus}/5`,
      `lydnad ${log.obedience}/5`,
    ]
    if (log.exercises && log.exercises.length > 0) {
      const exerciseParts = log.exercises.map((ex) => {
        const attempts = ex.success_count + ex.fail_count
        const rate = attempts > 0 ? Math.round((ex.success_count / attempts) * 100) : null
        return rate !== null ? `${ex.label} ${rate}%` : ex.label
      })
      parts.push(`övningar: ${exerciseParts.join(', ')}`)
    }
    if (log.notes) parts.push(`"${log.notes}"`)
    return parts.join(', ')
  })
}
