import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { getStripe, STRIPE_PRICE_IDS } from '@/lib/stripe/client'
import { apiError } from '@/lib/api/errors'

type Tier = 'basic' | 'pro'

function parseTier(value: unknown): Tier | null {
  if (value === 'basic' || value === 'pro') return value
  return null
}

function getAppUrl(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  return req.nextUrl.origin || 'http://localhost:3000'
}

export async function POST(req: NextRequest) {
  try {
    return withAuth(req, async ({ user }) => {
      const body = await req.json().catch(() => ({}))
      const tier = parseTier((body as { tier?: unknown }).tier)
      if (!tier) {
        return NextResponse.json({ error: 'invalid tier' }, { status: 400 })
      }

      const priceId = STRIPE_PRICE_IDS[tier]
      if (!priceId) {
        return NextResponse.json({ error: 'price not configured' }, { status: 500 })
      }

      if (!user.email) {
        return NextResponse.json({ error: 'missing user email' }, { status: 400 })
      }

      const admin = getSupabaseAdmin() as unknown as {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (column: string, value: string) => {
              maybeSingle: () => Promise<{ data: { stripe_customer_id: string | null } | null }>
            }
          }
          upsert: (
            payload: Record<string, unknown>,
            options: { onConflict: string },
          ) => Promise<{ error: { message: string } | null }>
        }
      }

      const { data: sub } = await admin
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle()

      let customerId = sub?.stripe_customer_id ?? null
      if (!customerId) {
        const customer = await getStripe().customers.create({
          email: user.email,
          metadata: { user_id: user.id },
        })
        customerId = customer.id

        const { error: upsertError } = await admin
          .from('subscriptions')
          .upsert(
            {
              user_id: user.id,
              stripe_customer_id: customerId,
              tier: 'free',
              status: 'canceled',
              cancel_at_period_end: false,
            },
            { onConflict: 'user_id' },
          )
        if (upsertError) {
          throw new Error(`Failed to save stripe customer id: ${upsertError.message}`)
        }
      }

      const baseUrl = getAppUrl(req)
      const session = await getStripe().checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        payment_method_types: ['card', 'klarna'],
        success_url: `${baseUrl}/dashboard?upgraded=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/profile?canceled=1`,
        metadata: { user_id: user.id, tier },
        subscription_data: {
          metadata: { user_id: user.id, tier },
        },
      })

      if (!session.url) {
        throw new Error('Stripe did not return a checkout url')
      }
      return NextResponse.json({ url: session.url })
    })
  } catch (err) {
    return apiError(err, 'failed_to_create_checkout')
  }
}
