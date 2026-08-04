'use client'

import { useCallback, useEffect, useState } from 'react'
import { TRAINING_PROTOCOLS } from '@dogvantage/core'
import { IconTarget, IconCaretRight } from '@/components/icons'
import styles from './TrainingProjectCard.module.css'

export interface ProjectProgressDTO {
  currentPhase: number
  totalPhases: number
  completed: boolean
  phaseLabel: string
  achievedRungLabel: string | null
  nextStep: string | null
}

export interface ActiveProjectDTO {
  id: string
  protocolId: string
  label: string
  description: string
  primaryExerciseId: string
  supportExerciseIds: string[]
  exerciseIds: string[]
  startedAt: string
  progress: ProjectProgressDTO
}

interface Props {
  dogId: string
  /** Anropas när projektet startats/bytts/avslutats så att veckoplanen kan hämtas om. */
  onChanged?: () => void
}

export default function TrainingProjectCard({ dogId, onChanged }: Props) {
  const [project, setProject] = useState<ActiveProjectDTO | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [picking, setPicking] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/training/project?dogId=${encodeURIComponent(dogId)}`)
      if (!res.ok) return
      const body = (await res.json()) as { project: ActiveProjectDTO | null }
      setProject(body.project)
    } catch (e) {
      console.error('[project load]', e)
    } finally {
      setLoaded(true)
    }
  }, [dogId])

  useEffect(() => {
    setLoaded(false)
    setProject(null)
    setPicking(false)
    load()
  }, [load])

  async function start(protocolId: string) {
    setSaving(true)
    try {
      const res = await fetch('/api/training/project', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dogId, protocolId }),
      })
      if (res.ok) {
        const body = (await res.json()) as { project: ActiveProjectDTO }
        setProject(body.project)
        setPicking(false)
        onChanged?.()
      }
    } catch (e) {
      console.error('[project start]', e)
    } finally {
      setSaving(false)
    }
  }

  async function end(action: 'complete' | 'stop') {
    setSaving(true)
    try {
      const res = await fetch('/api/training/project', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dogId, action }),
      })
      if (res.ok) {
        setProject(null)
        onChanged?.()
      }
    } catch (e) {
      console.error('[project end]', e)
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return null

  if (!project || picking) {
    return (
      <section className={styles.card}>
        <div className={styles.headRow}>
          <IconTarget size="md" className={styles.headIcon} />
          <div>
            <p className={styles.title}>Vad vill du fixa just nu?</p>
            <p className={styles.sub}>Välj ett mål så byggs veckoschemat om runt det — varje dag.</p>
          </div>
        </div>
        <div className={styles.options}>
          {Object.values(TRAINING_PROTOCOLS).map((protocol) => (
            <button
              key={protocol.id}
              type="button"
              className={styles.option}
              onClick={() => start(protocol.id)}
              disabled={saving}
            >
              <span className={styles.optionLabel}>{protocol.label}</span>
              <span className={styles.optionDesc}>{protocol.description}</span>
            </button>
          ))}
        </div>
        {picking && project && (
          <button
            type="button"
            className={styles.textBtn}
            onClick={() => setPicking(false)}
            disabled={saving}
          >
            Behåll {project.label}
          </button>
        )}
      </section>
    )
  }

  const { progress } = project
  return (
    <section className={styles.card}>
      <div className={styles.headRow}>
        <IconTarget size="md" className={styles.headIcon} />
        <div style={{ minWidth: 0 }}>
          <p className={styles.overline}>Aktuellt träningsprojekt</p>
          <p className={styles.title}>{project.label}</p>
        </div>
      </div>

      <div className={styles.phaseBar} role="img" aria-label={`Fas ${progress.currentPhase} av ${progress.totalPhases}`}>
        {Array.from({ length: progress.totalPhases }, (_, i) => (
          <span
            key={i}
            className={`${styles.phaseSegment} ${
              i < progress.currentPhase - 1 || progress.completed
                ? styles.phaseDone
                : i === progress.currentPhase - 1
                  ? styles.phaseCurrent
                  : ''
            }`}
          />
        ))}
      </div>
      <p className={styles.phaseText}>
        Fas {progress.currentPhase} av {progress.totalPhases} · {progress.phaseLabel}
      </p>

      {progress.achievedRungLabel && (
        <p className={styles.achieved}>Klarar: {progress.achievedRungLabel}</p>
      )}

      {progress.completed ? (
        <div className={styles.doneBox}>
          <p className={styles.doneText}>
            Alla faser avklarade — snyggt jobbat! Markera projektet som slutfört och välj nästa mål.
          </p>
          <button type="button" className={styles.primaryBtn} onClick={() => end('complete')} disabled={saving}>
            Slutför projektet
          </button>
        </div>
      ) : (
        progress.nextStep && (
          <p className={styles.nextStep}>
            <span className={styles.nextStepLabel}>Nästa steg:</span> {progress.nextStep}
          </p>
        )
      )}

      <div className={styles.footer}>
        <button type="button" className={styles.textBtn} onClick={() => setPicking(true)} disabled={saving}>
          Byt mål <IconCaretRight size="sm" />
        </button>
        {!progress.completed && (
          <button type="button" className={styles.textBtnMuted} onClick={() => end('stop')} disabled={saving}>
            Avsluta utan mål
          </button>
        )}
      </div>
    </section>
  )
}
