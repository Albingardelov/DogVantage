import { Alert, Linking, Platform, Pressable, StyleSheet, Text } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch, webBaseUrl } from '@/lib/api/client'
import { ProfileSection } from '@/components/profile/ProfileSection'
import { colors, fontSize, space } from '@/theme/tokens'

type Props = {
  email: string | undefined
}

export function DangerZone({ email }: Props) {
  const { session, signOut } = useAuth()

  async function onSignOut() {
    await signOut()
    router.replace('/(auth)/login')
  }

  function onPrivacy() {
    void Linking.openURL(`${webBaseUrl()}/privacy`)
  }

  async function deleteAccount() {
    if (!session?.user?.id) return
    try {
      const res = await apiFetch('/api/account', { method: 'DELETE' })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `Radering misslyckades (${res.status})`)
      }
      await signOut()
      router.replace('/(auth)/login')
    } catch (e) {
      Alert.alert('Fel', e instanceof Error ? e.message : 'Kunde inte radera konto')
    }
  }

  function onDelete() {
    Alert.alert(
      'Radera konto?',
      Platform.OS === 'ios'
        ? 'All data raderas permanent. Bekräfta med JA i nästa dialog.'
        : 'All data raderas permanent. Detta går inte att ångra.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: Platform.OS === 'ios' ? 'Fortsätt' : 'Radera permanent',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'ios') {
              void deleteAccount()
              return
            }
            // Alert.prompt is iOS-only
            Alert.prompt?.(
              'Bekräfta radering',
              'Skriv JA (versaler) för att radera kontot.',
              [
                { text: 'Avbryt', style: 'cancel' },
                {
                  text: 'Radera',
                  style: 'destructive',
                  onPress: (text?: string) => {
                    if (text?.trim() !== 'JA') {
                      Alert.alert('Avbrutet', 'Du måste skriva JA exakt.')
                      return
                    }
                    void deleteAccount()
                  },
                },
              ],
              'plain-text',
            )
          },
        },
      ],
    )
  }

  return (
    <ProfileSection title="Konto">
      {email ? <Text style={styles.email}>{email}</Text> : null}
      <Pressable style={styles.linkBtn} onPress={onPrivacy} accessibilityRole="link">
        <Text style={styles.linkLabel}>Integritetspolicy</Text>
      </Pressable>
      <Pressable style={styles.dangerBtn} onPress={onDelete} accessibilityRole="button">
        <Text style={styles.dangerLabel}>Radera konto</Text>
      </Pressable>
      <Pressable style={styles.logoutBtn} onPress={() => void onSignOut()} accessibilityRole="button">
        <Text style={styles.logoutLabel}>Logga ut</Text>
      </Pressable>
    </ProfileSection>
  )
}

const styles = StyleSheet.create({
  email: { fontSize: fontSize.sm, color: colors.textMuted },
  linkBtn: { minHeight: 40, justifyContent: 'center' },
  linkLabel: { color: colors.primary, fontWeight: '600', fontSize: fontSize.base },
  dangerBtn: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerLabel: { color: colors.error, fontWeight: '600' },
  logoutBtn: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: { color: colors.text, fontWeight: '600' },
})
