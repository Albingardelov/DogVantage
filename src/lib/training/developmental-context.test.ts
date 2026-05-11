import { describe, it, expect } from 'vitest'
import { getDevelopmentalWindow, formatDevelopmentalContext, getMaxSessionMinutes } from './developmental-context'

describe('getDevelopmentalWindow', () => {
  it('returns first fear period for 8-11 weeks', () => {
    expect(getDevelopmentalWindow(8)?.id).toBe('fear_period_1')
    expect(getDevelopmentalWindow(11)?.id).toBe('fear_period_1')
  })

  it('returns teething for 16-20 weeks', () => {
    expect(getDevelopmentalWindow(18)?.id).toBe('teething')
  })

  it('returns adolescent for 26-60 weeks', () => {
    expect(getDevelopmentalWindow(30)?.id).toBe('fear_period_2')
    expect(getDevelopmentalWindow(60)?.id).toBe('fear_period_2')
  })

  it('returns null outside windows', () => {
    expect(getDevelopmentalWindow(13)).toBeNull()
    expect(getDevelopmentalWindow(23)).toBeNull()
    expect(getDevelopmentalWindow(80)).toBeNull()
  })

  it('handles invalid input safely', () => {
    expect(getDevelopmentalWindow(0)).toBeNull()
    expect(getDevelopmentalWindow(NaN)).toBeNull()
    expect(getDevelopmentalWindow(-5)).toBeNull()
  })
})

describe('formatDevelopmentalContext', () => {
  it('returns prompt section for a puppy in fear period 1', () => {
    const ctx = formatDevelopmentalContext(9)
    expect(ctx).toContain('UTVECKLINGSFÖNSTER')
    expect(ctx).toContain('frykperiod')
  })

  it('returns null outside windows', () => {
    expect(formatDevelopmentalContext(13)).toBeNull()
  })
})

describe('getMaxSessionMinutes', () => {
  it('returns 1.5 min for puppies under 12 weeks', () => {
    expect(getMaxSessionMinutes(8)).toBe(1.5)
    expect(getMaxSessionMinutes(11)).toBe(1.5)
  })

  it('returns 3 min for puppies 12-15 weeks', () => {
    expect(getMaxSessionMinutes(13)).toBe(3)
  })

  it('returns 8 min for juniors 16-25 weeks', () => {
    expect(getMaxSessionMinutes(20)).toBe(8)
  })

  it('returns 15 min for adolescents and adults', () => {
    expect(getMaxSessionMinutes(30)).toBe(15)
    expect(getMaxSessionMinutes(104)).toBe(15)
  })
})
