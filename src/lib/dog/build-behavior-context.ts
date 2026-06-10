import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { OnboardingPrefs, AssessmentState, BehaviorProfile } from '@/types'
import { buildBehaviorContext } from './behavior'

type DogProfileBehaviorRow = {
  onboarding: OnboardingPrefs | null
  assessment: AssessmentState | null
}

export interface BehaviorContextPayload {
  context: string | null
  behaviorProfile: BehaviorProfile | null
}

export async function getBehaviorContextPayloadFromDb(
  supabase: SupabaseClient<Database>,
  dogId: string,
): Promise<BehaviorContextPayload> {
  const { data } = await supabase
    .from('dog_profiles')
    .select('onboarding, assessment')
    .eq('id', dogId)
    .single()

  if (!data) return { context: null, behaviorProfile: null }
  const row = data as unknown as DogProfileBehaviorRow
  return {
    context: buildBehaviorContext({
      onboarding: row.onboarding ?? undefined,
      assessment: row.assessment ?? undefined,
    }) ?? null,
    behaviorProfile: row.assessment?.behaviorProfile ?? null,
  }
}

export async function buildBehaviorContextFromDb(
  supabase: SupabaseClient<Database>,
  dogId: string,
): Promise<string | null> {
  const payload = await getBehaviorContextPayloadFromDb(supabase, dogId)
  return payload.context
}
