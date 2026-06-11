// DashboardHeader — Variant B "Kompakt hjälte"
// Ersätter <header className={styles.header}>…</header>-blocket i
// src/app/dashboard/page.tsx (nuvarande rader ~292–345).
//
// Förutsätter att en fas-progress finns. ProgramWeekTimeline innehöll redan
// fas-namn/intervall/nästa-fas-logik — flytta DEN datan hit (props eller en
// liten hook), eller låt ProgramWeekTimeline exponera { phaseName, phasePct,
// weekRange, nextPhaseLabel, weeksToNext }. Värdena nedan är platshållare.

import { IconCalendar, IconCaretRight, IconCaretDown, IconSignOut } from '@/components/icons'
// Lägg till IconCaretDown + IconSignOut i src/components/icons/ui-icons.tsx:
//   export const IconCaretDown = makeIcon(CaretDown)
//   export const IconSignOut   = makeIcon(SignOut)
// (CaretDown, SignOut finns i @phosphor-icons/react)

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

// — inuti Dashboard(), ersätt header-blocket: —
<header className={styles.header}>
  <div className={styles.decorCircle} aria-hidden="true" />

  {/* Rad 1 */}
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
      <span className={styles.greeting}>{getGreeting()}</span>
      {/* DogSwitcher: rendera namnet som rubrik-knapp (se DogSwitcher-noten).
          Behåll komponenten — bara .chip-stilen ändras. */}
      <DogSwitcher onAddDog={() => {
        if (subscription.tier === 'pro' && subscription.isActive) setShowAddDog(true)
        else router.push('/profile?section=billing')
      }} />
    </div>

    {streak > 0 && (
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

  {/* Rad 2: fas-hjälte (ersätter <ProgramWeekTimeline/> + .weekBadge + .stat" här) */}
  <div className={styles.phase}>
    <div className={styles.phaseTop}>
      <div style={{ minWidth: 0 }}>
        <div className={styles.phaseOver}>NUVARANDE FAS</div>
        <div className={styles.phaseTitle}>{phaseName /* t.ex. "Grundläggande lydnad" */}</div>
      </div>
      <PhaseRing pct={phasePct /* 0..1 */} />
    </div>

    <Link href="/calendar" className={styles.weekLink}>
      <span className={styles.weekLeft}>
        <IconCalendar size="sm" /> Programvecka {trainingWeek} · v. {weekRange /* "10–16" */}
      </span>
      <IconCaretRight size="sm" />
    </Link>

    <div className={styles.phaseNext}>
      Nästa fas om {weeksToNext} v · {nextPhaseLabel}
    </div>
  </div>
</header>
