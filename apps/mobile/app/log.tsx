import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { Exercise, QuickRating } from '@dogvantage/core'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch } from '@/lib/api/client'
import { useTrainingSession } from '@/hooks/use-training-session'
import { colors, fontSize, space } from '@/theme/tokens'

const QUICK: { value: QuickRating; label: string }[] = [
  { value: 'good', label: 'Bra' },
  { value: 'mixed', label: 'Blandat' },
  { value: 'bad', label: 'Dåligt' },
]

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <View style={styles.starBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={styles.starBtn}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${n}`}
          >
            <Text style={[styles.star, n <= value && styles.starOn]}>{n <= value ? '★' : '☆'}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

export default function LogModal() {
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const { dog, today, metrics, loading } = useTrainingSession()

  const available = today?.exercises ?? []
  const [selected, setSelected] = useState<string[]>([])
  const [focus, setFocus] = useState(3)
  const [obedience, setObedience] = useState(3)
  const [quick, setQuick] = useState<QuickRating | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (available.length && selected.length === 0) {
      setSelected(available.slice(0, Math.min(4, available.length)).map((e) => e.id))
    }
  }, [available, selected.length])

  const selectedExercises: Exercise[] = useMemo(
    () => available.filter((e) => selected.includes(e.id)),
    [available, selected],
  )

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }

  const canSubmit =
    !!dog?.id &&
    !!session?.user?.id &&
    selectedExercises.length >= 1 &&
    focus >= 1 &&
    obedience >= 1 &&
    quick != null &&
    !saving

  async function onSubmit() {
    if (!canSubmit || !dog?.id || !session?.user?.id || !quick) return
    setSaving(true)
    setError(null)
    try {
      const exercises = selectedExercises.map((ex) => {
        const m = metrics[ex.id]
        return {
          id: ex.id,
          label: ex.label,
          success_count: m?.success_count ?? 0,
          fail_count: m?.fail_count ?? 0,
          latency_bucket: m?.latency_bucket ?? null,
          criteria_level_id: m?.criteria_level_id ?? null,
        }
      })

      const res = await apiFetch('/api/logs', {
        method: 'POST',
        body: JSON.stringify({
          dogId: dog.id,
          breed: dog.breed,
          week_number: dog.trainingWeek ?? 1,
          focus,
          obedience,
          quick_rating: quick,
          notes: notes.trim() || undefined,
          exercises,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `Kunde inte spara (${res.status})`)
      }
      Alert.alert('Sparat', 'Passet är loggat.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte spara')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Logga pass</Text>
        <Pressable onPress={() => router.back()} style={styles.close}>
          <Text style={styles.closeLabel}>Stäng</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} />
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={styles.section}>Övningar (max 4)</Text>
          {available.length === 0 ? (
            <Text style={styles.hint}>Inga övningar idag — du kan fortfarande stänga.</Text>
          ) : (
            available.map((ex) => {
              const on = selected.includes(ex.id)
              return (
                <Pressable
                  key={ex.id}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => toggle(ex.id)}
                >
                  <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{ex.label}</Text>
                </Pressable>
              )
            })
          )}

          <StarRow label="Fokus" value={focus} onChange={setFocus} />
          <StarRow label="Lydnad" value={obedience} onChange={setObedience} />

          <Text style={styles.section}>Helhetskänsla</Text>
          <View style={styles.quickRow}>
            {QUICK.map((q) => (
              <Pressable
                key={q.value}
                style={[styles.quickBtn, quick === q.value && styles.quickOn]}
                onPress={() => setQuick(q.value)}
              >
                <Text style={[styles.quickLabel, quick === q.value && styles.quickLabelOn]}>
                  {q.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.section}>Anteckning (valfritt)</Text>
          <TextInput
            style={styles.notes}
            value={notes}
            onChangeText={setNotes}
            placeholder="Kort notis…"
            placeholderTextColor={colors.textMuted}
            multiline
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.submit, !canSubmit && styles.submitDisabled]}
            disabled={!canSubmit}
            onPress={() => void onSubmit()}
          >
            {saving ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.submitLabel}>Spara pass</Text>
            )}
          </Pressable>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
  close: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.sm },
  closeLabel: { color: colors.primary, fontWeight: '600' },
  section: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  hint: { color: colors.textMuted },
  chip: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
    marginBottom: space.sm,
    backgroundColor: colors.surface,
  },
  chipOn: { borderColor: colors.primary, backgroundColor: '#edf8f2' },
  chipLabel: { color: colors.text, fontSize: fontSize.base },
  chipLabelOn: { color: colors.primary, fontWeight: '600' },
  starBlock: { marginTop: space.lg },
  label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: space.sm },
  stars: { flexDirection: 'row', gap: space.sm },
  starBtn: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  star: { fontSize: 28, color: colors.border },
  starOn: { color: colors.accent },
  quickRow: { flexDirection: 'row', gap: space.sm },
  quickBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  quickOn: { borderColor: colors.primary, backgroundColor: '#edf8f2' },
  quickLabel: { color: colors.text, fontWeight: '600' },
  quickLabelOn: { color: colors.primary },
  notes: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: space.lg,
    backgroundColor: colors.surface,
    color: colors.text,
    textAlignVertical: 'top',
  },
  error: { color: colors.error, marginTop: space.md },
  submit: {
    marginTop: space.xl,
    marginBottom: space.xxl,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.45 },
  submitLabel: { color: colors.surface, fontWeight: '600' },
})
