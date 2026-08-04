import type { TrainingSourceRef } from '@dogvantage/core'
import type { LifeStage } from '@dogvantage/core'
import { topicForExerciseId } from '@/lib/learning/chunk-metadata'
import type { CoachAction } from '@dogvantage/core'
import type { ExerciseSpec } from '@dogvantage/core'

export type CoachKind = CoachAction['kind'] | null

export interface LiveCoachChatContext {
  label: string
  topic: string
  lifeStage: LifeStage
  levelLabel: string | null
}

export interface LiveCoachView {
  levelId: string | null
  levelLabel: string | null
  levelCriteria: string | null
  focusTips: string[]
  failTips: string[]
  showFailTips: boolean
  checklistItems: string[]
  chatContext: LiveCoachChatContext
}

export interface ResolveLiveCoachInput {
  spec: ExerciseSpec
  levelId: string | null
  coachKind: CoachKind
  consecutiveFails?: number
  exerciseLabel: string
  exerciseId: string
  lifeStage: LifeStage
  sources?: TrainingSourceRef[]
}

function takeTips(list: string[] | undefined, max = 2): string[] {
  return (list ?? []).map((s) => s.trim()).filter(Boolean).slice(0, max)
}

export function resolveLiveCoach(input: ResolveLiveCoachInput): LiveCoachView {
  const rung =
    input.spec.ladder.find((r) => r.id === input.levelId) ??
    input.spec.ladder[0] ??
    null
  const levelId = rung?.id ?? input.levelId
  const levelLabel = rung?.label ?? null
  const levelCriteria = rung?.criteria ?? null
  const focusTips = takeTips(rung?.tips)
  const failTips = takeTips(
    rung?.failTips?.length
      ? rung.failTips
      : input.spec.guide?.whenItFails?.length
        ? input.spec.guide.whenItFails
        : input.spec.troubleshooting,
  )
  const consecutiveFails = input.consecutiveFails ?? 0
  const showFailTips =
    consecutiveFails >= 1 ||
    input.coachKind === 'lower' ||
    input.coachKind === 'stop'
  const topic = topicForExerciseId(input.exerciseId)

  const checklistItems: string[] = [
    'Belöning inom räckhåll — belöna i rätt ögonblick.',
    'Lugn plats; stäng bort onödiga störningar om du kan.',
  ]
  if (levelLabel && levelCriteria) {
    checklistItems.push(`Idag: ${levelLabel} — ${levelCriteria}`)
  }
  if (focusTips[0]) checklistItems.push(focusTips[0])
  const src = input.sources?.[0]
  if (src?.source) {
    checklistItems.push(src.source_url ? `Läs mer: ${src.source}` : `Läs mer: ${src.source}`)
  }

  return {
    levelId,
    levelLabel,
    levelCriteria,
    focusTips,
    failTips,
    showFailTips,
    checklistItems,
    chatContext: {
      label: input.exerciseLabel,
      topic,
      lifeStage: input.lifeStage,
      levelLabel,
    },
  }
}
