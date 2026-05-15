import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { apiError } from '@/lib/api/errors'
import {
  BehaviorEmergencyError,
  buildWeekContextFromRequest,
  getOrGenerateWeekPlan,
} from '@/lib/training/week-orchestrator'

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog, supabase }) => {
    try {
      const context = await buildWeekContextFromRequest(req, dog, supabase)
      const plan = await getOrGenerateWeekPlan(context)
      return NextResponse.json(plan)
    } catch (err) {
      if (err instanceof BehaviorEmergencyError) {
        return NextResponse.json(
          { error: 'behavior_referral', referral: err.referral },
          { status: 422 },
        )
      }
      if (err instanceof Error && err.message === 'breed and week required') {
        return NextResponse.json({ error: err.message }, { status: 400 })
      }
      return apiError(err, 'plan_generation_failed')
    }
  })
}
