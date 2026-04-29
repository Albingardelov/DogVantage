import { describe, it, expect, vi } from 'vitest'

vi.mock('./client', () => ({
  getGroqClient: () => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  }),
  GROQ_MODEL: 'llama-3.3-70b-versatile',
}))

vi.mock('./embed', () => ({
  embedText: vi.fn(),
}))

vi.mock('@/lib/supabase/breed-chunks', () => ({
  searchBreedChunks: vi.fn(),
}))

vi.mock('./breed-profiles', () => ({
  formatBreedProfile: vi.fn().mockReturnValue(''),
  formatCurrentPhase: vi.fn().mockReturnValue(''),
}))

import { parseWeekPlan, buildFallbackPlan } from './week-plan'

describe('parseWeekPlan', () => {
  it('parses valid JSON with 7 days', () => {
    const json = JSON.stringify({
      days: [
        { day: 'Måndag', exercises: [{ id: 'inkallning', label: 'Inkallning', desc: 'Kalla med glad röst', reps: 3 }] },
        { day: 'Tisdag', rest: true },
        { day: 'Onsdag', exercises: [{ id: 'sitt', label: 'Sitt', desc: 'Håll godis över nosen', reps: 5 }] },
        { day: 'Torsdag', exercises: [{ id: 'ligg', label: 'Ligg', desc: 'Sjunk ner från sitt', reps: 3 }] },
        { day: 'Fredag', rest: true },
        { day: 'Lördag', exercises: [{ id: 'namn', label: 'Namnträning', desc: 'Säg namn, belöna blick', reps: 5 }] },
        { day: 'Söndag', exercises: [{ id: 'inkallning', label: 'Inkallning', desc: 'Kalla med glad röst', reps: 3 }] },
      ],
    })
    const plan = parseWeekPlan(json)
    expect(plan).not.toBeNull()
    expect(plan!.days).toHaveLength(7)
    expect(plan!.days[0].day).toBe('Måndag')
    expect(plan!.days[0].exercises![0].reps).toBe(3)
  })

  it('returns null for invalid JSON', () => {
    expect(parseWeekPlan('not json')).toBeNull()
  })

  it('returns null when days array has wrong length', () => {
    const json = JSON.stringify({ days: [{ day: 'Måndag' }] })
    expect(parseWeekPlan(json)).toBeNull()
  })

  it('returns null when days key is missing', () => {
    expect(parseWeekPlan(JSON.stringify({}))).toBeNull()
  })
})

describe('buildFallbackPlan', () => {
  it('always returns exactly 7 days', () => {
    const plan = buildFallbackPlan()
    expect(plan.days).toHaveLength(7)
  })

  it('all days have a day name', () => {
    const plan = buildFallbackPlan()
    plan.days.forEach((d) => expect(typeof d.day).toBe('string'))
  })
})
