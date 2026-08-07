import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { colors, fontSize, space } from '@/theme/tokens'

type Lesson = {
  title: string
  body: string
  exerciseId: string
  exerciseLabel: string
  sources?: { source: string; source_url?: string | null }[]
}

type Props = {
  lesson: Lesson
  dogId: string
  onDismiss: () => void
}

export function MicroLessonCard({ lesson, dogId, onDismiss }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Mikrolektion · {lesson.exerciseLabel}</Text>
      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.body}>{lesson.body}</Text>
      {lesson.sources && lesson.sources.length > 0 ? (
        <Text style={styles.sources}>
          {lesson.sources
            .slice(0, 2)
            .map((s) => s.source)
            .join(' · ')}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Pressable
          style={styles.primary}
          onPress={() =>
            router.push({
              pathname: '/learn/quiz',
              params: {
                contextKey: `micro_${lesson.exerciseId}`,
                title: lesson.title,
                body: lesson.body.slice(0, 400),
                exerciseId: lesson.exerciseId,
                dogId,
              },
            })
          }
        >
          <Text style={styles.primaryLabel}>Testa kunskap</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={onDismiss}>
          <Text style={styles.secondaryLabel}>Stäng för idag</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    padding: space.lg,
    marginBottom: space.lg,
    gap: space.sm,
  },
  eyebrow: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  title: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  body: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  sources: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic' },
  actions: { marginTop: space.sm, gap: space.sm },
  primary: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { color: '#fff', fontWeight: '600' },
  secondary: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  secondaryLabel: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
})
