import { getSupabaseBrowser } from './browser'
import type { DogProfile } from '@/types'

interface DbProfile {
  user_id: string
  name: string
  breed: string
  birthdate: string
  training_week: number
  onboarding: DogProfile['onboarding'] | null
  assessment: DogProfile['assessment'] | null
}

function dbToProfile(row: DbProfile): DogProfile {
  // dogKey is not persisted — user_id from Supabase Auth is the stable identity
  return {
    name: row.name,
    breed: row.breed as DogProfile['breed'],
    birthdate: row.birthdate,
    trainingWeek: row.training_week,
    onboarding: row.onboarding ?? undefined,
    assessment: row.assessment ?? undefined,
  }
}

export async function getProfile(): Promise<DogProfile | null> {
  const { data, error } = await getSupabaseBrowser()
    .from('dog_profiles')
    .select('*')
    .single()
  if (error || !data) return null
  return dbToProfile(data as DbProfile)
}

export async function saveProfile(profile: DogProfile, userId: string): Promise<void> {
  const row = {
    user_id: userId,
    name: profile.name,
    breed: profile.breed,
    birthdate: profile.birthdate,
    training_week: profile.trainingWeek ?? 1,
    onboarding: profile.onboarding ?? null,
    assessment: profile.assessment ?? null,
  }
  const { error } = await getSupabaseBrowser()
    .from('dog_profiles')
    .upsert(row, { onConflict: 'user_id' })
  if (error) throw new Error(`Failed to save profile: ${error.message}`)
}

export async function updateProfile(fields: Partial<DogProfile>): Promise<void> {
  const updates: Record<string, unknown> = {}
  if (fields.trainingWeek !== undefined) updates.training_week = fields.trainingWeek
  if (fields.onboarding !== undefined) updates.onboarding = fields.onboarding
  if (fields.assessment !== undefined) updates.assessment = fields.assessment
  if (fields.name !== undefined) updates.name = fields.name

  if (Object.keys(updates).length === 0) return

  const { data: { user } } = await getSupabaseBrowser().auth.getUser()
  if (!user) throw new Error('updateProfile called without authenticated user')

  const { error } = await getSupabaseBrowser()
    .from('dog_profiles')
    .update(updates)
    .eq('user_id', user.id)
  if (error) throw new Error(`Failed to update profile: ${error.message}`)
}
