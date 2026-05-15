import { resolveBreedProfile } from '@/lib/ai/breed-profiles'
import { GOAL_LABELS, GOAL_RULES } from '@/lib/training/goal-exercises'
import { getLifeStage, isPuppy } from '@/lib/dog/age'
import type { Breed, TrainingGoal } from '@/types'

export interface WeekFocusCopy {
  /** Varför veckan ser ut som den gör */
  whyLine: string
  /** Max två konkreta delmål kopplade till valda mål */
  subGoalBullets: string[]
  /** Metod vs dokument vs rasprofil */
  methodVsDocumentsNote: string
  /** Påminnelse om kvalitetsmätning */
  qualityMeasurementHint: string
}

function phasePhrase(ageWeeks: number): string {
  if (isPuppy(ageWeeks)) {
    return `valpen är ${ageWeeks} veckor — korta pass och små steg i svårighet`
  }
  const stage = getLifeStage(ageWeeks)
  if (stage === 'junior' || stage === 'adolescent') {
    return `hunden är ${ageWeeks} veckor (ungdom) — var beredd på stubbor och planera om när det behövs`
  }
  const months = Math.round(ageWeeks / 4.33)
  return `hunden är ca ${months} månader — progression kan gå snabbare om flyt och motivation finns`
}

function defaultSubGoals(breed: string): string[] {
  const skills = resolveBreedProfile(breed).breedSkills.slice(0, 2)
  return skills.map((s) => `${s.name}: ${s.description}`)
}

/**
 * Copy för "Veckans fokus" på träningskortet — kopplar programvecka, ras, ålder och mål.
 */
export function buildWeekFocusCopy(params: {
  breed: string
  ageWeeks: number
  trainingWeek: number
  goals?: TrainingGoal[]
}): WeekFocusCopy {
  const { breed, ageWeeks, trainingWeek, goals } = params
  const breedName = resolveBreedProfile(breed).name

  const goalPart =
    goals && goals.length > 0
      ? `Dina valda mål (${goals.map((g) => GOAL_LABELS[g]).join(', ')}) styr vilka övningar som prioriteras.`
      : 'Lägg gärna till träningsmål under Profil om du vill styra prioriteringen tydligare.'

  const whyLine = `Programvecka ${trainingWeek} för ${breedName}: ${phasePhrase(ageWeeks)}. ${goalPart}`

  let subGoalBullets: string[] = []
  if (goals && goals.length > 0) {
    subGoalBullets = goals.slice(0, 2).map((g) => GOAL_RULES[g])
    if (goals.length > 2) {
      subGoalBullets.push(`Även: ${goals.slice(2).map((g) => GOAL_LABELS[g]).join(', ')}`)
    }
  } else {
    subGoalBullets = defaultSubGoals(breed)
    if (subGoalBullets.length === 0) {
      subGoalBullets = [
        'Bygg flyt på namn och inkallning innan du höjer svårighet.',
        'Håll passen korta och avsluta med en lyckad rep.',
      ]
    }
  }
  subGoalBullets = subGoalBullets.slice(0, 3)

  const methodVsDocumentsNote =
    'Planen blandar allmän träningsmetod (belöning, timing, korta pass) med rasprofilen ovan. Om ni har laddat upp dokument i kunskapsbasen kan veckan även spegla det materialet — annars bygger den på metod + ras + era mål.'

  const qualityMeasurementHint =
    'Tips: använd Utfall och Latens under varje övning — då ser ni om hunden lär sig (kvalitet), inte bara hur många reps ni räknar.'

  return {
    whyLine,
    subGoalBullets,
    methodVsDocumentsNote,
    qualityMeasurementHint,
  }
}
