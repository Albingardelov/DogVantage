import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { getFlag, setFlag } from '@/lib/storage/dismiss'
import { colors, fontSize, space } from '@/theme/tokens'

const STORAGE_KEY = 'dv_learning_checklist_v1'

export function LearningChecklistCard() {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    void getFlag(STORAGE_KEY).then((v) => setDismissed(v === '1'))
  }, [])

  if (dismissed) return null

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tre vanor som maxar inlärning</Text>
      <Text style={styles.intro}>Gäller särskilt första veckorna — sedan blir de automatiska.</Text>
      <Text style={styles.item}>
        <Text style={styles.strong}>Belöning redo</Text> innan du börjar — godis/leksak inom
        räckhåll så timingen blir rätt.
      </Text>
      <Text style={styles.item}>
        <Text style={styles.strong}>Ett steg i taget</Text> — höj bara ett kriterium (miljö,
        avstånd eller störning) per pass.
      </Text>
      <Text style={styles.item}>
        <Text style={styles.strong}>Hunden tar inte belöning?</Text> Gör övningen lättare, öka
        avstånd till det svåra, eller avsluta och vila.
      </Text>
      <Text style={styles.note}>Vilodagar är lika viktiga som träningsdagar för återhämtning.</Text>
      <Pressable
        style={styles.dismiss}
        onPress={() => {
          void setFlag(STORAGE_KEY, '1')
          setDismissed(true)
        }}
        accessibilityRole="button"
      >
        <Text style={styles.dismissLabel}>Visa inte igen</Text>
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
  title: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
  intro: { fontSize: fontSize.sm, color: colors.textMuted },
  item: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  strong: { fontWeight: '700' },
  note: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic', marginTop: space.xs },
  dismiss: { minHeight: 40, justifyContent: 'center' },
  dismissLabel: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
})
