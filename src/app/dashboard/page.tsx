'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ProfileGuard from '@/components/ProfileGuard'
import TrainingCard from '@/components/TrainingCard/TrainingCard'
import PuppyDayCard from '@/components/PuppyDayCard/PuppyDayCard'
import SessionLogForm from '@/components/SessionLogForm'
import Avatar from '@/components/Avatar'
import BottomNav from '@/components/BottomNav'
import LearningChecklistCard from '@/components/LearningChecklistCard'
import MicroLessonCard from '@/components/MicroLessonCard'
import InsightCard from '@/components/InsightCard/InsightCard'
import TrainingProjectCard from '@/components/TrainingProjectCard/TrainingProjectCard'
import DogSwitcher from '@/components/DogSwitcher'
import AddDogModal from '@/components/AddDogModal'
import StreakBadge from '@/components/StreakBadge'
import { useActiveDog } from '@/lib/dog/active-dog-context'
import { useSubscription } from '@/lib/billing/subscription-context'
import { getAgeInWeeks, daysUntilHomecoming, isPuppy, isPuppyMode } from '@/lib/dog/age'
import ProgramWeekTimeline, { getPhaseInfo } from '@/components/ProgramWeekTimeline/ProgramWeekTimeline'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import { getHandlerFeedbackTip, type HandlerFeedbackTip } from '@/lib/training/handler-feedback'
import { computeStreak } from '@/lib/training/streak'
import { apiFetch } from '@/lib/api/fetch'
import { SessionLogArraySchema, TrainingDaysResponseSchema } from '@/types/api/schemas'
import {
  IconCalendar,
  IconCaretRight,
  IconClose,
  IconFlask,
  IconPaw,
  IconPencil,
  IconSignOut,
} from '@/components/icons'
import type { DogProfile, BehaviorProfile, SessionLog } from '@/types'
import styles from './page.module.css'

export default function DashboardPage() {
  return (
    <ProfileGuard>
      <Dashboard />
    </ProfileGuard>
  )
}

function getGreetingKey(): 'night' | 'morning' | 'day' | 'evening' {
  const hour = new Date().getHours()
  if (hour < 5) return 'night'
  if (hour < 11) return 'morning'
  if (hour < 17) return 'day'
  return 'evening'
}

function PhaseRing({ pct }: { pct: number }) {
  const r = 19
  const c = 2 * Math.PI * r
  return (
    <div className={styles.ring}>
      <svg width={46} height={46} className={styles.ringSvg}>
        <circle className={styles.ringTrack} cx={23} cy={23} r={r} fill="none" strokeWidth={5} />
        <circle className={styles.ringFill} cx={23} cy={23} r={r} fill="none" strokeWidth={5}
          strokeDasharray={`${c * pct} ${c}`} />
      </svg>
      <span className={styles.ringPct}>{Math.round(pct * 100)}%</span>
    </div>
  )
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

interface ProgressionHint {
  exerciseId: string
  label: string
  decision: 'advance' | 'hold' | 'regress'
  reason: string
  attempts: number
  successRate: number
  criteriaLevelId: string | null
}

function getContextualTips(profile: DogProfile, ageWeeks: number): ContextualTip[] {
  const tips: ContextualTip[] = []
  const behavior = profile.assessment?.behaviorProfile as BehaviorProfile | undefined
  // trainingBackground is captured at onboarding now — fall back to assessment if not set there
  const trainingBackground = profile.onboarding?.trainingBackground ?? behavior?.trainingBackground
  const isBeginner = trainingBackground === 'beginner'
  const puppy = isPuppy(ageWeeks)

  if (isBeginner && puppy) {
    tips.push({
      id: 'puppy-fundamentals',
      title: `Valpens grundbehov — börja här med ${profile.name}`,
      body: 'Rastning, bett-hämning, box-träning och ensam-träning är viktigare än formella övningar de första veckorna. Bygg rutinerna nu — utan dem fungerar inget annat. Läs guiderna och lägg till övningarna i schemat.',
      learnId: 'rastning',
    })
  }

  if (puppy) {
    tips.push({
      id: 'puppy-sleep',
      title: 'Valpen behöver 18 timmar sömn per dygn',
      body: `${profile.name} ska sova ca 18 h/dygn. För lite vila → överstimulering, bett-attacker, oförmåga att lära sig. Lägg in 1–2 h vila mellan varje aktivitet, gärna i bur/box. Sömnig valp lär sig, trött valp biter.`,
      learnId: 'puppy-sleep',
    })
  }

  if (puppy) {
    tips.push({
      id: 'socialization-window',
      title: 'Socialisationsfönstret stänger snart',
      body: `${profile.name} är under 16 veckor. Det här är den viktigaste perioden för positiv exponering — nya ljud, ytor, människor och miljöer. Varje positiv upplevelse nu bygger framtida trygghet.`,
      learnId: 'socialization-window',
    })
  }

  if (behavior?.leashBehavior === 'pulls_hard_reactive') {
    tips.push({
      id: 'reactive-stress',
      title: 'Reaktiv hund — börja här',
      body: `${profile.name} är reaktiv på koppel. Tre saker att läsa innan ni går ut: Threshold (när hunden slutar tänka), Look At That (träna automatisk uppmärksamhet) och Trigger stacking (varför ${profile.name} verkar bli värre vissa dagar). LAT är nu tillgänglig som övning i veckoschemat.`,
      learnId: 'lat-method',
    })
    tips.push({
      id: 'trigger-stacking',
      title: 'Trigger stacking — schemalägg återhämtning',
      body: 'Cortisol tar dagar att brytas ned. Efter en intensiv trigger-dag → 1–2 lugna dagar med bara sniff-promenader. Aldrig två LAT-pass i rad mot olika triggers.',
      learnId: 'trigger-stacking',
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

  if (isBeginner) {
    tips.push({
      id: 'timing-tip',
      title: 'Det viktigaste en nybörjare kan lära sig',
      body: 'Timing — att belöna i exakt rätt ögonblick — har mer effekt på inlärningen än val av övning, belöningstyp eller hur länge du tränar. Läs guiden om timing.',
      learnId: 'timing',
    })
  }

  return tips
}

function toLocalDateString(ms: number): string {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Innevarande kalendervecka: måndag 00:00 – söndag 23:59 (lokal tid). */
function getWeekRangeMs(now = new Date()): { start: number; end: number } {
  const d = new Date(now)
  const dow = d.getDay()
  const offsetToMonday = dow === 0 ? -6 : 1 - dow
  const start = new Date(d)
  start.setDate(d.getDate() + offsetToMonday)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return { start: start.getTime(), end: end.getTime() }
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
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeDog: profile } = useActiveDog()
  const { state: subscription } = useSubscription()
  const [showLogForm, setShowLogForm] = useState(false)
  const [showAddDog, setShowAddDog] = useState(false)
  const [dismissedTips, setDismissedTips] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissedTips') ?? '[]')
    } catch { return [] }
  })
  const [weekStats, setWeekStats] = useState<{ count: number; avg: number | null } | null>(null)
  const [handlerTip, setHandlerTip] = useState<HandlerFeedbackTip | null>(null)
  const [heatState, setHeatState] = useState<{ isInHeat: boolean; skenfasActive: boolean } | null>(null)
  const [streak, setStreak] = useState<number | null>(null)
  const [progressionHints, setProgressionHints] = useState<ProgressionHint[]>([])
  // Bumpas när träningsprojektet ändras så att TrainingCard hämtar om veckoplanen.
  const [projectVersion, setProjectVersion] = useState(0)

  const ageWeeks = profile ? Math.max(1, getAgeInWeeks(profile.birthdate)) : 0
  const homecomeDate = profile?.onboarding?.homecomeDate
  const daysUntilHome = homecomeDate ? daysUntilHomecoming(homecomeDate) : null
  const beforeHomecoming = daysUntilHome !== null && daysUntilHome > 0
  const trainingWeek = profile?.trainingWeek ?? 1

  const refreshWeekStats = useCallback(async () => {
    if (!profile?.id) return
    try {
      const { start, end } = getWeekRangeMs()
      const logParams = new URLSearchParams({
        dogId: profile.id,
        from: new Date(start).toISOString(),
        to: new Date(end).toISOString(),
      })
      const dayParams = new URLSearchParams({
        dogId: profile.id,
        from: toLocalDateString(start),
        to: toLocalDateString(end - 1),
      })
      const [weekLogs, activity] = await Promise.all([
        apiFetch(`/api/logs?${logParams}`, SessionLogArraySchema),
        apiFetch(`/api/training/metrics?${dayParams}`, TrainingDaysResponseSchema)
          .catch(() => ({ days: [] as string[] })),
      ])
      const trainedDays = new Set(activity.days)
      for (const log of weekLogs) trainedDays.add(toLocalDateString(new Date(log.created_at).getTime()))
      const count = trainedDays.size
      const avg = weekLogs.length > 0
        ? weekLogs.reduce((acc, l) => acc + (l.focus + l.obedience) / 2, 0) / weekLogs.length
        : null
      setWeekStats({ count, avg })
    } catch (e) {
      console.error('[dashboard week stats]', e)
      setWeekStats({ count: 0, avg: null })
    }
  }, [profile?.id])

  const refreshHandlerTip = useCallback(async () => {
    if (!profile?.id || !profile?.name) return
    try {
      const params = new URLSearchParams({ dogId: profile.id, limit: '5' })
      const logs = await apiFetch(`/api/logs?${params}`, SessionLogArraySchema)
      setHandlerTip(getHandlerFeedbackTip(logs, profile.name))
    } catch (e) {
      console.error('[dashboard handler tip]', e)
      setHandlerTip(null)
    }
  }, [profile?.id, profile?.name])

  const refreshStreak = useCallback(async () => {
    if (!profile?.id) return
    try {
      const params = new URLSearchParams({ dogId: profile.id, limit: '500' })
      const logs = await apiFetch(`/api/logs?${params}`, SessionLogArraySchema)
      setStreak(computeStreak(logs))
    } catch (e) {
      console.error('[dashboard streak]', e)
      setStreak(0)
    }
  }, [profile?.id])

  const refreshProgressionHints = useCallback(async () => {
    if (!profile?.id || !profile?.breed) return
    try {
      const params = new URLSearchParams({
        dogId: profile.id,
        breed: profile.breed,
      })
      const res = await fetch(`/api/training/progression?${params}`)
      if (!res.ok) throw new Error('Kunde inte hämta progression')
      const data = await res.json() as { decisions?: ProgressionHint[] }
      setProgressionHints(data.decisions ?? [])
    } catch (e) {
      console.error('[dashboard progression]', e)
      setProgressionHints([])
    }
  }, [profile?.id, profile?.breed])

  useEffect(() => {
    if (!profile?.breed) {
      setWeekStats(null)
      setHandlerTip(null)
      setHeatState(null)
      setStreak(null)
      setProgressionHints([])
      return
    }
    setWeekStats(null)
    setStreak(null)
    setProgressionHints([])
    refreshWeekStats()
    refreshHandlerTip()
    refreshStreak()
    refreshProgressionHints()
    if (profile.id && profile.sex === 'female' && profile.castrationStatus === 'intact') {
      fetch(`/api/training/heat?dogId=${encodeURIComponent(profile.id)}`)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d) setHeatState({ isInHeat: d.isInHeat, skenfasActive: d.skenfasActive }) })
        .catch(() => {})
    } else {
      setHeatState(null)
    }
  }, [profile?.breed, profile?.id, profile?.sex, profile?.castrationStatus, refreshWeekStats, refreshHandlerTip, refreshStreak, refreshProgressionHints])

  useEffect(() => {
    if (searchParams.get('log') === '1') {
      setShowLogForm(true)
      document.getElementById('today-training')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [searchParams])

  function handleLogSaved() {
    setShowLogForm(false)
    refreshWeekStats()
    refreshHandlerTip()
    refreshStreak()
    refreshProgressionHints()
  }

  function dismissTip(id: string) {
    const next = [...dismissedTips, id]
    setDismissedTips(next)
    localStorage.setItem('dismissedTips', JSON.stringify(next))
  }

  const dogName = profile?.name ?? '…'
  const phaseInfo = getPhaseInfo(ageWeeks)
  const needsAssessment = Boolean(profile) && (profile?.assessment?.status ?? 'not_started') !== 'completed' && ageWeeks >= 26
  const ageAlert = profile ? getAgeAlert(ageWeeks) : null
  const contextualTips = profile
    ? getContextualTips(profile, ageWeeks).filter((t) => !dismissedTips.includes(t.id))
    : []
  const showHandlerTip = handlerTip && !dismissedTips.includes(handlerTip.id)
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.decorCircle} aria-hidden="true" />

        {/* Rad 1: avatar + hälsning/namn + streak + logga ut */}
        <div className={styles.idRow}>
          <button
            type="button"
            className={styles.avatarBtn}
            onClick={() => router.push('/profile')}
            aria-label="Öppna profil"
          >
            <Avatar name={dogName} dogId={profile?.id} size={50} />
          </button>

          <div className={styles.idText}>
            <span className={styles.greeting}>{t(`dashboard.greeting.${getGreetingKey()}`)}</span>
            <DogSwitcher onAddDog={() => {
              if (subscription.tier === 'pro' && subscription.isActive) setShowAddDog(true)
              else router.push('/profile?section=billing')
            }} />
          </div>

          {(streak ?? 0) > 0 && (
            <span className={styles.streakMini} aria-label={`${streak} dagar i rad`}>
              <IconPaw size="sm" /> {streak}
            </span>
          )}

          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Logga ut"
            title="Logga ut"
            onClick={async () => {
              try { await getSupabaseBrowser().auth.signOut() }
              finally { router.replace('/') }
            }}
          >
            <IconSignOut size="md" />
          </button>
        </div>

        {/* Rad 2: fas-hjälte */}
        {phaseInfo && (
          <div className={styles.phase}>
            <div className={styles.phaseTop}>
              <div style={{ minWidth: 0 }}>
                <div className={styles.phaseOver}>NUVARANDE FAS</div>
                <div className={styles.phaseTitle}>{phaseInfo.phaseName}</div>
              </div>
              <PhaseRing pct={phaseInfo.phasePct} />
            </div>

            <Link href="/calendar" className={styles.weekLink}>
              <span className={styles.weekLeft}>
                <IconCalendar size="sm" /> {t('dashboard.programWeek', { week: trainingWeek })} · v. {phaseInfo.weekRange}
              </span>
              <IconCaretRight size="sm" />
            </Link>

            {phaseInfo.nextPhaseLabel && phaseInfo.weeksToNext !== null && (
              <div className={styles.phaseNext}>
                Nästa fas om {phaseInfo.weeksToNext} v · {phaseInfo.nextPhaseLabel}
              </div>
            )}
          </div>
        )}
      </header>

      <div className={styles.scrollArea}>
        {profile?.id && !beforeHomecoming && !isPuppyMode(ageWeeks) && (
          <TrainingProjectCard
            dogId={profile.id}
            onChanged={() => setProjectVersion((v) => v + 1)}
          />
        )}

        <button
          className={styles.logCta}
          onClick={() => {
            document.getElementById('today-training')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
          type="button"
        >
          <IconPaw size="md" className={styles.logCtaIcon} />
          <span>Starta dagens pass</span>
        </button>

        {ageAlert && (
          <div className={`${styles.ageAlert} ${ageAlert.tone === 'warning' ? styles.ageAlertWarning : styles.ageAlertInfo}`}>
            <p className={styles.ageAlertTitle}>{ageAlert.title}</p>
            <p className={styles.ageAlertBody}>{ageAlert.body}</p>
          </div>
        )}

        {heatState?.isInHeat && (
          <div className={`${styles.ageAlert} ${styles.ageAlertWarning}`}>
            <p className={styles.ageAlertTitle}>Tiken löper just nu</p>
            <p className={styles.ageAlertBody}>Håll träningspassen korta (max 5 min), undvik socialisering med okända hundar och prioritera lugna inomhusövningar. Veckoplanen är anpassad.</p>
          </div>
        )}

        {heatState?.skenfasActive && !heatState.isInHeat && (
          <div className={`${styles.ageAlert} ${styles.ageAlertWarning}`}>
            <p className={styles.ageAlertTitle}>Skenfas-fönster (6–9 v efter löp)</p>
            <p className={styles.ageAlertBody}>Tiken kan visa beteendeförändringar — ökad distraktion, rastlöshet eller mild agitation. Håll lågstimulans-träning och prioritera plats och impulskontroll. Veckoplanen är anpassad.</p>
          </div>
        )}

        {showHandlerTip && handlerTip && (
          <div className={`${styles.tipCard} ${styles.tipCardHandler}`}>
            <div className={styles.tipContent}>
              <span className={styles.tipBadge}>För dig som förare</span>
              <p className={styles.tipTitle}>{handlerTip.title}</p>
              <p className={styles.tipBody}>{handlerTip.body}</p>
              <Link
                href={`/learn?article=${handlerTip.learnArticleId}`}
                className={styles.tipLink}
              >
                Läs guiden <IconCaretRight size="sm" className={styles.tipLinkIcon} />
              </Link>
            </div>
            <button
              type="button"
              className={styles.tipDismiss}
              onClick={() => dismissTip(handlerTip.id)}
              aria-label="Stäng tips"
            >
              <IconClose size="sm" />
            </button>
          </div>
        )}

        {contextualTips.map((tip) => (
          <div key={tip.id} className={styles.tipCard}>
            <div className={styles.tipContent}>
              <p className={styles.tipTitle}>{tip.title}</p>
              <p className={styles.tipBody}>{tip.body}</p>
              {tip.learnId && (
                <Link href={`/learn?article=${tip.learnId}`} className={styles.tipLink}>
                  Läs guiden <IconCaretRight size="sm" className={styles.tipLinkIcon} />
                </Link>
              )}
            </div>
            <button
              type="button"
              className={styles.tipDismiss}
              onClick={() => dismissTip(tip.id)}
              aria-label="Stäng tips"
            >
              <IconClose size="sm" />
            </button>
          </div>
        ))}

        {profile && (profile.trainingWeek ?? 1) <= 3 && <LearningChecklistCard />}

        {profile?.id && !beforeHomecoming && <MicroLessonCard dogId={profile.id} />}

        {needsAssessment && (
          <button
            className={styles.logCta}
            onClick={() => (window.location.href = '/assessment')}
            type="button"
          >
            <IconFlask size="md" className={styles.logCtaIcon} />
            <span>Starta nivåtest (10–12 min)</span>
          </button>
        )}
        <div id="today-training">
          {profile && beforeHomecoming ? (
            <div className={styles.countdownCard}>
            <div className={styles.countdownIcon}>
              <IconPaw size="xl" />
            </div>
            <p className={styles.countdownTitle}>
              {dogName} kommer hem om {daysUntilHome} {daysUntilHome === 1 ? 'dag' : 'dagar'}
            </p>
            <p className={styles.countdownBody}>
              Träningsschemat aktiveras automatiskt när hämtningsdatumet är inne.
              Vecka 1 börjar med ett anpassat ankomstprogram — inga krav, bara trygghet.
            </p>
            <div className={styles.countdownChecklist}>
              <p className={styles.countdownChecklistTitle}>Förberedelser att bocka av:</p>
              <ul className={styles.countdownChecklistItems}>
                <li>Kattens viloplats på annan våning/rum tillgänglig</li>
                <li>Valpsäker plats/hörna med bädd och vatten redo</li>
                <li>Lägg en filt/tröja nära kull ett dygn innan (tar hem din doft)</li>
                <li>Boka veterinärbesök inom 1–2 veckor</li>
              </ul>
            </div>
            </div>
          ) : profile ? (
            isPuppyMode(ageWeeks) ? (
              <PuppyDayCard
              trainingWeek={trainingWeek}
              ageWeeks={ageWeeks}
              breed={profile.breed}
              dogName={dogName}
              dogId={profile.id ?? ''}
              goals={profile.onboarding?.goals}
              environment={profile.onboarding?.environment}
              rewardPreference={profile.onboarding?.rewardPreference}
              takesRewardsOutdoors={profile.onboarding?.takesRewardsOutdoors}
              householdPets={profile.onboarding?.householdPets}
              />
            ) : (
              <TrainingCard
              key={projectVersion}
              trainingWeek={trainingWeek}
              ageWeeks={ageWeeks}
              breed={profile.breed}
              dogName={dogName}
              dogId={profile.id ?? ''}
              goals={profile.onboarding?.goals}
              environment={profile.onboarding?.environment}
              rewardPreference={profile.onboarding?.rewardPreference}
              takesRewardsOutdoors={profile.onboarding?.takesRewardsOutdoors}
              householdPets={profile.onboarding?.householdPets}
              />
            )
          ) : null}
        </div>

        {profile?.id && !beforeHomecoming && <InsightCard dogId={profile.id} />}

        {progressionHints.length > 0 && (
          <div className={styles.progressionCard}>
            <p className={styles.progressionTitle}>Nästa steg i progressionen</p>
            <div className={styles.progressionList}>
              {progressionHints.slice(0, 4).map((hint) => (
                <div key={`${hint.exerciseId}-${hint.criteriaLevelId ?? 'none'}`} className={styles.progressionItem}>
                  <span
                    className={`${styles.progressionBadge} ${
                      hint.decision === 'advance'
                        ? styles.progressionUp
                        : hint.decision === 'regress'
                          ? styles.progressionDown
                          : styles.progressionHold
                    }`}
                  >
                    {hint.decision === 'advance'
                      ? 'Höj ett steg'
                      : hint.decision === 'regress'
                        ? 'Sänk ett steg'
                        : 'Håll nivån'}
                  </span>
                  <p className={styles.progressionItemTitle}>{hint.label}</p>
                  <p className={styles.progressionReason}>{hint.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile && (
          <div className={styles.statsGrid}>
            <StatCard
              label="Träningsdagar"
              value={weekStats === null ? '…' : String(weekStats.count)}
              sub={t('dashboard.thisWeek')}
              tone="primary"
            />
            <StatCard
              label={t('dashboard.averageScore')}
              value={
                weekStats === null
                  ? '…'
                  : weekStats.avg === null
                    ? '—'
                    : weekStats.avg.toFixed(1)
              }
              sub="fokus & lydnad"
              tone="accent"
            />
          </div>
        )}

        {!showLogForm ? (
          <button
            className={styles.logCta}
            onClick={() => setShowLogForm(true)}
            type="button"
          >
            <IconPencil size="md" className={styles.logCtaIcon} />
            <span>{t('dashboard.logSession')}</span>
          </button>
        ) : (
          profile?.id && (
            <SessionLogForm
              dogId={profile.id}
              weekNumber={trainingWeek}
              onSaved={handleLogSaved}
              onCancel={() => setShowLogForm(false)}
            />
          )
        )}
      </div>

      <BottomNav active="dashboard" />
      {showAddDog && <AddDogModal onClose={() => setShowAddDog(false)} />}
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
