import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DayComplete } from './parts'

describe('DayComplete', () => {
  it('summarises reps and success rate', () => {
    render(<DayComplete repsDone={9} successRate={78} />)
    expect(screen.getByText(/Klart för idag/i)).toBeInTheDocument()
    expect(screen.getByText(/9/)).toBeInTheDocument()
    expect(screen.getByText(/78%/)).toBeInTheDocument()
  })

  it('omits the rate when null', () => {
    render(<DayComplete repsDone={3} successRate={null} />)
    expect(screen.getByText(/Klart för idag/i)).toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })
})
