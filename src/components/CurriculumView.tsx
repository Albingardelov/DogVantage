'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/fetch'
import { CurriculumOverviewSchema } from '@/types/api/schemas'
import type { z } from 'zod'
import type { CurriculumModuleSchema } from '@/types/api/schemas'
import { IconCaretRight, IconCheck } from '@/components/icons'
import styles from './CurriculumView.module.css'

type CurriculumOverview = z.infer<typeof CurriculumOverviewSchema>
type CurriculumModule = z.infer<typeof CurriculumModuleSchema>

export default function CurriculumView({ dogId }: { dogId: string }) {
  const [data, setData] = useState<CurriculumOverview | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const overview = await apiFetch(
        `/api/learning/curriculum?dogId=${encodeURIComponent(dogId)}`,
        CurriculumOverviewSchema,
      )
      setData(overview)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [dogId])

  useEffect(() => {
    void load()
  }, [load])

  async function markComplete(moduleId: string) {
    setCompleting(moduleId)
    try {
      await fetch(`/api/learning/curriculum/${moduleId}?dogId=${encodeURIComponent(dogId)}`, {
        method: 'POST',
      })
      await load()
    } finally {
      setCompleting(null)
    }
  }

  if (loading) {
    return <p className={styles.status}>Laddar din kurs...</p>
  }

  if (!data) {
    return <p className={styles.status}>Kunde inte hämta kursen just nu.</p>
  }

  const total = data.modules.length

  return (
    <div className={styles.wrap}>
      <div className={styles.progressHead}>
        <span className={styles.progressLabel}>Din kurs</span>
        <span className={styles.progressCount}>{data.completedCount}/{total} klara</span>
      </div>
      <p className={styles.intro}>
        Steg-för-steg för dig som lär dig själv — baserat på {data.lifeStage === 'puppy' ? 'valp' : 'din hunds'} fas och rasens dokument.
      </p>

      {data.modules.map((mod) => {
        const open = expandedId === mod.id
        return (
          <article
            key={mod.id}
            className={`${styles.module} ${!mod.unlocked ? styles.locked : ''} ${mod.completed ? styles.done : ''}`}
          >
            <button
              type="button"
              className={styles.moduleHead}
              disabled={!mod.unlocked}
              onClick={() => setExpandedId(open ? null : mod.id)}
              aria-expanded={open}
            >
              <span className={styles.moduleOrder}>{mod.order}</span>
              <div className={styles.moduleMeta}>
                <h2 className={styles.moduleTitle}>{mod.title}</h2>
                <p className={styles.moduleGoal}>{mod.summary}</p>
              </div>
              {mod.completed ? (
                <IconCheck size="sm" className={styles.checkIcon} />
              ) : (
                <IconCaretRight size="sm" className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
              )}
            </button>

            {open && mod.unlocked && (
              <div className={styles.moduleBody}>
                <p className={styles.body}>{mod.body}</p>
                {mod.keyPoints.length > 0 && (
                  <ul className={styles.keyPoints}>
                    {mod.keyPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
                {mod.sources.length > 0 && (
                  <p className={styles.source}>
                    Källa:{' '}
                    {mod.sources.map((s, i) => (
                      <span key={s.source}>
                        {i > 0 && ' · '}
                        {s.source_url ? (
                          <a href={s.source_url} target="_blank" rel="noopener noreferrer">{s.source}</a>
                        ) : (
                          s.source
                        )}
                      </span>
                    ))}
                  </p>
                )}
                <div className={styles.actions}>
                  {!mod.completed && (
                    <button
                      type="button"
                      className={styles.completeBtn}
                      disabled={completing === mod.id}
                      onClick={() => markComplete(mod.id)}
                    >
                      {completing === mod.id ? 'Sparar...' : 'Markera klar'}
                    </button>
                  )}
                  {mod.exerciseId && (
                    <Link href="/dashboard" className={styles.trainLink}>
                      Träna i appen <IconCaretRight size="sm" />
                    </Link>
                  )}
                  <Link
                    href={`/learn/quiz?dogId=${encodeURIComponent(dogId)}&contextKey=curr_${mod.id}&title=${encodeURIComponent(mod.title)}&body=${encodeURIComponent(mod.body.slice(0, 300))}&exerciseId=${mod.exerciseId ?? ''}`}
                    className={styles.quizLink}
                  >
                    Testa dig
                  </Link>
                </div>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
