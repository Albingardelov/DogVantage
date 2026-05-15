import { NextRequest, NextResponse } from 'next/server'
import { getMetrics, upsertMetrics } from '@/lib/supabase/daily-exercise-metrics'
import { getExerciseSpec, isValidCriteriaLevel } from '@/lib/training/exercise-specs'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { isValidBreed } from '@/lib/breeds/registry'
import type { Breed, DailyExerciseMetrics, LatencyBucket } from '@/types'

const VALID_LATENCY: LatencyBucket[] = ['lt1s', '1to3s', 'gt3s']

function isValidDateString(date: unknown): date is string {
  if (typeof date !== 'string') return false
  // Expect YYYY-MM-DD (server treats as date)
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0
}

function parseLatencyBucket(v: unknown): LatencyBucket | null {
  if (v === null || v === undefined) return null
  if (typeof v !== 'string') return null
  return (VALID_LATENCY as string[]).includes(v) ? (v as LatencyBucket) : null
}

function parsePatch(body: unknown): {
  breed: Breed
  date: string
  exerciseId: string
  patch: Partial<DailyExerciseMetrics>
} | { error: string; status: number } {
  if (!body || typeof body !== 'object') return { error: 'Invalid JSON body', status: 400 }
  const b = body as Record<string, unknown>

  const breed = b.breed
  const date = b.date
  const exerciseId = b.exerciseId
  const patchRaw = b.patch

  if (typeof breed !== 'string' || !isValidBreed(breed) || !isValidDateString(date) || typeof exerciseId !== 'string' || !exerciseId) {
    return { error: 'breed, date, exerciseId required', status: 400 }
  }
  if (!patchRaw || typeof patchRaw !== 'object') return { error: 'patch required', status: 400 }

  const p = patchRaw as Record<string, unknown>
  const patch: Partial<DailyExerciseMetrics> = {}

  if ('success_count' in p) {
    if (!isNonNegativeInt(p.success_count)) return { error: 'success_count must be a non-negative int', status: 400 }
    patch.success_count = p.success_count
  }
  if ('fail_count' in p) {
    if (!isNonNegativeInt(p.fail_count)) return { error: 'fail_count must be a non-negative int', status: 400 }
    patch.fail_count = p.fail_count
  }
  if ('latency_bucket' in p) {
    const bucket = parseLatencyBucket(p.latency_bucket)
    if (bucket === null && p.latency_bucket !== null) return { error: 'latency_bucket invalid', status: 400 }
    patch.latency_bucket = bucket
  }
  if ('criteria_level_id' in p) {
    const level = p.criteria_level_id
    if (level === null || level === undefined || level === '') {
      patch.criteria_level_id = null
    } else if (typeof level !== 'string') {
      return { error: 'criteria_level_id must be a string or null', status: 400 }
    } else {
      const isCustom = exerciseId.startsWith('custom_')
      if (!isCustom && !getExerciseSpec(exerciseId)) return { error: 'Unknown exerciseId', status: 400 }
      if (!isCustom && !isValidCriteriaLevel(exerciseId, level)) {
        return { error: 'criteria_level_id invalid for exerciseId', status: 400 }
      }
      patch.criteria_level_id = level
    }
  }
  if ('notes' in p) {
    const n = p.notes
    if (n === null || n === undefined || n === '') patch.notes = undefined
    else if (typeof n !== 'string') return { error: 'notes must be a string', status: 400 }
    else patch.notes = n.slice(0, 1000)
  }

  if (Object.keys(patch).length === 0) return { error: 'patch must include at least one field', status: 400 }

  return { breed, date, exerciseId, patch }
}

export async function GET(req: NextRequest) {
  const breed = req.nextUrl.searchParams.get('breed')
  const date = req.nextUrl.searchParams.get('date')
  if (!breed || !isValidBreed(breed) || !isValidDateString(date)) {
    return NextResponse.json({ error: 'breed and date required' }, { status: 400 })
  }
  return withAuthAndDog(req, async ({ dog }) => {
    const metrics = await getMetrics(breed, date, dog.id)
    return NextResponse.json(metrics)
  })
}

export async function PATCH(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const parsed = parsePatch(await req.json())
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    await upsertMetrics(parsed.breed, parsed.date, dog.id, parsed.exerciseId, parsed.patch)
    return NextResponse.json({ ok: true })
  })
}

