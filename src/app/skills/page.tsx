'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProfileGuard from '@/components/ProfileGuard'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import SkillProgressSection from '@/components/SkillProgressSection'
import { useActiveDog } from '@/lib/dog/active-dog-context'
import { MAX_WEEKLY_PRIORITY_EXERCISES } from '@/lib/training/weekly-focus'
import styles from './page.module.css'

export default function SkillsPage() {
  return (
    <ProfileGuard>
      <SkillsView />
    </ProfileGuard>
  )
}

function SkillsView() {
  const { activeDog: profile } = useActiveDog()
  const dogId = profile?.id ?? null
  const breed = profile?.breed ?? null
  const dogName = profile?.name ?? 'Din hund'
  const [priorityExerciseIds, setPriorityExerciseIds] = useState<string[]>([])
  const [focusWeek, setFocusWeek] = useState<string | null>(null)

  useEffect(() => {
    if (!dogId) return
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/api/training/focus?dogId=${encodeURIComponent(dogId)}`)
        if (!res.ok) return
        const body = (await res.json()) as { isoWeek?: string; exerciseIds?: string[] }
        if (!alive) return
        setPriorityExerciseIds(Array.isArray(body.exerciseIds) ? body.exerciseIds : [])
        setFocusWeek(typeof body.isoWeek === 'string' ? body.isoWeek : null)
      } catch (err) {
        console.error('[skills priorities load]', err)
      }
    })()
    return () => { alive = false }
  }, [dogId])

  async function togglePriority(exerciseId: string) {
    if (!dogId) return
    const isSelected = priorityExerciseIds.includes(exerciseId)
    if (!isSelected && priorityExerciseIds.length >= MAX_WEEKLY_PRIORITY_EXERCISES) return
    const next = isSelected
      ? priorityExerciseIds.filter((id) => id !== exerciseId)
      : [...priorityExerciseIds, exerciseId]
    setPriorityExerciseIds(next)
    try {
      const res = await fetch('/api/training/focus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dogId, exerciseIds: next }),
      })
      if (!res.ok) return
      const body = (await res.json()) as { isoWeek?: string; exerciseIds?: string[] }
      setPriorityExerciseIds(Array.isArray(body.exerciseIds) ? body.exerciseIds : next)
      if (typeof body.isoWeek === 'string') setFocusWeek(body.isoWeek)
    } catch (err) {
      console.error('[skills priorities save]', err)
    }
  }

  async function setPriorities(exerciseIds: string[]) {
    if (!dogId) return
    const next = exerciseIds.slice(0, MAX_WEEKLY_PRIORITY_EXERCISES)
    setPriorityExerciseIds(next)
    try {
      const res = await fetch('/api/training/focus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dogId, exerciseIds: next }),
      })
      if (!res.ok) return
      const body = (await res.json()) as { isoWeek?: string; exerciseIds?: string[] }
      setPriorityExerciseIds(Array.isArray(body.exerciseIds) ? body.exerciseIds : next)
      if (typeof body.isoWeek === 'string') setFocusWeek(body.isoWeek)
    } catch (err) {
      console.error('[skills priorities save batch]', err)
    }
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Avatar name={dogName} size={36} bordered={false} />
          <div className={styles.headerText}>
            <h1 className={styles.title}>Färdigheter</h1>
            <span className={styles.subtitle}>Alla övningar, nuvarande nivå och resultat per miljö</span>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <Link href="/log" className={styles.historyLink}>
          Öppna passhistorik
        </Link>
        {focusWeek && (
          <p className={styles.weekHint}>Prioriteringar gäller för {focusWeek}</p>
        )}
        {dogId && breed && (
          <SkillProgressSection
            breed={breed}
            dogId={dogId}
            weeks={8}
            title="Övningsöversikt senaste 8 veckorna"
            showSearch
            showEnvironmentBreakdown
            priorityExerciseIds={priorityExerciseIds}
            onTogglePriority={togglePriority}
            onSetPriorities={setPriorities}
            maxPriorities={MAX_WEEKLY_PRIORITY_EXERCISES}
          />
        )}
      </div>

      <BottomNav active="skills" />
    </main>
  )
}
