import { useCallback, useEffect, useMemo, useState } from 'react'
import type { QuickRating } from '@dogvantage/core'
import { fetchActiveDog, type ActiveDog } from '@/lib/dog/active-dog'
import { supabase } from '@/lib/supabase'

export type CalendarSessionLog = {
  id: string
  created_at: string
  quick_rating: QuickRating
  focus: number
  obedience: number
  exercises?: {
    id: string
    label: string
    success_count: number
    fail_count: number
  }[] | null
  notes?: string | null
}

export type MarkedDates = Record<
  string,
  {
    marked?: boolean
    dotColor?: string
    selected?: boolean
    selectedColor?: string
  }
>

function dateKeyFromIso(iso: string): string {
  return iso.slice(0, 10)
}

function monthRangeIso(year: number, month: number): { from: string; to: string } {
  const from = new Date(Date.UTC(year, month - 1, 1)).toISOString()
  const to = new Date(Date.UTC(year, month, 1)).toISOString()
  return { from, to }
}

export function useMonthlyLogs(year: number, month: number) {
  const [dog, setDog] = useState<ActiveDog | null>(null)
  const [logs, setLogs] = useState<CalendarSessionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const active = await fetchActiveDog()
      setDog(active)
      if (!active?.id) {
        setLogs([])
        setError('Ingen hundprofil hittades.')
        return
      }

      const { from, to } = monthRangeIso(year, month)
      const { data, error: qErr } = await supabase
        .from('session_logs')
        .select('id, created_at, quick_rating, focus, obedience, exercises, notes')
        .eq('dog_id', active.id)
        .gte('created_at', from)
        .lt('created_at', to)
        .order('created_at', { ascending: true })

      if (qErr) throw new Error(qErr.message)
      setLogs((data as CalendarSessionLog[] | null) ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte hämta loggar')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    void reload()
  }, [reload])

  const logsByDay = useMemo(() => {
    const map: Record<string, CalendarSessionLog[]> = {}
    for (const log of logs) {
      const key = dateKeyFromIso(log.created_at)
      if (!map[key]) map[key] = []
      map[key].push(log)
    }
    return map
  }, [logs])

  const markedDates: MarkedDates = useMemo(() => {
    const marks: MarkedDates = {}
    for (const key of Object.keys(logsByDay)) {
      marks[key] = { marked: true, dotColor: '#22c55e' }
    }
    return marks
  }, [logsByDay])

  const removeLog = useCallback(async (id: string) => {
    const { error: delErr } = await supabase.from('session_logs').delete().eq('id', id)
    if (delErr) throw new Error(delErr.message)
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }, [])

  return { dog, logs, logsByDay, markedDates, loading, error, reload, removeLog }
}
