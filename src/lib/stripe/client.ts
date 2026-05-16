import Stripe from 'stripe'

let stripeClient: Stripe | null = null

function requireEnv(name: string, value: string | undefined): string {
  if (value && value.length > 0) return value
  throw new Error(`Missing ${name}`)
}

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient
  const key = requireEnv('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY)
  stripeClient = new Stripe(key, {
    apiVersion: '2026-04-22.dahlia',
  })
  return stripeClient
}

export const STRIPE_PRICE_IDS = {
  basic: process.env.STRIPE_PRICE_BASIC ?? '',
  proMonthly: process.env.STRIPE_PRICE_PRO ?? '',
  proAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? '',
} as const
