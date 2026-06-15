import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import TrainingOnboarding from './TrainingOnboarding'

describe('TrainingOnboarding', () => {
  beforeEach(() => localStorage.clear())

  it('shows on first visit and advances through steps', () => {
    render(<TrainingOnboarding dogId="dog-1" />)
    expect(screen.getByText(/Så funkar Dagens pass/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Nästa/i }))
    expect(screen.getByText(/Lyckad eller Miss/i)).toBeInTheDocument()
  })

  it('does not show once the dog has been onboarded', () => {
    localStorage.setItem('dv:onboarded:training:dog-1', '1')
    const { container } = render(<TrainingOnboarding dogId="dog-1" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('skip sets the flag and closes', () => {
    render(<TrainingOnboarding dogId="dog-1" />)
    fireEvent.click(screen.getByRole('button', { name: /Hoppa över/i }))
    expect(localStorage.getItem('dv:onboarded:training:dog-1')).toBe('1')
    expect(screen.queryByText(/Så funkar Dagens pass/i)).not.toBeInTheDocument()
  })
})
