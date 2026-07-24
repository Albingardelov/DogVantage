import { describe, expect, it } from 'vitest'
import {
  TRAINING_PROTOCOLS,
  PROTOCOL_BY_CHAT_TOPIC,
  computeProjectProgress,
  isProtocolId,
  type ProjectMetricRow,
} from './training-projects'
import { getExerciseSpec } from './exercise-specs'

describe('TRAINING_PROTOCOLS', () => {
  it('references only exercises that exist in the spec catalogue', () => {
    for (const protocol of Object.values(TRAINING_PROTOCOLS)) {
      expect(getExerciseSpec(protocol.primaryExerciseId), protocol.id).toBeTruthy()
      for (const id of protocol.supportExerciseIds) {
        expect(getExerciseSpec(id), `${protocol.id} support ${id}`).toBeTruthy()
      }
    }
  })

  it('has phase target rungs that exist in the primary ladder, in ascending order', () => {
    for (const protocol of Object.values(TRAINING_PROTOCOLS)) {
      const ladder = getExerciseSpec(protocol.primaryExerciseId)?.ladder ?? []
      const rungIds = ladder.map((rung) => rung.id)
      let prevIdx = -1
      for (const phase of protocol.phases) {
        const idx = rungIds.indexOf(phase.targetRungId)
        expect(idx, `${protocol.id}/${phase.id} rung ${phase.targetRungId}`).toBeGreaterThan(prevIdx)
        prevIdx = idx
      }
    }
  })

  it('maps chat topics to existing protocols', () => {
    for (const protocolId of Object.values(PROTOCOL_BY_CHAT_TOPIC)) {
      expect(isProtocolId(protocolId)).toBe(true)
    }
  })
})

describe('computeProjectProgress', () => {
  const recall = TRAINING_PROTOCOLS.recall

  function rows(input: Array<[string, number, number]>): ProjectMetricRow[] {
    return input.map(([criteria, success, fail]) => ({
      exercise_id: 'inkallning',
      success_count: success,
      fail_count: fail,
      criteria_level_id: criteria,
    }))
  }

  it('starts at phase 1 without any logged data', () => {
    const progress = computeProjectProgress(recall, [])
    expect(progress.currentPhase).toBe(1)
    expect(progress.completed).toBe(false)
    expect(progress.achievedRungLabel).toBeNull()
    expect(progress.nextStep).toContain('Inne · 2 m')
  })

  it('advances to the next phase when the target rung is achieved', () => {
    // home_2m (fas 1-mål) uppnådd: 8/9 lyckade.
    const progress = computeProjectProgress(recall, rows([['home_2m', 8, 1]]))
    expect(progress.currentPhase).toBe(2)
    expect(progress.phaseLabel).toBe('Ute i trädgården')
    expect(progress.achievedRungLabel).toContain('Inne · 2 m')
  })

  it('requires enough attempts before counting a rung as achieved', () => {
    // 100 % men bara 3 försök — otillräckligt underlag.
    const progress = computeProjectProgress(recall, rows([['home_2m', 3, 0]]))
    expect(progress.currentPhase).toBe(1)
  })

  it('counts a later rung as covering earlier phases', () => {
    // Hunden presterar direkt i parken → fas 1–3 räknas som klara.
    const progress = computeProjectProgress(recall, rows([['park_low', 10, 1]]))
    expect(progress.currentPhase).toBe(4)
  })

  it('marks the project completed when the last phase target is achieved', () => {
    const progress = computeProjectProgress(recall, rows([['park_medium', 12, 2]]))
    expect(progress.completed).toBe(true)
    expect(progress.currentPhase).toBe(recall.phases.length)
    expect(progress.nextStep).toBeNull()
  })

  it('ignores rows for other exercises and unknown rungs', () => {
    const progress = computeProjectProgress(recall, [
      { exercise_id: 'koppel', success_count: 20, fail_count: 0, criteria_level_id: 'outdoor_low' },
      { exercise_id: 'inkallning', success_count: 20, fail_count: 0, criteria_level_id: 'nonsense_rung' },
    ])
    expect(progress.currentPhase).toBe(1)
  })
})
