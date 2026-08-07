import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { SkillProgress } from '@dogvantage/core'
import { SkillSparkline } from '@/components/skills/SkillSparkline'
import { SKILL_ENVIRONMENT_LABELS } from '@/lib/training/environment-labels'
import { colors, fontSize, space } from '@/theme/tokens'

type Props = {
  skill: SkillProgress
  prioritized: boolean
  canPrioritize: boolean
  showEnv: boolean
  onTogglePriority: () => void
}

export function SkillRow({
  skill,
  prioritized,
  canPrioritize,
  showEnv,
  onTogglePriority,
}: Props) {
  const ratePct = Math.round(skill.overall_success_rate * 100)
  const deltaPct = skill.delta == null ? null : Math.round(skill.delta * 100)
  const deltaLabel =
    deltaPct == null ? null : deltaPct > 0 ? `↑ +${deltaPct}p` : deltaPct < 0 ? `↓ ${deltaPct}p` : '= 0p'

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.left}>
          <Text style={styles.label}>{skill.label}</Text>
          <Text style={styles.rate}>{ratePct}%</Text>
          <SkillSparkline weeks={skill.weeks} />
          <Text style={styles.meta}>{skill.total_attempts} repetitioner</Text>
          {skill.latest_criteria_level_label ? (
            <Text style={styles.badge}>Nu: {skill.latest_criteria_level_label}</Text>
          ) : null}
          {deltaLabel ? <Text style={styles.delta}>{deltaLabel}</Text> : null}
        </View>
        <Pressable
          style={[
            styles.prioBtn,
            prioritized && styles.prioOn,
            !canPrioritize && !prioritized && styles.prioDisabled,
          ]}
          disabled={!canPrioritize && !prioritized}
          onPress={onTogglePriority}
          accessibilityRole="button"
          accessibilityState={{ selected: prioritized }}
        >
          <Text style={[styles.prioLabel, prioritized && styles.prioLabelOn]}>
            {prioritized ? 'Prioriterad' : 'Prioritera'}
          </Text>
        </Pressable>
      </View>
      {showEnv && skill.environments.length > 0 ? (
        <View style={styles.envBlock}>
          {skill.environments.map((e) => (
            <Text key={e.environment} style={styles.envLine}>
              {SKILL_ENVIRONMENT_LABELS[e.environment]}:{' '}
              {e.success_rate == null ? '—' : `${Math.round(e.success_rate * 100)}%`} ({e.attempts})
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.md,
  },
  top: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  left: { flex: 1 },
  label: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
  rate: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary, marginTop: space.xs },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: space.xs },
  badge: {
    marginTop: space.sm,
    alignSelf: 'flex-start',
    fontSize: fontSize.xs,
    color: colors.text,
    backgroundColor: colors.bgAlt,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  delta: { marginTop: space.xs, fontSize: fontSize.xs, color: colors.textMuted },
  prioBtn: {
    minHeight: 36,
    paddingHorizontal: space.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prioOn: { backgroundColor: colors.primary },
  prioDisabled: { opacity: 0.35 },
  prioLabel: { color: colors.primary, fontWeight: '600', fontSize: fontSize.xs },
  prioLabelOn: { color: '#fff' },
  envBlock: { marginTop: space.md, gap: 2 },
  envLine: { fontSize: fontSize.xs, color: colors.textMuted },
})
