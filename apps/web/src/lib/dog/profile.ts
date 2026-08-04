import { getProfile, saveProfile, updateProfile, getAllProfiles } from '@/lib/supabase/dog-profiles'
import { autoAdvancedTrainingWeek } from '@dogvantage/core'
import type { DogProfile } from '@dogvantage/core'

export async function getDogProfile(): Promise<DogProfile | null> {
  return getProfile()
}

export async function saveDogProfile(profile: DogProfile, userId: string): Promise<DogProfile> {
  return saveProfile(profile, userId)
}

export async function updateDogProfile(fields: Partial<DogProfile>): Promise<void> {
  return updateProfile(fields)
}

export async function getAllDogProfiles(): Promise<DogProfile[]> {
  const dogs = await getAllProfiles()
  return Promise.all(dogs.map(syncTrainingWeek))
}

/** Advances training_week from the homecoming date. Returns the dog unchanged if persisting fails. */
async function syncTrainingWeek(dog: DogProfile): Promise<DogProfile> {
  const advanced = autoAdvancedTrainingWeek(dog.trainingWeek, dog.onboarding?.homecomeDate)
  if (advanced === null || !dog.id) return dog
  try {
    await updateProfile({ id: dog.id, trainingWeek: advanced })
    return { ...dog, trainingWeek: advanced }
  } catch (e) {
    console.error('[syncTrainingWeek]', e)
    return dog
  }
}
