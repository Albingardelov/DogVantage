import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Article } from '@/content/articles'
import { colors, fontSize, space } from '@/theme/tokens'

export function ArticleCard({ article }: { article: Article }) {
  const [open, setOpen] = useState(false)
  return (
    <View style={styles.card}>
      <Pressable onPress={() => setOpen((v) => !v)} accessibilityRole="button">
        <Text style={styles.title}>{article.title}</Text>
        <Text style={styles.meta}>{article.readTime}</Text>
        <Text style={styles.summary}>{article.summary}</Text>
      </Pressable>
      {open ? (
        <View style={styles.body}>
          {article.sections.map((s) => (
            <View key={s.heading} style={styles.section}>
              <Text style={styles.heading}>{s.heading}</Text>
              <Text style={styles.text}>{s.body}</Text>
            </View>
          ))}
          {article.sources.length > 0 ? (
            <Text style={styles.sources}>Källor: {article.sources.join(' · ')}</Text>
          ) : null}
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
  title: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: space.xs },
  summary: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: space.sm },
  body: { marginTop: space.md, gap: space.md },
  section: { gap: space.xs },
  heading: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  text: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  sources: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic' },
})
