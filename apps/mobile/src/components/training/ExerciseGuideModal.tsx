import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { getExerciseSpec, normalizeHandlerGuide } from '@dogvantage/core'
import { colors, fontSize, space } from '@/theme/tokens'

export function ExerciseGuideModal({
  exerciseId,
  exerciseLabel,
  visible,
  onClose,
}: {
  exerciseId: string | null
  exerciseLabel?: string | null
  visible: boolean
  onClose: () => void
}) {
  const spec = exerciseId ? getExerciseSpec(exerciseId) : null
  const guide = spec
    ? normalizeHandlerGuide(spec.guide, {
        definition: spec.definition,
        troubleshooting: spec.troubleshooting,
      })
    : null

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>{exerciseLabel ?? guide?.todaySummary ?? 'Guide'}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" style={styles.close}>
            <Text style={styles.closeLabel}>Stäng</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          {!spec ? (
            <Text style={styles.muted}>Ingen guide för den här övningen ännu.</Text>
          ) : !guide ? (
            <>
              <Text style={styles.summary}>{spec.definition}</Text>
              {spec.troubleshooting?.length ? (
                <Section title="Om det inte funkar" lines={spec.troubleshooting} />
              ) : null}
            </>
          ) : (
            <>
              {guide.todaySummary ? <Text style={styles.summary}>{guide.todaySummary}</Text> : null}
              {guide.setup?.length ? <Section title="Setup" lines={guide.setup} /> : null}
              {guide.steps?.map((step, i) => (
                <View key={i} style={styles.step}>
                  <Text style={styles.stepHow}>
                    {i + 1}. {step.how}
                  </Text>
                  {step.why ? <Text style={styles.stepWhy}>{step.why}</Text> : null}
                </View>
              ))}
              {guide.successLooksLike ? (
                <Section title="Så vet du att det funkar" lines={[guide.successLooksLike]} />
              ) : null}
              {guide.whenItFails?.length ? (
                <Section title="Om det inte funkar" lines={guide.whenItFails} />
              ) : null}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

function Section({ title, lines }: { title: string; lines: string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {lines.map((line, i) => (
        <Text key={i} style={styles.line}>
          • {line}
        </Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingTop: space.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    marginBottom: space.lg,
  },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text, flex: 1 },
  close: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.sm },
  closeLabel: { color: colors.primary, fontWeight: '600', fontSize: fontSize.base },
  body: { paddingHorizontal: space.xl, paddingBottom: space.xxl },
  muted: { color: colors.textMuted },
  summary: {
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: '600',
    marginBottom: space.lg,
  },
  section: { marginBottom: space.lg },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: space.sm,
  },
  line: { fontSize: fontSize.base, color: colors.text, marginBottom: space.xs },
  step: { marginBottom: space.lg },
  stepHow: { fontSize: fontSize.base, color: colors.text, fontWeight: '600' },
  stepWhy: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: space.xs },
})
