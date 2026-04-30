import { describe, it, expect, beforeEach } from 'vitest'
import { getDogProfile, saveDogProfile, clearDogProfile } from './profile'
import type { DogProfile } from '@/types'

const mockProfile: DogProfile = {
  name: 'Rex',
  breed: 'labrador',
  birthdate: '2024-10-15',
  trainingWeek: 1,
  onboarding: {
    goals: ['everyday_obedience'],
    environment: 'suburb',
    rewardPreference: 'mixed',
    takesRewardsOutdoors: true,
  },
  assessment: { status: 'not_started' },
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('getDogProfile', () => {
  it('returns null when no profile is stored', () => {
    expect(getDogProfile()).toBeNull()
  })

  it('returns the stored profile', () => {
    localStorage.setItem('dogProfile', JSON.stringify(mockProfile))
    const stored = getDogProfile()
    expect(stored).toMatchObject(mockProfile)
    expect(typeof stored?.dogKey).toBe('string')
    expect(stored?.dogKey?.length).toBeGreaterThan(5)
  })
})

describe('saveDogProfile', () => {
  it('stores the profile in localStorage', () => {
    saveDogProfile(mockProfile)
    // dogKey is generated on save if missing, so avoid strict JSON equality here
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'dogProfile',
      expect.any(String)
    )
  })
})

describe('clearDogProfile', () => {
  it('removes the profile from localStorage', () => {
    clearDogProfile()
    expect(localStorage.removeItem).toHaveBeenCalledWith('dogProfile')
  })
})
