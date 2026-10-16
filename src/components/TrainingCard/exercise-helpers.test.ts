import { describe, it, expect } from 'vitest'
import { emptyMetrics, incrementedCountPatch, successRatePercent } from './exercise-helpers'

describe('incrementedCountPatch', () => {
  it('starts from zero when no metrics exist yet', () => {
    expect(incrementedCountPatch(null, 'success_count')).toEqual({ success_count: 1 })
    expect(incrementedCountPatch(null, 'fail_count')).toEqual({ fail_count: 1 })
  })

  it('adds one to the latest known count of the given field only', () => {
    const current = { ...emptyMetrics(), success_count: 3, fail_count: 7 }
    expect(incrementedCountPatch(current, 'success_count')).toEqual({ success_count: 4 })
    expect(incrementedCountPatch(current, 'fail_count')).toEqual({ fail_count: 8 })
  })
})

describe('successRatePercent', () => {
  it('is null when nothing has been attempted', () => {
    expect(successRatePercent(0, 0)).toBeNull()
  })

  it('is 0 when every attempt missed', () => {
    expect(successRatePercent(0, 4)).toBe(0)
  })

  it('is 100 when every attempt succeeded', () => {
    expect(successRatePercent(5, 0)).toBe(100)
  })

  it('rounds the share of successful attempts', () => {
    expect(successRatePercent(2, 1)).toBe(67)
  })
})
