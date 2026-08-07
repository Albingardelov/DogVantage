import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { AuthGate } from '@/lib/auth/AuthGate'
import { DogGateProvider } from '@/lib/dog/DogGateContext'
import { colors } from '@/theme/tokens'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DogGateProvider>
          <StatusBar style="dark" />
          <AuthGate>
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
              <Stack.Screen name="assessment" />
              <Stack.Screen name="log" options={{ presentation: 'modal' }} />
              <Stack.Screen name="+not-found" />
            </Stack>
          </AuthGate>
        </DogGateProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
