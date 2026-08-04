export type BadgeTone = 'priority' | 'focus' | 'weak'

export interface ReasonBadge {
  label: string
  tone: BadgeTone
  detail?: string
}

const TONE_RANK: Record<BadgeTone, number> = { weak: 3, focus: 2, priority: 1 }

export function topBadge(badges: ReasonBadge[]): ReasonBadge | null {
  if (badges.length === 0) return null
  return [...badges].sort((a, b) => TONE_RANK[b.tone] - TONE_RANK[a.tone])[0]
}
