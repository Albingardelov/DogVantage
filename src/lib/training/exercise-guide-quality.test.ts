import { describe, expect, it } from 'vitest'
import { EXERCISE_SPECS } from './exercise-specs'

describe('HandlerGuide quality gate', () => {
  const entries = Object.values(EXERCISE_SPECS).filter((s) => s.guide)

  it('every guided exercise uses the new HandlerGuide shape', () => {
    expect(entries.length).toBeGreaterThan(10)
    for (const spec of entries) {
      const g = spec.guide!
      expect(g.todaySummary?.trim().length, spec.exerciseId).toBeGreaterThan(10)
      expect(g.setup.length, spec.exerciseId).toBeGreaterThanOrEqual(2)
      expect(g.steps.length, spec.exerciseId).toBeGreaterThanOrEqual(4)
      for (const step of g.steps) {
        expect(step.how?.trim().length, `${spec.exerciseId} how`).toBeGreaterThan(8)
        expect(step.why?.trim().length, `${spec.exerciseId} why`).toBeGreaterThan(8)
      }
      expect(g.successLooksLike?.trim().length, spec.exerciseId).toBeGreaterThan(10)
      expect(g.whenItFails.length, spec.exerciseId).toBeGreaterThanOrEqual(2)
      expect(g.wrapUp.length, spec.exerciseId).toBeGreaterThanOrEqual(1)
      if (g.variants) {
        expect(g.variants.length, spec.exerciseId).toBeLessThanOrEqual(2)
        for (const v of g.variants) {
          expect(v.id).toMatch(/^[a-z0-9_]+$/)
          expect(v.how.length).toBeGreaterThanOrEqual(2)
          expect(v.whenToUse.trim().length).toBeGreaterThan(8)
        }
      }
    }
  })

  it('owner-facing guide text does not expose raw ladder ids as prose', () => {
    for (const spec of entries) {
      const blob = JSON.stringify(spec.guide)
      for (const rung of spec.ladder) {
        expect(blob.includes(`"${rung.id}"`) || !blob.includes(rung.id), `${spec.exerciseId} leaked ${rung.id}`).toBe(true)
        // Allow id only inside structured ladder elsewhere — guide blob should not contain bare rung ids as words
        expect(new RegExp(`\\b${rung.id}\\b`).test(blob), `${spec.exerciseId} contains ${rung.id}`).toBe(false)
      }
    }
  })
})
