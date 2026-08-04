import type { TrainingResult } from '@dogvantage/core'
import { FALLBACK_LOCALE, type Locale } from '@/i18n/config'

/**
 * Safety guards — keyword filters that short-circuit AI training advice
 * for cases that need a professional instead of a generic R+ plan.
 *
 * Two categories:
 *  1. Health/medical issues → veterinarian
 *  2. Behavioural emergencies (bites, severe reactivity, separation panic,
 *     resource guarding) → certified behaviour consultant (SBBK / IAABC)
 */

// ─── Health / vet guard ──────────────────────────────────────────────────────
const VET_KEYWORDS = [
  'haltar', 'kräks', 'äter inte', 'blöder', 'veterinär',
  'sjuk', 'ont', 'skada', 'hälta', 'kräkningar', 'diarré',
  'feber', 'sår', 'svullen',
]

const VET_RESPONSES: Partial<Record<Locale, TrainingResult>> = {
  sv: {
    content:
      'Det verkar handla om ett hälsoproblem. DogVantage ger inte medicinska råd — kontakta din veterinär.',
    source: '',
    source_url: '',
    attributionNote: 'Fast svar vid hälsoindikation — inte från dina dokument.',
  },
  en: {
    content:
      'This sounds like a health issue. DogVantage does not give medical advice — please contact your veterinarian.',
    source: '',
    source_url: '',
    attributionNote: 'Fixed response for a health indication — not from your documents.',
  },
}

export function vetResponse(locale: Locale): TrainingResult {
  return VET_RESPONSES[locale] ?? VET_RESPONSES[FALLBACK_LOCALE]!
}

export function detectHealthIssue(text: string): boolean {
  const lower = text.toLowerCase()
  return VET_KEYWORDS.some((kw) => lower.includes(kw))
}

// ─── Behaviour-emergency guard ───────────────────────────────────────────────
//
// These signal cases where a generic R+ training plan is the wrong response
// and could cause real harm if followed without a professional assessment:
// bite history, severe aggression, panic/separation distress, resource guarding,
// and hormonal aggression windows.
const BEHAVIOR_REFERRAL_KEYWORDS = [
  // Bite / aggression
  'biter', 'bitit', 'bett mig', 'bett barn', 'bett någon',
  'morrar', 'morrade', 'morrar mot barn', 'morrar mot folk',
  'knäpper', 'snäpper', 'snäppt',
  // Severe reactivity
  'attackerar', 'attackerade',
  // Resource guarding
  'resursförsvar', 'försvarar mat', 'försvarar leksaker', 'försvarar sängen',
  'vakar mat', 'vaktar foderskålen',
  // Separation panic
  'panik vid ensamhet', 'panikar när jag går', 'separationsångest',
  'förstör när jag går', 'totalt panik',
  // Heat-related aggression
  'skenfas-aggression', 'aggressiv under löp', 'aggressiv i skenfas',
  // Fear-aggression
  'fruktan-aggression', 'rädsla för folk',
]

const BEHAVIOR_RESPONSES: Partial<Record<Locale, TrainingResult>> = {
  sv: {
    content:
      'Det du beskriver låter som ett beteendeproblem som ligger utanför det DogVantage kan hjälpa med säkert. ' +
      'Bett, morrning, resursförsvar och panik är inte träningsfel — det är signaler som behöver bedömas av en certifierad beteendekonsulent som kan möta er fysiskt och bygga ett individanpassat program.\n\n' +
      'Hitta hjälp via:\n' +
      '• SBBK — Sveriges Bästa Beteendekonsulter (sbbk.se)\n' +
      '• IAABC — internationell organisation med certifierade konsulter (iaabc.org)\n' +
      '• Din veterinär kan också remittera till en beteendeveterinär.\n\n' +
      'Fortsätt gärna träna grundlydnad och vardagliga moment i appen, men prioritera professionell hjälp för det beskrivna beteendet.',
    source: '',
    source_url: '',
    attributionNote: 'Fast svar vid beteende-emergency — inte från dina dokument.',
  },
  en: {
    content:
      'What you are describing sounds like a behaviour problem that is outside what DogVantage can safely help with. ' +
      'Biting, growling, resource guarding and panic are not training mistakes — they are signals that need to be assessed by a certified behaviour consultant who can meet you in person and build an individual programme.\n\n' +
      'Find help via:\n' +
      '• IAABC — international organisation of certified consultants (iaabc.org)\n' +
      '• Your veterinarian can also refer you to a veterinary behaviourist.\n\n' +
      'Please keep training basic obedience and everyday skills in the app, but prioritise professional help for the behaviour described.',
    source: '',
    source_url: '',
    attributionNote: 'Fixed response for a behaviour emergency — not from your documents.',
  },
}

export function behaviorResponse(locale: Locale): TrainingResult {
  return BEHAVIOR_RESPONSES[locale] ?? BEHAVIOR_RESPONSES[FALLBACK_LOCALE]!
}

export function detectBehaviorEmergency(text: string | null | undefined): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  return BEHAVIOR_REFERRAL_KEYWORDS.some((kw) => lower.includes(kw))
}

// ─── Secret exposure guard ───────────────────────────────────────────────────
// Blocks accidental pasting of API keys or other high-entropy credentials
// into chat prompts that are sent to third-party AI providers.
const SECRET_PATTERNS: RegExp[] = [
  /\bsk-[a-z0-9]{20,}\b/i, // OpenAI/Groq style
  /\bAIza[0-9A-Za-z\-_]{20,}\b/, // Google API keys
  /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/, // GitHub tokens
  /\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/, // JWT
  /\b(?:access|api|service|secret|token)[-_ ]?key\s*[:=]\s*[A-Za-z0-9_\-]{12,}\b/i, // labeled key/value
]

export function detectSecretExposure(text: string | null | undefined): boolean {
  if (!text) return false
  return SECRET_PATTERNS.some((pattern) => pattern.test(text))
}

/**
 * Inline banner copy when the rest of the experience still runs but the user
 * should see a referral note (e.g. on the dashboard / assessment summary).
 */
export const BEHAVIOR_REFERRAL_BANNER =
  'Något du har skrivit i hundens profil tyder på ett beteendeproblem (bett, morrning, resursförsvar eller panik). ' +
  'Det är inte fel på dig eller din hund — men det behöver bedömas av en certifierad beteendekonsulent (sbbk.se / iaabc.org), inte av en app.'
