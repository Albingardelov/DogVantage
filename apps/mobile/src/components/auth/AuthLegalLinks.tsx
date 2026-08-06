import { Linking, Pressable, StyleSheet, Text } from 'react-native'
import { webBaseUrl } from '@/lib/api/client'
import { colors, fontSize, space } from '@/theme/tokens'

export function AuthLegalLinks() {
  function openPrivacy() {
    const base = webBaseUrl()
    void Linking.openURL(base ? `${base}/privacy` : 'https://dogvantage.se/privacy')
  }

  return (
    <Pressable onPress={openPrivacy} style={styles.wrap} accessibilityRole="link">
      <Text style={styles.text}>Integritetspolicy</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: space.xl,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
})
