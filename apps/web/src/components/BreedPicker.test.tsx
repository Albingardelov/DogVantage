// src/components/BreedPicker.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BreedPicker from './BreedPicker'

describe('BreedPicker', () => {
  it('shows input when no value selected', () => {
    render(<BreedPicker value="" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toBeDefined()
  })

  it('shows selected breed name and clear button when value is set', () => {
    render(<BreedPicker value="labrador" onChange={() => {}} />)
    expect(screen.getByText('Labrador Retriever')).toBeDefined()
    expect(screen.getByRole('button')).toBeDefined()
  })

  it('calls onChange with slug when a result is clicked', () => {
    const onChange = vi.fn()
    render(<BreedPicker value="" onChange={onChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'golden' } })
    const option = screen.getByText('Golden Retriever')
    fireEvent.mouseDown(option)
    expect(onChange).toHaveBeenCalledWith('golden_retriever')
  })

  it('shows empty message when search has no results', () => {
    render(<BreedPicker value="" onChange={() => {}} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'zzzzznotabreed' } })
    expect(screen.getByText(/Hittade ingen ras/)).toBeDefined()
  })

  it('calls onChange with empty string when clear button pressed', () => {
    const onChange = vi.fn()
    render(<BreedPicker value="labrador" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onChange).toHaveBeenCalledWith('')
  })
})
