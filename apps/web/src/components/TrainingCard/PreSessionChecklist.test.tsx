import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import PreSessionChecklist from './PreSessionChecklist'

describe('PreSessionChecklist', () => {
  beforeEach(() => localStorage.clear())

  it('renders custom items when provided', () => {
    render(
      <PreSessionChecklist
        ageWeeks={12}
        dateKey="2026-07-26"
        dogId="dog-1"
        items={['Custom tip one', 'Idag: Nivå 1 — Sitt och vänta']}
      />,
    )
    expect(screen.getByText('Custom tip one')).toBeInTheDocument()
    expect(screen.getByText(/Idag: Nivå 1/)).toBeInTheDocument()
    expect(screen.queryByText(/En övning i taget/)).not.toBeInTheDocument()
  })

  it('falls back to generic bullets when items are omitted', () => {
    render(<PreSessionChecklist ageWeeks={12} dateKey="2026-07-26" dogId="dog-1" />)
    expect(screen.getByText(/En övning i taget/)).toBeInTheDocument()
  })
})
