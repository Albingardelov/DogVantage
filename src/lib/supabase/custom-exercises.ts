import { createSupabaseServer } from './server'
import type { ExerciseSpec } from '@/lib/training/exercise-specs'

export interface CustomExercise {
  id: string
  user_id: string
  exercise_id: string
  label: string
  prompt: string
  spec: ExerciseSpec
  active: boolean
  created_at: string
}

export async function getActiveCustomExercises(): Promise<CustomExercise[]> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('custom_exercises')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`custom_exercises fetch failed: ${error.message}`)
  return (data ?? []) as CustomExercise[]
}

export async function getAllCustomExercises(): Promise<CustomExercise[]> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('custom_exercises')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`custom_exercises fetch failed: ${error.message}`)
  return (data ?? []) as CustomExercise[]
}

export async function createCustomExercise(
  userId: string,
  exerciseId: string,
  label: string,
  prompt: string,
  spec: ExerciseSpec
): Promise<CustomExercise> {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('custom_exercises')
    .insert({ user_id: userId, exercise_id: exerciseId, label, prompt, spec })
    .select()
    .single()

  if (error) throw new Error(`custom_exercises insert failed: ${error.message}`)
  return data as CustomExercise
}

export async function toggleCustomExercise(id: string, active: boolean): Promise<void> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { error } = await supabase
    .from('custom_exercises')
    .update({ active })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(`custom_exercises toggle failed: ${error.message}`)
}

export async function deleteCustomExercise(id: string): Promise<void> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { error } = await supabase
    .from('custom_exercises')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(`custom_exercises delete failed: ${error.message}`)
}
