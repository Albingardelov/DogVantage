import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { OnboardingPrefs, AssessmentState } from '@/types'
import { buildBehaviorContext } from './behavior'

type DogProfileBehaviorRow = {
  onboarding: OnboardingPrefs | null
  assessment: AssessmentState | null
}

export async function buildBehaviorContextFromDb(
  supabase: SupabaseClient<Database>,
  dogId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('dog_profiles')
    .select('onboarding, assessment')
    .eq('id', dogId)
    .single()

  if (!data) return null
  const row = data as unknown as DogProfileBehaviorRow
  return buildBehaviorContext({
    onboarding: row.onboarding ?? undefined,
    assessment: row.assessment ?? undefined,
  }) ?? null
}
