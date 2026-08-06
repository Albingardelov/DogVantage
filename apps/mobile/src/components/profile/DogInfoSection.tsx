import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { ActiveDog } from '@/lib/dog/active-dog'
import { BREED_OPTIONS } from '@/lib/dog/breeds'
import { colors, fontSize, space } from '@/theme/tokens'

function breedLabel(slug: string): string {
  return BREED_OPTIONS.find((b) => b.slug === slug)?.nameSv ?? slug
}

type Props = {
  dog: ActiveDog
  onOpenSwitcher: () => void
  showSwitcher: boolean
}

export function DogInfoSection({ dog, onOpenSwitcher, showSwitcher }: Props) {
  return (
    <View style={styles.hero}>
      <Text style={styles.name}>{dog.name}</Text>
      <Text style={styles.meta}>
        {breedLabel(dog.breed)} · {dog.ageWeeks} v · programvecka {dog.trainingWeek ?? 1}
      </Text>
      <Text style={styles.meta}>Född {dog.birthdate}</Text>
      {showSwitcher ? (
        <Pressable style={styles.switchBtn} onPress={onOpenSwitcher} accessibilityRole="button">
          <Text style={styles.switchLabel}>Byt / lägg till hund</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  hero: { marginBottom: space.xl },
  name: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: space.xs },
  switchBtn: {
    marginTop: space.md,
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingHorizontal: space.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
  },
  switchLabel: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
})
