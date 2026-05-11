import { describe, it, expect } from 'vitest'
import { detectHealthIssue, detectBehaviorEmergency } from './safety-guards'

describe('detectHealthIssue', () => {
  it('flags vet keywords', () => {
    expect(detectHealthIssue('Min hund haltar på vänster ben')).toBe(true)
    expect(detectHealthIssue('Hon kräks efter maten')).toBe(true)
    expect(detectHealthIssue('Det finns ett sår på tassen')).toBe(true)
  })

  it('does not flag normal training queries', () => {
    expect(detectHealthIssue('Hur tränar jag inkallning?')).toBe(false)
    expect(detectHealthIssue('Bästa belöningen utomhus?')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(detectHealthIssue('Hunden HALTAR plötsligt')).toBe(true)
  })
})

describe('detectBehaviorEmergency', () => {
  it('flags bite-related text', () => {
    expect(detectBehaviorEmergency('Hunden biter mig när jag tar bort matskålen')).toBe(true)
    expect(detectBehaviorEmergency('Han har bett barn två gånger')).toBe(true)
  })

  it('flags growling and snapping', () => {
    expect(detectBehaviorEmergency('Hon morrar mot barn')).toBe(true)
    expect(detectBehaviorEmergency('Knäpper efter folk på promenad')).toBe(true)
  })

  it('flags resource guarding', () => {
    expect(detectBehaviorEmergency('Resursförsvar runt sängen')).toBe(true)
    expect(detectBehaviorEmergency('Försvarar mat aggressivt')).toBe(true)
  })

  it('flags separation panic', () => {
    expect(detectBehaviorEmergency('Total panik vid ensamhet, river upp dörrar')).toBe(true)
    expect(detectBehaviorEmergency('Separationsångest sedan vi flyttade')).toBe(true)
  })

  it('flags heat-related aggression', () => {
    expect(detectBehaviorEmergency('Skenfas-aggression mot andra tikar')).toBe(true)
  })

  it('does not flag normal training queries', () => {
    expect(detectBehaviorEmergency('Hur tränar jag sitt?')).toBe(false)
    expect(detectBehaviorEmergency('Hunden är lite skygg mot främlingar')).toBe(false)
    expect(detectBehaviorEmergency('Vill lära henne apportera')).toBe(false)
  })

  it('handles null/undefined safely', () => {
    expect(detectBehaviorEmergency(null)).toBe(false)
    expect(detectBehaviorEmergency(undefined)).toBe(false)
    expect(detectBehaviorEmergency('')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(detectBehaviorEmergency('HUNDEN BITER')).toBe(true)
  })
})
