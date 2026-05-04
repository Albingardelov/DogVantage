'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProfileGuard from '@/components/ProfileGuard'
import TrainingCard from '@/components/TrainingCard/TrainingCard'
import SessionLogForm from '@/components/SessionLogForm'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import { getDogProfile } from '@/lib/dog/profile'
import { getAgeInWeeks } from '@/lib/dog/age'
import { buildBehaviorContext } from '@/lib/dog/behavior'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import type { DogProfile, BehaviorProfile } from '@/types'
import styles from './page.module.css'

export default function DashboardPage() {
  return (
    <ProfileGuard>
      <Dashboard />
    </ProfileGuard>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'God natt!'
  if (hour < 11) return 'God morgon!'
  if (hour < 17) return 'God dag!'
  return 'God kväll!'
}

interface AgeAlert {
  title: string
  body: string
  tone: 'warning' | 'info'
}

interface ContextualTip {
  id: string
  title: string
  body: string
  learnId?: string // links to article on /learn
}

function getContextualTips(profile: DogProfile, ageWeeks: number): ContextualTip[] {
  const tips: ContextualTip[] = []
  const behavior = profile.assessment?.behaviorProfile as BehaviorProfile | undefined

  if (ageWeeks > 0 && ageWeeks < 16) {
    tips.push({
      id: 'socialization-window',
      title: 'Socialisationsfönstret stänger snart',
      body: `${profile.name} är under 16 veckor. Det här är den viktigaste perioden för positiv exponering — nya ljud, ytor, människor och miljöer. Varje positiv upplevelse nu bygger framtida trygghet.`,
      learnId: 'stress-signals',
    })
  }

  if (behavior?.leashBehavior === 'pulls_hard_reactive') {
    tips.push({
      id: 'reactive-stress',
      title: 'Reaktiv hund — se upp för stresssignaler',
      body: 'Din hunds profil visar reaktivitet i koppel. Lär dig känna igen stresssignaler tidigt — gäspning, slickar sig om nosen, vänder bort — så du kan öka avstånd innan hunden passerar sin tröskel.',
      learnId: 'over-threshold',
    })
  }

  if (behavior?.newEnvironmentReaction === 'avoidant') {
    tips.push({
      id: 'avoidant-tips',
      title: 'Känslig för nya miljöer',
      body: `${profile.name} tenderar att dra sig undan i nya miljöer. Starta alltid träning på lättaste kriterienivå när ni byter plats, och låt hunden alltid välja avstånd till det som verkar läskigt.`,
      learnId: 'generalization',
    })
  }

  if (behavior && behavior.triggers.length >= 3) {
    tips.push({
      id: 'many-triggers',
      title: 'Flera triggrar — prioritera ett i taget',
      body: 'Din hunds profil visar reaktivitet mot flera stimuli. Välj en trigger att jobba med åt gången. Framsteg på ett område ger ofta positiv spridning till andra.',
      learnId: 'over-threshold',
    })
  }

  if (
    profile.assessment?.status === 'completed' &&
    profile.assessment?.behaviorProfile?.trainingBackground === 'beginner'
  ) {
    tips.push({
      id: 'timing-tip',
      title: 'Det viktigaste en nybörjare kan lära sig',
      body: 'Timing — att belöna i exakt rätt ögonblick — har mer effekt på inlärningen än val av övning, belöningstyp eller hur länge du tränar. Läs guiden om timing.',
      learnId: 'timing',
    })
  }

  return tips
}

function getAgeAlert(ageWeeks: number): AgeAlert | null {
  if (ageWeeks >= 14 && ageWeeks <= 20) {
    return {
      title: 'Rädsloperiod pågår (v. 14–20)',
      body: 'Hundar kan bli mer försiktiga och reaktiva just nu — det är normalt. Undvik att pressa på svåra situationer. Positiva, lugna exponeringar är viktigare än att avancera.',
      tone: 'warning',
    }
  }
  if (ageWeeks >= 26 && ageWeeks <= 52) {
    return {
      title: 'Puberteten är här (6–12 mån)',
      body: 'Det är normalt att tidigare inlärda beteenden verkar försvinna eller bli opålitliga nu. Gå tillbaka till enklare kriterier, korta pass, och belöna generöst. Regressionen är tillfällig.',
      tone: 'info',
    }
  }
  return null
}

function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<DogProfile | null>(null)
  const [showLogForm, setShowLogForm] = useState(false)
  const [dismissedTips, setDismissedTips] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissedTips') ?? '[]')
    } catch { return [] }
  })

  const ageWeeks = profile ? Math.max(1, getAgeInWeeks(profile.birthdate)) : 0
  const trainingWeek = profile?.trainingWeek ?? 1

  useEffect(() => {
    let alive = true
    ;(async () => {
      const p = await getDogProfile()
      if (alive) setProfile(p)
    })().catch((e) => console.error('[dashboard getDogProfile]', e))
    return () => { alive = false }
  }, [])

  function handleLogSaved() {
    setShowLogForm(false)
  }

  function dismissTip(id: string) {
    const next = [...dismissedTips, id]
    setDismissedTips(next)
    localStorage.setItem('dismissedTips', JSON.stringify(next))
  }

  const dogName = profile?.name ?? '…'
  const needsAssessment = Boolean(profile) && (profile?.assessment?.status ?? 'not_started') !== 'completed' && ageWeeks >= 26
  const ageAlert = profile ? getAgeAlert(ageWeeks) : null
  const contextualTips = profile
    ? getContextualTips(profile, ageWeeks).filter((t) => !dismissedTips.includes(t.id))
    : []

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.decorCircle} aria-hidden="true" />
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <span className={styles.greeting}>{getGreeting()}</span>
            <h1 className={styles.dogName}>{dogName}</h1>
            <Link href="/calendar" className={styles.weekBadge}>
              <span aria-hidden="true">🗓️</span> Programvecka {trainingWeek}
              <span className={styles.weekBadgeArrow} aria-hidden="true">›</span>
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={async () => {
                try {
                  await getSupabaseBrowser().auth.signOut()
                } finally {
                  router.replace('/')
                }
              }}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.35)',
                color: '#fff',
                padding: '8px 10px',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
              aria-label="Logga ut"
            >
              Logga ut
            </button>
            <button
              type="button"
              onClick={() => router.push('/profile')}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '50%' }}
              aria-label="Öppna profil"
            >
              <Avatar name={dogName} size={64} />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.scrollArea}>
        {ageAlert && (
          <div className={`${styles.ageAlert} ${ageAlert.tone === 'warning' ? styles.ageAlertWarning : styles.ageAlertInfo}`}>
            <p className={styles.ageAlertTitle}>{ageAlert.title}</p>
            <p className={styles.ageAlertBody}>{ageAlert.body}</p>
          </div>
        )}

        {contextualTips.map((tip) => (
          <div key={tip.id} className={styles.tipCard}>
            <div className={styles.tipContent}>
              <p className={styles.tipTitle}>{tip.title}</p>
              <p className={styles.tipBody}>{tip.body}</p>
              {tip.learnId && (
                <Link href={`/learn`} className={styles.tipLink}>
                  Läs guiden ›
                </Link>
              )}
            </div>
            <button
              type="button"
              className={styles.tipDismiss}
              onClick={() => dismissTip(tip.id)}
              aria-label="Stäng tips"
            >
              ×
            </button>
          </div>
        ))}

        {needsAssessment && (
          <button
            className={styles.logCta}
            onClick={() => (window.location.href = '/assessment')}
            type="button"
          >
            <span aria-hidden="true">🧪</span>
            <span>Gör snabb screening (10–12 min)</span>
          </button>
        )}
        {profile && (
          <TrainingCard
            trainingWeek={trainingWeek}
            ageWeeks={ageWeeks}
            breed={profile.breed}
            dogName={dogName}
            dogKey={profile.dogKey ?? 'default'}
            goals={profile.onboarding?.goals}
            environment={profile.onboarding?.environment}
            rewardPreference={profile.onboarding?.rewardPreference}
            takesRewardsOutdoors={profile.onboarding?.takesRewardsOutdoors}
            behaviorContext={buildBehaviorContext(profile)}
          />
        )}

        <div className={styles.statsGrid}>
          <StatCard label="Pass loggade" value="3" sub="denna vecka" tone="primary" />
          <StatCard label="Snittbetyg" value="4.2" sub="fokus & lydnad" tone="accent" />
        </div>

        {!showLogForm ? (
          <button
            className={styles.logCta}
            onClick={() => setShowLogForm(true)}
            type="button"
          >
            <span aria-hidden="true">✍️</span>
            <span>Logga träningspass</span>
          </button>
        ) : (
          profile && (
            <SessionLogForm
              breed={profile.breed}
              weekNumber={trainingWeek}
              onSaved={handleLogSaved}
              onCancel={() => setShowLogForm(false)}
            />
          )
        )}
      </div>

      <BottomNav active="dashboard" />
    </main>
  )
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub: string
  tone: 'primary' | 'accent'
}) {
  return (
    <div className={styles.statCard}>
      <span className={`${styles.statValue} ${tone === 'accent' ? styles.statValueAccent : ''}`}>
        {value}
      </span>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statSub}>{sub}</span>
    </div>
  )
}
