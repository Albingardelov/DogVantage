const KEY = 'dogPhoto'

export function getDogPhoto(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(KEY)
}

export function saveDogPhoto(dataUrl: string): void {
  localStorage.setItem(KEY, dataUrl)
}

export function clearDogPhoto(): void {
  localStorage.removeItem(KEY)
}
