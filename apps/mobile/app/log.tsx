import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fontSize, space } from '@/theme/tokens'

export default function LogModal() {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xxl }]}>
      <Text style={styles.title}>Logga pass</Text>
      <Text style={styles.subtitle}>Sessionslogg kommer i RN-4.</Text>
      <Pressable
        style={styles.button}
        accessibilityRole="button"
        onPress={() => router.back()}
      >
        <Text style={styles.buttonLabel}>Stäng</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    color: colors.primary,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
})
