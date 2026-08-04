// Structured telemetry with a pluggable HTTP sink.
//
// Always logs structured JSON to stdout (picked up by Vercel logs). If
// TELEMETRY_INGEST_URL is set, events are also shipped fire-and-forget to that
// endpoint — works with Axiom (https://api.axiom.co/v1/datasets/<ds>/ingest),
// Logflare, Tinybird or any JSON-accepting collector.
//
// Env:
//   TELEMETRY_INGEST_URL  – POST endpoint receiving JSON arrays of events
//   TELEMETRY_API_KEY     – optional bearer token

const SINK_TIMEOUT_MS = 3_000

export function trackTelemetry(event: string, payload: Record<string, unknown>): void {
  const enriched = {
    event,
    timestamp: new Date().toISOString(),
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
    ...payload,
  }

  console.log(`[telemetry:${event}]`, JSON.stringify(enriched))

  const url = process.env.TELEMETRY_INGEST_URL
  if (!url) return

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const apiKey = process.env.TELEMETRY_API_KEY
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  // Fire-and-forget: telemetry must never block or fail a user request.
  void fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify([enriched]),
    signal: AbortSignal.timeout(SINK_TIMEOUT_MS),
  }).catch((err) => {
    console.warn('[telemetry] sink delivery failed:', err instanceof Error ? err.message : String(err))
  })
}
