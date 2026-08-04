import type { GuideStep, GuideVariant, HandlerGuide } from './exercise-specs'

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function normalizeVariants(raw: unknown): GuideVariant[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const variants = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const v = item as Record<string, unknown>
      if (typeof v.id !== 'string' || typeof v.label !== 'string') return null
      return {
        id: v.id,
        label: v.label,
        whenToUse: typeof v.whenToUse === 'string' ? v.whenToUse : '',
        how: asStringArray(v.how),
        why: typeof v.why === 'string' ? v.why : '',
      }
    })
    .filter((v): v is GuideVariant => v !== null)
  return variants.length > 0 ? variants : undefined
}

function normalizeSteps(raw: unknown): GuideStep[] {
  if (!Array.isArray(raw)) return []
  return raw.map((step) => {
    if (typeof step === 'string') return { how: step, why: '' }
    if (step && typeof step === 'object' && typeof (step as GuideStep).how === 'string') {
      const s = step as GuideStep
      return { how: s.how, why: typeof s.why === 'string' ? s.why : '' }
    }
    return { how: String(step), why: '' }
  })
}

export function normalizeHandlerGuide(
  guide: unknown,
  fallbacks: { definition: string; troubleshooting?: string[] },
): HandlerGuide | null {
  if (!guide || typeof guide !== 'object') return null
  const g = guide as Record<string, unknown>

  const setup = asStringArray(g.setup)
  const steps = normalizeSteps(g.steps)
  if (setup.length === 0 || steps.length === 0) return null

  const firstStepHow = steps[0]?.how.trim() ?? ''
  const todaySummary =
    typeof g.todaySummary === 'string' && g.todaySummary.trim()
      ? g.todaySummary.trim()
      : firstStepHow || fallbacks.definition

  const whenItFails =
    asStringArray(g.whenItFails).length > 0
      ? asStringArray(g.whenItFails)
      : (fallbacks.troubleshooting ?? [])

  const wrapUp =
    asStringArray(g.wrapUp).length > 0 ? asStringArray(g.wrapUp) : asStringArray(g.stopRules)

  const successLooksLike =
    typeof g.successLooksLike === 'string' && g.successLooksLike.trim()
      ? g.successLooksLike.trim()
      : fallbacks.definition

  return {
    todaySummary,
    setup,
    steps,
    successLooksLike,
    whenItFails,
    wrapUp,
    variants: normalizeVariants(g.variants),
  }
}
