import type {
  BehaviorProfile,
  TriggerType,
  LeashBehavior,
  NewEnvironmentReaction,
  TrainingBackground,
  HouseholdPet,
} from '@/types'

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  cars:         'Bilar / fordon',
  cyclists:     'Cyklister',
  runners:      'Löpare / joggare',
  children:     'Barn',
  skateboards:  'Skateboard / sparkcykel',
  other_dogs:   'Andra hundar',
  animals:      'Djur (katter, fåglar, vilt)',
  loud_sounds:  'Höga ljud (smällar, motor)',
  strangers:    'Okända människor',
}

export const LEASH_LABELS: Record<LeashBehavior, string> = {
  calm:                'Slakt koppel — lugnt och fint',
  pulls_some:          'Drar lite, men hanterbart',
  pulls_hard_reactive: 'Drar hårt eller reagerar/skäller i koppel',
}

export const ENV_REACTION_LABELS: Record<NewEnvironmentReaction, string> = {
  curious:  'Nyfiken och trygg direkt',
  cautious: 'Lite försiktig men lugnar ner sig',
  avoidant: 'Undviker eller verkar rädd',
}

export const BACKGROUND_LABELS: Record<TrainingBackground, string> = {
  beginner:       'Nybörjare — aldrig tränat strukturerat',
  some_training:  'Lite tränad / gått kurs',
  experienced:    'Erfaren — tävlat eller tränat länge',
}

export const HOUSEHOLD_PET_LABELS: Record<HouseholdPet, string> = {
  cats_indoor:   'Innekatter',
  cats_outdoor:  'Katter som är ute / kan smita ut',
  dogs:          'Andra hundar',
  small_animals: 'Smådjur (kanin, fågel, gnagare)',
  livestock:     'Gårdsdjur (häst, får, höns)',
}

/**
 * Returns extra training notes for risky pet combinations (e.g. hunting breed + outdoor cats).
 * These are appended to the AI prompt to ensure the right precautions are flagged.
 */
export function householdPetNotes(pets: HouseholdPet[]): string[] {
  const notes: string[] = []
  if (pets.includes('cats_outdoor')) {
    notes.push(
      'VIKTIGT: Det finns katter som kan röra sig utomhus. Prioritera stoppsignal och koppelkontroll. ' +
      'Träna lugn och artfrid kring rörliga bytesdjur. Undvik att stimulera jaktdrift med leksaker inomhus.'
    )
  } else if (pets.includes('cats_indoor')) {
    notes.push(
      'Det finns innekatter i hemmet. Träna "ignorera katt" som ett aktivt beteende. ' +
      'Säkerställ att katten alltid har flyktvägar och höga platser.'
    )
  }
  if (pets.includes('small_animals')) {
    notes.push(
      'Det finns smådjur (kanin/fågel/gnagare) i hemmet. Håll hunden borta tills tydlig artfrid är etablerad.'
    )
  }
  if (pets.includes('livestock')) {
    notes.push(
      'Det finns gårdsdjur i närmiljön. Stoppsignal och stadga är extra viktigt — introducera nötkreatur/hästar kontrollerat.'
    )
  }
  return notes
}

/**
 * Formats a BehaviorProfile into a compact text block suitable for AI prompts.
 */
export function formatBehaviorProfile(bp: BehaviorProfile): string {
  const lines: string[] = ['=== BETEENDEPROFIL ===']

  lines.push(`Träningsbakgrund: ${BACKGROUND_LABELS[bp.trainingBackground]}`)
  lines.push(`Koppelbeteende: ${LEASH_LABELS[bp.leashBehavior]}`)
  lines.push(`Reaktion på ny miljö/folk: ${ENV_REACTION_LABELS[bp.newEnvironmentReaction]}`)

  if (bp.triggers.length > 0) {
    lines.push(`Kända triggers: ${bp.triggers.map((t) => TRIGGER_LABELS[t]).join(', ')}`)
  } else {
    lines.push('Kända triggers: Inga specifika triggers angivna')
  }

  if (bp.householdPets.length > 0) {
    lines.push(`Husdjur i hemmet: ${bp.householdPets.map((p) => HOUSEHOLD_PET_LABELS[p]).join(', ')}`)
    for (const note of householdPetNotes(bp.householdPets)) {
      lines.push(note)
    }
  } else {
    lines.push('Husdjur i hemmet: Inga')
  }

  if (bp.problemNotes?.trim()) {
    lines.push(`Övrigt: ${bp.problemNotes.trim()}`)
  }

  lines.push('Anpassa träningsinnehåll, progression och rådgivning utifrån beteendeprofilen ovan.')
  return lines.join('\n')
}

/**
 * Builds a behavior context string from whichever source is available:
 * - Full BehaviorProfile from assessment (preferred)
 * - Partial context from onboarding householdPets only (fallback for new dogs)
 */
export function buildBehaviorContext(profile: {
  assessment?: { behaviorProfile?: BehaviorProfile }
  onboarding?: { householdPets?: HouseholdPet[] }
}): string | undefined {
  if (profile.assessment?.behaviorProfile) {
    return formatBehaviorProfile(profile.assessment.behaviorProfile)
  }
  const pets = profile.onboarding?.householdPets ?? []
  if (pets.length === 0) return undefined
  const lines = ['=== HUSDJUR I HEMMET ===']
  lines.push(`Husdjur: ${pets.map((p) => HOUSEHOLD_PET_LABELS[p]).join(', ')}`)
  for (const note of householdPetNotes(pets)) lines.push(note)
  return lines.join('\n')
}
