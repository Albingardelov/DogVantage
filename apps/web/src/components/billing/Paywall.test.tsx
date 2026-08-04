import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, it, expect } from 'vitest'
import { Paywall } from './Paywall'
import { createI18nInstance } from '@/i18n/create-instance'

describe('Paywall i18n', () => {
  it('renders the English paywall title', () => {
    const i18n = createI18nInstance('en')
    render(
      <I18nextProvider i18n={i18n}>
        <Paywall />
      </I18nextProvider>,
    )
    expect(screen.getByText(i18n.t('billing.paywallTitle'))).toBeInTheDocument()
  })
})
