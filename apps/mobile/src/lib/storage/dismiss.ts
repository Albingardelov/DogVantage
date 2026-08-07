import AsyncStorage from '@react-native-async-storage/async-storage'

export async function getFlag(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key)
  } catch {
    return null
  }
}

export async function setFlag(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

export async function isInsightDismissed(key: string, maxAgeDays = 14): Promise<boolean> {
  const raw = await getFlag(key)
  if (!raw) return false
  const ts = Date.parse(raw)
  if (!Number.isFinite(ts)) return true
  return Date.now() - ts < maxAgeDays * 24 * 60 * 60 * 1000
}
