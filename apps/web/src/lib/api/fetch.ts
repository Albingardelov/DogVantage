import type { ZodSchema } from 'zod'

export class ApiError extends Error {
  status: number
  retryable: boolean

  constructor(status: number, message: string, retryable = true) {
    super(message)
    this.status = status
    this.retryable = retryable
  }
}

export async function apiFetch<T>(url: string, schema: ZodSchema<T>, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'request_failed', retryable: true }))
    throw new ApiError(
      res.status,
      typeof body?.error === 'string' ? body.error : 'request_failed',
      typeof body?.retryable === 'boolean' ? body.retryable : true,
    )
  }

  const json = await res.json()
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    console.error('[apiFetch] schema mismatch', parsed.error.issues, json)
    throw new Error(`Server returned unexpected shape: ${parsed.error.message}`)
  }
  return parsed.data
}
