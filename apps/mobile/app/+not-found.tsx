import { Link, Stack } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { colors, fontSize, space } from '@/theme/tokens'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Hittades inte', headerShown: true }} />
      <View style={styles.root}>
        <Text style={styles.title}>Sidan finns inte</Text>
        <Link href="/(tabs)/dashboard" style={styles.link}>
          Tillbaka till Hem
        </Link>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: space.lg,
  },
  link: {
    fontSize: fontSize.base,
    color: colors.primary,
    fontWeight: '600',
  },
})
