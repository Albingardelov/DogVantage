import type { DogProfile } from '@/types'

const KEY = 'dogProfile'

function generateDogKey(): string {
  // Prefer a real UUID when available (modern browsers)
  // Fallback keeps it stable-ish without external deps.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = (globalThis as any).crypto
    if (c?.randomUUID) return c.randomUUID()
  } catch {
    // ignore
  }
  return `dog_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

export function getDogProfile(): DogProfile | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    const p = JSON.parse(raw) as DogProfile & { onboarding?: { goal?: string; goals?: string[] } }
    // Backfill dogKey for older stored profiles
    if (!p.dogKey) {
      p.dogKey = generateDogKey()
      saveDogProfile(p)
    }
    // Migrate legacy single-value goal → goals array
    if (p.onboarding && !p.onboarding.goals && p.onboarding.goal) {
      p.onboarding.goals = [p.onboarding.goal as import('@/types').TrainingGoal]
      saveDogProfile(p)
    }
    return p as DogProfile
  } catch {
    return null
  }
}

export function saveDogProfile(profile: DogProfile): void {
  if (!profile.dogKey) profile.dogKey = generateDogKey()
  localStorage.setItem(KEY, JSON.stringify(profile))
}

export function clearDogProfile(): void {
  localStorage.removeItem(KEY)
}
