import type { TrainingResult } from '@/types'

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

export const VET_RESPONSE: TrainingResult = {
  content:
    'Det verkar handla om ett hälsoproblem. DogVantage ger inte medicinska råd — kontakta din veterinär.',
  source: '',
  source_url: '',
  attributionNote: 'Fast svar vid hälsoindikation — inte från dina dokument.',
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

export const BEHAVIOR_RESPONSE: TrainingResult = {
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
}

export function detectBehaviorEmergency(text: string | null | undefined): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  return BEHAVIOR_REFERRAL_KEYWORDS.some((kw) => lower.includes(kw))
}

/**
 * Inline banner copy when the rest of the experience still runs but the user
 * should see a referral note (e.g. on the dashboard / assessment summary).
 */
export const BEHAVIOR_REFERRAL_BANNER =
  'Något du har skrivit i hundens profil tyder på ett beteendeproblem (bett, morrning, resursförsvar eller panik). ' +
  'Det är inte fel på dig eller din hund — men det behöver bedömas av en certifierad beteendekonsulent (sbbk.se / iaabc.org), inte av en app.'
