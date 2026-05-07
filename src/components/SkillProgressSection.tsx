'use client'

import { useEffect, useState } from 'react'
import type { Breed } from '@/types'
import type { SkillProgress } from '@/lib/training/skill-progress'
import styles from './SkillProgressSection.module.css'

interface Props {
  breed: Breed
  dogId: string
  weeks?: number
}

interface Response {
  exercises: SkillProgress[]
}

export default function SkillProgressSection({ breed, dogId, weeks = 4 }: Props) {
  const [data, setData] = useState<SkillProgress[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!dogId) return
    let alive = true
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const params = new URLSearchParams({ breed, dogId, weeks: String(weeks) })
        const res = await fetch(`/api/training/skill-progress?${params}`)
        const body = (await res.json()) as Response | { error: string }
        if (!alive) return
        if (!res.ok || 'error' in body) {
          setError('error' in body ? body.error : `Fel ${res.status}`)
          setData(null)
        } else {
          setData(body.exercises)
        }
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : 'Nätverksfel')
          setData(null)
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [breed, dogId, weeks])

  if (loading) {
    return (
      <section className={styles.section} aria-busy="true">
        <h2 className={styles.title}>Färdigheter senaste {weeks} veckorna</h2>
        <p className={styles.muted}>Laddar…</p>
      </section>
    )
  }

  if (error) return null
  if (!data || data.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>Färdigheter senaste {weeks} veckorna</h2>
        <p className={styles.muted}>
          Inga övningsmätningar ännu. Logga lyckade och misslyckade reps i övningarna så ser du trender här.
        </p>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Färdigheter senaste {weeks} veckorna</h2>
      <ul className={styles.list}>
        {data.map((skill) => (
          <SkillRow key={skill.exercise_id} skill={skill} />
        ))}
      </ul>
    </section>
  )
}

function SkillRow({ skill }: { skill: SkillProgress }) {
  const ratePct = Math.round(skill.overall_success_rate * 100)
  const deltaPct = skill.delta === null ? null : Math.round(skill.delta * 100)
  const deltaTone = deltaPct === null ? 'neutral' : deltaPct > 2 ? 'up' : deltaPct < -2 ? 'down' : 'neutral'

  return (
    <li className={styles.row}>
      <div className={styles.rowHeader}>
        <span className={styles.rowName}>{skill.label}</span>
        <span className={styles.rowRate}>{ratePct}%</span>
      </div>
      <div className={styles.rowBody}>
        <Sparkline weeks={skill.weeks} />
        <div className={styles.rowMeta}>
          <span className={styles.attempts}>{skill.total_attempts} repetitioner</span>
          {deltaPct !== null && (
            <span className={`${styles.deltaBadge} ${styles[`delta_${deltaTone}`]}`}>
              {deltaPct > 0 ? `↑ +${deltaPct}p` : deltaPct < 0 ? `↓ ${deltaPct}p` : '= 0p'}
            </span>
          )}
        </div>
      </div>
    </li>
  )
}

function Sparkline({ weeks }: { weeks: SkillProgress['weeks'] }) {
  return (
    <div className={styles.spark} aria-hidden="true">
      {weeks.map((w) => {
        const h = w.success_rate === null ? 0 : Math.max(4, Math.round(w.success_rate * 100))
        const empty = w.attempts === 0
        return (
          <span
            key={w.week_start}
            className={`${styles.bar} ${empty ? styles.barEmpty : ''}`}
            style={{ height: `${empty ? 4 : h}%` }}
            title={`${w.week_start}: ${w.attempts} repetitioner`}
          />
        )
      })}
    </div>
  )
}
