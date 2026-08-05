import DateTimePicker from '@react-native-community/datetimepicker'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type {
  HouseholdPet,
  RewardPreference,
  TrainingBackground,
  TrainingEnvironment,
  TrainingGoal,
} from '@dogvantage/core'
import { useAuth } from '@/lib/auth/AuthContext'
import { BREED_OPTIONS } from '@/lib/dog/breeds'
import { useDogGate } from '@/lib/dog/DogGateContext'
import {
  BACKGROUND_OPTIONS,
  ENVIRONMENT_OPTIONS,
  GOAL_OPTIONS,
  PET_OPTIONS,
  REWARD_OPTIONS,
  ensureTrialForSession,
  saveNewDogProfile,
} from '@/lib/dog/profile'
import { colors, fontSize, space } from '@/theme/tokens'

const STEPS = [
  'Namn',
  'Ras',
  'Födelsedag',
  'Erfarenhet',
  'Mål',
  'Miljö',
  'Husdjur',
] as const

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const { user, session } = useAuth()
  const { refreshDogs } = useDogGate()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [breedQuery, setBreedQuery] = useState('')
  const [birthdate, setBirthdate] = useState<Date>(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 1)
    return d
  })
  const [showDate, setShowDate] = useState(Platform.OS === 'ios')
  const [background, setBackground] = useState<TrainingBackground>('some_training')
  const [goals, setGoals] = useState<TrainingGoal[]>(['everyday_obedience'])
  const [environment, setEnvironment] = useState<TrainingEnvironment>('suburb')
  const [reward, setReward] = useState<RewardPreference>('mixed')
  const [takesOutdoors, setTakesOutdoors] = useState(true)
  const [pets, setPets] = useState<HouseholdPet[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const breedResults = useMemo(() => {
    const q = breedQuery.trim().toLowerCase()
    if (!q) return BREED_OPTIONS.slice(0, 40)
    return BREED_OPTIONS.filter(
      (b) => b.nameSv.toLowerCase().includes(q) || b.slug.includes(q),
    ).slice(0, 40)
  }, [breedQuery])

  const canNext = (() => {
    if (step === 0) return name.trim().length > 0
    if (step === 1) return breed.length > 0
    if (step === 2) return birthdate.getTime() < Date.now()
    if (step === 4) return goals.length > 0
    return true
  })()

  function toggleGoal(g: TrainingGoal) {
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
  }

  function togglePet(p: HouseholdPet) {
    setPets((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  async function finish() {
    if (!user || !session) return
    setError(null)
    setSaving(true)
    try {
      await saveNewDogProfile({
        userId: user.id,
        name,
        breed,
        birthdate: toIsoDate(birthdate),
        onboarding: {
          goals,
          environment,
          rewardPreference: reward,
          takesRewardsOutdoors: takesOutdoors,
          householdPets: pets.length ? pets : undefined,
          trainingBackground: background,
        },
      })
      await ensureTrialForSession(session.access_token)
      await refreshDogs()
      router.replace('/(tabs)/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte spara profilen.')
    } finally {
      setSaving(false)
    }
  }

  function onNext() {
    if (step >= STEPS.length - 1) {
      void finish()
      return
    }
    setStep((s) => s + 1)
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg }]}>
      <Text style={styles.progress}>
        Steg {step + 1} / {STEPS.length}
      </Text>
      <Text style={styles.title}>{STEPS[step]}</Text>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Hundens namn"
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
        )}

        {step === 1 && (
          <>
            <TextInput
              style={styles.input}
              value={breedQuery}
              onChangeText={setBreedQuery}
              placeholder="Sök ras…"
              placeholderTextColor={colors.textMuted}
            />
            {breed ? (
              <Text style={styles.selected}>
                Vald: {BREED_OPTIONS.find((b) => b.slug === breed)?.nameSv ?? breed}
              </Text>
            ) : null}
            {breedResults.map((item) => (
              <Pressable
                key={item.slug}
                style={[styles.chip, breed === item.slug && styles.chipActive]}
                onPress={() => setBreed(item.slug)}
              >
                <Text style={[styles.chipLabel, breed === item.slug && styles.chipLabelActive]}>
                  {item.nameSv}
                </Text>
              </Pressable>
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <Pressable style={styles.input} onPress={() => setShowDate(true)}>
              <Text style={styles.inputText}>{toIsoDate(birthdate)}</Text>
            </Pressable>
            {showDate && (
              <DateTimePicker
                value={birthdate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(_, date) => {
                  if (Platform.OS !== 'ios') setShowDate(false)
                  if (date) setBirthdate(date)
                }}
              />
            )}
          </>
        )}

        {step === 3 &&
          BACKGROUND_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.chip, background === opt.value && styles.chipActive]}
              onPress={() => setBackground(opt.value)}
            >
              <Text style={[styles.chipLabel, background === opt.value && styles.chipLabelActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}

        {step === 4 &&
          GOAL_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.chip, goals.includes(opt.value) && styles.chipActive]}
              onPress={() => toggleGoal(opt.value)}
            >
              <Text
                style={[styles.chipLabel, goals.includes(opt.value) && styles.chipLabelActive]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}

        {step === 5 && (
          <>
            {ENVIRONMENT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.chip, environment === opt.value && styles.chipActive]}
                onPress={() => setEnvironment(opt.value)}
              >
                <Text
                  style={[styles.chipLabel, environment === opt.value && styles.chipLabelActive]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
            <Text style={styles.section}>Belöning</Text>
            {REWARD_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.chip, reward === opt.value && styles.chipActive]}
                onPress={() => setReward(opt.value)}
              >
                <Text style={[styles.chipLabel, reward === opt.value && styles.chipLabelActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.chip, takesOutdoors && styles.chipActive]}
              onPress={() => setTakesOutdoors((v) => !v)}
            >
              <Text style={[styles.chipLabel, takesOutdoors && styles.chipLabelActive]}>
                Tar belöningar utomhus
              </Text>
            </Pressable>
          </>
        )}

        {step === 6 &&
          PET_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.chip, pets.includes(opt.value) && styles.chipActive]}
              onPress={() => togglePet(opt.value)}
            >
              <Text style={[styles.chipLabel, pets.includes(opt.value) && styles.chipLabelActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.nav}>
        <Pressable
          style={[styles.navBtn, step === 0 && styles.navBtnDisabled]}
          disabled={step === 0 || saving}
          onPress={() => setStep((s) => Math.max(0, s - 1))}
        >
          <Text style={styles.navBtnLabel}>Tillbaka</Text>
        </Pressable>
        <Pressable
          style={[styles.navBtnPrimary, (!canNext || saving) && styles.navBtnDisabled]}
          disabled={!canNext || saving}
          onPress={onNext}
        >
          {saving ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.navBtnPrimaryLabel}>
              {step >= STEPS.length - 1 ? 'Klar' : 'Nästa'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.xl },
  progress: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: space.sm },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text, marginBottom: space.lg },
  body: { flex: 1 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: space.lg,
    backgroundColor: colors.surface,
    marginBottom: space.md,
    justifyContent: 'center',
  },
  inputText: { fontSize: fontSize.base, color: colors.text },
  selected: { color: colors.primary, marginBottom: space.sm, fontWeight: '600' },
  chip: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    marginBottom: space.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipActive: { borderColor: colors.primary, backgroundColor: '#edf8f2' },
  chipLabel: { fontSize: fontSize.base, color: colors.text },
  chipLabelActive: { color: colors.primary, fontWeight: '600' },
  section: {
    marginTop: space.lg,
    marginBottom: space.sm,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
  error: { color: colors.error, marginTop: space.md },
  nav: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  navBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.45 },
  navBtnLabel: { color: colors.text, fontWeight: '600' },
  navBtnPrimaryLabel: { color: colors.surface, fontWeight: '600' },
})
