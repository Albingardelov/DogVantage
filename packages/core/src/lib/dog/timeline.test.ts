import { describe, it, expect } from 'vitest'
import { summarizeDogTimeline } from './timeline'

describe('summarizeDogTimeline', () => {
  it('returns null without any data', () => {
    expect(summarizeDogTimeline({ checkIns: {}, recentTopics: [] })).toBeNull()
  })

  it('summarizes check-in zones', () => {
    const result = summarizeDogTimeline({
      checkIns: { '2026-06-09': 'green', '2026-06-10': 'green', '2026-06-11': 'red' },
      recentTopics: [],
    })
    expect(result).toContain('2 gröna')
    expect(result).toContain('1 röd')
  })

  it('lists recent chat topics', () => {
    const result = summarizeDogTimeline({
      checkIns: {},
      recentTopics: ['skällande', 'inkallning'],
    })
    expect(result).toContain('skällande')
    expect(result).toContain('inkallning')
  })

  it('combines zones and topics on separate lines', () => {
    const result = summarizeDogTimeline({
      checkIns: { '2026-06-11': 'yellow' },
      recentTopics: ['stress'],
    })
    expect(result?.split('\n')).toHaveLength(2)
  })
})
