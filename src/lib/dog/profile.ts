import { getProfile, saveProfile, updateProfile } from '@/lib/supabase/dog-profiles'
import type { DogProfile } from '@/types'

export async function getDogProfile(): Promise<DogProfile | null> {
  return getProfile()
}

export async function saveDogProfile(profile: DogProfile, userId: string): Promise<DogProfile> {
  return saveProfile(profile, userId)
}

export async function updateDogProfile(fields: Partial<DogProfile>): Promise<void> {
  return updateProfile(fields)
}
