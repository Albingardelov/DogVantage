import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth/AuthContext'
import { colors, fontSize, space } from '@/theme/tokens'

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { user, signOut } = useAuth()

  async function onSignOut() {
    await signOut()
    router.replace('/(auth)/login')
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.xxl }]}>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.subtitle}>
        {user?.email ?? 'Inloggad'} — full profil kommer i RN-7.
      </Text>
      <Pressable style={styles.button} onPress={onSignOut} accessibilityRole="button">
        <Text style={styles.buttonLabel}>Logga ut</Text>
      </Pressable>
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
    paddingHorizontal: space.xl,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    color: colors.error,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
})
