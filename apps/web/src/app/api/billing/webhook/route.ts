import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/client'
import {
  markCanceled,
  markPastDue,
  syncSubscription,
} from '@/lib/billing/webhook-sync'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 })
  }

  const body = await req.text()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[stripe-webhook] missing STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'webhook misconfigured' }, { status: 500 })
  }

  try {
    const event = getStripe().webhooks.constructEvent(body, signature, secret)
    console.log('[stripe-webhook] handling', event.type)

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await syncSubscription(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await markCanceled(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_failed':
        await markPastDue(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_succeeded':
        // No-op: customer.subscription.updated will carry source-of-truth status.
        break
      default:
        console.log('[stripe-webhook] unhandled', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('signature')) {
      console.error('[stripe-webhook] verify failed', err)
      return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
    }
    console.error('[stripe-webhook] handler error', err)
    return NextResponse.json({ error: 'handler failed' }, { status: 500 })
  }
}
