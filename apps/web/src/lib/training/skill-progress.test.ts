import { describe, it, expect } from 'vitest'
import { aggregateSkillProgress, isoMondayOf, type MetricRow } from './skill-progress'

const labels = { sit: 'Sitt', recall: 'Inkallning', leash: 'Koppel' }

describe('isoMondayOf', () => {
  it('returns same day for a Monday', () => {
    expect(isoMondayOf('2026-05-04')).toBe('2026-05-04')
  })
  it('returns previous Monday for Sunday', () => {
    expect(isoMondayOf('2026-05-03')).toBe('2026-04-27')
  })
  it('returns previous Monday for Wednesday', () => {
    expect(isoMondayOf('2026-05-06')).toBe('2026-05-04')
  })
})

describe('aggregateSkillProgress', () => {
  const endDate = new Date('2026-05-07T12:00:00Z')

  function row(over: Partial<MetricRow>): MetricRow {
    return {
      exercise_id: 'sit',
      date: '2026-05-05',
      success_count: 0,
      fail_count: 0,
      criteria_level_id: null,
      ...over,
    }
  }

  it('returns empty array when no rows', () => {
    expect(aggregateSkillProgress([], { exerciseLabels: labels, endDate })).toEqual([])
  })

  it('skips exercises with zero total attempts', () => {
    const rows = [row({ exercise_id: 'sit', success_count: 0, fail_count: 0 })]
    expect(aggregateSkillProgress(rows, { exerciseLabels: labels, endDate })).toEqual([])
  })

  it('computes overall success rate', () => {
    const rows = [
      row({ exercise_id: 'sit', date: '2026-05-05', success_count: 8, fail_count: 2 }),
    ]
    const out = aggregateSkillProgress(rows, { exerciseLabels: labels, endDate })
    expect(out).toHaveLength(1)
    expect(out[0].exercise_id).toBe('sit')
    expect(out[0].label).toBe('Sitt')
    expect(out[0].total_attempts).toBe(10)
    expect(out[0].overall_success_rate).toBeCloseTo(0.8)
  })

  it('returns 4 weekly buckets by default', () => {
    const rows = [row({ exercise_id: 'sit', date: '2026-05-05', success_count: 5, fail_count: 0 })]
    const out = aggregateSkillProgress(rows, { exerciseLabels: labels, endDate })
    expect(out[0].weeks).toHaveLength(4)
  })

  it('null success_rate when a week has no attempts', () => {
    const rows = [row({ exercise_id: 'sit', date: '2026-05-05', success_count: 5, fail_count: 0 })]
    const out = aggregateSkillProgress(rows, { exerciseLabels: labels, endDate })
    const week = out[0].weeks.find((w) => w.attempts === 0)
    expect(week?.success_rate).toBeNull()
  })

  it('sorts by total_attempts desc and respects topN', () => {
    const rows: MetricRow[] = [
      row({ exercise_id: 'sit', date: '2026-05-05', success_count: 5, fail_count: 0 }),
      row({ exercise_id: 'recall', date: '2026-05-05', success_count: 30, fail_count: 0 }),
      row({ exercise_id: 'leash', date: '2026-05-05', success_count: 10, fail_count: 0 }),
    ]
    const out = aggregateSkillProgress(rows, { exerciseLabels: labels, endDate, topN: 2 })
    expect(out).toHaveLength(2)
    expect(out[0].exercise_id).toBe('recall')
    expect(out[1].exercise_id).toBe('leash')
  })

  it('drops rows older than the window', () => {
    const rows: MetricRow[] = [
      row({ exercise_id: 'sit', date: '2026-04-01', success_count: 100, fail_count: 0 }),
      row({ exercise_id: 'sit', date: '2026-05-05', success_count: 1, fail_count: 0 }),
    ]
    const out = aggregateSkillProgress(rows, { exerciseLabels: labels, endDate, weeks: 2 })
    expect(out[0].total_attempts).toBe(1)
  })

  it('computes positive delta when later weeks improve', () => {
    const rows: MetricRow[] = [
      row({ exercise_id: 'sit', date: '2026-04-13', success_count: 4, fail_count: 6 }),
      row({ exercise_id: 'sit', date: '2026-04-20', success_count: 5, fail_count: 5 }),
      row({ exercise_id: 'sit', date: '2026-04-27', success_count: 8, fail_count: 2 }),
      row({ exercise_id: 'sit', date: '2026-05-04', success_count: 9, fail_count: 1 }),
    ]
    const out = aggregateSkillProgress(rows, { exerciseLabels: labels, endDate, weeks: 4 })
    expect(out[0].delta).not.toBeNull()
    expect((out[0].delta ?? 0) > 0).toBe(true)
  })

  it('uses latest criteria level id by date', () => {
    const rows: MetricRow[] = [
      row({ exercise_id: 'sit', date: '2026-04-20', success_count: 1, fail_count: 0, criteria_level_id: 'home_2steps' }),
      row({ exercise_id: 'sit', date: '2026-05-05', success_count: 1, fail_count: 0, criteria_level_id: 'outdoor_low' }),
    ]
    const out = aggregateSkillProgress(rows, { exerciseLabels: labels, endDate })
    expect(out[0].latest_criteria_level_id).toBe('outdoor_low')
  })

  it('falls back to exercise_id when label is missing', () => {
    const rows = [row({ exercise_id: 'unknown_x', date: '2026-05-05', success_count: 1, fail_count: 0 })]
    const out = aggregateSkillProgress(rows, { exerciseLabels: labels, endDate })
    expect(out[0].label).toBe('unknown_x')
  })
})
