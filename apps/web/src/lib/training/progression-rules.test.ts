import { describe, it, expect } from 'vitest'
import { computeProgressionDecisions, formatProgressionRule } from './progression-rules'

const today = new Date('2026-05-11T12:00:00Z')

function row(opts: {
  id: string
  date: string
  s: number
  f: number
  latency?: 'lt1s' | '1to3s' | 'gt3s' | null
  rung?: string | null
}) {
  return {
    exercise_id: opts.id,
    date: opts.date,
    success_count: opts.s,
    fail_count: opts.f,
    latency_bucket: opts.latency ?? null,
    criteria_level_id: opts.rung ?? null,
  }
}

function sessionRow(opts: { id: string; date: string; rung?: string | null }) {
  return {
    exercise_id: opts.id,
    date: opts.date,
    criteria_level_id: opts.rung ?? null,
  }
}

describe('computeProgressionDecisions', () => {
  it('advances when success rate >= 80% over enough reps', () => {
    const rows = [
      row({ id: 'sitt', date: '2026-05-10', s: 8, f: 1, rung: 'home_signal' }),
      row({ id: 'sitt', date: '2026-05-09', s: 7, f: 1, rung: 'home_signal' }),
    ]
    const decisions = computeProgressionDecisions(rows, {
      now: today,
      sessionRows: [
        sessionRow({ id: 'sitt', date: '2026-05-10', rung: 'home_signal' }),
        sessionRow({ id: 'sitt', date: '2026-05-09', rung: 'home_signal' }),
      ],
    })
    expect(decisions).toHaveLength(1)
    expect(decisions[0].decision).toBe('advance')
    expect(decisions[0].criteria_level_id).toBe('home_signal')
  })

  it('regresses when success rate <= 60% over enough reps', () => {
    const rows = [
      row({ id: 'koppel', date: '2026-05-10', s: 3, f: 7 }),
      row({ id: 'koppel', date: '2026-05-09', s: 2, f: 8 }),
    ]
    const decisions = computeProgressionDecisions(rows, {
      now: today,
      sessionRows: [
        sessionRow({ id: 'koppel', date: '2026-05-10' }),
        sessionRow({ id: 'koppel', date: '2026-05-09' }),
      ],
    })
    expect(decisions[0].decision).toBe('regress')
  })

  it('holds when in the middle (60-80%)', () => {
    const rows = [
      row({ id: 'ligg', date: '2026-05-10', s: 7, f: 3 }),
      row({ id: 'ligg', date: '2026-05-09', s: 7, f: 3 }),
    ]
    const decisions = computeProgressionDecisions(rows, {
      now: today,
      sessionRows: [
        sessionRow({ id: 'ligg', date: '2026-05-10' }),
        sessionRow({ id: 'ligg', date: '2026-05-09' }),
      ],
    })
    expect(decisions[0].decision).toBe('hold')
  })

  it('holds when too few attempts (< 10)', () => {
    const rows = [
      row({ id: 'plats', date: '2026-05-10', s: 4, f: 0 }),
    ]
    const decisions = computeProgressionDecisions(rows, {
      now: today,
      sessionRows: [sessionRow({ id: 'plats', date: '2026-05-10' }), sessionRow({ id: 'plats', date: '2026-05-09' })],
    })
    expect(decisions[0].decision).toBe('hold')
    expect(decisions[0].reason).toContain('för få')
  })

  it('ignores rows older than the window', () => {
    const rows = [
      row({ id: 'sitt', date: '2026-04-01', s: 100, f: 0 }), // way outside window
    ]
    const decisions = computeProgressionDecisions(rows, { now: today, windowDays: 7 })
    expect(decisions).toHaveLength(0)
  })

  it('uses latency as a tiebreaker — fast pushes toward advance', () => {
    // 77% raw rate (borderline hold) + lt1s latency should push to advance
    const rows = [
      row({ id: 'inkallning', date: '2026-05-10', s: 8, f: 2, latency: 'lt1s' }),
      row({ id: 'inkallning', date: '2026-05-09', s: 7, f: 3, latency: 'lt1s' }),
    ]
    const decisions = computeProgressionDecisions(rows, {
      now: today,
      sessionRows: [
        sessionRow({ id: 'inkallning', date: '2026-05-10' }),
        sessionRow({ id: 'inkallning', date: '2026-05-09' }),
      ],
    })
    // 15/20 = 75% raw, +0.05 latency = 80% → advance
    expect(decisions[0].decision).toBe('advance')
  })

  it('orders output: regress first, then advance, then hold', () => {
    const rows = [
      row({ id: 'a_hold', date: '2026-05-10', s: 7, f: 3 }),
      row({ id: 'b_hold', date: '2026-05-09', s: 7, f: 3 }),
      row({ id: 'c_advance', date: '2026-05-10', s: 9, f: 1 }),
      row({ id: 'd_advance', date: '2026-05-09', s: 9, f: 1 }),
      row({ id: 'e_regress', date: '2026-05-10', s: 2, f: 8 }),
      row({ id: 'f_regress', date: '2026-05-09', s: 2, f: 8 }),
    ]
    const decisions = computeProgressionDecisions(rows, {
      now: today,
      sessionRows: [
        sessionRow({ id: 'a_hold', date: '2026-05-10' }),
        sessionRow({ id: 'a_hold', date: '2026-05-09' }),
        sessionRow({ id: 'b_hold', date: '2026-05-10' }),
        sessionRow({ id: 'b_hold', date: '2026-05-09' }),
        sessionRow({ id: 'c_advance', date: '2026-05-10' }),
        sessionRow({ id: 'c_advance', date: '2026-05-09' }),
        sessionRow({ id: 'd_advance', date: '2026-05-10' }),
        sessionRow({ id: 'd_advance', date: '2026-05-09' }),
        sessionRow({ id: 'e_regress', date: '2026-05-10' }),
        sessionRow({ id: 'e_regress', date: '2026-05-09' }),
        sessionRow({ id: 'f_regress', date: '2026-05-10' }),
        sessionRow({ id: 'f_regress', date: '2026-05-09' }),
      ],
    })
    expect(decisions.map((d) => d.decision)).toEqual(['regress', 'regress', 'advance', 'advance', 'hold', 'hold'])
  })

  it('tracks the latest criteria_level_id', () => {
    const rows = [
      row({ id: 'sitt', date: '2026-05-08', s: 5, f: 0, rung: 'home_lure' }),
      row({ id: 'sitt', date: '2026-05-10', s: 5, f: 0, rung: 'home_signal' }), // most recent
    ]
    const decisions = computeProgressionDecisions(rows, {
      now: today,
      sessionRows: [
        sessionRow({ id: 'sitt', date: '2026-05-08', rung: 'home_lure' }),
        sessionRow({ id: 'sitt', date: '2026-05-10', rung: 'home_signal' }),
      ],
    })
    expect(decisions.map((d) => d.criteria_level_id).sort()).toEqual(['home_lure', 'home_signal'])
  })

  it('holds when only one session exists on the current rung', () => {
    const rows = [
      row({ id: 'fot', date: '2026-05-10', s: 9, f: 1, rung: 'outdoor_low' }),
      row({ id: 'fot', date: '2026-05-10', s: 9, f: 1, rung: 'outdoor_low' }),
    ]
    const decisions = computeProgressionDecisions(rows, {
      now: today,
      sessionRows: [sessionRow({ id: 'fot', date: '2026-05-10', rung: 'outdoor_low' })],
    })
    expect(decisions[0].decision).toBe('hold')
    expect(decisions[0].reason).toContain('minst 2 pass')
  })
})

describe('computeProgressionDecisions thresholdOverrides', () => {
  it('thresholdOverrides raises the advance bar per exercise', () => {
    // 17/20 = 85% raw rate (no latency) → normally advance; with override +0.10 → 0.90 threshold → hold
    const rows = [
      row({ id: 'sitt', date: '2026-05-10', s: 9, f: 1 }),
      row({ id: 'sitt', date: '2026-05-09', s: 8, f: 2 }),
    ]
    const sessions = [
      sessionRow({ id: 'sitt', date: '2026-05-10' }),
      sessionRow({ id: 'sitt', date: '2026-05-09' }),
    ]
    const withoutOverride = computeProgressionDecisions(rows, { now: today, sessionRows: sessions })
    const withOverride = computeProgressionDecisions(rows, {
      now: today,
      sessionRows: sessions,
      thresholdOverrides: { sitt: 0.10 },
    })
    expect(withoutOverride[0].decision).toBe('advance')
    expect(withOverride[0].decision).toBe('hold')
  })

  it('threshold override is capped at 0.9', () => {
    // 92% success rate with override 0.5 → 0.8 + 0.5 capped to 0.9 → still advance
    const rows = [
      row({ id: 'inkallning', date: '2026-05-10', s: 10, f: 0 }),
      row({ id: 'inkallning', date: '2026-05-09', s: 9, f: 1 }),
    ]
    const sessions = [
      sessionRow({ id: 'inkallning', date: '2026-05-10' }),
      sessionRow({ id: 'inkallning', date: '2026-05-09' }),
    ]
    const result = computeProgressionDecisions(rows, {
      now: today,
      sessionRows: sessions,
      thresholdOverrides: { inkallning: 0.5 },
    })
    expect(result[0].decision).toBe('advance')
  })
})

describe('formatProgressionRule', () => {
  it('returns null when no actionable decisions', () => {
    const rule = formatProgressionRule([
      { exercise_id: 'sitt', criteria_level_id: 'home_signal', decision: 'hold', attempts: 15, success_rate: 0.7, reason: 'mitt i fönstret' },
    ])
    expect(rule).toBeNull()
  })

  it('formats advance and regress lines with labels', () => {
    const rule = formatProgressionRule(
      [
        { exercise_id: 'sitt', criteria_level_id: 'home_signal', decision: 'advance', attempts: 20, success_rate: 0.9, reason: '90% lyckade' },
        { exercise_id: 'koppel', criteria_level_id: 'outdoor_low', decision: 'regress', attempts: 15, success_rate: 0.4, reason: '40% lyckade' },
      ],
      { sitt: 'Sitt', koppel: 'Koppel' },
    )
    expect(rule).toContain('Sitt')
    expect(rule).toContain('HÖJ')
    expect(rule).toContain('Koppel')
    expect(rule).toContain('SÄNK')
  })
})
