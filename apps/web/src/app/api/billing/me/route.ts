import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { getSubscriptionState } from '@/lib/billing/subscription'
import { apiError } from '@/lib/api/errors'

export async function GET(req: NextRequest) {
  try {
    return withAuth(req, async ({ user }) => {
      const state = await getSubscriptionState(user.id)
      return NextResponse.json(state)
    })
  } catch (err) {
    return apiError(err, 'failed_to_load_subscription')
  }
}
