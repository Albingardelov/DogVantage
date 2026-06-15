import { describe, it, expect } from 'vitest'
import { topBadge, type ReasonBadge } from './badges'

const priority: ReasonBadge = { label: 'Prioriterad', tone: 'priority' }
const focus: ReasonBadge = { label: 'Veckofokus', tone: 'focus' }
const weak: ReasonBadge = { label: 'Behöver mer tid', tone: 'weak' }

describe('topBadge', () => {
  it('prefers weak over focus over priority', () => {
    expect(topBadge([priority, focus, weak])?.tone).toBe('weak')
    expect(topBadge([priority, focus])?.tone).toBe('focus')
    expect(topBadge([priority])?.tone).toBe('priority')
  })

  it('returns null for no badges', () => {
    expect(topBadge([])).toBeNull()
  })
})
