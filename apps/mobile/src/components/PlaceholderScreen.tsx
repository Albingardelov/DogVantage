import { Link } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fontSize, space } from '@/theme/tokens'

export function PlaceholderScreen({
  title,
  subtitle,
  showLogLink = false,
}: {
  title: string
  subtitle: string
  showLogLink?: boolean
}) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.xxl }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {showLogLink ? (
        <Link href="/log" asChild>
          <Pressable style={styles.button} accessibilityRole="button">
            <Text style={styles.buttonLabel}>Öppna logg (modal)</Text>
          </Pressable>
        </Link>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: space.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: space.sm,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: space.xxl,
  },
  button: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    color: colors.surface,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
})
