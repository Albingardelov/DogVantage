import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Link as RouterLink } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ExerciseGuideModal } from '@/components/training/ExerciseGuideModal'
import { ExerciseRow } from '@/components/training/ExerciseRow'
import { useTrainingSession } from '@/hooks/use-training-session'
import { colors, fontSize, space } from '@/theme/tokens'

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
  } = useTrainingSession()
  const [guideId, setGuideId] = useState<string | null>(null)
  const [guideLabel, setGuideLabel] = useState<string | null>(null)

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
          <Text style={styles.meta}>
            Vecka {dog.trainingWeek ?? 1} · {dog.ageWeeks} veckor
            {!today?.rest && exercises.length > 0
              ? ` · ${completedCount}/${exercises.length} klara`
              : ''}
          </Text>
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
            <Text style={styles.desc}>Idag är det återhämtning — ingen strukturerad träning.</Text>
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
  meta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: space.xs,
    marginBottom: space.lg,
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
