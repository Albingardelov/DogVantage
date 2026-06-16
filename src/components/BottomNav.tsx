'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { NavIcon, type BottomNavTab } from '@/components/icons'
import styles from './BottomNav.module.css'

interface BottomNavProps {
  active: BottomNavTab
}

const ITEMS: { id: BottomNavTab; labelKey: string; href: string }[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', href: '/dashboard' },
  { id: 'chat', labelKey: 'nav.chat', href: '/chat' },
  { id: 'skills', labelKey: 'nav.skills', href: '/skills' },
  { id: 'learn', labelKey: 'nav.learn', href: '/learn' },
]

export default function BottomNav({ active }: BottomNavProps) {
  const { t } = useTranslation()
  return (
    <nav className={styles.nav} aria-label={t('nav.ariaLabel')}>
      {ITEMS.map((item) => {
        const isActive = item.id === active
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <NavIcon tab={item.id} />
            <span className={styles.label}>{t(item.labelKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
