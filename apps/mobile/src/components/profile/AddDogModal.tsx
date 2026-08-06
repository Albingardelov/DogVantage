import DateTimePicker from '@react-native-community/datetimepicker'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth/AuthContext'
import { BREED_OPTIONS } from '@/lib/dog/breeds'
import { useDogGate } from '@/lib/dog/DogGateContext'
import { ensureTrialForSession, saveNewDogProfile } from '@/lib/dog/profile'
import { colors, fontSize, space } from '@/theme/tokens'

type Props = {
  visible: boolean
  onClose: () => void
  onCreated: () => void
}

export function AddDogModal({ visible, onClose, onCreated }: Props) {
  const insets = useSafeAreaInsets()
  const { user, session } = useAuth()
  const { refreshDogs } = useDogGate()
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [breedQuery, setBreedQuery] = useState('')
  const [birthdate, setBirthdate] = useState(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 1)
    return d
  })
  const [showDate, setShowDate] = useState(Platform.OS === 'ios')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const breedResults = useMemo(() => {
    const q = breedQuery.trim().toLowerCase()
    if (!q) return BREED_OPTIONS.slice(0, 30)
    return BREED_OPTIONS.filter(
      (b) => b.nameSv.toLowerCase().includes(q) || b.slug.includes(q),
    ).slice(0, 30)
  }, [breedQuery])

  async function submit() {
    if (!user || !session || !name.trim() || !breed) return
    setSaving(true)
    setError(null)
    try {
      await saveNewDogProfile({
        userId: user.id,
        name: name.trim(),
        breed,
        birthdate: birthdate.toISOString().slice(0, 10),
        onboarding: {
          goals: ['everyday_obedience'],
          environment: 'suburb',
          rewardPreference: 'mixed',
          takesRewardsOutdoors: true,
          trainingBackground: 'some_training',
        },
      })
      await ensureTrialForSession(session.access_token)
      await refreshDogs()
      setName('')
      setBreed('')
      setBreedQuery('')
      onCreated()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte skapa hund')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg }]}>
        <Text style={styles.title}>Lägg till hund</Text>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Namn</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Hundens namn"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.label}>Ras</Text>
          <TextInput
            style={styles.input}
            value={breedQuery}
            onChangeText={setBreedQuery}
            placeholder="Sök ras"
            placeholderTextColor={colors.textMuted}
          />
          {breed ? (
            <Text style={styles.selected}>Vald: {BREED_OPTIONS.find((b) => b.slug === breed)?.nameSv}</Text>
          ) : null}
          {breedResults.map((b) => (
            <Pressable
              key={b.slug}
              style={[styles.breedRow, breed === b.slug && styles.breedOn]}
              onPress={() => {
                setBreed(b.slug)
                setBreedQuery(b.nameSv)
              }}
            >
              <Text style={styles.breedText}>{b.nameSv}</Text>
            </Pressable>
          ))}
          <Text style={styles.label}>Födelsedag</Text>
          <Pressable onPress={() => setShowDate(true)} style={styles.input}>
            <Text style={styles.breedText}>{birthdate.toISOString().slice(0, 10)}</Text>
          </Pressable>
          {showDate ? (
            <DateTimePicker
              value={birthdate}
              mode="date"
              maximumDate={new Date()}
              onChange={(_, d) => {
                if (Platform.OS === 'android') setShowDate(false)
                if (d) setBirthdate(d)
              }}
            />
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
        <Pressable
          style={[styles.save, (!name.trim() || !breed || saving) && styles.saveDisabled]}
          disabled={!name.trim() || !breed || saving}
          onPress={() => void submit()}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveLabel}>Skapa</Text>}
        </Pressable>
        <Pressable style={styles.cancel} onPress={onClose}>
          <Text style={styles.cancelLabel}>Avbryt</Text>
        </Pressable>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.xl },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text, marginBottom: space.lg },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted, marginTop: space.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: space.md,
    marginTop: space.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  selected: { marginTop: space.sm, color: colors.primary, fontWeight: '600' },
  breedRow: { paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  breedOn: { backgroundColor: colors.bgAlt },
  breedText: { color: colors.text, fontSize: fontSize.base },
  error: { color: colors.error, marginTop: space.md },
  save: {
    marginTop: space.lg,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDisabled: { opacity: 0.5 },
  saveLabel: { color: '#fff', fontWeight: '600' },
  cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: space.sm },
  cancelLabel: { color: colors.primary, fontWeight: '600' },
})
