import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { colors } from '@/theme/tokens'

/**
 * RN-1: wrap with AuthProvider and redirect unauthenticated users to /(auth)/login.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="log" options={{ presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </SafeAreaProvider>
  )
}
