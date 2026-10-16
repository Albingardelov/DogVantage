import { useCallback, useRef, useState } from 'react'

/**
 * Sends training writes one at a time, in the order they were requested, so a
 * slower earlier response cannot overwrite a newer value on the server.
 */
export function useTrainingWrite() {
  const [writeFailed, setWriteFailed] = useState(false)
  const queue = useRef<Promise<void>>(Promise.resolve())

  const saveTrainingWrite = useCallback((url: string, body: unknown) => {
    queue.current = queue.current.then(() =>
      fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then((res) => setWriteFailed(!res.ok))
        .catch(() => setWriteFailed(true)),
    )
  }, [])

  return { writeFailed, saveTrainingWrite }
}
