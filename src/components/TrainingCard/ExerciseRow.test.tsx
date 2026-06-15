import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ExerciseRow from './ExerciseRow'
import { EMPTY_GUARD } from '@/lib/training/session-coach'
import type { ExerciseSpec } from '@/lib/training/exercise-specs'

const spec: ExerciseSpec = {
  exerciseId: 'sitt',
  definition: 'Lyckad rep = rumpan i marken.',
  ladder: [{ id: 'home_low', label: 'Hemma, låg störning', criteria: 'Inomhus' }],
  troubleshooting: [],
  guide: {
    setup: ['Ha godis i hand'],
    steps: ['Locka rumpan ner, markera, belöna'],
    logging: [],
    commonMistakes: [],
    stopRules: [],
  },
}

const base = {
  exercise: { id: 'sitt', label: 'Sitt', desc: '3 reps', reps: 3 },
  done: 0,
  onRepClick: vi.fn(),
  spec,
  metrics: null,
  guard: EMPTY_GUARD,
  onMetricsPatch: vi.fn(),
  ageWeeks: 52,
}

describe('ExerciseRow maturity', () => {
  it('new mode shows the first guide step and hides latency behind Visa mer', () => {
    render(<ExerciseRow {...base} maturity="new" />)
    expect(screen.getByText(/Locka rumpan ner/)).toBeInTheDocument()
    expect(screen.queryByText('Svarstid efter signal')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Visa mer' })).toBeInTheDocument()
  })

  it('practiced mode shows latency controls immediately', () => {
    render(<ExerciseRow {...base} maturity="practiced" />)
    expect(screen.getByText('Svarstid efter signal')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Visa mer' })).not.toBeInTheDocument()
  })

  it('shows the per-row done message on the last exercise when the day is not complete', () => {
    render(<ExerciseRow {...base} done={3} hasNextExercise={false} />)
    expect(screen.getByText(/Du är klar för idag/)).toBeInTheDocument()
  })

  it('suppresses the per-row done message when the whole day is complete', () => {
    render(<ExerciseRow {...base} done={3} hasNextExercise={false} dayComplete />)
    expect(screen.queryByText(/Du är klar för idag/)).not.toBeInTheDocument()
  })
})
