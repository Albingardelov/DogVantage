import { Link } from 'expo-router'
import { Pressable, StyleSheet, Text } from 'react-native'
import { PlaceholderScreen } from '@/components/PlaceholderScreen'
import { colors, fontSize, space } from '@/theme/tokens'

export default function DashboardScreen() {
  return (
    <>
      <PlaceholderScreen
        title="Hem"
        subtitle="Veckans träningsplan kommer i RN-3."
        showLogLink
      />
      <Link href="/profile" asChild>
        <Pressable style={styles.profileLink} accessibilityRole="button">
          <Text style={styles.profileLinkLabel}>Profil / logga ut</Text>
        </Pressable>
      </Link>
    </>
  )
}

const styles = StyleSheet.create({
  profileLink: {
    position: 'absolute',
    bottom: space.xxl,
    alignSelf: 'center',
    minHeight: 44,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
  },
  profileLinkLabel: {
    color: colors.primary,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
})
