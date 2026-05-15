import { getSupabaseBrowser } from './browser'
import type { Json } from '@/types/database'
import type { DogProfile, DogSex, CastrationStatus } from '@/types'

interface DbProfile {
  id: string
  user_id: string
  name: string
  breed: string
  birthdate: string
  training_week: number
  sex: string | null
  castration_status: string | null
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
    sex: (row.sex as DogSex) ?? undefined,
    castrationStatus: (row.castration_status as CastrationStatus) ?? undefined,
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

  const row = {
    user_id: userId,
    name: profile.name,
    breed: profile.breed,
    birthdate: profile.birthdate,
    training_week: profile.trainingWeek ?? 1,
    sex: profile.sex ?? null,
    castration_status: profile.castrationStatus ?? null,
    onboarding: (profile.onboarding ?? null) as unknown as Json | null,
    assessment: (profile.assessment ?? null) as unknown as Json | null,
  }

  // If the profile already has an id, update that specific record (edit flow).
  // Otherwise always insert — a new dog should never overwrite an existing one.
  if (profile.id) {
    const { data, error } = await supabase
      .from('dog_profiles')
      .update(row)
      .eq('id', profile.id)
      .select('id')
      .single()
    if (error) throw new Error('Failed to save profile')
    return { ...profile, id: data.id }
  }

  const { data, error } = await supabase
    .from('dog_profiles')
    .insert(row)
    .select('id')
    .single()
  if (error) throw new Error('Failed to save profile')
  return { ...profile, id: data.id }
}

export async function updateProfile(fields: Partial<DogProfile>): Promise<void> {
  if (!fields.id) throw new Error('updateProfile requires fields.id — refusing to update without dog id')

  const updates: {
    training_week?: number
    onboarding?: Json | null
    assessment?: Json | null
    name?: string
    sex?: DogSex | null
    castration_status?: CastrationStatus | null
  } = {}
  if (fields.trainingWeek !== undefined) updates.training_week = fields.trainingWeek
  if (fields.onboarding !== undefined) updates.onboarding = fields.onboarding as unknown as Json | null
  if (fields.assessment !== undefined) updates.assessment = fields.assessment as unknown as Json | null
  if (fields.name !== undefined) updates.name = fields.name
  if (fields.sex !== undefined) updates.sex = fields.sex ?? null
  if (fields.castrationStatus !== undefined) updates.castration_status = fields.castrationStatus ?? null

  if (Object.keys(updates).length === 0) return

  const supabase = getSupabaseBrowser()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('updateProfile called without authenticated user')

  const { error } = await supabase
    .from('dog_profiles')
    .update(updates)
    .eq('id', fields.id)
    .eq('user_id', user.id)
  if (error) throw new Error('Failed to update profile')
}

export async function getAllProfiles(): Promise<DogProfile[]> {
  const { data, error } = await getSupabaseBrowser()
    .from('dog_profiles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return (data as DbProfile[]).map(dbToProfile)
}
