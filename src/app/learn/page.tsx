'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import ProfileGuard from '@/components/ProfileGuard'
import BottomNav from '@/components/BottomNav'
import CurriculumView from '@/components/CurriculumView'
import { useActiveDog } from '@/lib/dog/active-dog-context'
import { IconCaretRight } from '@/components/icons'
import { CATEGORIES, TAB_LABELS, type TabKey } from './articles'
import styles from './page.module.css'

type LearnTab = TabKey | 'kurs'

const STATIC_TABS = Object.keys(TAB_LABELS) as TabKey[]
const TAB_LABELS_EXT: Record<LearnTab, string> = {
  kurs: 'Din kurs',
  ...TAB_LABELS,
}

export default function LearnPage() {
  return (
    <ProfileGuard>
      <Suspense>
        <Learn />
      </Suspense>
    </ProfileGuard>
  )
}

function Learn() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { activeDog } = useActiveDog()

  const rawTab = searchParams.get('tab') as LearnTab | null
  const activeTab: LearnTab = rawTab === 'kurs' || (rawTab && rawTab in CATEGORIES)
    ? rawTab
    : 'kurs'
  const [expandedId, setExpandedId] = useState<string | null>(searchParams.get('article'))

  function setTab(tab: LearnTab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    params.delete('article')
    router.replace(`${pathname}?${params.toString()}`)
    setExpandedId(null)
  }

  const articles = activeTab !== 'kurs' ? CATEGORIES[activeTab as TabKey] : []

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Förarguider</h1>
        <p className={styles.subtitle}>Kunskapen som gör dig till en bättre tränare</p>
      </header>

      <nav className={styles.tabs} aria-label="Guidekategorier">
        {(['kurs', ...STATIC_TABS] as LearnTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setTab(tab)}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            {TAB_LABELS_EXT[tab]}
          </button>
        ))}
      </nav>

      <div className={styles.body}>
        {activeTab === 'kurs' && activeDog?.id && (
          <CurriculumView dogId={activeDog.id} />
        )}
        {activeTab === 'kurs' && !activeDog?.id && (
          <p className={styles.subtitle}>Logga in och välj hund för att se din kurs.</p>
        )}

        {activeTab !== 'kurs' && articles.map((article) => {
          const isOpen = expandedId === article.id
          return (
            <div key={article.id} className={`${styles.card} ${isOpen ? styles.cardOpen : ''}`}>
              <button
                type="button"
                className={styles.cardHeader}
                onClick={() => setExpandedId(isOpen ? null : article.id)}
                aria-expanded={isOpen}
              >
                <div className={styles.cardMeta}>
                  <span className={styles.readTime}>{article.readTime}</span>
                  <h2 className={styles.cardTitle}>{article.title}</h2>
                  <p className={styles.cardSummary}>{article.summary}</p>
                </div>
                <IconCaretRight
                  size="sm"
                  className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                />
              </button>

              {isOpen && (
                <div className={styles.content}>
                  {article.sections.map((s) => (
                    <div key={s.heading} className={styles.section}>
                      <h3 className={styles.sectionHeading}>{s.heading}</h3>
                      <p className={styles.sectionBody}>{s.body}</p>
                    </div>
                  ))}
                  <div className={styles.sources}>
                    <span className={styles.sourcesLabel}>Källa:</span>{' '}
                    {article.sources.join(' · ')}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <BottomNav active="learn" />
    </main>
  )
}
