import { describe, it, expect } from 'vitest'
import {
  sanitizeFocusAreas,
  focusExerciseIds,
  focusPromptRule,
  currentIsoWeek,
  MAX_WEEKLY_FOCUS,
} from './weekly-focus'

describe('sanitizeFocusAreas', () => {
  it('returns empty array for non-array input', () => {
    expect(sanitizeFocusAreas(null)).toEqual([])
    expect(sanitizeFocusAreas('recall')).toEqual([])
    expect(sanitizeFocusAreas({})).toEqual([])
  })

  it('drops invalid entries', () => {
    expect(sanitizeFocusAreas(['recall', 'bogus', 42])).toEqual(['recall'])
  })

  it('deduplicates', () => {
    expect(sanitizeFocusAreas(['recall', 'recall', 'attention'])).toEqual(['recall', 'attention'])
  })

  it('caps at MAX_WEEKLY_FOCUS', () => {
    const tooMany = ['recall', 'attention', 'impulse_calm', 'nosework']
    expect(sanitizeFocusAreas(tooMany)).toHaveLength(MAX_WEEKLY_FOCUS)
  })
})

describe('focusExerciseIds', () => {
  it('returns empty array for empty focus', () => {
    expect(focusExerciseIds([])).toEqual([])
  })

  it('expands one area to its exercise ids', () => {
    expect(focusExerciseIds(['recall'])).toEqual(['inkallning', 'stoppsignal'])
  })

  it('merges and deduplicates across areas', () => {
    const ids = focusExerciseIds(['impulse_calm', 'place_settle'])
    expect(ids).toContain('impulskontroll')
    expect(ids).toContain('plats')
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})

describe('focusPromptRule', () => {
  it('returns null when no focus selected', () => {
    expect(focusPromptRule([])).toBeNull()
  })
  it('mentions selected labels and exercise ids', () => {
    const rule = focusPromptRule(['recall'])!
    expect(rule).toContain('Inkallning & stopp')
    expect(rule).toContain('inkallning')
    expect(rule).toContain('stoppsignal')
  })
})

describe('currentIsoWeek', () => {
  it('formats as YYYY-Www', () => {
    expect(currentIsoWeek(new Date('2026-05-07T12:00:00'))).toMatch(/^\d{4}-W\d{2}$/)
  })
})
