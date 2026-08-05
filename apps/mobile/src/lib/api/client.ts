import type { ActiveDog } from '@/lib/dog/active-dog'

export function webBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '') ||
    process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    ''
  )
}

export async function apiFetch(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<Response> {
  const base = webBaseUrl()
  if (!base) throw new Error('EXPO_PUBLIC_WEB_URL saknas')
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  return fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers,
  })
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
