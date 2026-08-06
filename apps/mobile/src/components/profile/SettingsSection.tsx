import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import type { HouseholdPet, TrainingGoal } from '@dogvantage/core'
import type { ProfileDraft } from '@/hooks/use-profile'
import {
  ENVIRONMENT_OPTIONS,
  GOAL_OPTIONS,
  PET_OPTIONS,
  REWARD_OPTIONS,
} from '@/lib/dog/profile'
import { ProfileSection } from '@/components/profile/ProfileSection'
import { colors, fontSize, space } from '@/theme/tokens'

type Props = {
  draft: ProfileDraft
  onChange: (next: ProfileDraft) => void
}

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

export function SettingsSection({ draft, onChange }: Props) {
  const ob = draft.onboarding

  function patchOnboarding(partial: Partial<ProfileDraft['onboarding']>) {
    onChange({ ...draft, onboarding: { ...ob, ...partial } })
  }

  function toggleGoal(g: TrainingGoal) {
    const goals = ob.goals.includes(g) ? ob.goals.filter((x) => x !== g) : [...ob.goals, g]
    if (goals.length === 0) return
    patchOnboarding({ goals })
  }

  function togglePet(p: HouseholdPet) {
    const pets = ob.householdPets ?? []
    const next = pets.includes(p) ? pets.filter((x) => x !== p) : [...pets, p]
    patchOnboarding({ householdPets: next.length ? next : undefined })
  }

  return (
    <>
      <ProfileSection title="Träningsmål">
        <View style={styles.wrap}>
          {GOAL_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={ob.goals.includes(o.value)}
              onPress={() => toggleGoal(o.value)}
            />
          ))}
        </View>
      </ProfileSection>

      <ProfileSection title="Träningsinställningar">
        <Text style={styles.label}>Miljö</Text>
        <View style={styles.wrap}>
          {ENVIRONMENT_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={ob.environment === o.value}
              onPress={() => patchOnboarding({ environment: o.value })}
            />
          ))}
        </View>
        <Text style={styles.label}>Belöning</Text>
        <View style={styles.wrap}>
          {REWARD_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={ob.rewardPreference === o.value}
              onPress={() => patchOnboarding({ rewardPreference: o.value })}
            />
          ))}
        </View>
        <Text style={styles.label}>Tar belöningar utomhus?</Text>
        <View style={styles.wrap}>
          <Chip
            label="Ja"
            selected={ob.takesRewardsOutdoors === true}
            onPress={() => patchOnboarding({ takesRewardsOutdoors: true })}
          />
          <Chip
            label="Nej"
            selected={ob.takesRewardsOutdoors === false}
            onPress={() => patchOnboarding({ takesRewardsOutdoors: false })}
          />
        </View>
      </ProfileSection>

      <ProfileSection title="Husdjur i hemmet">
        <View style={styles.wrap}>
          {PET_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={(ob.householdPets ?? []).includes(o.value)}
              onPress={() => togglePet(o.value)}
            />
          ))}
        </View>
      </ProfileSection>

      <ProfileSection title="Programvecka & anteckningar">
        <Text style={styles.label}>Programvecka</Text>
        <View style={styles.weekRow}>
          <Pressable
            style={styles.weekBtn}
            onPress={() =>
              onChange({ ...draft, trainingWeek: Math.max(1, draft.trainingWeek - 1) })
            }
            accessibilityRole="button"
            accessibilityLabel="Minska vecka"
          >
            <Text style={styles.weekBtnText}>−</Text>
          </Pressable>
          <Text style={styles.weekValue}>{draft.trainingWeek}</Text>
          <Pressable
            style={styles.weekBtn}
            onPress={() =>
              onChange({ ...draft, trainingWeek: Math.min(520, draft.trainingWeek + 1) })
            }
            accessibilityRole="button"
            accessibilityLabel="Öka vecka"
          >
            <Text style={styles.weekBtnText}>+</Text>
          </Pressable>
        </View>
        <Text style={styles.label}>Anteckningar</Text>
        <TextInput
          style={styles.notes}
          value={ob.ownerNotes ?? ''}
          onChangeText={(t) => patchOnboarding({ ownerNotes: t.slice(0, 500) })}
          placeholder="Valfria anteckningar om hunden"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
        />
      </ProfileSection>
    </>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginTop: space.sm,
  },
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
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
  weekBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBtnText: { fontSize: 22, color: colors.primary, fontWeight: '600' },
  weekValue: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, minWidth: 40, textAlign: 'center' },
  notes: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: space.md,
    textAlignVertical: 'top',
    color: colors.text,
    fontSize: fontSize.base,
    backgroundColor: colors.bg,
  },
})
