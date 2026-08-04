import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { apiError } from '@/lib/api/errors'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { getActiveProject, startProject, endActiveProject } from '@/lib/supabase/training-projects'
import {
  TRAINING_PROTOCOLS,
  computeProjectProgress,
  isProtocolId,
  projectExerciseIds,
  type ProjectMetricRow,
  type TrainingProtocol,
} from '@dogvantage/core'

const METRICS_WINDOW_DAYS = 42

async function buildProjectResponse(
  dogId: string,
  projectId: string,
  protocol: TrainingProtocol,
  startedAt: string,
) {
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - METRICS_WINDOW_DAYS)
  const { data } = await getSupabaseAdmin()
    .from('daily_exercise_metrics')
    .select('exercise_id, success_count, fail_count, criteria_level_id')
    .eq('dog_id', dogId)
    .eq('exercise_id', protocol.primaryExerciseId)
    .gte('date', since.toISOString().slice(0, 10))
  const progress = computeProjectProgress(protocol, (data ?? []) as ProjectMetricRow[])
  return {
    project: {
      id: projectId,
      protocolId: protocol.id,
      label: protocol.label,
      description: protocol.description,
      primaryExerciseId: protocol.primaryExerciseId,
      supportExerciseIds: protocol.supportExerciseIds,
      exerciseIds: projectExerciseIds(protocol),
      startedAt,
      progress,
    },
  }
}

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    try {
      const row = await getActiveProject(dog.id)
      const protocol = row ? TRAINING_PROTOCOLS[row.protocol_id] : undefined
      if (!row || !protocol) return NextResponse.json({ project: null })
      return NextResponse.json(await buildProjectResponse(dog.id, row.id, protocol, row.started_at))
    } catch (err) {
      return apiError(err, 'project_fetch_failed')
    }
  })
}

export async function PUT(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    try {
      const body = (await req.json()) as { protocolId?: unknown }
      if (!isProtocolId(body.protocolId)) {
        return NextResponse.json({ error: 'invalid protocolId' }, { status: 400 })
      }
      const protocol = TRAINING_PROTOCOLS[body.protocolId]
      const row = await startProject(dog.id, protocol.id)
      return NextResponse.json(await buildProjectResponse(dog.id, row.id, protocol, row.started_at))
    } catch (err) {
      return apiError(err, 'project_start_failed')
    }
  })
}

export async function PATCH(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    try {
      const body = (await req.json()) as { action?: unknown }
      if (body.action !== 'complete' && body.action !== 'stop') {
        return NextResponse.json({ error: 'invalid action' }, { status: 400 })
      }
      await endActiveProject(dog.id, body.action === 'complete' ? 'completed' : 'stopped')
      return NextResponse.json({ project: null })
    } catch (err) {
      return apiError(err, 'project_end_failed')
    }
  })
}
