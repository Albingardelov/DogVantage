import type { DogStatePayload } from '@dogvantage/core'
import type { SkillEnvironment } from '@dogvantage/core'
import { exerciseLabel } from '@dogvantage/core'

const ENV_LABELS: Record<SkillEnvironment, string> = {
  home: 'hemma',
  outdoor: 'utomhus',
  park: 'i parken',
  mixed: 'i blandad miljö',
}

const MIN_HANDLER_SAMPLES = 3

function pct(rate: number): string {
  return `${Math.round(rate * 100)} %`
}

export function formatDogStateForPrompt(payload: DogStatePayload): string | null {
  const lines: string[] = []

  if (payload.weakExercises.length > 0) {
    const items = payload.weakExercises
      .map((e) => `${exerciseLabel(e.exerciseId)} ${pct(e.successRate)} (${e.attempts} försök)`)
      .join(', ')
    lines.push(`Svaga övningar (senaste 28 d): ${items}`)
  }

  if (payload.strongExercises.length > 0) {
    const items = payload.strongExercises
      .map((e) => `${exerciseLabel(e.exerciseId)} ${pct(e.successRate)}`)
      .join(', ')
    lines.push(`Starka övningar: ${items}`)
  }

  const envEntries = payload.environmentByExercise ?? []
  if (envEntries.length > 0) {
    const items = envEntries
      .map((e) => `${exerciseLabel(e.exerciseId)} ${ENV_LABELS[e.environment]} ${pct(e.successRate)}`)
      .join(', ')
    lines.push(`Per miljö: ${items}`)
  } else {
    const envs = Object.entries(payload.environmentDifficulty) as [SkillEnvironment, number][]
    if (envs.length > 0) {
      const items = envs.map(([env, rate]) => `${ENV_LABELS[env]} ${pct(rate)}`).join(', ')
      lines.push(`Andel lyckade per miljö: ${items}`)
    }
  }

  const h = payload.handler
  const hasHandlerSignal = h.timing != null || h.consistency != null || h.reading != null
  if (h.sampleSize >= MIN_HANDLER_SAMPLES && hasHandlerSignal) {
    const dims = [
      h.timing != null ? `timing ${h.timing.toFixed(1)}/5` : null,
      h.consistency != null ? `konsekvens ${h.consistency.toFixed(1)}/5` : null,
      h.reading != null ? `läsning ${h.reading.toFixed(1)}/5` : null,
    ].filter(Boolean)
    lines.push(`Förarens självskattning (${h.sampleSize} pass): ${dims.join(', ')}`)
  }

  const z = payload.zoneSummary
  if (z.greenDays + z.yellowDays + z.redDays > 0) {
    lines.push(`Dagsform senaste ${z.window} d: ${z.greenDays} gröna, ${z.yellowDays} gula, ${z.redDays} röda dagar`)
  }

  return lines.length > 0 ? lines.join('\n') : null
}
