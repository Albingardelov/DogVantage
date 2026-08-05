import { Redirect, useSegments } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useAuth } from '@/lib/auth/AuthContext'
import { colors } from '@/theme/tokens'

/**
 * Gates protected areas. Auth routes stay reachable when logged out.
 * Dog/onboarding/billing gates are later tickets (ProfileGuard parity).
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const segments = useSegments()
  const inAuthGroup = segments[0] === '(auth)'

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (!session && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />
  }

  if (session && inAuthGroup) {
    return <Redirect href="/(tabs)/dashboard" />
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
})
