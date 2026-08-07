import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { DayCheckInState, HandlerEnergy, PuppyZone } from '@dogvantage/core'
import { colors, fontSize, space } from '@/theme/tokens'

const ZONE_OPTIONS: { id: PuppyZone; label: string }[] = [
  { id: 'green', label: 'Pigg & fokuserad' },
  { id: 'yellow', label: 'Lite trött/stressad' },
  { id: 'red', label: 'Behöver vila' },
]

const ENERGY_OPTIONS: { id: HandlerEnergy; label: string }[] = [
  { id: 'low', label: 'Låg' },
  { id: 'ok', label: 'Ok' },
  { id: 'high', label: 'Hög' },
]

const TIME_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 5, label: '5 min' },
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30+ min' },
]

type Props = {
  dogName: string
  onSave: (value: DayCheckInState) => void
  onDismiss: () => void
}

export function DayCheckInCard({ dogName, onSave, onDismiss }: Props) {
  const [zone, setZone] = useState<PuppyZone | null>(null)
  const [energy, setEnergy] = useState<HandlerEnergy | null>(null)
  const [minutes, setMinutes] = useState<number | null>(null)

  return (
    <View style={styles.card}>
      <Text style={styles.question}>Hur är {dogName}s form idag?</Text>
      <View style={styles.row}>
        {ZONE_OPTIONS.map((o) => (
          <Pressable
            key={o.id}
            style={[styles.chip, zone === o.id && styles.chipOn]}
            onPress={() => setZone(o.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: zone === o.id }}
          >
            <Text style={[styles.chipText, zone === o.id && styles.chipTextOn]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.question}>Din egen energi?</Text>
      <View style={styles.row}>
        {ENERGY_OPTIONS.map((o) => (
          <Pressable
            key={o.id}
            style={[styles.chip, energy === o.id && styles.chipOn]}
            onPress={() => setEnergy(o.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: energy === o.id }}
          >
            <Text style={[styles.chipText, energy === o.id && styles.chipTextOn]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.question}>Hur mycket tid har ni?</Text>
      <View style={styles.row}>
        {TIME_OPTIONS.map((o) => (
          <Pressable
            key={o.minutes}
            style={[styles.chip, minutes === o.minutes && styles.chipOn]}
            onPress={() => setMinutes(o.minutes)}
            accessibilityRole="button"
            accessibilityState={{ selected: minutes === o.minutes }}
          >
            <Text style={[styles.chipText, minutes === o.minutes && styles.chipTextOn]}>
              {o.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.saveBtn, !zone && styles.disabled]}
        disabled={!zone}
        onPress={() =>
          zone &&
          onSave({ zone, handlerEnergy: energy, minutesAvailable: minutes })
        }
        accessibilityRole="button"
      >
        <Text style={styles.saveLabel}>Starta dagen</Text>
      </Pressable>
      <Pressable style={styles.skipBtn} onPress={onDismiss} accessibilityRole="button">
        <Text style={styles.skipLabel}>Hoppa över</Text>
      </Pressable>
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
    gap: space.sm,
  },
  question: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginTop: space.sm,
  },
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
  chipText: { fontSize: fontSize.sm, color: colors.text },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  saveBtn: {
    marginTop: space.md,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.45 },
  saveLabel: { color: '#fff', fontWeight: '600' },
  skipBtn: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  skipLabel: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.sm },
})
