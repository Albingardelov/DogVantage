import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetProfile, mockSaveProfile, mockUpdateProfile } = vi.hoisted(() => ({
  mockGetProfile: vi.fn(),
  mockSaveProfile: vi.fn(),
  mockUpdateProfile: vi.fn(),
}))

vi.mock('@/lib/supabase/dog-profiles', () => ({
  getProfile: mockGetProfile,
  saveProfile: mockSaveProfile,
  updateProfile: mockUpdateProfile,
}))

import { getDogProfile, saveDogProfile, updateDogProfile } from './profile'
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
  vi.clearAllMocks()
})

describe('getDogProfile', () => {
  it('returns null when getProfile returns null', async () => {
    mockGetProfile.mockResolvedValue(null)
    expect(await getDogProfile()).toBeNull()
  })

  it('returns the profile from DB', async () => {
    mockGetProfile.mockResolvedValue(mockProfile)
    expect(await getDogProfile()).toEqual(mockProfile)
  })
})

describe('saveDogProfile', () => {
  it('calls saveProfile with the profile and userId', async () => {
    mockSaveProfile.mockResolvedValue(undefined)
    await saveDogProfile(mockProfile, 'user-abc')
    expect(mockSaveProfile).toHaveBeenCalledWith(mockProfile, 'user-abc')
  })
})

describe('updateDogProfile', () => {
  it('calls updateProfile with the fields', async () => {
    mockUpdateProfile.mockResolvedValue(undefined)
    await updateDogProfile({ trainingWeek: 3 })
    expect(mockUpdateProfile).toHaveBeenCalledWith({ trainingWeek: 3 })
  })
})
