import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ExerciseGuideSheet from './ExerciseGuideSheet'
import type { ExerciseSpec } from '@dogvantage/core'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

const spec: ExerciseSpec = {
  exerciseId: 'inkallning',
  definition: 'Kommer hela vägen in.',
  ladder: [{ id: 'home_2m', label: 'Inne 2 m', criteria: '2 m inne', tips: ['Stå still.', 'Belöna vid vändning.'] }],
  troubleshooting: [],
  guide: {
    todaySummary: 'Idag bygger ni en glad inkallning på kort avstånd.',
    setup: ['Träna inne eller inhägnat', 'Ha högvärdig belöning redo'],
    steps: [
      { how: 'Säg namnet. När hunden tittar: säg kom och backa två steg.', why: 'Rörelse bakåt gör dig mer intressant än miljön.' },
      { how: 'Belöna vid vändning och igen när hunden når dig.', why: 'Dubbel belöning bygger fart in till dig.' },
      { how: 'Ge fri och släpp ut igen.', why: 'Kom ska inte betyda att kul tar slut.' },
      { how: 'Gör 3–5 reps och avsluta på lyckad.', why: 'Korta pass håller kvaliteten hög.' },
    ],
    successLooksLike: 'Hunden vänder direkt och springer hela vägen in på första signalen.',
    whenItFails: ['Gå närmare innan du ropar.', 'Byt till godare belöning.'],
    wrapUp: ['Sluta efter en tydlig lyckad rep.'],
    variants: [
      {
        id: 'toy_chase',
        label: 'Leksaksjakt',
        whenToUse: 'När maten känns platt idag.',
        how: ['Samma korta avstånd', 'Belöna med 3 sek lek vid dig'],
        why: 'Byter valuta till det som motiverar just nu.',
      },
    ],
  },
}

describe('ExerciseGuideSheet', () => {
  beforeEach(() => {
    push.mockClear()
  })

  it('renders how+why steps and hides variants until Det går inte', () => {
    render(
      <ExerciseGuideSheet
        exerciseId="inkallning"
        exerciseLabel="Inkallning"
        onClose={vi.fn()}
        customSpecs={{ inkallning: spec }}
      />,
    )
    expect(screen.getByText(/glad inkallning/i)).toBeInTheDocument()
    expect(screen.getByText(/Rörelse bakåt gör dig mer intressant/i)).toBeInTheDocument()
    expect(screen.queryByText('Leksaksjakt')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Det går inte/i }))
    expect(screen.getByText('Leksaksjakt')).toBeInTheDocument()
  })

  it('shows På din nivå when metrics include a known level', () => {
    render(
      <ExerciseGuideSheet
        exerciseId="inkallning"
        exerciseLabel="Inkallning"
        onClose={vi.fn()}
        customSpecs={{ inkallning: spec }}
        metrics={{ success_count: 2, fail_count: 1, latency_bucket: '1to3s', criteria_level_id: 'home_2m' } as never}
      />,
    )
    expect(screen.getByText('På din nivå')).toBeInTheDocument()
    expect(screen.getByText(/Inne 2 m/)).toBeInTheDocument()
    expect(screen.getByText(/2 m inne/)).toBeInTheDocument()
    expect(screen.getByText('Stå still.')).toBeInTheDocument()
  })

  it('chat CTA passes topic and lifeStage without raw level id in question', () => {
    render(
      <ExerciseGuideSheet
        exerciseId="inkallning"
        exerciseLabel="Inkallning"
        ageWeeks={20}
        onClose={vi.fn()}
        customSpecs={{ inkallning: spec }}
        metrics={{ success_count: 2, fail_count: 1, latency_bucket: '1to3s', criteria_level_id: 'home_2m' } as never}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Förklara mer/i }))
    expect(push).toHaveBeenCalledOnce()
    const href = push.mock.calls[0][0] as string
    expect(href).toContain('topic=recall')
    expect(href).toContain('lifeStage=junior')
    expect(href).toContain('Inne%202%20m')
    expect(href).not.toContain('home_2m')
  })
})
