import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LanguageSwitcher from './LanguageSwitcher'
import { createI18nInstance } from '@/i18n/create-instance'

const fetchMock = vi.fn()
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ locale: 'en' }) })
  localStorage.clear()
})

describe('LanguageSwitcher', () => {
  it('switches the active language and persists it', async () => {
    const i18n = createI18nInstance('sv')
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher />
      </I18nextProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    await waitFor(() => expect(i18n.language).toBe('en'))
    expect(localStorage.getItem('dv.locale')).toBe('en')
    expect(fetchMock).toHaveBeenCalledWith('/api/account', expect.objectContaining({ method: 'PATCH' }))
  })
})
