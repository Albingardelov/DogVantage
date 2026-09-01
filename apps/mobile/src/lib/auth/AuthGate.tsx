import { Redirect, useSegments } from 'expo-router'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '@/lib/auth/AuthContext'
import { useDogGate } from '@/lib/dog/DogGateContext'
import { colors, fontSize, space } from '@/theme/tokens'

/**
 * Session + dog gates. Billing/subscription gating lives in SubscriptionGate (tabs).
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const { dogCount, dogsLoading, dogsError, refreshDogs } = useDogGate()
  const segments = useSegments()
  const inAuthGroup = segments[0] === '(auth)'
  const inOnboarding = segments[0] === 'onboarding'

  if (loading || (session && dogsLoading && dogCount === null)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (!session && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />
  }

  // Okänt hundantal pga nätverks-/serverfel: visa retry istället för att
  // skicka en befintlig användare till onboarding.
  if (session && dogsError && dogCount === null) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorTitle}>Kunde inte hämta dina uppgifter</Text>
        <Text style={styles.errorBody}>Kontrollera din anslutning och försök igen.</Text>
        <Pressable style={styles.retry} onPress={() => void refreshDogs()} accessibilityRole="button">
          <Text style={styles.retryText}>Försök igen</Text>
        </Pressable>
      </View>
    )
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
    paddingHorizontal: space.xl,
  },
  errorTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: space.sm,
  },
  errorBody: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: space.xl,
  },
  retry: {
    minHeight: 48,
    paddingHorizontal: space.xxl,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: fontSize.base },
})
