import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ActiveDog } from '@/lib/dog/active-dog'
import { colors, fontSize, space } from '@/theme/tokens'

type Props = {
  visible: boolean
  dogs: ActiveDog[]
  activeId?: string
  onClose: () => void
  onSelect: (dogId: string) => void
  onAdd: () => void
  canAdd: boolean
}

export function DogSwitcher({
  visible,
  dogs,
  activeId,
  onClose,
  onSelect,
  onAdd,
  canAdd,
}: Props) {
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
          <Text style={styles.title}>Dina hundar</Text>
          <ScrollView>
            {dogs.map((d) => {
              const active = d.id === activeId
              return (
                <Pressable
                  key={d.id}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => {
                    onSelect(d.id!)
                    onClose()
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.rowName}>{d.name}</Text>
                  {active ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              )
            })}
          </ScrollView>
          {canAdd ? (
            <Pressable style={styles.addBtn} onPress={onAdd} accessibilityRole="button">
              <Text style={styles.addLabel}>Lägg till hund</Text>
            </Pressable>
          ) : (
            <Text style={styles.hint}>Flera hundar ingår i Pro.</Text>
          )}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeLabel}>Stäng</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: space.xl,
    maxHeight: '70%',
  },
  title: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: space.md },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowActive: {},
  rowName: { fontSize: fontSize.base, color: colors.text, fontWeight: '500' },
  check: { color: colors.primary, fontWeight: '700', fontSize: fontSize.lg },
  addBtn: {
    marginTop: space.lg,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: { color: '#fff', fontWeight: '600' },
  hint: { marginTop: space.lg, color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
  closeBtn: { marginTop: space.md, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  closeLabel: { color: colors.primary, fontWeight: '600' },
})
