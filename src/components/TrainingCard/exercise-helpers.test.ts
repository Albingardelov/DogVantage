import { describe, it, expect } from 'vitest'
import { successRatePercent } from './exercise-helpers'

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
