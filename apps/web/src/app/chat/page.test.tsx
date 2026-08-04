import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DogProfile } from '@dogvantage/core'

const mockUseSearchParams = vi.fn()
const mockUseActiveDog = vi.fn()
const mockChatInterface = vi.fn((_props: unknown) => <div data-testid="chat-interface" />)

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockUseSearchParams(),
}))

vi.mock('@/lib/dog/active-dog-context', () => ({
  useActiveDog: () => mockUseActiveDog(),
}))

vi.mock('@/components/ProfileGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/ChatInterface', () => ({
  default: (props: unknown) => mockChatInterface(props),
}))

vi.mock('@/components/billing/FeatureGate', () => ({
  FeatureGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/Avatar', () => ({
  default: ({ name }: { name: string }) => <div data-testid="avatar">{name}</div>,
}))

vi.mock('@/components/BottomNav', () => ({
  default: () => <nav data-testid="bottom-nav" />,
}))

import ChatPage from './page'

const activeDog: DogProfile = {
  id: 'dog-2',
  name: 'Bella',
  breed: 'labrador',
  birthdate: '2025-01-10',
  trainingWeek: 4,
  onboarding: {
    goals: ['everyday_obedience'],
    environment: 'suburb',
    rewardPreference: 'food',
    takesRewardsOutdoors: true,
  },
  assessment: { status: 'not_started' },
}

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === 'question' ? 'Hur tränar jag inkallning?' : null),
    })
    mockUseActiveDog.mockReturnValue({
      activeDog,
      allDogs: [activeDog],
      switchDog: vi.fn(),
      refreshDogs: vi.fn(),
      isLoading: false,
    })
  })

  it('passes active dog data into chat interface', () => {
    render(<ChatPage />)

    expect(screen.getByTestId('avatar')).toHaveTextContent('Bella')
    expect(screen.getByTestId('chat-interface')).toBeInTheDocument()
    expect(mockChatInterface).toHaveBeenCalledWith(
      expect.objectContaining({
        trainingWeek: 4,
        dogId: 'dog-2',
        initialQuestion: 'Hur tränar jag inkallning?',
      }),
    )
  })
})
