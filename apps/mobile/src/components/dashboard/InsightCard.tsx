import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import type { InsightCopy } from '@dogvantage/core'
import { colors, fontSize, space } from '@/theme/tokens'

type Props = {
  copy: InsightCopy
  busy: boolean
  onPriority: () => void
  onDismiss: () => void
}

export function InsightCard({ copy, busy, onPriority, onDismiss }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Insikt</Text>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>
      <Pressable
        style={[styles.primary, busy && styles.disabled]}
        disabled={busy}
        onPress={onPriority}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryLabel}>Gör till veckans prioritet</Text>
        )}
      </Pressable>
      <Pressable style={styles.secondary} onPress={onDismiss} disabled={busy}>
        <Text style={styles.secondaryLabel}>Stäng</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: space.lg,
    marginBottom: space.lg,
    gap: space.sm,
  },
  eyebrow: { fontSize: fontSize.xs, color: colors.accent, fontWeight: '700' },
  title: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
  body: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20 },
  primary: {
    marginTop: space.sm,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { color: '#fff', fontWeight: '600' },
  secondary: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  secondaryLabel: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
  disabled: { opacity: 0.5 },
})
