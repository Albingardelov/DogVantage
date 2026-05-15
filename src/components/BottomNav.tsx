'use client'

import Link from 'next/link'
import { NavIcon, type BottomNavTab } from '@/components/icons'
import styles from './BottomNav.module.css'

interface BottomNavProps {
  active: BottomNavTab
}

const ITEMS: { id: BottomNavTab; label: string; href: string }[] = [
  { id: 'dashboard', label: 'Hem', href: '/dashboard' },
  { id: 'chat', label: 'Chatt', href: '/chat' },
  { id: 'log', label: 'Logg', href: '/log' },
  { id: 'learn', label: 'Lär', href: '/learn' },
]

export default function BottomNav({ active }: BottomNavProps) {
  return (
    <nav className={styles.nav} aria-label="Huvudnavigering">
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
            <span className={styles.label}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
