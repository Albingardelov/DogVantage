import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  meetsTier,
  useSubscription,
  type SubscriptionState,
} from '@/lib/billing/use-subscription'
import { useAuth } from '@/lib/auth/AuthContext'
import { webBaseUrl } from '@/lib/api/client'
import { colors, fontSize, space } from '@/theme/tokens'

function accountUrl(): string {
  return `${webBaseUrl()}/profile`
}

type Props = {
  children: React.ReactNode
  requireTier?: 'basic' | 'pro'
}

function Paywall({
  state,
  requireTier,
  onRefresh,
}: {
  state: SubscriptionState | null
  requireTier: 'basic' | 'pro'
  onRefresh: () => void
}) {
  const insets = useSafeAreaInsets()
  const { signOut } = useAuth()
  const title =
    requireTier === 'pro'
      ? 'Den här funktionen kräver Pro-konto'
      : state?.isOnTrial
        ? 'Din provperiod har slutat'
        : 'Logga in med ett aktivt konto'

  async function onSignOut() {
    await signOut()
    router.replace('/(auth)/login')
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xxl }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>
        DogVantage-konton hanteras på vår webbsida. Öppna den för att se ditt konto.
      </Text>
      <Pressable
        style={styles.cta}
        onPress={() => void WebBrowser.openBrowserAsync(accountUrl())}
        accessibilityRole="link"
      >
        <Text style={styles.ctaText}>Öppna kontosidan</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onRefresh} accessibilityRole="button">
        <Text style={styles.secondaryText}>Jag har redan ett konto — uppdatera</Text>
      </Pressable>
      <Pressable
        style={styles.secondary}
        onPress={() => router.push('/profile')}
        accessibilityRole="button"
      >
        <Text style={styles.secondaryText}>Hantera konto i appen</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={() => void onSignOut()} accessibilityRole="button">
        <Text style={styles.signOutText}>Logga ut</Text>
      </Pressable>
    </View>
  )
}

export function SubscriptionGate({ children, requireTier = 'basic' }: Props) {
  const { state, loading, refresh } = useSubscription()

  if (loading && !state) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (meetsTier(state, requireTier)) {
    return <>{children}</>
  }

  return <Paywall state={state} requireTier={requireTier} onRefresh={() => void refresh()} />
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: space.md,
  },
  body: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: space.xxl,
    maxWidth: 340,
  },
  cta: {
    minHeight: 48,
    paddingHorizontal: space.xxl,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
    alignSelf: 'stretch',
    maxWidth: 340,
  },
  ctaText: { color: '#fff', fontWeight: '600', fontSize: fontSize.base },
  secondary: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  secondaryText: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
  signOutText: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.sm },
})
