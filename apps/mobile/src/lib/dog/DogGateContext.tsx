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
  refreshDogs: () => Promise<void>
}

const DogGateContext = createContext<DogGateValue | null>(null)

export function DogGateProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth()
  const [dogCount, setDogCount] = useState<number | null>(null)
  const [dogsLoading, setDogsLoading] = useState(true)

  const refreshDogs = useCallback(async () => {
    if (!session) {
      setDogCount(null)
      setDogsLoading(false)
      return
    }
    setDogsLoading(true)
    try {
      const n = await countUserDogs()
      setDogCount(n)
    } catch (e) {
      console.warn('[DogGate]', e)
      setDogCount(0)
    } finally {
      setDogsLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (authLoading) return
    void refreshDogs()
  }, [authLoading, refreshDogs])

  const value = useMemo(
    () => ({ dogCount, dogsLoading, refreshDogs }),
    [dogCount, dogsLoading, refreshDogs],
  )

  return <DogGateContext.Provider value={value}>{children}</DogGateContext.Provider>
}

export function useDogGate(): DogGateValue {
  const ctx = useContext(DogGateContext)
  if (!ctx) throw new Error('useDogGate must be used within DogGateProvider')
  return ctx
}
