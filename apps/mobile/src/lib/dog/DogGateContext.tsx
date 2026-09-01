import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { countUserDogs } from '@/lib/dog/profile'
import { useAuth } from '@/lib/auth/AuthContext'

type DogGateValue = {
  dogCount: number | null
  dogsLoading: boolean
  dogsError: boolean
  refreshDogs: () => Promise<void>
}

const DogGateContext = createContext<DogGateValue | null>(null)

export function DogGateProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth()
  const userId = session?.user?.id ?? null
  const [dogCount, setDogCount] = useState<number | null>(null)
  const [dogsLoading, setDogsLoading] = useState(true)
  const [dogsError, setDogsError] = useState(false)

  const refreshDogs = useCallback(async () => {
    if (!userId) {
      setDogCount(null)
      setDogsError(false)
      setDogsLoading(false)
      return
    }
    setDogsLoading(true)
    try {
      const n = await countUserDogs()
      setDogCount(n)
      setDogsError(false)
    } catch (e) {
      console.warn('[DogGate]', e)
      setDogsError(true)
    } finally {
      setDogsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (authLoading) return
    void refreshDogs()
  }, [authLoading, refreshDogs])

  const value = useMemo(
    () => ({ dogCount, dogsLoading, dogsError, refreshDogs }),
    [dogCount, dogsLoading, dogsError, refreshDogs],
  )

  return <DogGateContext.Provider value={value}>{children}</DogGateContext.Provider>
}

export function useDogGate(): DogGateValue {
  const ctx = useContext(DogGateContext)
  if (!ctx) throw new Error('useDogGate must be used within DogGateProvider')
  return ctx
}
