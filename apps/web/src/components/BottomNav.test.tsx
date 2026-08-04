import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, it, expect } from 'vitest'
import BottomNav from './BottomNav'
import { createI18nInstance } from '@/i18n/create-instance'

function renderIn(locale: 'sv' | 'en' | 'de') {
  return render(
    <I18nextProvider i18n={createI18nInstance(locale)}>
      <BottomNav active="dashboard" />
    </I18nextProvider>,
  )
}

describe('BottomNav i18n', () => {
  it('renders Swedish labels', () => {
    renderIn('sv')
    expect(screen.getByText('Hem')).toBeInTheDocument()
    expect(screen.getByText('Färdigheter')).toBeInTheDocument()
  })

  it('renders English labels', () => {
    renderIn('en')
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Skills')).toBeInTheDocument()
  })
})
