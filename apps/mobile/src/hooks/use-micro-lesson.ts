import { useCallback, useEffect, useState } from 'react'
import { MicroLessonResponseSchema } from '@dogvantage/core'
import type { z } from 'zod'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch } from '@/lib/api/client'
import { todayDateKey } from '@/lib/training/dates'
import { getFlag, setFlag } from '@/lib/storage/dismiss'

type MicroLesson = NonNullable<z.infer<typeof MicroLessonResponseSchema>['lesson']>

function dismissKey(dogId: string) {
  return `dv_micro_lesson_dismissed_${dogId}_${todayDateKey()}`
}

export function useMicroLesson(dogId: string | undefined, enabled: boolean) {
  const { session } = useAuth()
  const [lesson, setLesson] = useState<MicroLesson | null>(null)
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!session?.user?.id || !dogId || !enabled) {
      setLesson(null)
      return
    }
    const dismissed = (await getFlag(dismissKey(dogId))) === '1'
    if (dismissed) {
      setLesson(null)
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch(
        `/api/training/micro-lesson?dogId=${encodeURIComponent(dogId)}&locale=sv`,
      )
      if (!res.ok) {
        setLesson(null)
        return
      }
      const parsed = MicroLessonResponseSchema.parse(await res.json())
      setLesson(parsed.lesson)
    } catch {
      setLesson(null)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, dogId, enabled])

  useEffect(() => {
    void reload()
  }, [reload])

  const dismiss = useCallback(async () => {
    if (!dogId) return
    await setFlag(dismissKey(dogId), '1')
    setLesson(null)
  }, [dogId])

  return { lesson, loading, dismiss, reload }
}
