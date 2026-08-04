/**
 * Träningsprojekt: ägarens aktuella mål som styrande enhet för veckoplanen.
 *
 * Ett protokoll bryter ner ett vardagsproblem ("hunden kommer inte när jag
 * ropar") i faser med mätbara utgångskriterier. Varje fas pekar på en pinne
 * i primärövningens kriteriestege (exercise-specs.ts) — fasen är klar när
 * hunden presterar ≥80 % på den pinnen (eller högre) med tillräckligt underlag.
 *
 * Aktivt projekt dominerar veckoplanen: primärövningen schemaläggs varje
 * träningsdag (medvetet undantag från variationsregeln) och stödövningarna
 * viktas upp.
 */
import { getExerciseSpec } from '../../lib/training/exercise-specs'
import { evaluateRate } from '../../lib/training/progression-kernel'

export interface ProtocolPhase {
  id: string
  label: string
  /** Pinne i primärövningens kriteriestege som ska vara uppnådd för att fasen ska räknas som klar. */
  targetRungId: string
}

export interface TrainingProtocol {
  id: string
  label: string
  /** Ägarens språk: vilket vardagsproblem projektet fixar. */
  description: string
  primaryExerciseId: string
  supportExerciseIds: string[]
  phases: ProtocolPhase[]
}

export const TRAINING_PROTOCOLS: Record<string, TrainingProtocol> = {
  recall: {
    id: 'recall',
    label: 'Pålitlig inkallning',
    description: 'Hunden kommer på första signalen — även ute med störningar.',
    primaryExerciseId: 'inkallning',
    supportExerciseIds: ['namn', 'stoppsignal'],
    phases: [
      { id: 'foundation', label: 'Grunden inne', targetRungId: 'home_5m' },
      { id: 'garden', label: 'Ute i trädgården', targetRungId: 'garden_10m' },
      { id: 'park', label: 'Parken, låg störning', targetRungId: 'park_low' },
      { id: 'distractions', label: 'Mitt bland störningar', targetRungId: 'park_medium' },
    ],
  },
  leash_walking: {
    id: 'leash_walking',
    label: 'Gå fint i koppel',
    description: 'Slut på koppeldrag — promenader med slakt koppel.',
    primaryExerciseId: 'koppel',
    supportExerciseIds: ['fokus', 'orientering'],
    phases: [
      { id: 'foundation', label: 'Grunden inne', targetRungId: 'home_5steps' },
      { id: 'first_streets', label: 'Första gatorna', targetRungId: 'first_street' },
      { id: 'calm_walks', label: 'Lugna promenader', targetRungId: 'outdoor_low' },
      { id: 'busy_walks', label: 'Möten & störningar', targetRungId: 'outdoor_medium' },
    ],
  },
  calm_place: {
    id: 'calm_place',
    label: 'Lugn hemma & vid besök',
    description: 'Hunden går till sin plats och varvar ner — även när det händer saker.',
    primaryExerciseId: 'plats',
    supportExerciseIds: ['impulskontroll', 'stanna'],
    phases: [
      { id: 'magic_mat', label: 'Mattan blir värdefull', targetRungId: 'capture_lie_on_mat' },
      { id: 'on_signal', label: 'Plats på signal', targetRungId: 'go_to_mat' },
      { id: 'short_settle', label: 'Ligg kvar en stund', targetRungId: 'duration_5s' },
      { id: 'real_calm', label: 'Lugn på riktigt', targetRungId: 'duration_30s' },
    ],
  },
  focus_contact: {
    id: 'focus_contact',
    label: 'Fokus & kontakt ute',
    description: 'Hunden väljer dig framför omgivningen — grunden för allt annat.',
    primaryExerciseId: 'fokus',
    supportExerciseIds: ['namn', 'orientering'],
    phases: [
      { id: 'indoors', label: 'Kontakt inne', targetRungId: 'home_mild' },
      { id: 'outdoors_low', label: 'Ute, låg störning', targetRungId: 'outdoor_low' },
      { id: 'outdoors_medium', label: 'Ute bland störningar', targetRungId: 'outdoor_medium' },
    ],
  },
}

export const PROTOCOL_IDS = Object.keys(TRAINING_PROTOCOLS)

export function isProtocolId(value: unknown): value is string {
  return typeof value === 'string' && value in TRAINING_PROTOCOLS
}

/** Chatämnen (lib/dog/chat-topics.ts) som mappar till ett startbart projekt. */
export const PROTOCOL_BY_CHAT_TOPIC: Record<string, string> = {
  inkallning: 'recall',
  koppeldragande: 'leash_walking',
}

export function projectExerciseIds(protocol: TrainingProtocol): string[] {
  return [protocol.primaryExerciseId, ...protocol.supportExerciseIds]
}

/** Sammanfattning av ett aktivt projekt som veckoplanen behöver. */
export interface ActiveProjectInput {
  protocolId: string
  label: string
  primaryExerciseId: string
  supportExerciseIds: string[]
}

export function toProjectInput(protocol: TrainingProtocol): ActiveProjectInput {
  return {
    protocolId: protocol.id,
    label: protocol.label,
    primaryExerciseId: protocol.primaryExerciseId,
    supportExerciseIds: protocol.supportExerciseIds,
  }
}

// --- Fasprogress -----------------------------------------------------------

/** Samma radform som daily_exercise_metrics-frågor i resten av kodbasen. */
export interface ProjectMetricRow {
  exercise_id: string
  success_count: number
  fail_count: number
  criteria_level_id: string | null
}

export interface ProjectProgress {
  /** 1-baserad. Vid completed pekar den på sista fasen. */
  currentPhase: number
  totalPhases: number
  completed: boolean
  phaseLabel: string
  /** Högsta uppnådda pinne i ägarens språk, t.ex. "Klarar: Ute · låg störning". */
  achievedRungLabel: string | null
  /** Nästa delmål: aktuell fas målpinne (label + kriterium). */
  nextStep: string | null
}

/**
 * Beräknar var i protokollet hunden befinner sig utifrån loggade metrics för
 * primärövningen. En pinne räknas som uppnådd när hunden har ≥80 % lyckade
 * på den pinnen — eller på någon senare pinne — med minst 6 försök.
 */
export function computeProjectProgress(
  protocol: TrainingProtocol,
  rows: ProjectMetricRow[],
): ProjectProgress {
  const spec = getExerciseSpec(protocol.primaryExerciseId)
  const ladder = spec?.ladder ?? []
  const rungIndex = new Map(ladder.map((rung, idx) => [rung.id, idx]))

  const byRung = new Map<number, { success: number; attempts: number }>()
  for (const row of rows) {
    if (row.exercise_id !== protocol.primaryExerciseId) continue
    const idx = row.criteria_level_id != null ? rungIndex.get(row.criteria_level_id) : undefined
    if (idx === undefined) continue
    const bucket = byRung.get(idx) ?? { success: 0, attempts: 0 }
    bucket.success += row.success_count
    bucket.attempts += row.success_count + row.fail_count
    byRung.set(idx, bucket)
  }

  let highestAchievedIdx = -1
  for (const [idx, bucket] of byRung) {
    const evaluated = evaluateRate({
      success: bucket.success,
      fail: bucket.attempts - bucket.success,
      horizon: 'project',
    })
    if (evaluated.decision === 'advance') {
      highestAchievedIdx = Math.max(highestAchievedIdx, idx)
    }
  }

  const totalPhases = protocol.phases.length
  let currentPhaseIdx = protocol.phases.findIndex((phase) => {
    const target = rungIndex.get(phase.targetRungId)
    return target === undefined || highestAchievedIdx < target
  })
  const completed = currentPhaseIdx === -1
  if (completed) currentPhaseIdx = totalPhases - 1

  const currentPhase = protocol.phases[currentPhaseIdx]
  const targetRung = ladder[rungIndex.get(currentPhase.targetRungId) ?? -1]
  const achievedRung = highestAchievedIdx >= 0 ? ladder[highestAchievedIdx] : undefined

  return {
    currentPhase: currentPhaseIdx + 1,
    totalPhases,
    completed,
    phaseLabel: currentPhase.label,
    achievedRungLabel: achievedRung ? achievedRung.label : null,
    nextStep: completed || !targetRung ? null : `${targetRung.label} — ${targetRung.criteria}`,
  }
}
