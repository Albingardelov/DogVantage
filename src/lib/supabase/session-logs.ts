import { createSupabaseServer } from '@/lib/supabase/server'
import type { Breed, SessionLog, QuickRating, ExerciseSummary } from '@/types'

export async function getRecentLogs(
  breed: Breed,
  weekNumber: number,
  limit = 5
): Promise<SessionLog[]> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('session_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('breed', breed)
    .eq('week_number', weekNumber)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch session logs: ${error.message}`)
  return (data ?? []) as SessionLog[]
}

export async function getAllLogs(breed: Breed, limit = 30): Promise<SessionLog[]> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('session_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('breed', breed)
    .order('created_at', { ascending: false })
    .limit(limit)

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
