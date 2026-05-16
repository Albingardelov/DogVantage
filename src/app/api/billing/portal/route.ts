import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { getStripe } from '@/lib/stripe/client'
import { apiError } from '@/lib/api/errors'

function getAppUrl(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  return req.nextUrl.origin || 'http://localhost:3000'
}

export async function POST(req: NextRequest) {
  try {
    return withAuth(req, async ({ user }) => {
      const admin = getSupabaseAdmin() as unknown as {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (column: string, value: string) => {
              maybeSingle: () => Promise<{ data: { stripe_customer_id: string | null } | null }>
            }
          }
        }
      }

      const { data: sub } = await admin
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!sub?.stripe_customer_id) {
        return NextResponse.json({ error: 'no_customer' }, { status: 404 })
      }

      const baseUrl = getAppUrl(req)
      const session = await getStripe().billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        return_url: `${baseUrl}/profile?section=billing`,
      })

      return NextResponse.json({ url: session.url })
    })
  } catch (err) {
    return apiError(err, 'failed_to_create_portal_session')
  }
}
