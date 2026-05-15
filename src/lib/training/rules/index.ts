import { markerRule } from './marker'
import { scheduleRule } from './schedule'
import { capturingRule } from './capturing'
import { breedSpecificRule } from './breed-specific'
import { petRule } from './pet'
import { focusRule } from './focus'
import { sexRule } from './sex'
import { reactiveRule } from './reactive'
import { developmentalRule } from './developmental'
import { sessionCapRule } from './session-cap'
import { goalRule } from './goal'
import { progressionRule } from './progression'
import { puppyRule } from './puppy'
import type { RuleBuilder, WeekPlanContext } from './types'

export const ALL_RULES: RuleBuilder[] = [
  progressionRule,
  developmentalRule,
  sessionCapRule,
  reactiveRule,
  markerRule,
  scheduleRule,
  capturingRule,
  breedSpecificRule,
  puppyRule,
  goalRule,
  petRule,
  focusRule,
  sexRule,
]

export function composeRules(ctx: WeekPlanContext, rules: RuleBuilder[]): string {
  return rules
    .map((r) => r(ctx))
    .filter((v): v is string => Boolean(v))
    .join('\n')
}

export type { RuleBuilder, WeekPlanContext } from './types'
