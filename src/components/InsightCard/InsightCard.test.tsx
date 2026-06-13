import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFetch = vi.fn()
vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  ApiError: class extends Error {},
}))

import InsightCard from './InsightCard'

function payloadWith(entries: unknown[]) {
  return {
    version: 1,
    weakExercises: [],
    strongExercises: [],
    environmentDifficulty: {},
    environmentByExercise: entries,
    handler: { timing: null, consistency: null, reading: null, sampleSize: 0 },
    zoneSummary: { greenDays: 0, yellowDays: 0, redDays: 0, window: 14 },
    thresholdAdjustments: {},
  }
}

describe('InsightCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders nothing without a significant gap', async () => {
    mockApiFetch.mockResolvedValue(payloadWith([]))
    const { container } = render(<InsightCard dogId="dog-1" />)
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('renders insight copy when a gap exists', async () => {
    mockApiFetch.mockResolvedValue(payloadWith([
      { exerciseId: 'sitt', environment: 'home', successRate: 0.9, attempts: 10 },
      { exerciseId: 'sitt', environment: 'park', successRate: 0.4, attempts: 10 },
    ]))
    render(<InsightCard dogId="dog-1" />)
    expect(await screen.findByText('Sitt sitter hemma — men inte i parken')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gör till veckans prioritet' })).toBeInTheDocument()
  })

  it('dismisses and persists a 14-day silence window', async () => {
    mockApiFetch.mockResolvedValue(payloadWith([
      { exerciseId: 'sitt', environment: 'home', successRate: 0.9, attempts: 10 },
      { exerciseId: 'sitt', environment: 'park', successRate: 0.4, attempts: 10 },
    ]))
    const { container } = render(<InsightCard dogId="dog-1" />)
    await screen.findByText('Sitt sitter hemma — men inte i parken')
    fireEvent.click(screen.getByRole('button', { name: 'Stäng insikt' }))
    expect(container).toBeEmptyDOMElement()
    expect(localStorage.getItem('insight-dismissed:dog-1:sitt:park')).toBeTruthy()
  })

  it('does not render a dismissed insight within the window', async () => {
    localStorage.setItem('insight-dismissed:dog-1:sitt:park', new Date().toISOString())
    mockApiFetch.mockResolvedValue(payloadWith([
      { exerciseId: 'sitt', environment: 'home', successRate: 0.9, attempts: 10 },
      { exerciseId: 'sitt', environment: 'park', successRate: 0.4, attempts: 10 },
    ]))
    const { container } = render(<InsightCard dogId="dog-1" />)
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('adds the exercise as weekly priority on cta click', async () => {
    mockApiFetch
      .mockResolvedValueOnce(payloadWith([
        { exerciseId: 'sitt', environment: 'home', successRate: 0.9, attempts: 10 },
        { exerciseId: 'sitt', environment: 'park', successRate: 0.4, attempts: 10 },
      ]))
      .mockResolvedValueOnce({ isoWeek: '2026-W24', areas: [], exerciseIds: ['plats'] })
      .mockResolvedValueOnce({ isoWeek: '2026-W24', areas: [], exerciseIds: ['plats', 'sitt'] })
    render(<InsightCard dogId="dog-1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Gör till veckans prioritet' }))
    await screen.findByText('Tillagd som veckans prioritet')
    const putCall = mockApiFetch.mock.calls[2]
    expect(putCall[0]).toBe('/api/training/focus?dogId=dog-1')
    expect(JSON.parse((putCall[2] as RequestInit).body as string)).toEqual({
      exerciseIds: ['plats', 'sitt'],
    })
  })
})
