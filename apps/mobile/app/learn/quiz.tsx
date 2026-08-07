import { useEffect } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuiz } from '@/hooks/use-quiz'
import { fetchActiveDog } from '@/lib/dog/active-dog'
import { useState } from 'react'
import { colors, fontSize, space } from '@/theme/tokens'

export default function LearnQuizScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{
    contextKey?: string
    title?: string
    body?: string
    exerciseId?: string
  }>()
  const [dogId, setDogId] = useState<string | undefined>()
  const quiz = useQuiz(dogId)

  useEffect(() => {
    void fetchActiveDog().then((d) => setDogId(d?.id))
  }, [])

  useEffect(() => {
    if (!dogId || !params.contextKey || !params.title || !params.body) return
    void quiz.load({
      contextKey: params.contextKey,
      title: params.title,
      body: params.body,
      exerciseId: params.exerciseId || undefined,
    })
    // intentionally only when dog/params ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dogId, params.contextKey, params.title, params.body, params.exerciseId])

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.lg }]}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backLabel}>← Tillbaka till kursen</Text>
      </Pressable>
      <Text style={styles.title}>{params.title ?? 'Quiz'}</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}>
        {quiz.loading ? <ActivityIndicator color={colors.primary} /> : null}
        {quiz.error ? <Text style={styles.error}>{quiz.error}</Text> : null}

        {quiz.grade ? (
          <View style={styles.results}>
            <Text style={styles.score}>
              {quiz.grade.correctCount}/{quiz.grade.total} rätt
            </Text>
            {quiz.grade.results.map((r) => (
              <View key={r.cardKey} style={styles.resultCard}>
                <Text style={r.correct ? styles.ok : styles.bad}>
                  {r.correct ? 'Rätt' : 'Fel'}
                </Text>
                <Text style={styles.explain}>{r.explanation}</Text>
              </View>
            ))}
            <Pressable style={styles.primary} onPress={() => router.back()}>
              <Text style={styles.primaryLabel}>Tillbaka</Text>
            </Pressable>
          </View>
        ) : (
          quiz.sessionQuiz?.questions.map((q) => (
            <View key={q.cardKey} style={styles.qCard}>
              <Text style={styles.qText}>{q.question}</Text>
              {q.options.map((opt, i) => {
                const selected = quiz.answers[q.cardKey] === i
                return (
                  <Pressable
                    key={`${q.cardKey}-${i}`}
                    style={[styles.opt, selected && styles.optOn]}
                    onPress={() => quiz.select(q.cardKey, i)}
                  >
                    <Text style={[styles.optText, selected && styles.optTextOn]}>{opt}</Text>
                  </Pressable>
                )
              })}
            </View>
          ))
        )}

        {!quiz.grade && quiz.sessionQuiz ? (
          <Pressable
            style={[styles.primary, quiz.grading && styles.disabled]}
            disabled={quiz.grading}
            onPress={() => void quiz.submit()}
          >
            {quiz.grading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryLabel}>Se resultat</Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.xl },
  back: { minHeight: 40, justifyContent: 'center', marginBottom: space.sm },
  backLabel: { color: colors.primary, fontWeight: '600' },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text, marginBottom: space.lg },
  error: { color: colors.error, marginBottom: space.md },
  qCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.md,
    gap: space.sm,
  },
  qText: { fontSize: fontSize.base, fontWeight: '600', color: colors.text, marginBottom: space.sm },
  opt: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    backgroundColor: colors.bgAlt,
  },
  optOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  optText: { color: colors.text, fontSize: fontSize.sm },
  optTextOn: { color: '#fff', fontWeight: '600' },
  primary: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.md,
  },
  primaryLabel: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
  results: { gap: space.md },
  score: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  ok: { color: colors.primary, fontWeight: '600' },
  bad: { color: colors.error, fontWeight: '600' },
  explain: { marginTop: space.xs, fontSize: fontSize.sm, color: colors.text },
})
