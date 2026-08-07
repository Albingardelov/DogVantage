import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import type { HeatState } from '@/hooks/use-heat'
import { colors, fontSize, space } from '@/theme/tokens'

type Props = {
  heat: HeatState
  busy: boolean
  onStart: () => void
  onEnd: () => void
}

export function HeatBanner({ heat, busy, onStart, onEnd }: Props) {
  if (!heat.isInHeat && !heat.skenfasActive) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Löpcykel</Text>
        <Text style={styles.body}>
          Markera när tiken börjar löpa så kan träningen anpassas. Detta är träningsstöd — rådfråga
          veterinär vid hälsoproblem.
        </Text>
        <Pressable
          style={[styles.btn, busy && styles.disabled]}
          disabled={busy}
          onPress={onStart}
          accessibilityRole="button"
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnLabel}>Starta löpning</Text>}
        </Pressable>
      </View>
    )
  }

  if (heat.isInHeat) {
    return (
      <View style={[styles.card, styles.warn]}>
        <Text style={styles.title}>Tiken löper just nu</Text>
        <Text style={styles.body}>
          Håll passen korta, undvik socialisering med okända hundar och prioritera lugna
          inomhusövningar. Rådfråga veterinär vid behov.
        </Text>
        <Pressable
          style={[styles.btn, styles.btnSecondary, busy && styles.disabled]}
          disabled={busy}
          onPress={onEnd}
          accessibilityRole="button"
        >
          {busy ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.btnSecondaryLabel}>Avsluta löpning</Text>
          )}
        </Pressable>
      </View>
    )
  }

  return (
    <View style={[styles.card, styles.warn]}>
      <Text style={styles.title}>Skenfas-fönster (6–9 v efter löp)</Text>
      <Text style={styles.body}>
        Tiken kan visa beteendeförändringar. Håll lågstimulans-träning och prioritera plats och
        impulskontroll.
      </Text>
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
    marginBottom: space.lg,
  },
  warn: { borderColor: colors.accent, backgroundColor: '#fff8f0' },
  title: { fontSize: fontSize.base, fontWeight: '600', color: colors.text, marginBottom: space.sm },
  body: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20, marginBottom: space.md },
  btn: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnLabel: { color: '#fff', fontWeight: '600' },
  btnSecondaryLabel: { color: colors.primary, fontWeight: '600' },
  disabled: { opacity: 0.5 },
})
