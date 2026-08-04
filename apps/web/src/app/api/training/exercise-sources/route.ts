import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import { getExerciseSources } from '@/lib/ai/doc-learning'
import type { Breed, TrainingSourceRef } from '@/types'

const MAX_IDS = 8

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ dog }) => {
    const idsParam = req.nextUrl.searchParams.get('ids') ?? ''
    const ids = idsParam
      .split(',')
      .map((id) => id.trim())
      .filter((id) => /^[a-z0-9_]+$/.test(id))
      .slice(0, MAX_IDS)

    if (ids.length === 0) {
      return NextResponse.json({ sources: {} })
    }

    const breed = dog.breed as Breed
    const entries = await Promise.all(
      ids.map(async (id): Promise<[string, TrainingSourceRef[]]> => {
        try {
          return [id, await getExerciseSources(breed, id)]
        } catch {
          return [id, []]
        }
      }),
    )

    return NextResponse.json({ sources: Object.fromEntries(entries) })
  })
}
