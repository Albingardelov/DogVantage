import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AssessmentExerciseCard } from '@/components/assessment/AssessmentExerciseCard'
import { BehaviorStep } from '@/components/assessment/BehaviorStep'
import { ExerciseGuideModal } from '@/components/training/ExerciseGuideModal'
import { useAssessment } from '@/hooks/use-assessment'
import { colors, fontSize, space } from '@/theme/tokens'

export default function AssessmentScreen() {
  const insets = useSafeAreaInsets()
  const a = useAssessment()
  const [guideId, setGuideId] = useState<string | null>(null)

  if (a.booting) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (!a.dog) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.error}>Ingen hundprofil.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Tillbaka</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.lg }]}>
      <View style={styles.progress}>
        <View style={[styles.dot, styles.dotOn]}>
          <Text style={styles.dotText}>1</Text>
        </View>
        <View style={[styles.line, a.step === 1 && styles.lineOn]} />
        <View style={[styles.dot, a.step === 1 && styles.dotOn]}>
          <Text style={styles.dotText}>2</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        {a.step === 0 ? (
          <BehaviorStep
            background={a.background}
            setBackground={a.setBackground}
            hasBeenOut={a.hasBeenOut}
            setBeenOut={a.setBeenOut}
            leashBehavior={a.leashBehavior}
            setLeashBehavior={a.setLeashBehavior}
            envReaction={a.envReaction}
            setEnvReaction={a.setEnvReaction}
            triggers={a.triggers}
            setTriggers={a.setTriggers}
            householdPets={a.householdPets}
            setHouseholdPets={a.setHouseholdPets}
            problemNotes={a.problemNotes}
            setProblemNotes={a.setProblemNotes}
          />
        ) : (
          <>
            <Text style={styles.title}>Snabb övningstest</Text>
            <Text style={styles.sub}>
              Kör 5 försök per övning. Logga lyckad/miss + latens och välj kriterium. Ålder:{' '}
              {a.dog.ageWeeks} v.
            </Text>
            {a.exerciseIds.map((id) => (
              <AssessmentExerciseCard
                key={id}
                exerciseId={id}
                metrics={a.metrics[id] ?? null}
                onSuccess={() => a.logOutcome(id, 'success')}
                onFail={() => a.logOutcome(id, 'fail')}
                onLatency={(b) => a.setLatency(id, b)}
                onCriteria={(c) => a.setCriteria(id, c)}
                onOpenGuide={() => setGuideId(id)}
              />
            ))}
          </>
        )}

        {a.error ? <Text style={styles.error}>{a.error}</Text> : null}

        {a.step === 0 ? (
          <>
            <Pressable
              style={[styles.primary, a.hasBeenOut === null && styles.disabled]}
              disabled={a.hasBeenOut === null}
              onPress={() => a.setStep(1)}
            >
              <Text style={styles.primaryLabel}>Fortsätt till övningstest →</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={() => router.replace('/(tabs)/dashboard')}>
              <Text style={styles.secondaryLabel}>Hoppa över</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              style={[styles.primary, (!a.exercisesComplete || a.saving) && styles.disabled]}
              disabled={!a.exercisesComplete || a.saving}
              onPress={() => void a.finish()}
            >
              {a.saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryLabel}>Spara baseline →</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.secondary}
              disabled={a.saving}
              onPress={() => a.setStep(0)}
            >
              <Text style={styles.secondaryLabel}>← Tillbaka</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <ExerciseGuideModal
        exerciseId={guideId}
        exerciseLabel={null}
        visible={guideId != null}
        onClose={() => setGuideId(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    marginBottom: space.lg,
    gap: space.sm,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: { backgroundColor: colors.primary },
  dotText: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
  line: { width: 48, height: 3, backgroundColor: colors.border },
  lineOn: { backgroundColor: colors.primary },
  content: { paddingHorizontal: space.xl },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
  sub: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: space.lg, marginTop: space.xs },
  error: { color: colors.error, marginBottom: space.md },
  link: { color: colors.primary, fontWeight: '600', marginTop: space.md },
  primary: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.md,
  },
  primaryLabel: { color: '#fff', fontWeight: '600' },
  secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: space.sm },
  secondaryLabel: { color: colors.primary, fontWeight: '600' },
  disabled: { opacity: 0.45 },
})
