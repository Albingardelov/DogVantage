import { useCallback, useState } from 'react'
import {
  QuizGradeResponseSchema,
  QuizSessionResponseSchema,
  QuizSessionSchema,
} from '@dogvantage/core'
import type { z } from 'zod'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch } from '@/lib/api/client'

type QuizSession = z.infer<typeof QuizSessionSchema>
type QuizGrade = z.infer<typeof QuizGradeResponseSchema>

export function useQuiz(dogId: string | undefined) {
  const { session } = useAuth()
  const [sessionQuiz, setSessionQuiz] = useState<QuizSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [grading, setGrading] = useState(false)
  const [grade, setGrade] = useState<QuizGrade | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})

  const load = useCallback(
    async (params: { contextKey: string; title: string; body: string; exerciseId?: string }) => {
      if (!session?.access_token || !dogId) return
      setLoading(true)
      setError(null)
      setGrade(null)
      setAnswers({})
      setSessionQuiz(null)
      try {
        const q = new URLSearchParams({
          dogId,
          contextKey: params.contextKey,
          title: params.title,
          body: params.body.slice(0, 400),
        })
        if (params.exerciseId) q.set('exerciseId', params.exerciseId)
        const res = await apiFetch(`/api/learning/quiz?${q.toString()}`, session.access_token)
        if (!res.ok) throw new Error('Kunde inte skapa quiz')
        const parsed = QuizSessionResponseSchema.parse(await res.json())
        setSessionQuiz(parsed.session)
        if (!parsed.session) setError('Inga frågor kunde skapas.')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fel')
      } finally {
        setLoading(false)
      }
    },
    [session?.access_token, dogId],
  )

  const select = useCallback((cardKey: string, selectedIndex: number) => {
    setAnswers((prev) => ({ ...prev, [cardKey]: selectedIndex }))
  }, [])

  const submit = useCallback(async () => {
    if (!session?.access_token || !dogId || !sessionQuiz) return
    const payload = sessionQuiz.questions.map((q) => ({
      cardKey: q.cardKey,
      selectedIndex: answers[q.cardKey] ?? -1,
    }))
    if (payload.some((a) => a.selectedIndex < 0)) {
      setError('Svara på alla frågor först.')
      return
    }
    setGrading(true)
    setError(null)
    try {
      const res = await apiFetch(
        `/api/learning/quiz?dogId=${encodeURIComponent(dogId)}`,
        session.access_token,
        { method: 'POST', body: JSON.stringify({ answers: payload }) },
      )
      if (!res.ok) throw new Error('Kunde inte rätta quiz')
      setGrade(QuizGradeResponseSchema.parse(await res.json()))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fel')
    } finally {
      setGrading(false)
    }
  }, [session?.access_token, dogId, sessionQuiz, answers])

  return { sessionQuiz, loading, grading, grade, error, answers, load, select, submit }
}
