import { Redirect, useSegments } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useAuth } from '@/lib/auth/AuthContext'
import { useDogGate } from '@/lib/dog/DogGateContext'
import { colors } from '@/theme/tokens'

/**
 * Session + dog gates. Billing/subscription gating lives in SubscriptionGate (tabs).
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const { dogCount, dogsLoading } = useDogGate()
  const segments = useSegments()
  const inAuthGroup = segments[0] === '(auth)'
  const inOnboarding = segments[0] === 'onboarding'

  if (loading || (session && dogsLoading)) {
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
    if ((dogCount ?? 0) === 0) return <Redirect href="/onboarding" />
    return <Redirect href="/(tabs)/dashboard" />
  }

  if (session && !inOnboarding && (dogCount ?? 0) === 0) {
    return <Redirect href="/onboarding" />
  }

  if (session && inOnboarding && (dogCount ?? 0) > 0) {
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
