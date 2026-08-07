import { useMemo, useState, useCallback } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Link as RouterLink, router, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { daysUntilHomecoming } from '@dogvantage/core'
import { InsightCard } from '@/components/dashboard/InsightCard'
import { LearningChecklistCard } from '@/components/dashboard/LearningChecklistCard'
import { MicroLessonCard } from '@/components/dashboard/MicroLessonCard'
import { DayCheckInCard } from '@/components/training/DayCheckInCard'
import { ExerciseGuideModal } from '@/components/training/ExerciseGuideModal'
import { ExerciseRow } from '@/components/training/ExerciseRow'
import { HeatBanner } from '@/components/training/HeatBanner'
import { useInsight } from '@/hooks/use-insight'
import { useMicroLesson } from '@/hooks/use-micro-lesson'
import { useTrainingSession } from '@/hooks/use-training-session'
import { needsAssessment } from '@/lib/dog/active-dog'
import { colors, fontSize, space } from '@/theme/tokens'

const ZONE_LABEL = { green: 'Grön', yellow: 'Gul', red: 'Röd' } as const

export default function DashboardScreen() {
  const insets = useSafeAreaInsets()
  const {
    dog,
    today,
    progress,
    metrics,
    loading,
    error,
    referral,
    reload,
    logSuccess,
    logFail,
    checkIn,
    showCheckInCard,
    saveCheckIn,
    dismissCheckIn,
    scaleNote,
    heat,
    dogStateSummary,
  } = useTrainingSession()
  const [guideId, setGuideId] = useState<string | null>(null)
  const [guideLabel, setGuideLabel] = useState<string | null>(null)

  const homecomeDate = dog?.onboarding?.homecomeDate
  const daysUntilHome = homecomeDate ? daysUntilHomecoming(homecomeDate) : null
  const beforeHomecoming = daysUntilHome !== null && daysUntilHome > 0
  const showHomeCards = Boolean(dog?.id) && !beforeHomecoming

  const micro = useMicroLesson(dog?.id, showHomeCards)
  const insight = useInsight(dog?.id, showHomeCards)

  useFocusEffect(
    useCallback(() => {
      void reload()
      void micro.reload()
      void insight.reload()
    }, [reload, micro.reload, insight.reload]),
  )

  const exercises = today?.exercises ?? []
  const completedCount = useMemo(
    () => exercises.filter((ex) => (progress[ex.id] ?? 0) >= ex.reps).length,
    [exercises, progress],
  )
  const allDone = exercises.length > 0 && completedCount === exercises.length

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.lg }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void reload()} />}
      >
        <Text style={styles.eyebrow}>Hem</Text>
        <Text style={styles.title}>{dog ? `${dog.name}s träning` : 'Din träning'}</Text>
        {dog ? (
          <RouterLink href="/calendar" asChild>
            <Pressable style={styles.weekLink} accessibilityRole="link">
              <Text style={styles.meta}>
                Programvecka {dog.trainingWeek ?? 1} · {dog.ageWeeks} v
                {!today?.rest && exercises.length > 0
                  ? ` · ${completedCount}/${exercises.length} klara`
                  : ''}
              </Text>
              <Text style={styles.weekChevron}>Kalender →</Text>
            </Pressable>
          </RouterLink>
        ) : null}

        {dogStateSummary ? <Text style={styles.stateLine}>{dogStateSummary}</Text> : null}

        {needsAssessment(dog) ? (
          <Pressable
            style={styles.assessBanner}
            onPress={() => router.push('/assessment')}
            accessibilityRole="button"
          >
            <Text style={styles.assessTitle}>Starta nivåtest (10–12 min)</Text>
            <Text style={styles.assessBody}>
              Anpassa startvecka och rekommendationer efter hundens nivå.
            </Text>
          </Pressable>
        ) : null}

        {heat.eligible ? (
          <HeatBanner
            heat={heat.heat ?? { isInHeat: false, skenfasActive: false }}
            busy={heat.busy}
            onStart={() => void heat.start()}
            onEnd={() => void heat.end()}
          />
        ) : null}

        {dog && showCheckInCard ? (
          <DayCheckInCard
            dogName={dog.name}
            onSave={(v) => void saveCheckIn(v)}
            onDismiss={dismissCheckIn}
          />
        ) : null}

        {checkIn?.zone && !showCheckInCard ? (
          <Text style={styles.checkSummary}>
            Dagens form: {ZONE_LABEL[checkIn.zone]}
            {checkIn.handlerEnergy ? ` · energi ${checkIn.handlerEnergy}` : ''}
            {checkIn.minutesAvailable != null ? ` · ${checkIn.minutesAvailable} min` : ''}
          </Text>
        ) : null}

        {scaleNote ? <Text style={styles.scaleNote}>{scaleNote}</Text> : null}

        {dog && (dog.trainingWeek ?? 1) <= 3 ? <LearningChecklistCard /> : null}

        {showHomeCards && micro.lesson && dog?.id ? (
          <MicroLessonCard
            lesson={micro.lesson}
            dogId={dog.id}
            onDismiss={() => void micro.dismiss()}
          />
        ) : null}

        {loading && !today ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} />
        ) : null}

        {referral ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Behöver professionell hjälp</Text>
            <Text style={styles.desc}>{referral}</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !error && !referral && today?.rest ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vilodag</Text>
            <Text style={styles.desc}>
              {scaleNote ?? 'Idag är det återhämtning — ingen strukturerad träning.'}
            </Text>
          </View>
        ) : null}

        {!loading && !error && !referral && today && !today.rest ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Idag · {today.day}</Text>
            {allDone ? (
              <Text style={styles.doneBanner}>Klart för idag — bra jobbat!</Text>
            ) : null}
            {exercises.map((ex) => (
              <ExerciseRow
                key={ex.id}
                exercise={ex}
                done={progress[ex.id] ?? 0}
                metrics={metrics[ex.id]}
                onSuccess={() => void logSuccess(ex)}
                onFail={() => void logFail(ex)}
                onOpenGuide={() => {
                  setGuideId(ex.id)
                  setGuideLabel(ex.label)
                }}
              />
            ))}
            {exercises.length === 0 ? (
              <Text style={styles.desc}>Inga övningar planerade idag.</Text>
            ) : null}
          </View>
        ) : null}

        {showHomeCards && insight.copy ? (
          <InsightCard
            copy={insight.copy}
            busy={insight.busy}
            onPriority={() => void insight.makePriority()}
            onDismiss={() => void insight.dismiss()}
          />
        ) : null}

        <RouterLink href="/log" asChild>
          <Pressable style={styles.secondaryBtn}>
            <Text style={styles.secondaryLabel}>Logga pass</Text>
          </Pressable>
        </RouterLink>
        <RouterLink href="/profile" asChild>
          <Pressable style={styles.linkBtn}>
            <Text style={styles.linkLabel}>Profil / logga ut</Text>
          </Pressable>
        </RouterLink>
      </ScrollView>

      <ExerciseGuideModal
        exerciseId={guideId}
        exerciseLabel={guideLabel}
        visible={guideId != null}
        onClose={() => {
          setGuideId(null)
          setGuideLabel(null)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.xl, paddingBottom: space.xxl },
  eyebrow: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: space.xs },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
  weekLink: {
    marginTop: space.xs,
    marginBottom: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    flexShrink: 1,
  },
  weekChevron: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  stateLine: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: space.md,
  },
  assessBanner: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: space.lg,
    marginBottom: space.lg,
  },
  assessTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.primary },
  assessBody: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: space.xs },
  checkSummary: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: space.md,
  },
  scaleNote: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: space.md,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.lg,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: space.md,
  },
  doneBanner: {
    color: colors.primary,
    fontWeight: '600',
    marginBottom: space.md,
  },
  desc: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: space.xs },
  error: { color: colors.error, marginBottom: space.lg },
  secondaryBtn: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  secondaryLabel: { color: colors.surface, fontWeight: '600' },
  linkBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { color: colors.primary, fontWeight: '600' },
})
