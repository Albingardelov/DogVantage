export type WeeklyFocusArea =
  | 'recall'
  | 'leash_walking'
  | 'impulse_calm'
  | 'socialization'
  | 'attention'
  | 'place_settle'
  | 'retrieve'
  | 'nosework'

export const WEEKLY_FOCUS_AREAS: WeeklyFocusArea[] = [
  'recall',
  'leash_walking',
  'impulse_calm',
  'socialization',
  'attention',
  'place_settle',
  'retrieve',
  'nosework',
]

export const WEEKLY_FOCUS_LABELS: Record<WeeklyFocusArea, string> = {
  recall: 'Inkallning & stopp',
  leash_walking: 'Koppel & fot',
  impulse_calm: 'Impulskontroll & lugn',
  socialization: 'Socialisering & hantering',
  attention: 'Uppmärksamhet & fokus',
  place_settle: 'Plats & passivitet',
  retrieve: 'Apportering',
  nosework: 'Nosework & sök',
}

export const WEEKLY_FOCUS_EXERCISES: Record<WeeklyFocusArea, string[]> = {
  recall: ['inkallning', 'stoppsignal'],
  leash_walking: ['koppel', 'fot'],
  impulse_calm: ['impulskontroll', 'stanna', 'plats'],
  socialization: ['socialisering', 'hantering'],
  attention: ['namn', 'fokus'],
  place_settle: ['plats', 'ligg'],
  retrieve: ['apportering'],
  nosework: ['nosework', 'kontrollerat_sok'],
}

export const FOCUS_EXERCISE_LABELS: Record<string, string> = {
  inkallning: 'Inkallning',
  stoppsignal: 'Stoppsignal',
  koppel: 'Koppel',
  fot: 'Fot',
  impulskontroll: 'Impulskontroll',
  stanna: 'Stanna',
  plats: 'Plats',
  socialisering: 'Socialisering',
  hantering: 'Hantering',
  namn: 'Namnkontakt',
  fokus: 'Fokus',
  ligg: 'Ligg',
  apportering: 'Apportering',
  nosework: 'Nosework',
  kontrollerat_sok: 'Kontrollerat sök',
}

export const MAX_WEEKLY_FOCUS = 2

export function isValidFocusArea(value: unknown): value is WeeklyFocusArea {
  return typeof value === 'string' && (WEEKLY_FOCUS_AREAS as readonly string[]).includes(value)
}

export function sanitizeFocusAreas(input: unknown): WeeklyFocusArea[] {
  if (!Array.isArray(input)) return []
  const out: WeeklyFocusArea[] = []
  const seen = new Set<string>()
  for (const v of input) {
    if (isValidFocusArea(v) && !seen.has(v)) {
      out.push(v)
      seen.add(v)
      if (out.length >= MAX_WEEKLY_FOCUS) break
    }
  }
  return out
}

export function focusExerciseIds(areas: WeeklyFocusArea[]): string[] {
  const ids = new Set<string>()
  for (const a of areas) {
    for (const id of WEEKLY_FOCUS_EXERCISES[a] ?? []) ids.add(id)
  }
  return [...ids]
}

export function focusPromptRule(areas: WeeklyFocusArea[]): string | null {
  if (areas.length === 0) return null
  const labels = areas.map((a) => WEEKLY_FOCUS_LABELS[a]).join(', ')
  const ids = focusExerciseIds(areas)
  return `Veckofokus från ägaren: ${labels}. Inkludera minst en övning med id ur denna lista varje träningsdag: ${ids.join(', ')}. Vikta planen mot dessa men följ fortfarande rasregler och valpregler.`
}

/** ISO-week key like "2026-W19" — same week boundary used by the planner cache. */
export function currentIsoWeek(now: Date = new Date()): string {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const week =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    )
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}
