'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/fetch'
import { QuizGradeResponseSchema, QuizSessionResponseSchema } from '@/types/api/schemas'
import type { z } from 'zod'
import type { QuizQuestionSchema } from '@/types/api/schemas'
import { IconCheck, IconX } from '@/components/icons'
import styles from './QuizSheet.module.css'

type QuizQuestion = z.infer<typeof QuizQuestionSchema>

interface Props {
  dogId: string
  contextKey: string
  title: string
  body: string
  exerciseId?: string
  onClose: () => void
}

export default function QuizSheet({ dogId, contextKey, title, body, exerciseId, onClose }: Props) {
  const router = useRouter()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null)
  const [results, setResults] = useState<Array<{ cardKey: string; correct: boolean; explanation: string }>>([])

  useEffect(function loadQuiz() {
    let cancelled = false
    const params = new URLSearchParams({
      dogId,
      contextKey,
      title,
      body: body.slice(0, 400),
    })
    if (exerciseId) params.set('exerciseId', exerciseId)

    apiFetch(`/api/learning/quiz?${params.toString()}`, QuizSessionResponseSchema)
      .then((res) => {
        if (!cancelled) setQuestions(res.session?.questions ?? [])
      })
      .catch(function onQuizLoadError() {
        if (!cancelled) setQuestions([])
      })
      .finally(function finishQuizLoad() {
        if (!cancelled) setLoading(false)
      })

    return function cleanupQuizLoad() {
      cancelled = true
    }
  }, [dogId, contextKey, title, body, exerciseId])

  function select(cardKey: string, index: number) {
    setAnswers((prev) => ({ ...prev, [cardKey]: index }))
  }

  async function handleSubmit() {
    if (questions.some((q) => answers[q.cardKey] === undefined)) return
    setSubmitting(true)
    try {
      const res = await apiFetch(
        `/api/learning/quiz?dogId=${encodeURIComponent(dogId)}`,
        QuizGradeResponseSchema,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: questions.map((q) => ({
              cardKey: q.cardKey,
              selectedIndex: answers[q.cardKey],
            })),
          }),
        },
      )
      setScore({ correct: res.correctCount, total: res.total })
      setResults(res.results.map((r) => ({
        cardKey: r.cardKey,
        correct: r.correct,
        explanation: r.explanation,
      })))
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="quiz-title">
      <div className={styles.sheet}>
        <header className={styles.header}>
          <h2 id="quiz-title" className={styles.title}>Testa dig · {title}</h2>
          <button type="button" className={styles.dismiss} onClick={onClose} aria-label="Stäng">
            Stäng
          </button>
        </header>

        {loading && <p className={styles.status}>Skapar frågor...</p>}

        {!loading && questions.length === 0 && (
          <p className={styles.status}>Inga frågor kunde skapas just nu.</p>
        )}

        {!loading && !done && questions.map((q, qi) => (
          <fieldset key={q.cardKey} className={styles.question}>
            <legend className={styles.questionText}>{qi + 1}. {q.question}</legend>
            <div className={styles.options}>
              {q.options.map((opt, oi) => (
                <button
                  key={opt}
                  type="button"
                  className={`${styles.option} ${answers[q.cardKey] === oi ? styles.optionSelected : ''}`}
                  onClick={() => select(q.cardKey, oi)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </fieldset>
        ))}

        {done && score && (
          <div className={styles.result}>
            <p className={styles.score}>
              {score.correct}/{score.total} rätt
            </p>
            {results.map((r) => (
              <div key={r.cardKey} className={styles.feedback}>
                {r.correct ? <IconCheck size="sm" /> : <IconX size="sm" />}
                <span>{r.explanation}</span>
              </div>
            ))}
            <p className={styles.reviewNote}>
              Fel svar repeteras om {results.some((r) => !r.correct) ? '1–3 dagar' : 'några dagar'}.
            </p>
          </div>
        )}

        <footer className={styles.footer}>
          {!done && questions.length > 0 && (
            <button
              type="button"
              className={styles.submit}
              disabled={submitting || questions.some((q) => answers[q.cardKey] === undefined)}
              onClick={() => void handleSubmit()}
            >
              {submitting ? 'Rättar...' : 'Se resultat'}
            </button>
          )}
          {done && (
            <button type="button" className={styles.submit} onClick={() => router.push('/learn?tab=kurs')}>
              Tillbaka till kursen
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
