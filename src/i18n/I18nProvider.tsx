'use client'

import { useState, useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import { createI18nInstance } from './create-instance'
import { resolveLocale } from './resolve-locale'
import { isSupportedLocale, DEFAULT_LOCALE } from './config'

const CACHE_KEY = 'dv.locale'

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  // First paint uses DEFAULT_LOCALE on server and client so hydration matches
  // today's Swedish UI; the real locale is applied after mount.
  const [instance] = useState(() => createI18nInstance(DEFAULT_LOCALE))

  useEffect(() => {
    const local = resolveLocale({
      cached: window.localStorage.getItem(CACHE_KEY),
      deviceLanguage: window.navigator.language,
    })
    if (local !== instance.language) void instance.changeLanguage(local)

    let cancelled = false
    fetch('/api/account')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { locale?: string } | null) => {
        const stored = data?.locale
        if (!cancelled && isSupportedLocale(stored) && stored !== instance.language) {
          void instance.changeLanguage(stored)
          window.localStorage.setItem(CACHE_KEY, stored)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [instance])

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>
}
