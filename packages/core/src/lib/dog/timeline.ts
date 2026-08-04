import type { PuppyZone } from '../../lib/training/puppy-zone'

export interface TimelineInputs {
  /** daily_check_ins som datum → zon, senaste 14 dagarna */
  checkIns: Record<string, PuppyZone>
  /** distinkta chatämnen, nyast först */
  recentTopics: string[]
}

export function summarizeDogTimeline(inputs: TimelineInputs): string | null {
  const lines: string[] = []

  const zones = Object.values(inputs.checkIns)
  if (zones.length > 0) {
    const green = zones.filter((z) => z === 'green').length
    const yellow = zones.filter((z) => z === 'yellow').length
    const red = zones.filter((z) => z === 'red').length
    const parts = [
      green > 0 ? `${green} ${green === 1 ? 'grön' : 'gröna'}` : null,
      yellow > 0 ? `${yellow} ${yellow === 1 ? 'gul' : 'gula'}` : null,
      red > 0 ? `${red} ${red === 1 ? 'röd' : 'röda'}` : null,
    ].filter(Boolean)
    lines.push(`Dagsform senaste 14 dagarna: ${parts.join(', ')} dagar.`)
  }

  if (inputs.recentTopics.length > 0) {
    lines.push(`Föraren har nyligen frågat om: ${inputs.recentTopics.join(', ')}.`)
  }

  return lines.length > 0 ? lines.join('\n') : null
}
