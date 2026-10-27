import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/client'
import { subscriptionIdFromInvoice, syncSubscriptionById } from '@/lib/billing/webhook-sync'

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

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret)
  } catch (err) {
    console.error('[stripe-webhook] verify failed', err)
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  try {
    const subscriptionId = subscriptionIdForEvent(event)
    if (subscriptionId) {
      console.log('[stripe-webhook] syncing', event.type, event.id)
      await syncSubscriptionById(subscriptionId)
    } else {
      console.log('[stripe-webhook] unhandled', event.type, event.id)
    }
    return NextResponse.json({ received: true })
  } catch (err) {
    // A 5xx makes Stripe retry; the sync re-reads current state, so retries are safe.
    console.error('[stripe-webhook] handler error', event.type, event.id, err)
    return NextResponse.json({ error: 'handler failed' }, { status: 500 })
  }
}

function subscriptionIdForEvent(event: Stripe.Event): string | null {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'customer.subscription.paused':
    case 'customer.subscription.resumed':
      return event.data.object.id
    case 'invoice.paid':
    case 'invoice.payment_failed':
    case 'invoice.payment_succeeded':
      return subscriptionIdFromInvoice(event.data.object)
    default:
      return null
  }
}
