import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDog } from '@/lib/api/with-auth'
import {
  buildQuizSession,
  ensureQuizCards,
  gradeQuizAnswers,
  type QuizGradeInput,
} from '@/lib/learning/quiz'
import { topicForExerciseId } from '@/lib/learning/chunk-metadata'
import type { Breed } from '@/types'

export async function GET(req: NextRequest) {
  return withAuthAndDog(req, async ({ user, dog }) => {
    const contextKey = req.nextUrl.searchParams.get('contextKey')
    const title = req.nextUrl.searchParams.get('title')
    const body = req.nextUrl.searchParams.get('body')
    const exerciseId = req.nextUrl.searchParams.get('exerciseId')

    if (!contextKey || !title || !body) {
      return NextResponse.json({ error: 'contextKey, title and body required' }, { status: 400 })
    }

    const breed = dog.breed as Breed
    const topic = exerciseId ? topicForExerciseId(exerciseId) : undefined
    const session = await buildQuizSession(breed, contextKey, title, body, topic)
    if (!session) {
      return NextResponse.json({ session: null })
    }

    const questions = await ensureQuizCards(user.id, dog.id, session)
    return NextResponse.json({ session: { ...session, questions } })
  })
}

export async function POST(req: NextRequest) {
  return withAuthAndDog(req, async ({ user, dog }) => {
    const body = await req.json() as { answers?: QuizGradeInput[] }
    const answers = body.answers
    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'answers required' }, { status: 400 })
    }

    const results = await gradeQuizAnswers(user.id, dog.id, answers)
    const correctCount = results.filter((r) => r.correct).length
    return NextResponse.json({ results, correctCount, total: results.length })
  })
}
