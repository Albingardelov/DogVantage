import { describe, expect, it } from 'vitest'
import { getExerciseSpec } from './exercise-specs'
import { resolveLiveCoach } from './live-coach'

const ink = () => getExerciseSpec('inkallning')!

describe('resolveLiveCoach', () => {
  it('uses rung tips and failTips when present', () => {
    const spec = structuredClone(ink())
    spec.ladder[0] = {
      ...spec.ladder[0],
      tips: ['Stå 1 m ifrån.', 'Belöna vid vändning.'],
      failTips: ['Gå närmare.', 'Byt till godare belöning.'],
    }
    const view = resolveLiveCoach({
      spec,
      levelId: spec.ladder[0].id,
      coachKind: 'lower',
      exerciseLabel: 'Inkallning',
      exerciseId: 'inkallning',
      lifeStage: 'adult',
    })
    expect(view.focusTips).toEqual(['Stå 1 m ifrån.', 'Belöna vid vändning.'])
    expect(view.failTips).toEqual(['Gå närmare.', 'Byt till godare belöning.'])
    expect(view.showFailTips).toBe(true)
  })

  it('falls back to whenItFails then troubleshooting, max 2', () => {
    const spec = structuredClone(ink())
    // ensure no failTips on rung
    spec.ladder[0] = { ...spec.ladder[0], failTips: undefined, tips: undefined }
    const view = resolveLiveCoach({
      spec,
      levelId: spec.ladder[0].id,
      coachKind: 'stop',
      exerciseLabel: 'Inkallning',
      exerciseId: 'inkallning',
      lifeStage: 'puppy',
    })
    expect(view.failTips.length).toBeGreaterThan(0)
    expect(view.failTips.length).toBeLessThanOrEqual(2)
    expect(view.showFailTips).toBe(true)
  })

  it('hides fail tips when coach is keep and no consecutive fails', () => {
    const view = resolveLiveCoach({
      spec: ink(),
      levelId: ink().ladder[0].id,
      coachKind: 'keep',
      consecutiveFails: 0,
      exerciseLabel: 'Inkallning',
      exerciseId: 'inkallning',
      lifeStage: 'adult',
    })
    expect(view.showFailTips).toBe(false)
  })

  it('shows fail tips after first consecutive miss even when keep', () => {
    const view = resolveLiveCoach({
      spec: ink(),
      levelId: ink().ladder[0].id,
      coachKind: 'keep',
      consecutiveFails: 1,
      exerciseLabel: 'Inkallning',
      exerciseId: 'inkallning',
      lifeStage: 'adult',
    })
    expect(view.showFailTips).toBe(true)
    expect(view.failTips.length).toBeGreaterThan(0)
  })

  it('chatContext uses topic + lifeStage and never raw level id as levelLabel', () => {
    const spec = ink()
    const levelId = spec.ladder[1].id // e.g. home_2m
    const view = resolveLiveCoach({
      spec,
      levelId,
      coachKind: null,
      exerciseLabel: 'Inkallning',
      exerciseId: 'inkallning',
      lifeStage: 'junior',
    })
    expect(view.chatContext.topic).toBe('recall')
    expect(view.chatContext.lifeStage).toBe('junior')
    expect(view.chatContext.levelLabel).not.toBe(levelId)
    expect(view.chatContext.levelLabel).toBe(spec.ladder[1].label)
  })

  it('checklist includes level row and optional source', () => {
    const view = resolveLiveCoach({
      spec: ink(),
      levelId: ink().ladder[0].id,
      coachKind: null,
      exerciseLabel: 'Inkallning',
      exerciseId: 'inkallning',
      lifeStage: 'adult',
      sources: [{
        source: 'Dummybok',
        source_url: 'https://example.com',
        doc_version: '',
        page_ref: '',
      }],
    })
    expect(view.checklistItems.some((i) => i.includes(ink().ladder[0].label))).toBe(true)
    expect(view.checklistItems.some((i) => /Dummybok|Läs mer/i.test(i))).toBe(true)
  })
})
