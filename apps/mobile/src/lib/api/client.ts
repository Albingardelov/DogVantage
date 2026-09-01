import { supabase } from '@/lib/supabase'
import type { ActiveDog } from '@/lib/dog/active-dog'

const PROD_WEB_URL = 'https://dog-vantage.vercel.app'

export function webBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '') ||
    process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    PROD_WEB_URL
  )
}

/**
 * Hämtar aktuell access-token själv (getSession auto-refreshar utgången token)
 * och gör en refresh + retry vid 401, så anropare aldrig skickar stale tokens.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Ingen aktiv session')

  const url = `${webBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const doFetch = (accessToken: string) => {
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${accessToken}`)
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json')
    }
    return fetch(url, { ...init, headers })
  }

  let res = await doFetch(token)
  if (res.status === 401) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    const newToken = refreshed.session?.access_token
    if (newToken && newToken !== token) {
      res = await doFetch(newToken)
    }
  }
  return res
}

export function buildWeekPlanPath(dog: ActiveDog): string {
  const params = new URLSearchParams()
  params.set('week', String(dog.trainingWeek ?? 1))
  params.set('ageWeeks', String(dog.ageWeeks))
  params.set('dogId', dog.id!)
  const ob = dog.onboarding
  if (ob?.goals?.length) params.set('goals', ob.goals.join(','))
  if (ob?.environment) params.set('environment', ob.environment)
  if (ob?.rewardPreference) params.set('rewardPreference', ob.rewardPreference)
  if (ob?.takesRewardsOutdoors != null) {
    params.set('takesRewardsOutdoors', String(ob.takesRewardsOutdoors))
  }
  if (ob?.householdPets?.length) params.set('householdPets', ob.householdPets.join(','))
  return `/api/training/week?${params.toString()}`
}
