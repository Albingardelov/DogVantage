import { useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch } from '@/lib/api/client'
import { colors, fontSize, space } from '@/theme/tokens'

type Props = {
  visible: boolean
  dogId: string
  onClose: () => void
  onCreated: () => void
}

export function AddCustomExerciseModal({ visible, dogId, onClose, onCreated }: Props) {
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!session?.access_token || !prompt.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await apiFetch(
        `/api/training/custom?dogId=${encodeURIComponent(dogId)}`,
        session.access_token,
        {
          method: 'POST',
          body: JSON.stringify({ prompt: prompt.trim(), dogId }),
        },
      )
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `Kunde inte skapa övning (${res.status})`)
      }
      setPrompt('')
      onCreated()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fel')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
          <Text style={styles.title}>Ny egen övning</Text>
          <Text style={styles.hint}>Beskriv vad du vill träna — AI skapar övningen.</Text>
          <TextInput
            style={styles.input}
            value={prompt}
            onChangeText={(t) => setPrompt(t.slice(0, 300))}
            placeholder="T.ex. lära hunden hämta nycklarna"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={300}
            editable={!saving}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={[styles.save, (!prompt.trim() || saving) && styles.disabled]}
            disabled={!prompt.trim() || saving}
            onPress={() => void submit()}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveLabel}>Skapa</Text>
            )}
          </Pressable>
          <Pressable style={styles.cancel} onPress={onClose} disabled={saving}>
            <Text style={styles.cancelLabel}>Avbryt</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: space.xl,
  },
  title: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  hint: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: space.xs, marginBottom: space.md },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: space.md,
    textAlignVertical: 'top',
    color: colors.text,
    backgroundColor: colors.surface,
  },
  error: { color: colors.error, marginTop: space.sm, fontSize: fontSize.sm },
  save: {
    marginTop: space.lg,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  saveLabel: { color: '#fff', fontWeight: '600' },
  cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: space.sm },
  cancelLabel: { color: colors.primary, fontWeight: '600' },
})
