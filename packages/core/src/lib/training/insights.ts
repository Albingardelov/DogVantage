import type { DogStatePayload, DogStateEnvExerciseStat } from './dog-state'
import type { SkillEnvironment } from './skill-progress'
import { exerciseLabel } from './exercise-label'

const ENV_ORDER: SkillEnvironment[] = ['home', 'outdoor', 'park']
const EASY_MIN_RATE = 0.75
const HARD_MAX_RATE = 0.5
const MIN_ATTEMPTS = 8

export interface EnvironmentGapInsight {
  exerciseId: string
  easyEnv: SkillEnvironment
  hardEnv: SkillEnvironment
  easyRate: number
  hardRate: number
}

export function findEnvironmentGapInsight(payload: DogStatePayload): EnvironmentGapInsight | null {
  const byExercise = new Map<string, DogStateEnvExerciseStat[]>()
  for (const entry of payload.environmentByExercise ?? []) {
    if (!ENV_ORDER.includes(entry.environment)) continue
    if (entry.attempts < MIN_ATTEMPTS) continue
    const list = byExercise.get(entry.exerciseId) ?? []
    list.push(entry)
    byExercise.set(entry.exerciseId, list)
  }

  let best: EnvironmentGapInsight | null = null
  for (const [exerciseId, stats] of byExercise) {
    for (const easy of stats) {
      for (const hard of stats) {
        if (ENV_ORDER.indexOf(easy.environment) >= ENV_ORDER.indexOf(hard.environment)) continue
        if (easy.successRate < EASY_MIN_RATE || hard.successRate > HARD_MAX_RATE) continue
        if (!best || easy.successRate - hard.successRate > best.easyRate - best.hardRate) {
          best = {
            exerciseId,
            easyEnv: easy.environment,
            hardEnv: hard.environment,
            easyRate: easy.successRate,
            hardRate: hard.successRate,
          }
        }
      }
    }
  }
  return best
}

const ENV_PHRASE: Record<SkillEnvironment, string> = {
  home: 'hemma',
  outdoor: 'utomhus',
  park: 'i parken',
  mixed: 'i blandad miljö',
}

export interface InsightCopy {
  title: string
  body: string
}

export function formatInsightCopy(insight: EnvironmentGapInsight): InsightCopy {
  const label = exerciseLabel(insight.exerciseId)
  const easyPct = Math.round(insight.easyRate * 100)
  const hardPct = Math.round(insight.hardRate * 100)
  return {
    title: `${label} sitter ${ENV_PHRASE[insight.easyEnv]} — men inte ${ENV_PHRASE[insight.hardEnv]}`,
    body: `${label} lyckas ${easyPct} % ${ENV_PHRASE[insight.easyEnv]} men bara ${hardPct} % ${ENV_PHRASE[insight.hardEnv]}. Det är inte trots — hunden har inte generaliserat beteendet än. Träna mellansteget ${ENV_PHRASE[insight.hardEnv]}: kortare avstånd, färre störningar och högre belöning.`,
  }
}
