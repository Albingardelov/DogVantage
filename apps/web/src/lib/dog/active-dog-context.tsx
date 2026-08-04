'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getAllDogProfiles } from './profile'
import { getActiveDogId, setActiveDogId } from '@/lib/supabase/user-settings'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import type { DogProfile } from '@/types'

interface ActiveDogContextValue {
  activeDog: DogProfile | null
  allDogs: DogProfile[]
  switchDog: (id: string) => Promise<void>
  refreshDogs: () => Promise<void>
  isLoading: boolean
}

const ActiveDogContext = createContext<ActiveDogContextValue | null>(null)

export function ActiveDogProvider({ children }: { children: React.ReactNode }) {
  const [allDogs, setAllDogs] = useState<DogProfile[]>([])
  const [activeDogId, setActiveDogIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadDogs = useCallback(async () => {
    const [dogs, activeId] = await Promise.all([
      getAllDogProfiles(),
      getActiveDogId(),
    ])
    setAllDogs(dogs)
    const resolved = activeId && dogs.some((d) => d.id === activeId)
      ? activeId
      : dogs[0]?.id ?? null
    setActiveDogIdState(resolved)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadDogs().catch((e) => console.error('[ActiveDogProvider]', e))
  }, [loadDogs])

  const switchDog = useCallback(async (id: string) => {
    const { data: { user } } = await getSupabaseBrowser().auth.getUser()
    if (!user) return
    setActiveDogIdState(id)
    await setActiveDogId(user.id, id)
  }, [])

  const refreshDogs = useCallback(async () => {
    const dogs = await getAllDogProfiles()
    setAllDogs(dogs)
  }, [])

  const activeDog = allDogs.find((d) => d.id === activeDogId) ?? allDogs[0] ?? null

  return (
    <ActiveDogContext.Provider value={{ activeDog, allDogs, switchDog, refreshDogs, isLoading }}>
      {children}
    </ActiveDogContext.Provider>
  )
}

export function useActiveDog(): ActiveDogContextValue {
  const ctx = useContext(ActiveDogContext)
  if (!ctx) throw new Error('useActiveDog must be used inside ActiveDogProvider')
  return ctx
}
