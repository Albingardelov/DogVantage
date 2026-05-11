/**
 * Age-based developmental context for puppy/adolescent training.
 *
 * Modern canine developmental neuroscience identifies critical windows
 * where pushing new criteria can cause lasting damage (fear periods) or
 * is just biologically inappropriate (teething, adolescent regression).
 *
 * This module returns prompt-ready text the AI can inject as a hard rule
 * so it doesn't have to "remember" the developmental schedule from
 * training data.
 */

export interface DevelopmentalWindow {
  id: 'fear_period_1' | 'teething' | 'fear_period_2' | 'adolescent_regression'
  label: string
  ageRangeWeeks: [number, number]
  /**
   * Hard rule for the AI prompt — what the plan MUST avoid during this window.
   */
  promptRule: string
  /**
   * User-facing summary for the dashboard / contextual tips.
   */
  ownerSummary: string
}

const WINDOWS: DevelopmentalWindow[] = [
  {
    id: 'fear_period_1',
    label: 'Första frykperioden',
    ageRangeWeeks: [8, 11],
    promptRule:
      'Första frykperiod (8–11 v): undvik nya enskilda stressorer (höga ljud, främlingar, nya miljöer som kombinerar fler stimuli). Maintenance, inte progression. Sänk kriterier, kortare pass (under 2 min för valpar under 12 v). Inga distansbyggen, inga störningsökningar. Negativa upplevelser nu lägger sig som långvariga rädslor.',
    ownerSummary:
      'Valpen är i sin första frykperiod (8–11 veckor). Negativa intryck nu kan ge bestående rädsla. Konsolidera det den redan kan — introducera inte nya svåra moment.',
  },
  {
    id: 'teething',
    label: 'Tandning',
    ageRangeWeeks: [16, 20],
    promptRule:
      'Tandning (16–20 v): valpen har ont i munnen. Apportering, hantering kring munnen och hårda tuggleksaker blir svårare. Mjuka belöningar istället för torrt godis. Kortare pass. Förvänta dig tillfälligt sämre lydnad — det är fysiskt, inte attityd.',
    ownerSummary:
      'Valpen tandar (16–20 v). Munnen är öm, så apportering och hantering kring munnen blir svårare. Använd mjuka belöningar och förvänta dig lite ojämna pass.',
  },
  {
    id: 'fear_period_2',
    label: 'Andra frykperioden',
    ageRangeWeeks: [26, 60],
    promptRule:
      'Andra frykperiod + adolescent regression (6–14 mån): kortikal pruning omformar nervsystemet. Tidigare inlärda beteenden kan verka försvinna — det är neurobiologi, inte olydnad. Konsolidera, höj inte kriterier under denna fas. Belöna generöst, korta pass. Stötta hunden vid plötsliga rädslor istället för att tvinga.',
    ownerSummary:
      'Hunden är i adolescent fas (~6–14 mån). Tidigare inlärda saker kan verka glömda — det är hjärnans omstrukturering, inte attityd. Gå tillbaka till lättare kriterier, belöna generöst. Regressionen är tillfällig.',
  },
]

/**
 * Returns the developmental window that applies at the given age (if any).
 * Returns null outside of all windows.
 */
export function getDevelopmentalWindow(ageWeeks: number): DevelopmentalWindow | null {
  if (!Number.isFinite(ageWeeks) || ageWeeks <= 0) return null
  for (const w of WINDOWS) {
    if (ageWeeks >= w.ageRangeWeeks[0] && ageWeeks <= w.ageRangeWeeks[1]) return w
  }
  return null
}

/**
 * Prompt-ready section. Returns null when no window applies (out of band).
 */
export function formatDevelopmentalContext(ageWeeks: number): string | null {
  const w = getDevelopmentalWindow(ageWeeks)
  if (!w) return null
  return `=== UTVECKLINGSFÖNSTER (${w.label}, ${w.ageRangeWeeks[0]}–${w.ageRangeWeeks[1]} v) ===\n${w.promptRule}`
}

/**
 * Per-week session-length cap for very young puppies, where older
 * "5 min per session" guidance is biologically inappropriate.
 */
export function getMaxSessionMinutes(ageWeeks: number): number {
  if (!Number.isFinite(ageWeeks) || ageWeeks <= 0) return 10
  if (ageWeeks < 12) return 1.5  // 60–90 sekunder micro-sessions
  if (ageWeeks < 16) return 3
  if (ageWeeks < 26) return 8
  return 15
}
