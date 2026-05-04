const KEY = 'dogPhoto'

export function getDogPhoto(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(KEY)
}

export function saveDogPhoto(dataUrl: string): void {
  try {
    localStorage.setItem(KEY, dataUrl)
  } catch {
    // Photo is optional — ignore QuotaExceededError (common on iOS Safari with large images)
  }
}

export function clearDogPhoto(): void {
  localStorage.removeItem(KEY)
}
