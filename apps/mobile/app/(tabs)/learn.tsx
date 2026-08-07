import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArticleCard } from '@/components/learn/ArticleCard'
import { CurriculumModuleCard } from '@/components/learn/CurriculumModuleCard'
import { CATEGORIES, TAB_LABELS, type TabKey } from '@/content/articles'
import { useCurriculum } from '@/hooks/use-curriculum'
import { fetchActiveDog, type ActiveDog } from '@/lib/dog/active-dog'
import { colors, fontSize, space } from '@/theme/tokens'

type MainTab = 'kurs' | TabKey

const TABS: { key: MainTab; label: string }[] = [
  { key: 'kurs', label: 'Din kurs' },
  ...(Object.keys(TAB_LABELS) as TabKey[]).map((k) => ({ key: k as MainTab, label: TAB_LABELS[k] })),
]

export default function LearnScreen() {
  const insets = useSafeAreaInsets()
  const [dog, setDog] = useState<ActiveDog | null>(null)
  const [tab, setTab] = useState<MainTab>('kurs')
  const curriculum = useCurriculum(dog?.id)

  const boot = useCallback(async () => {
    setDog(await fetchActiveDog())
  }, [])

  useFocusEffect(
    useCallback(() => {
      void boot()
      void curriculum.reload()
    }, [boot, curriculum.reload]),
  )

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.lg }]}>
      <Text style={styles.title}>Guider</Text>
      <Text style={styles.sub}>Kurs, artiklar och kunskapstest</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabOn]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextOn]}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]}
        refreshControl={
          <RefreshControl
            refreshing={curriculum.loading}
            onRefresh={() => {
              void boot()
              void curriculum.reload()
            }}
          />
        }
      >
        {tab === 'kurs' ? (
          <>
            {curriculum.overview ? (
              <Text style={styles.progress}>
                {curriculum.overview.completedCount}/{curriculum.overview.modules.length} klara ·{' '}
                {curriculum.overview.lifeStage}
              </Text>
            ) : null}
            {curriculum.loading && !curriculum.overview ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} />
            ) : null}
            {curriculum.error ? <Text style={styles.error}>{curriculum.error}</Text> : null}
            {curriculum.overview?.modules.map((m) => (
              <CurriculumModuleCard
                key={m.id}
                module={m}
                completing={curriculum.completingId === m.id}
                onComplete={() => void curriculum.completeModule(m.id)}
              />
            ))}
            {!curriculum.loading && curriculum.overview?.modules.length === 0 ? (
              <Text style={styles.empty}>Ingen kurs tillgänglig för den här hunden ännu.</Text>
            ) : null}
          </>
        ) : (
          CATEGORIES[tab].map((article) => <ArticleCard key={article.id} article={article} />)
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: space.xl,
  },
  sub: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    paddingHorizontal: space.xl,
    marginTop: space.xs,
    marginBottom: space.md,
  },
  tabs: { maxHeight: 44, paddingHorizontal: space.xl, marginBottom: space.md },
  tab: {
    marginRight: space.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.bgAlt,
    justifyContent: 'center',
  },
  tabOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: fontSize.sm, color: colors.text },
  tabTextOn: { color: '#fff', fontWeight: '600' },
  content: { paddingHorizontal: space.xl },
  progress: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: space.md },
  error: { color: colors.error, marginBottom: space.md },
  empty: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: space.lg },
})
