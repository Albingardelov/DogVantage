import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { DailyExerciseMetrics, LatencyBucket } from '@dogvantage/core'
import { exerciseLabel, getExerciseSpec } from '@dogvantage/core'
import { colors, fontSize, space } from '@/theme/tokens'

const LATENCY: { id: LatencyBucket; label: string }[] = [
  { id: 'lt1s', label: '<1s' },
  { id: '1to3s', label: '1–3s' },
  { id: 'gt3s', label: '>3s' },
]

type Props = {
  exerciseId: string
  metrics: DailyExerciseMetrics | null
  onSuccess: () => void
  onFail: () => void
  onLatency: (b: LatencyBucket) => void
  onCriteria: (id: string) => void
  onOpenGuide: () => void
}

export function AssessmentExerciseCard({
  exerciseId,
  metrics,
  onSuccess,
  onFail,
  onLatency,
  onCriteria,
  onOpenGuide,
}: Props) {
  const spec = getExerciseSpec(exerciseId)
  if (!spec) return null

  const success = metrics?.success_count ?? 0
  const fail = metrics?.fail_count ?? 0
  const attempts = success + fail
  const rate = attempts > 0 ? Math.round((success / attempts) * 100) : null
  const levelId = metrics?.criteria_level_id ?? spec.ladder[0]?.id ?? null
  const latency = metrics?.latency_bucket ?? null
  const done = attempts >= 5

  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <Pressable onPress={onOpenGuide} accessibilityRole="button">
        <Text style={styles.title}>{exerciseLabel(exerciseId)}</Text>
        <Text style={styles.meta}>
          {attempts}/5 · {rate != null ? `${rate}%` : '—'} · Guide →
        </Text>
      </Pressable>

      <Text style={styles.label}>Kriterium</Text>
      <View style={styles.row}>
        {spec.ladder.map((l) => (
          <Pressable
            key={l.id}
            style={[styles.chip, levelId === l.id && styles.chipOn]}
            onPress={() => onCriteria(l.id)}
          >
            <Text style={[styles.chipText, levelId === l.id && styles.chipTextOn]}>{l.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Utfall</Text>
      <View style={styles.row}>
        <Pressable style={styles.action} onPress={onSuccess}>
          <Text style={styles.actionLabel}>Lyckad</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={onFail}>
          <Text style={styles.actionLabel}>Miss</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Latens</Text>
      <View style={styles.row}>
        {LATENCY.map((l) => (
          <Pressable
            key={l.id}
            style={[styles.chip, latency === l.id && styles.chipOn]}
            onPress={() => onLatency(l.id)}
          >
            <Text style={[styles.chipText, latency === l.id && styles.chipTextOn]}>{l.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.md,
    gap: space.sm,
  },
  cardDone: { borderColor: colors.primaryLight },
  title: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.primary, marginBottom: space.sm },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted, marginTop: space.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.bgAlt,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.xs, color: colors.text },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  action: {
    minHeight: 40,
    paddingHorizontal: space.lg,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { color: '#fff', fontWeight: '600' },
})
