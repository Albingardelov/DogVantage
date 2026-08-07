import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import type {
  HouseholdPet,
  LeashBehavior,
  NewEnvironmentReaction,
  TrainingBackground,
  TriggerType,
} from '@dogvantage/core'
import {
  BACKGROUND_LABELS,
  ENV_REACTION_LABELS,
  HOUSEHOLD_PET_LABELS,
  LEASH_LABELS,
  TRIGGER_LABELS,
} from '@dogvantage/core'
import { colors, fontSize, space } from '@/theme/tokens'

const ALL_TRIGGERS = Object.keys(TRIGGER_LABELS) as TriggerType[]
const ALL_PETS = Object.keys(HOUSEHOLD_PET_LABELS) as HouseholdPet[]
const BACKGROUNDS = Object.keys(BACKGROUND_LABELS) as TrainingBackground[]
const LEASH_OPTS = (Object.keys(LEASH_LABELS) as LeashBehavior[]).filter((k) => k !== 'not_yet_out')
const ENV_OPTS = (Object.keys(ENV_REACTION_LABELS) as NewEnvironmentReaction[]).filter(
  (k) => k !== 'not_yet_out',
)

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  )
}

type Props = {
  background: TrainingBackground
  setBackground: (v: TrainingBackground) => void
  hasBeenOut: boolean | null
  setBeenOut: (v: boolean) => void
  leashBehavior: LeashBehavior
  setLeashBehavior: (v: LeashBehavior) => void
  envReaction: NewEnvironmentReaction
  setEnvReaction: (v: NewEnvironmentReaction) => void
  triggers: TriggerType[]
  setTriggers: (v: TriggerType[] | ((p: TriggerType[]) => TriggerType[])) => void
  householdPets: HouseholdPet[]
  setHouseholdPets: (v: HouseholdPet[] | ((p: HouseholdPet[]) => HouseholdPet[])) => void
  problemNotes: string
  setProblemNotes: (v: string) => void
}

export function BehaviorStep(props: Props) {
  const {
    background,
    setBackground,
    hasBeenOut,
    setBeenOut,
    leashBehavior,
    setLeashBehavior,
    envReaction,
    setEnvReaction,
    triggers,
    setTriggers,
    householdPets,
    setHouseholdPets,
    problemNotes,
    setProblemNotes,
  } = props

  function toggleTrigger(t: TriggerType) {
    setTriggers((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  function togglePet(p: HouseholdPet) {
    setHouseholdPets((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Berätta om hunden</Text>
      <Text style={styles.sub}>Svara snabbt — vi anpassar rekommendationerna.</Text>

      <Text style={styles.q}>Hur erfaren är du som hundtränare?</Text>
      <View style={styles.row}>
        {BACKGROUNDS.map((k) => (
          <Chip
            key={k}
            label={BACKGROUND_LABELS[k]}
            selected={background === k}
            onPress={() => setBackground(k)}
          />
        ))}
      </View>

      <Text style={styles.q}>Har hunden varit ute regelbundet i okända miljöer?</Text>
      <View style={styles.row}>
        <Chip
          label="Ja"
          selected={hasBeenOut === true}
          onPress={() => setBeenOut(true)}
        />
        <Chip
          label="Nej"
          selected={hasBeenOut === false}
          onPress={() => setBeenOut(false)}
        />
      </View>

      {hasBeenOut === true ? (
        <>
          <Text style={styles.q}>Hur fungerar koppeln generellt?</Text>
          <View style={styles.row}>
            {LEASH_OPTS.map((k) => (
              <Chip
                key={k}
                label={LEASH_LABELS[k]}
                selected={leashBehavior === k}
                onPress={() => setLeashBehavior(k)}
              />
            ))}
          </View>

          <Text style={styles.q}>Hur reagerar hunden på ny miljö?</Text>
          <View style={styles.row}>
            {ENV_OPTS.map((k) => (
              <Chip
                key={k}
                label={ENV_REACTION_LABELS[k]}
                selected={envReaction === k}
                onPress={() => setEnvReaction(k)}
              />
            ))}
          </View>

          <Text style={styles.q}>Vad brukar trigga hunden?</Text>
          <View style={styles.row}>
            {ALL_TRIGGERS.map((t) => (
              <Chip
                key={t}
                label={TRIGGER_LABELS[t]}
                selected={triggers.includes(t)}
                onPress={() => toggleTrigger(t)}
              />
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.q}>Finns det andra husdjur hemma?</Text>
      <View style={styles.row}>
        {ALL_PETS.map((p) => (
          <Chip
            key={p}
            label={HOUSEHOLD_PET_LABELS[p]}
            selected={householdPets.includes(p)}
            onPress={() => togglePet(p)}
          />
        ))}
      </View>

      <Text style={styles.q}>Något specifikt du vill lösa?</Text>
      <TextInput
        style={styles.notes}
        value={problemNotes}
        onChangeText={(t) => setProblemNotes(t.slice(0, 300))}
        placeholder="Valfritt"
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={300}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm, paddingBottom: space.lg },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
  sub: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: space.md },
  q: { fontSize: fontSize.base, fontWeight: '600', color: colors.text, marginTop: space.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.bgAlt,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.text },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  notes: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: space.md,
    textAlignVertical: 'top',
    color: colors.text,
    backgroundColor: colors.surface,
  },
})
