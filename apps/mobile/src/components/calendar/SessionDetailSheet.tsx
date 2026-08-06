import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { QuickRating } from '@dogvantage/core'
import type { CalendarSessionLog } from '@/hooks/use-monthly-logs'
import { colors, fontSize, space } from '@/theme/tokens'

const RATING_LABEL: Record<QuickRating, string> = {
  good: 'Bra',
  mixed: 'Blandat',
  bad: 'Dåligt',
}

const RATING_COLOR: Record<QuickRating, string> = {
  good: '#22c55e',
  mixed: colors.accent,
  bad: colors.error,
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

function stars(n: number): string {
  return `${'★'.repeat(Math.max(0, Math.min(5, n)))}${'☆'.repeat(Math.max(0, 5 - n))}`
}

type Props = {
  visible: boolean
  dateKey: string | null
  sessions: CalendarSessionLog[]
  onClose: () => void
  onDelete: (id: string) => Promise<void>
}

export function SessionDetailSheet({ visible, dateKey, sessions, onClose, onDelete }: Props) {
  const insets = useSafeAreaInsets()

  function confirmDelete(id: string) {
    Alert.alert('Ta bort pass?', 'Loggen raderas permanent.', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Ta bort',
        style: 'destructive',
        onPress: () => {
          void onDelete(id).catch((e: unknown) => {
            Alert.alert('Fel', e instanceof Error ? e.message : 'Kunde inte ta bort')
          })
        },
      },
    ])
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{dateKey ?? 'Sessioner'}</Text>
          <Text style={styles.subtitle}>
            {sessions.length === 0
              ? 'Inga loggade pass den här dagen.'
              : `${sessions.length} pass · håll inne för att ta bort`}
          </Text>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {sessions.map((s) => (
              <Pressable
                key={s.id}
                style={styles.card}
                onLongPress={() => confirmDelete(s.id)}
                delayLongPress={400}
                accessibilityRole="button"
                accessibilityHint="Håll inne för att ta bort"
              >
                <View style={styles.cardTop}>
                  <Text style={styles.time}>{formatTime(s.created_at)}</Text>
                  <View style={[styles.chip, { backgroundColor: RATING_COLOR[s.quick_rating] }]}>
                    <Text style={styles.chipLabel}>{RATING_LABEL[s.quick_rating]}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  Fokus {stars(s.focus)} · lydnad {stars(s.obedience)}
                </Text>
                {s.exercises && s.exercises.length > 0 ? (
                  <View style={styles.exRow}>
                    {s.exercises.map((ex) => (
                      <View key={ex.id} style={styles.exChip}>
                        <Text style={styles.exLabel}>
                          {ex.label} {ex.success_count}/{ex.success_count + ex.fail_count}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {s.notes ? <Text style={styles.notes}>{s.notes}</Text> : null}
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={styles.closeBtn} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeLabel}>Stäng</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: space.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: space.xs,
    marginBottom: space.md,
  },
  list: { flexGrow: 0 },
  listContent: { paddingBottom: space.md, gap: space.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  time: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
  chip: {
    borderRadius: 999,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  chipLabel: { color: '#fff', fontSize: fontSize.xs, fontWeight: '700' },
  meta: { fontSize: fontSize.sm, color: colors.textMuted },
  exRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  exChip: {
    backgroundColor: colors.bgAlt,
    borderRadius: 999,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  exLabel: { fontSize: fontSize.xs, color: colors.text },
  notes: {
    marginTop: space.md,
    fontSize: fontSize.sm,
    color: colors.text,
    fontStyle: 'italic',
  },
  closeBtn: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  closeLabel: { color: colors.primary, fontWeight: '600', fontSize: fontSize.base },
})
