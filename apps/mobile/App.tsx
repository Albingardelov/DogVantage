import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import { CORE_PACKAGE_NAME, getLifeStage } from '@dogvantage/core'

export default function App() {
  return (
    <View style={styles.container}>
      <Text>DogVantage mobile</Text>
      <Text>Shared package: {CORE_PACKAGE_NAME}</Text>
      <Text>Core import works: lifeStage(12w) = {getLifeStage(12)}</Text>
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
})
