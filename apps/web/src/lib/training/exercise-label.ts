import { getExerciseSpec } from './exercise-specs'

const LABEL_OVERRIDES: Record<string, string> = {
  namn: 'Namnkontakt',
  lat: 'LAT',
  kontrollerat_sok: 'Kontrollerat sök',
  box_traning: 'Boxträning',
  ensam_traning: 'Ensamträning',
  bett_inhibition: 'Bitinhibition',
  stoppsignal: 'Stoppsignal',
}

export function exerciseLabel(id: string): string {
  const spec = getExerciseSpec(id)
  return (
    LABEL_OVERRIDES[id] ??
    spec?.exerciseId?.replaceAll('_', ' ')?.replace(/\b\w/g, (c) => c.toUpperCase()) ??
    id
  )
}
