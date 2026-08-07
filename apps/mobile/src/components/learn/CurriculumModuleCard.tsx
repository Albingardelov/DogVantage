import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import type { CurriculumModule } from '@/hooks/use-curriculum'
import { colors, fontSize, space } from '@/theme/tokens'

type Props = {
  module: CurriculumModule
  completing: boolean
  onComplete: () => void
}

export function CurriculumModuleCard({ module, completing, onComplete }: Props) {
  const [open, setOpen] = useState(false)
  const locked = module.unlocked === false

  return (
    <View style={[styles.card, locked && styles.locked]}>
      <Pressable
        onPress={() => {
          if (!locked) setOpen((v) => !v)
        }}
        disabled={locked}
        accessibilityRole="button"
      >
        <Text style={styles.title}>
          {module.completed ? '✓ ' : ''}
          {module.title}
          {module.recommended ? ' · rekommenderad' : ''}
        </Text>
        <Text style={styles.meta}>
          {module.readMinutes} min · {module.goal}
          {locked ? ' · låst' : ''}
          {module.reviewSuggested ? ' · repetera quiz' : ''}
        </Text>
        <Text style={styles.summary}>{module.summary}</Text>
      </Pressable>

      {open && !locked ? (
        <View style={styles.body}>
          <Text style={styles.bodyText}>{module.body}</Text>
          {module.keyPoints.length > 0 ? (
            <View style={styles.points}>
              {module.keyPoints.map((p) => (
                <Text key={p} style={styles.point}>
                  • {p}
                </Text>
              ))}
            </View>
          ) : null}
          {!module.completed ? (
            <Pressable
              style={[styles.btn, completing && styles.disabled]}
              disabled={completing}
              onPress={onComplete}
            >
              {completing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnLabel}>Markera klar</Text>
              )}
            </Pressable>
          ) : null}
          <Pressable
            style={styles.secondary}
            onPress={() =>
              router.push({
                pathname: '/learn/quiz',
                params: {
                  contextKey: `curr_${module.id}`,
                  title: module.title,
                  body: module.body.slice(0, 400),
                  exerciseId: module.exerciseId ?? '',
                },
              })
            }
          >
            <Text style={styles.secondaryLabel}>Testa dig</Text>
          </Pressable>
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
  locked: { opacity: 0.55 },
  title: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: space.xs },
  summary: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: space.sm },
  body: { marginTop: space.md, gap: space.sm },
  bodyText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  points: { gap: 4 },
  point: { fontSize: fontSize.sm, color: colors.text },
  btn: {
    marginTop: space.md,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: { color: '#fff', fontWeight: '600' },
  secondary: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  secondaryLabel: { color: colors.primary, fontWeight: '600' },
  disabled: { opacity: 0.5 },
})
