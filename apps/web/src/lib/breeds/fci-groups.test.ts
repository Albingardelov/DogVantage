import { describe, it, expect } from 'vitest'
import { FCI_GROUP_PROFILES, getFciGroupProfile } from './fci-groups'

describe('FCI_GROUP_PROFILES', () => {
  it('has exactly 10 groups', () => {
    expect(Object.keys(FCI_GROUP_PROFILES).length).toBe(10)
  })

  it('each group has required BreedProfile fields', () => {
    for (const [group, profile] of Object.entries(FCI_GROUP_PROFILES)) {
      expect(profile.name, `group ${group} missing name`).toBeTruthy()
      expect(profile.sensitivity, `group ${group} missing sensitivity`).toMatch(/soft|medium|hardy/)
      expect(Array.isArray(profile.suggestedGoals), `group ${group} suggestedGoals must be array`).toBe(true)
      expect(Array.isArray(profile.hiddenGoals), `group ${group} hiddenGoals must be array`).toBe(true)
      expect(Array.isArray(profile.breedSkills), `group ${group} breedSkills must be array`).toBe(true)
      expect(profile.activityGuidelines.puppy, `group ${group} missing puppy guideline`).toBeTruthy()
    }
  })
})

describe('getFciGroupProfile', () => {
  it('returns group 8 profile for group 8', () => {
    const profile = getFciGroupProfile(8)
    expect(profile.suggestedGoals).toContain('hunting')
  })

  it('falls back to group 9 for unknown group', () => {
    const profile = getFciGroupProfile(99)
    expect(profile).toBeDefined()
  })
})
