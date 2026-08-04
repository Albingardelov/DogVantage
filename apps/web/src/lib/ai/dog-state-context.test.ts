import { describe, it, expect } from 'vitest'
import { formatDogStateForPrompt } from './dog-state-context'
import type { DogStatePayload } from '@dogvantage/core'

function emptyPayload(): DogStatePayload {
  return {
    version: 1,
    weakExercises: [],
    strongExercises: [],
    environmentDifficulty: {},
    handler: { timing: null, consistency: null, reading: null, sampleSize: 0 },
    zoneSummary: { greenDays: 0, yellowDays: 0, redDays: 0, window: 14 },
    thresholdAdjustments: {},
  }
}

describe('formatDogStateForPrompt', () => {
  it('returns null for a dog without signal', () => {
    expect(formatDogStateForPrompt(emptyPayload())).toBeNull()
  })

  it('lists weak and strong exercises with swedish labels and percentages', () => {
    const out = formatDogStateForPrompt({
      ...emptyPayload(),
      weakExercises: [{ exerciseId: 'inkallning', successRate: 0.4, attempts: 20 }],
      strongExercises: [{ exerciseId: 'sitt', successRate: 0.9, attempts: 30 }],
    })
    expect(out).toContain('Inkallning 40 % (20 försök)')
    expect(out).toContain('Sitt 90 %')
  })

  it('prefers per-exercise environment stats when present', () => {
    const out = formatDogStateForPrompt({
      ...emptyPayload(),
      environmentDifficulty: { home: 0.9 },
      environmentByExercise: [
        { exerciseId: 'sitt', environment: 'park', successRate: 0.4, attempts: 10 },
      ],
    })
    expect(out).toContain('Sitt i parken 40 %')
    expect(out).not.toContain('Andel lyckade per miljö')
  })

  it('falls back to aggregated environment difficulty', () => {
    const out = formatDogStateForPrompt({
      ...emptyPayload(),
      environmentDifficulty: { home: 0.85, outdoor: 0.55 },
    })
    expect(out).toContain('Andel lyckade per miljö')
    expect(out).toContain('hemma 85 %')
    expect(out).toContain('utomhus 55 %')
  })

  it('includes handler ratings only with >= 3 samples', () => {
    const base = {
      ...emptyPayload(),
      handler: { timing: 2.5, consistency: 4.0, reading: null, sampleSize: 2 },
    }
    expect(formatDogStateForPrompt(base)).toBeNull()

    const out = formatDogStateForPrompt({
      ...base,
      handler: { ...base.handler, sampleSize: 5 },
    })
    expect(out).toContain('timing 2.5/5')
    expect(out).toContain('konsekvens 4.0/5')
    expect(out).not.toContain('läsning')
  })

  it('summarizes check-in zones', () => {
    const out = formatDogStateForPrompt({
      ...emptyPayload(),
      zoneSummary: { greenDays: 8, yellowDays: 2, redDays: 1, window: 14 },
    })
    expect(out).toContain('8 gröna, 2 gula, 1 röda dagar')
  })
})
