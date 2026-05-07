import { getSupabaseBrowser } from './browser'
import type { DogProfile } from '@/types'

interface DbProfile {
  id: string
  user_id: string
  name: string
  breed: string
  birthdate: string
  training_week: number
  onboarding: DogProfile['onboarding'] | null
  assessment: DogProfile['assessment'] | null
}

function dbToProfile(row: DbProfile): DogProfile {
  return {
    id: row.id,
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
    .order('created_at', { ascending: true })
    .limit(1)
    .single()
  if (error || !data) return null
  return dbToProfile(data as DbProfile)
}

export async function saveProfile(profile: DogProfile, userId: string): Promise<DogProfile> {
  const supabase = getSupabaseBrowser()

  // Check if a profile already exists for this user (first-dog case)
  const { data: existing } = await supabase
    .from('dog_profiles')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  const row = {
    user_id: userId,
    name: profile.name,
    breed: profile.breed,
    birthdate: profile.birthdate,
    training_week: profile.trainingWeek ?? 1,
    onboarding: profile.onboarding ?? null,
    assessment: profile.assessment ?? null,
  }

  if (existing?.id) {
    const { data, error } = await supabase
      .from('dog_profiles')
      .update(row)
      .eq('id', existing.id)
      .select('id')
      .single()
    if (error) throw new Error(`Failed to save profile: ${error.message}`)
    return { ...profile, id: data.id }
  }

  const { data, error } = await supabase
    .from('dog_profiles')
    .insert(row)
    .select('id')
    .single()
  if (error) throw new Error(`Failed to save profile: ${error.message}`)
  return { ...profile, id: data.id }
}

export async function updateProfile(fields: Partial<DogProfile>): Promise<void> {
  const updates: Record<string, unknown> = {}
  if (fields.trainingWeek !== undefined) updates.training_week = fields.trainingWeek
  if (fields.onboarding !== undefined) updates.onboarding = fields.onboarding
  if (fields.assessment !== undefined) updates.assessment = fields.assessment
  if (fields.name !== undefined) updates.name = fields.name

  if (Object.keys(updates).length === 0) return

  const supabase = getSupabaseBrowser()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('updateProfile called without authenticated user')

  // If we have an id, update by id (precise); otherwise fall back to user_id (one-dog case)
  const filter = fields.id
    ? supabase.from('dog_profiles').update(updates).eq('id', fields.id)
    : supabase.from('dog_profiles').update(updates).eq('user_id', user.id)

  const { error } = await filter
  if (error) throw new Error(`Failed to update profile: ${error.message}`)
}
