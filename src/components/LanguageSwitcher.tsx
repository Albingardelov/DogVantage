'use client'

import { useTranslation } from 'react-i18next'
import { SUPPORTED_LOCALES, type Locale } from '@/i18n/config'
import styles from './LanguageSwitcher.module.css'

const LABELS: Record<Locale, string> = {
  sv: 'Svenska',
  en: 'English',
  de: 'Deutsch',
}

const CACHE_KEY = 'dv.locale'

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  async function choose(locale: Locale) {
    if (locale === i18n.language) return
    await i18n.changeLanguage(locale)
    window.localStorage.setItem(CACHE_KEY, locale)
    fetch('/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    }).catch(() => {})
  }

  return (
    <section className={styles.wrap}>
      <h2 className={styles.title}>{t('profile.language')}</h2>
      <div className={styles.options}>
        {SUPPORTED_LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            className={`${styles.option} ${i18n.language === locale ? styles.active : ''}`}
            aria-pressed={i18n.language === locale}
            onClick={() => choose(locale)}
          >
            {LABELS[locale]}
          </button>
        ))}
      </div>
    </section>
  )
}
