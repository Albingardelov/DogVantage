/**
 * Canonical goal → exercise-id mapping.
 *
 * Single source of truth used by both the week planner and the assessment
 * screening so the two flows are always in sync.
 */
import type { TrainingGoal } from '@/types'

export const GOAL_EXERCISE_IDS: Record<TrainingGoal, string[]> = {
  everyday_obedience: ['namn', 'inkallning', 'koppel', 'stanna', 'hantering', 'socialisering'],
  sport:              ['namn', 'stanna', 'sitt', 'ligg', 'inkallning', 'fokus'],
  hunting:            ['inkallning', 'stoppsignal', 'stadga', 'orientering', 'kontrollerat_sok', 'apportering', 'vatten'],
  herding:            ['inkallning', 'stoppsignal', 'impulskontroll', 'stadga', 'orientering', 'fokus'],
  impulse_control:    ['impulskontroll', 'stanna', 'stadga', 'namn', 'hantering'],
  nosework:           ['nosework', 'inkallning', 'stanna'],
  problem_solving:    ['koppel', 'inkallning', 'stadga', 'impulskontroll', 'orientering', 'fokus'],
}

export const GOAL_LABELS: Record<TrainingGoal, string> = {
  everyday_obedience: 'Vardagslydnad',
  sport:              'Sport / tävling',
  hunting:            'Jakt / bruk',
  herding:            'Vallning',
  impulse_control:    'Impulskontroll & lugn',
  nosework:           'Nosework / doftsök',
  problem_solving:    'Lösa problem (koppel/inkallning)',
}

export const GOAL_RULES: Record<TrainingGoal, string> = {
  everyday_obedience: 'Inkludera vardagsrelevanta övningar som koppel, inkallning, hantering.',
  sport:              'Prioritera precision och snabbhet: sitt, ligg, fokus, inkallning med hög kriterienivå.',
  hunting:            'Inkludera minst en av: stadga, orientering, kontrollerat_sok, stoppsignal per träningsdag.',
  herding:            'Inkludera impulskontroll och stoppsignal varje träningsdag. Orientering och stadga mot rörliga triggers.',
  impulse_control:    'Fokusera på lugn och väntan: impulskontroll, stanna, hantering. Korta pass, hög framgångsfrekvens.',
  nosework:           'Inkludera nosework minst 2 dagar i veckan. Kombinera med stanna och inkallning.',
  problem_solving:    'Fokusera på impulskontroll, koppelgång och inkallning i utmanande miljöer.',
}
