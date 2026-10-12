import { useCallback, useState } from 'react'

/** Sends a training write and tracks whether the last one failed. */
export function useTrainingWrite() {
  const [writeFailed, setWriteFailed] = useState(false)

  const saveTrainingWrite = useCallback((url: string, body: unknown) => {
    fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((res) => setWriteFailed(!res.ok))
      .catch(() => setWriteFailed(true))
  }, [])

  return { writeFailed, saveTrainingWrite }
}
