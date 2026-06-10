'use client'

import { useEffect, useRef, useState } from 'react'
import type { Breed } from '@/types'
import type { SkillEnvironment, SkillProgress } from '@/lib/training/skill-progress'
import { MAX_WEEKLY_PRIORITY_EXERCISES } from '@/lib/training/weekly-focus'
import styles from './SkillProgressSection.module.css'

interface Props {
  breed: Breed
  dogId: string
  weeks?: number
  title?: string
  limit?: number
  showSearch?: boolean
  showEnvironmentBreakdown?: boolean
  priorityExerciseIds?: string[]
  onTogglePriority?: (exerciseId: string) => void
  onSetPriorities?: (exerciseIds: string[]) => void
  maxPriorities?: number
}

interface Response {
  exercises: SkillProgress[]
}

const ENVIRONMENT_LABELS: Record<SkillEnvironment, string> = {
  home: 'Hemma',
  outdoor: 'Utomhus',
  park: 'Park',
  mixed: 'Blandat',
}

export default function SkillProgressSection({
  breed,
  dogId,
  weeks = 4,
  title = `Färdigheter senaste ${weeks} veckorna`,
  limit,
  showSearch = false,
  showEnvironmentBreakdown = false,
  priorityExerciseIds = [],
  onTogglePriority,
  onSetPriorities,
  maxPriorities = MAX_WEEKLY_PRIORITY_EXERCISES,
}: Props) {
  const [data, setData] = useState<SkillProgress[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [environmentFilter, setEnvironmentFilter] = useState<'all' | SkillEnvironment>('all')
  const [legendOpen, setLegendOpen] = useState<'priority' | 'focus' | 'weak' | null>(null)
  const legendRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!legendRef.current) return
      if (!legendRef.current.contains(event.target as Node)) {
        setLegendOpen(null)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  if (loading) {
    return (
      <section className={styles.section} aria-busy="true">
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.muted}>Laddar…</p>
      </section>
    )
  }

  if (error) return null
  if (!data || data.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.muted}>
          Inga övningsmätningar ännu. Logga lyckade och misslyckade reps i övningarna så ser du trender här.
        </p>
      </section>
    )
  }

  const normalizedQuery = query.trim().toLowerCase()
  const filtered = data
    .filter((skill) =>
      normalizedQuery.length === 0
        ? true
        : skill.label.toLowerCase().includes(normalizedQuery) ||
          (skill.latest_criteria_level_label ?? '').toLowerCase().includes(normalizedQuery),
    )
    .filter((skill) =>
      environmentFilter === 'all'
        ? true
        : skill.environments.some((env) => env.environment === environmentFilter),
    )
    .sort((a, b) => {
      if (environmentFilter === 'all') {
        return a.overall_success_rate - b.overall_success_rate || b.total_attempts - a.total_attempts
      }
      const rateFor = (skill: SkillProgress): number => {
        const env = skill.environments.find((e) => e.environment === environmentFilter)
        return env?.success_rate ?? Number.POSITIVE_INFINITY
      }
      return rateFor(a) - rateFor(b) || b.total_attempts - a.total_attempts
    })
  const visible = typeof limit === 'number' ? filtered.slice(0, Math.max(1, limit)) : filtered

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      {showSearch && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.search}
          placeholder="Sök övning eller nivå"
          aria-label="Sök färdigheter"
        />
      )}
      {onTogglePriority && (
        <p className={styles.priorityHint}>
          Prioriterade: {priorityExerciseIds.length}/{maxPriorities}
        </p>
      )}
      {onSetPriorities && (
        <button
          type="button"
          className={styles.autoPriorityBtn}
          onClick={() => onSetPriorities(visible.slice(0, maxPriorities).map((s) => s.exercise_id))}
        >
          Prioritera {maxPriorities} svagaste
        </button>
      )}
      <div ref={legendRef}>
        <div className={styles.badgeLegend}>
          <button
            type="button"
            className={`${styles.badgeLegendItem} ${styles.badgePriority}`}
            onClick={() => setLegendOpen((prev) => prev === 'priority' ? null : 'priority')}
          >
            Prioriterad
          </button>
          <button
            type="button"
            className={`${styles.badgeLegendItem} ${styles.badgeFocus}`}
            onClick={() => setLegendOpen((prev) => prev === 'focus' ? null : 'focus')}
          >
            Veckofokus
          </button>
          <button
            type="button"
            className={`${styles.badgeLegendItem} ${styles.badgeWeak}`}
            onClick={() => setLegendOpen((prev) => prev === 'weak' ? null : 'weak')}
          >
            Svag färdighet
          </button>
        </div>
        {legendOpen && (
          <p className={styles.legendHelp}>
            {legendOpen === 'priority'
              ? 'Prioriterad: du har aktivt valt att denna övning ska synas mer i veckoplanen.'
              : legendOpen === 'focus'
                ? 'Veckofokus: övningen matchar ditt valda fokusområde för veckan.'
                : 'Svag färdighet: senaste träningsdata visar låg träffsäkerhet, så nivån hålls eller sänks.'}
          </p>
        )}
      </div>
      <div className={styles.filters}>
        <button
          type="button"
          className={`${styles.filterChip} ${environmentFilter === 'all' ? styles.filterChipActive : ''}`}
          onClick={() => setEnvironmentFilter('all')}
        >
          Alla miljöer
        </button>
        {(Object.keys(ENVIRONMENT_LABELS) as SkillEnvironment[]).map((env) => (
          <button
            key={env}
            type="button"
            className={`${styles.filterChip} ${environmentFilter === env ? styles.filterChipActive : ''}`}
            onClick={() => setEnvironmentFilter(env)}
          >
            {ENVIRONMENT_LABELS[env]}
          </button>
        ))}
      </div>
      <p className={styles.sortHint}>Sortering: svagaste först</p>
      {visible.length === 0 && (
        <p className={styles.muted}>Ingen övning matchar din sökning ännu.</p>
      )}
      <ul className={styles.list}>
        {visible.map((skill) => (
          <SkillRow
            key={skill.exercise_id}
            skill={skill}
            showEnvironmentBreakdown={showEnvironmentBreakdown}
            isPrioritized={priorityExerciseIds.includes(skill.exercise_id)}
            maxPriorities={maxPriorities}
            priorityCount={priorityExerciseIds.length}
            onTogglePriority={onTogglePriority}
          />
        ))}
      </ul>
    </section>
  )
}

function SkillRow({
  skill,
  showEnvironmentBreakdown,
  isPrioritized,
  maxPriorities,
  priorityCount,
  onTogglePriority,
}: {
  skill: SkillProgress
  showEnvironmentBreakdown: boolean
  isPrioritized: boolean
  maxPriorities: number
  priorityCount: number
  onTogglePriority?: (exerciseId: string) => void
}) {
  const ratePct = Math.round(skill.overall_success_rate * 100)
  const deltaPct = skill.delta === null ? null : Math.round(skill.delta * 100)
  const deltaTone = deltaPct === null ? 'neutral' : deltaPct > 2 ? 'up' : deltaPct < -2 ? 'down' : 'neutral'
  const canPrioritize = isPrioritized || priorityCount < maxPriorities

  return (
    <li className={styles.row}>
      <div className={styles.rowHeader}>
        <span className={styles.rowName}>{skill.label}</span>
        <div className={styles.rowHeaderRight}>
          <span className={styles.rowRate}>{ratePct}%</span>
          {onTogglePriority && (
            <button
              type="button"
              onClick={() => onTogglePriority(skill.exercise_id)}
              disabled={!canPrioritize}
              aria-pressed={isPrioritized}
              className={`${styles.priorityBtn} ${isPrioritized ? styles.priorityBtnActive : ''}`}
            >
              {isPrioritized ? 'Prioriterad' : 'Prioritera'}
            </button>
          )}
        </div>
      </div>
      <div className={styles.rowBody}>
        <Sparkline weeks={skill.weeks} />
        <div className={styles.rowMeta}>
          <span className={styles.attempts}>{skill.total_attempts} repetitioner</span>
          {skill.latest_criteria_level_label && (
            <span className={styles.levelBadge}>Nu: {skill.latest_criteria_level_label}</span>
          )}
          {deltaPct !== null && (
            <span className={`${styles.deltaBadge} ${styles[`delta_${deltaTone}`]}`}>
              {deltaPct > 0 ? `↑ +${deltaPct}p` : deltaPct < 0 ? `↓ ${deltaPct}p` : '= 0p'}
            </span>
          )}
        </div>
      </div>
      {showEnvironmentBreakdown && skill.environments.length > 0 && (
        <div className={styles.environments}>
          {skill.environments.map((env) => {
            const rate = env.success_rate === null ? '—' : `${Math.round(env.success_rate * 100)}%`
            return (
              <span key={env.environment} className={styles.environmentBadge}>
                {ENVIRONMENT_LABELS[env.environment]}: {rate} ({env.attempts})
              </span>
            )
          })}
        </div>
      )}
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
