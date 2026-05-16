import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { ensureTrial } from '@/lib/billing/start-trial'
import { apiError } from '@/lib/api/errors'

export async function POST(req: NextRequest) {
  try {
    return withAuth(req, async ({ user }) => {
      if (!user.email) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
      }
      await ensureTrial(user.id, user.email)
      return NextResponse.json({ ok: true })
    })
  } catch (err) {
    return apiError(err, 'failed_to_ensure_trial')
  }
}
