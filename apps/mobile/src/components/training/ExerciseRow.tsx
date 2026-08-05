import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { DailyExerciseMetrics, Exercise } from '@dogvantage/core'
import { colors, fontSize, space } from '@/theme/tokens'

export function ExerciseRow({
  exercise,
  done,
  metrics,
  onSuccess,
  onFail,
  onOpenGuide,
}: {
  exercise: Exercise
  done: number
  metrics?: DailyExerciseMetrics
  onSuccess: () => void
  onFail: () => void
  onOpenGuide: () => void
}) {
  const complete = done >= exercise.reps
  const success = metrics?.success_count ?? 0
  const fail = metrics?.fail_count ?? 0
  const attempts = success + fail
  const rate = attempts > 0 ? Math.round((success / attempts) * 100) : null

  return (
    <View style={[styles.row, complete && styles.rowDone]}>
      <Pressable onPress={onOpenGuide} accessibilityRole="button">
        <Text style={styles.label}>{exercise.label}</Text>
        <Text style={styles.desc}>{exercise.desc}</Text>
        <Text style={styles.meta}>
          {done}/{exercise.reps} reps
          {rate != null ? ` · ${rate}% lyckade` : ''}
          {complete ? ' · Klart!' : ''}
        </Text>
        <Text style={styles.guideHint}>Tryck för guide</Text>
      </Pressable>
      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, styles.btnSuccess, complete && styles.btnDisabled]}
          onPress={onSuccess}
          disabled={complete}
          accessibilityRole="button"
          accessibilityLabel="Lyckad rep"
        >
          <Text style={styles.btnLabel}>Lyckad</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnFail, complete && styles.btnDisabled]}
          onPress={onFail}
          disabled={complete}
          accessibilityRole="button"
          accessibilityLabel="Missad rep"
        >
          <Text style={styles.btnLabelDark}>Miss</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowDone: { opacity: 0.7 },
  label: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
  desc: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: space.xs },
  meta: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: space.sm,
    fontWeight: '600',
  },
  guideHint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: space.xs },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  btn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSuccess: { backgroundColor: colors.primary },
  btnFail: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnDisabled: { opacity: 0.4 },
  btnLabel: { color: colors.surface, fontWeight: '600' },
  btnLabelDark: { color: colors.text, fontWeight: '600' },
})
