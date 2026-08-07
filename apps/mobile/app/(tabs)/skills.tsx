import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { SkillEnvironment, SkillProgress } from '@dogvantage/core'
import { SkillRow } from '@/components/skills/SkillRow'
import { useSkillProgress } from '@/hooks/use-skill-progress'
import { useWeeklyPriorities } from '@/hooks/use-weekly-priorities'
import { fetchActiveDog, type ActiveDog } from '@/lib/dog/active-dog'
import { SKILL_ENVIRONMENT_LABELS } from '@/lib/training/environment-labels'
import { colors, fontSize, space } from '@/theme/tokens'

const ENV_FILTERS: Array<SkillEnvironment | 'all'> = ['all', 'home', 'outdoor', 'park', 'mixed']

function sortSkills(list: SkillProgress[], env: SkillEnvironment | 'all'): SkillProgress[] {
  return [...list].sort((a, b) => {
    if (env !== 'all') {
      const ar = a.environments.find((e) => e.environment === env)?.success_rate
      const br = b.environments.find((e) => e.environment === env)?.success_rate
      const aRate = ar ?? 1
      const bRate = br ?? 1
      if (aRate !== bRate) return aRate - bRate
    }
    if (a.overall_success_rate !== b.overall_success_rate) {
      return a.overall_success_rate - b.overall_success_rate
    }
    return b.total_attempts - a.total_attempts
  })
}

export default function SkillsScreen() {
  const insets = useSafeAreaInsets()
  const [dog, setDog] = useState<ActiveDog | null>(null)
  const { exercises, loading, error, reload } = useSkillProgress(dog?.id, 8)
  const priorities = useWeeklyPriorities(dog?.id)
  const [query, setQuery] = useState('')
  const [env, setEnv] = useState<SkillEnvironment | 'all'>('all')

  const boot = useCallback(async () => {
    const active = await fetchActiveDog()
    setDog(active)
  }, [])

  useFocusEffect(
    useCallback(() => {
      void boot()
      void reload()
      void priorities.reload()
    }, [boot, reload, priorities.reload]),
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = exercises
    if (q) {
      list = list.filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          (s.latest_criteria_level_label ?? '').toLowerCase().includes(q),
      )
    }
    if (env !== 'all') {
      list = list.filter((s) => s.environments.some((e) => e.environment === env && e.attempts > 0))
    }
    return sortSkills(list, env)
  }, [exercises, query, env])

  async function onRefresh() {
    await boot()
    await Promise.all([reload(), priorities.reload()])
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.lg }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]}
        refreshControl={
          <RefreshControl refreshing={loading || priorities.loading} onRefresh={() => void onRefresh()} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Färdigheter</Text>
        <Text style={styles.sub}>Alla övningar, nuvarande nivå och resultat per miljö</Text>

        <Pressable style={styles.linkBtn} onPress={() => router.push('/calendar')} accessibilityRole="link">
          <Text style={styles.linkLabel}>Öppna passhistorik →</Text>
        </Pressable>

        {priorities.isoWeek ? (
          <Text style={styles.weekHint}>Prioriteringar gäller för {priorities.isoWeek}</Text>
        ) : null}

        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Sök övning eller nivå"
          placeholderTextColor={colors.textMuted}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {ENV_FILTERS.map((f) => (
            <Pressable
              key={f}
              style={[styles.chip, env === f && styles.chipOn]}
              onPress={() => setEnv(f)}
            >
              <Text style={[styles.chipText, env === f && styles.chipTextOn]}>
                {f === 'all' ? 'Alla miljöer' : SKILL_ENVIRONMENT_LABELS[f]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.prioRow}>
          <Text style={styles.prioCount}>
            Prioriterade: {priorities.priorityIds.length}/{priorities.max}
          </Text>
          <Pressable
            onPress={() =>
              void priorities.setPriorities(visible.slice(0, priorities.max).map((s) => s.exercise_id))
            }
            accessibilityRole="button"
          >
            <Text style={styles.autoPrio}>Prioritera {priorities.max} svagaste</Text>
          </Pressable>
        </View>
        <Text style={styles.sortHint}>Sortering: svagaste först · senaste 8 veckorna</Text>

        {loading && exercises.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} />
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && exercises.length === 0 && !error ? (
          <Text style={styles.empty}>Inga övningsmätningar ännu — logga reps på Hem för att se progress.</Text>
        ) : null}

        {!loading && exercises.length > 0 && visible.length === 0 ? (
          <Text style={styles.empty}>Ingen övning matchar din sökning ännu.</Text>
        ) : null}

        {visible.map((skill) => {
          const prioritized = priorities.priorityIds.includes(skill.exercise_id)
          return (
            <SkillRow
              key={skill.exercise_id}
              skill={skill}
              prioritized={prioritized}
              canPrioritize={prioritized || priorities.priorityIds.length < priorities.max}
              showEnv
              onTogglePriority={() => void priorities.togglePriority(skill.exercise_id)}
            />
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.xl },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
  sub: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: space.xs, marginBottom: space.md },
  linkBtn: { minHeight: 40, justifyContent: 'center', marginBottom: space.sm },
  linkLabel: { color: colors.primary, fontWeight: '600' },
  weekHint: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: space.md },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: fontSize.base,
    marginBottom: space.md,
  },
  chips: { marginBottom: space.md, maxHeight: 44 },
  chip: {
    marginRight: space.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.bgAlt,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.text },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  prioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.xs,
  },
  prioCount: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  autoPrio: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },
  sortHint: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: space.md },
  error: { color: colors.error, marginBottom: space.md },
  empty: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: space.lg },
})
