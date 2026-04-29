import type { DogProfile } from '@/types'

const KEY = 'dogProfile'

export function getDogProfile(): DogProfile | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as DogProfile
  } catch {
    return null
  }
}

export function saveDogProfile(profile: DogProfile): void {
  localStorage.setItem(KEY, JSON.stringify(profile))
}

export function clearDogProfile(): void {
  localStorage.removeItem(KEY)
}
