import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch } from '@/lib/api/client'
import { ProfileSection } from '@/components/profile/ProfileSection'
import { colors, fontSize, space } from '@/theme/tokens'

export type CustomExerciseRow = {
  id: string
  exercise_id: string
  label: string
  active: boolean
}

type Props = {
  dogId: string | undefined
  isPro: boolean
  onAdd: () => void
}

export function CustomExercisesSection({ dogId, isPro, onAdd }: Props) {
  const { session } = useAuth()
  const [items, setItems] = useState<CustomExerciseRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!isPro || !dogId || !session?.access_token) {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch(
        `/api/training/custom?dogId=${encodeURIComponent(dogId)}`,
        session.access_token,
      )
      if (res.status === 402) {
        setItems([])
        return
      }
      if (!res.ok) throw new Error('Kunde inte hämta egna övningar')
      const data = (await res.json()) as CustomExerciseRow[]
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fel')
    } finally {
      setLoading(false)
    }
  }, [isPro, dogId, session?.access_token])

  useEffect(() => {
    void reload()
  }, [reload])

  async function toggle(id: string, active: boolean) {
    if (!session?.access_token) return
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, active } : x)))
    const res = await apiFetch('/api/training/custom', session.access_token, {
      method: 'PATCH',
      body: JSON.stringify({ id, active }),
    })
    if (!res.ok) await reload()
  }

  if (!isPro) {
    return (
      <ProfileSection title="Egna övningar">
        <Text style={styles.banner}>Egna övningar ingår i Pro. Hantera prenumeration via webbappen.</Text>
      </ProfileSection>
    )
  }

  return (
    <ProfileSection title="Egna övningar">
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {items.map((ex) => (
        <View key={ex.id} style={styles.row}>
          <Text style={styles.label}>{ex.label}</Text>
          <Switch
            value={ex.active}
            onValueChange={(v) => void toggle(ex.id, v)}
            trackColor={{ true: colors.primaryLight, false: colors.border }}
            thumbColor={ex.active ? colors.primary : colors.bgAlt}
          />
        </View>
      ))}
      {!loading && items.length === 0 ? (
        <Text style={styles.empty}>Inga egna övningar ännu.</Text>
      ) : null}
      <Pressable style={styles.addBtn} onPress={onAdd} accessibilityRole="button">
        <Text style={styles.addLabel}>Lägg till övning</Text>
      </Pressable>
    </ProfileSection>
  )
}

const styles = StyleSheet.create({
  banner: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  label: { flex: 1, fontSize: fontSize.base, color: colors.text },
  empty: { fontSize: fontSize.sm, color: colors.textMuted },
  error: { color: colors.error, fontSize: fontSize.sm },
  addBtn: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: { color: colors.primary, fontWeight: '600' },
})
