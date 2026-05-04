'use client'

import Link from 'next/link'
import styles from './BottomNav.module.css'

export type BottomNavTab = 'dashboard' | 'chat' | 'log' | 'learn'

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
            <Icon id={item.id} />
            <span className={styles.label}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function Icon({ id }: { id: BottomNavTab }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  if (id === 'dashboard') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  }
  if (id === 'chat') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    )
  }
  if (id === 'learn') {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    )
  }
  return (
    <svg {...common} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  )
}
