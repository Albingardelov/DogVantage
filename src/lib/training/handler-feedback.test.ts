import { describe, it, expect } from 'vitest'
import { getHandlerFeedbackTip } from './handler-feedback'
import type { SessionLog } from '@/types'

function log(overrides: Partial<SessionLog>): SessionLog {
  return {
    id: 'x',
    user_id: 'u',
    breed: 'labrador',
    week_number: 1,
    quick_rating: 'good',
    focus: 4,
    obedience: 4,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('getHandlerFeedbackTip', () => {
  it('returns null with no logs', () => {
    expect(getHandlerFeedbackTip([], 'Bella')).toBeNull()
  })

  it('returns null when fewer than 3 samples for any dimension', () => {
    const logs = [log({ handler_timing: 2 }), log({ handler_timing: 2 })]
    expect(getHandlerFeedbackTip(logs, 'Bella')).toBeNull()
  })

  it('returns timing tip when timing is consistently low', () => {
    const logs = [
      log({ handler_timing: 2 }),
      log({ handler_timing: 2 }),
      log({ handler_timing: 3 }),
    ]
    const tip = getHandlerFeedbackTip(logs, 'Bella')
    expect(tip?.dimension).toBe('timing')
    expect(tip?.learnArticleId).toBe('timing')
    expect(tip?.id).toBe('handler-feedback-timing')
  })

  it('picks the lowest dimension when several are below threshold', () => {
    const logs = [
      log({ handler_timing: 2.5, handler_consistency: 2, handler_reading: 2.8 }),
      log({ handler_timing: 2.5, handler_consistency: 2, handler_reading: 2.8 }),
      log({ handler_timing: 2.5, handler_consistency: 2, handler_reading: 2.8 }),
    ]
    const tip = getHandlerFeedbackTip(logs, 'Bella')
    expect(tip?.dimension).toBe('consistency')
  })

  it('returns null when all dimensions are at or above threshold', () => {
    const logs = [
      log({ handler_timing: 4, handler_consistency: 4, handler_reading: 4 }),
      log({ handler_timing: 4, handler_consistency: 4, handler_reading: 4 }),
      log({ handler_timing: 4, handler_consistency: 4, handler_reading: 4 }),
    ]
    expect(getHandlerFeedbackTip(logs, 'Bella')).toBeNull()
  })

  it('ignores logs missing the dimension when counting samples', () => {
    const logs = [
      log({ handler_timing: 2 }),
      log({ handler_timing: 2 }),
      log({}),
      log({ handler_consistency: 2 }),
      log({ handler_consistency: 2 }),
      log({ handler_consistency: 2 }),
    ]
    const tip = getHandlerFeedbackTip(logs, 'Bella')
    expect(tip?.dimension).toBe('consistency')
  })

  it('treats zero as missing data (not a 0/5 score)', () => {
    const logs = [
      log({ handler_timing: 0 }),
      log({ handler_timing: 0 }),
      log({ handler_timing: 0 }),
    ]
    expect(getHandlerFeedbackTip(logs, 'Bella')).toBeNull()
  })
})
