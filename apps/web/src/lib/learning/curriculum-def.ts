import { getLifeStage, type LifeStage } from '@dogvantage/core'
import type { ChunkTopic } from '@/lib/learning/chunk-metadata'

export interface CurriculumModuleDef {
  id: string
  order: number
  title: string
  goal: string
  topic: ChunkTopic
  /** Optional linked exercise in the training app */
  exerciseId?: string
  readMinutes: number
  /** Handler dimension this module primarily trains — learning layer uses a literal union, not an import from training */
  dimension?: 'timing' | 'consistency' | 'reading'
}

/** Beginner-first curriculum — ordered for owners who are learning alongside their dog. */
export const CURRICULUM_MODULES: CurriculumModuleDef[] = [
  {
    id: 'hemma',
    order: 1,
    title: 'Första dagarna hemma',
    goal: 'Trygghet, rutin och en lugn start — innan krav.',
    topic: 'socialization',
    readMinutes: 4,
  },
  {
    id: 'marker',
    order: 2,
    title: 'Markören — din viktigaste signal',
    goal: 'Ladda markören och bygg timing mellan beteende och belöning.',
    topic: 'marker',
    exerciseId: 'marker',
    readMinutes: 3,
    dimension: 'timing',
  },
  {
    id: 'sitt',
    order: 3,
    title: 'Sitt — första lydnadstricket',
    goal: 'Korta pass, hög belöningsgrad, lugn miljö.',
    topic: 'sit',
    exerciseId: 'sitt',
    readMinutes: 3,
    dimension: 'consistency',
  },
  {
    id: 'inkallning',
    order: 4,
    title: 'Inkallning — säkerhet före fart',
    goal: 'Bygg värde att komma till dig, börja nära.',
    topic: 'recall',
    exerciseId: 'inkallning',
    readMinutes: 4,
  },
  {
    id: 'koppel',
    order: 5,
    title: 'Koppel — gå fint tillsammans',
    goal: 'Belöna lugn position, korta pass, pausa vid spänning.',
    topic: 'leash',
    exerciseId: 'lat',
    readMinutes: 4,
    dimension: 'consistency',
  },
  {
    id: 'hantering',
    order: 6,
    title: 'Hantering och vardag',
    goal: 'Korta positiva kontakter, klokslag, vardagslydnad.',
    topic: 'handling',
    exerciseId: 'hantering',
    readMinutes: 3,
    dimension: 'reading',
  },
  {
    id: 'socialisering',
    order: 7,
    title: 'Socialisering och miljö',
    goal: 'Positiva möten, val av stimuli, rätt förväntningar.',
    topic: 'socialization',
    readMinutes: 4,
    dimension: 'reading',
  },
  {
    id: 'bur',
    order: 8,
    title: 'Bur och ensamhet',
    goal: 'Gradvis vana, trygg plats, undvik separation anxiety.',
    topic: 'crate',
    exerciseId: 'bur',
    readMinutes: 4,
  },
]

export function modulesForLifeStage(lifeStage: LifeStage): CurriculumModuleDef[] {
  if (lifeStage === 'puppy') {
    return CURRICULUM_MODULES
  }
  // Skip "first days home" for older dogs — they already live with the family.
  return CURRICULUM_MODULES.filter((m) => m.id !== 'hemma')
}

export function moduleById(id: string): CurriculumModuleDef | undefined {
  return CURRICULUM_MODULES.find((m) => m.id === id)
}

export function lifeStageFromAgeWeeks(ageWeeks?: number): LifeStage {
  return getLifeStage(ageWeeks)
}
