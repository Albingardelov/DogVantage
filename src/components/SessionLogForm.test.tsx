import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import SessionLogForm from './SessionLogForm'

const onSaved = vi.fn()

function renderForm() {
  render(<SessionLogForm dogId="dog-1" weekNumber={1} exercises={[]} onSaved={onSaved} />)
  fireEvent.click(screen.getByRole('radio', { name: 'Bra' }))
  fireEvent.click(screen.getByRole('button', { name: /Spara pass/ }))
}

describe('SessionLogForm save status', () => {
  beforeEach(() => {
    onSaved.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows an error and no saved screen when the server responds with an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) }))

    renderForm()

    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent('kunde inte sparas')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Spara pass/ })).toBeEnabled()
  })

  it('shows an error when the request itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    renderForm()

    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent('kunde inte sparas')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the saved screen after a successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) }))

    renderForm()

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
