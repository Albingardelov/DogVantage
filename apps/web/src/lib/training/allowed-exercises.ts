import { isPuppy as isPuppyAge } from '@/lib/dog/age'

const FOUNDATION_EXERCISES = ['marker']
const PUPPY_FUNDAMENTALS = ['rastning', 'bett_inhibition', 'box_traning', 'ensam_traning']

export function allowedExerciseIdsForBreed(breed: string, ageWeeks?: number): string[] {
  const isPuppy = isPuppyAge(ageWeeks)
  const puppyExtras = isPuppy ? PUPPY_FUNDAMENTALS : []

  if (breed === 'braque_francais') return [
    ...FOUNDATION_EXERCISES, 'namn', 'inkallning', 'stoppsignal', 'stanna', 'hantering', 'socialisering',
    'stadga', 'orientering', 'kontrollerat_sok', 'impulskontroll', 'koppel', 'ligg', 'sitt', 'plats', 'fri',
    ...puppyExtras, ...(isPuppy ? [] : ['apportering', 'vatten', 'fot']),
  ]
  if (breed === 'labrador') return [
    ...FOUNDATION_EXERCISES, 'namn', 'inkallning', 'stoppsignal', 'stanna', 'sitt', 'ligg', 'koppel', 'hantering',
    'socialisering', 'fokus', 'apportering', 'plats', 'fri', 'impulskontroll', ...puppyExtras, ...(isPuppy ? [] : ['vatten', 'fot']),
  ]
  if (breed === 'italian_greyhound') return [
    ...FOUNDATION_EXERCISES, 'namn', 'inkallning', 'stanna', 'sitt', 'ligg', 'koppel', 'hantering',
    'socialisering', 'fokus', 'impulskontroll', 'plats', 'fri', ...puppyExtras,
  ]
  if (breed === 'miniature_american_shepherd') return [
    ...FOUNDATION_EXERCISES, 'namn', 'inkallning', 'stoppsignal', 'stanna', 'sitt', 'ligg', 'koppel', 'hantering',
    'socialisering', 'fokus', 'impulskontroll', 'stadga', 'orientering', 'nosework', 'plats', 'fri',
    ...puppyExtras, ...(isPuppy ? [] : ['vallning', 'fot']),
  ]
  return [
    ...FOUNDATION_EXERCISES, 'namn', 'inkallning', 'sitt', 'ligg', 'stanna', 'koppel', 'hantering', 'socialisering',
    'stoppsignal', 'fokus', 'apportering', 'vatten', 'fot', 'plats', 'fri', 'impulskontroll', ...puppyExtras,
  ]
}
