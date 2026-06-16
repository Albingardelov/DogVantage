'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiFetch } from '@/lib/api/fetch'
import { MicroLessonResponseSchema } from '@/types/api/schemas'
import type { z } from 'zod'
import type { MicroLessonSchema } from '@/types/api/schemas'
import Link from 'next/link'
import styles from './MicroLessonCard.module.css'

type MicroLesson = z.infer<typeof MicroLessonSchema>

const DISMISS_KEY_PREFIX = 'dv_micro_lesson_dismissed_'

function todayKey(dogId: string): string {
  return `${DISMISS_KEY_PREFIX}${dogId}_${new Date().toISOString().slice(0, 10)}`
}

export default function MicroLessonCard({ dogId }: { dogId: string }) {
  const { i18n } = useTranslation()
  const [lesson, setLesson] = useState<MicroLesson | null>(null)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(todayKey(dogId)) === '1')
    } catch {
      setDismissed(false)
    }
  }, [dogId])

  useEffect(() => {
    if (dismissed) return
    let cancelled = false
    apiFetch(`/api/training/micro-lesson?dogId=${encodeURIComponent(dogId)}&locale=${i18n.language}`, MicroLessonResponseSchema)
      .then((res) => {
        if (!cancelled) setLesson(res.lesson)
      })
      .catch(() => {
        // The lesson is a bonus — hide silently on failure.
      })
    return () => {
      cancelled = true
    }
  }, [dogId, dismissed, i18n.language])

  if (dismissed || !lesson) return null

  function dismiss() {
    try {
      localStorage.setItem(todayKey(dogId), '1')
    } catch { /* ignore */ }
    setDismissed(true)
  }

  const source = lesson.sources[0]

  return (
    <section className={styles.card} aria-labelledby="micro-lesson-title">
      <div className={styles.content}>
        <span className={styles.kicker}>Dagens mikrolektion · {lesson.exerciseLabel}</span>
        <h2 id="micro-lesson-title" className={styles.title}>{lesson.title}</h2>
        <p className={styles.body}>{lesson.body}</p>
        {source && (
          <p className={styles.source}>
            Källa:{' '}
            {source.source_url ? (
              <a href={source.source_url} target="_blank" rel="noopener noreferrer">
                {source.source}
              </a>
            ) : (
              source.source
            )}
          </p>
        )}
        <Link
          href={`/learn/quiz?dogId=${encodeURIComponent(dogId)}&contextKey=${encodeURIComponent(`micro_${lesson.exerciseId}`)}&title=${encodeURIComponent(lesson.title)}&body=${encodeURIComponent(lesson.body.slice(0, 400))}&exerciseId=${encodeURIComponent(lesson.exerciseId)}`}
          className={styles.quizBtn}
        >
          Testa dig (2 frågor)
        </Link>
      </div>
      <button type="button" className={styles.dismiss} onClick={dismiss} aria-label="Stäng dagens mikrolektion">
        Stäng
      </button>
    </section>
  )
}
