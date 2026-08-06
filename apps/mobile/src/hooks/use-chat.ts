import { useCallback, useEffect, useState } from 'react'
import type { ChatMessage, TrainingSourceRef } from '@dogvantage/core'
import {
  ChatHistoryResponseSchema,
  TrainingResultSchema,
} from '@dogvantage/core'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiFetch } from '@/lib/api/client'
import { fetchActiveDog, type ActiveDog } from '@/lib/dog/active-dog'

const GREETING: ChatMessage = {
  role: 'model',
  content:
    'Hej! Jag är din träningsassistent. För bäst hjälp: skriv övning + hur det gick idag, så får du en konkret plan för nästa reps.',
}

export type UiChatMessage = ChatMessage & {
  retryQuery?: string
  retryable?: boolean
  isError?: boolean
}

export function useChat() {
  const { session } = useAuth()
  const [dog, setDog] = useState<ActiveDog | null>(null)
  const [messages, setMessages] = useState<UiChatMessage[]>([GREETING])
  const [loading, setLoading] = useState(false)
  const [booting, setBooting] = useState(true)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!session?.access_token) return
    setBooting(true)
    setErrorBanner(null)
    try {
      const active = await fetchActiveDog()
      setDog(active)
      if (!active?.id) {
        setErrorBanner('Ingen hundprofil hittades.')
        return
      }
      const res = await apiFetch(
        `/api/chat/history?dogId=${encodeURIComponent(active.id)}`,
        session.access_token,
      )
      if (res.status === 401) {
        setErrorBanner('Sessionen har gått ut — logga in igen.')
        return
      }
      if (!res.ok) {
        // Keep greeting if history fails
        return
      }
      const parsed = ChatHistoryResponseSchema.parse(await res.json())
      if (parsed.messages.length > 0) {
        setMessages(
          parsed.messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            content: m.content,
          })),
        )
      } else {
        setMessages([GREETING])
      }
    } catch (e) {
      console.warn('[useChat] history', e)
    } finally {
      setBooting(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    void load()
  }, [load])

  const send = useCallback(
    async (raw: string) => {
      const query = raw.trim()
      if (!query || !session?.access_token || !dog?.id || loading) return

      setLoading(true)
      setErrorBanner(null)
      setMessages((prev) => [...prev, { role: 'user', content: query }])

      try {
        const res = await apiFetch('/api/chat', session.access_token, {
          method: 'POST',
          body: JSON.stringify({
            query,
            dogId: dog.id,
            locale: 'sv',
          }),
        })

        if (res.status === 401) {
          setErrorBanner('Sessionen har gått ut — logga in igen.')
          setMessages((prev) => [
            ...prev,
            {
              role: 'model',
              content: 'Du behöver logga in igen.',
              isError: true,
              retryable: false,
            },
          ])
          return
        }

        const body = (await res.json().catch(() => ({}))) as {
          error?: string
          retryable?: boolean
          content?: string
          sources?: TrainingSourceRef[]
          attributionNote?: string
        }

        if (!res.ok) {
          const retryable = body.retryable !== false && res.status !== 429 && res.status !== 422 && res.status !== 402
          setMessages((prev) => [
            ...prev,
            {
              role: 'model',
              content: body.error ?? `Kunde inte få svar (${res.status})`,
              isError: true,
              retryable,
              retryQuery: retryable ? query : undefined,
            },
          ])
          return
        }

        const parsed = TrainingResultSchema.parse(body)
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            content: parsed.content,
            sources: parsed.sources,
            attributionNote: parsed.attributionNote,
          },
        ])
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            content: e instanceof Error ? e.message : 'Nätverksfel',
            isError: true,
            retryable: true,
            retryQuery: query,
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [session?.access_token, dog?.id, loading],
  )

  const retry = useCallback(
    (query: string) => {
      setMessages((prev) => {
        // drop trailing error bubble
        const next = [...prev]
        while (next.length && next[next.length - 1]?.isError) next.pop()
        // also drop the user bubble we will re-add
        if (next.length && next[next.length - 1]?.role === 'user') next.pop()
        return next
      })
      void send(query)
    },
    [send],
  )

  return {
    dog,
    messages,
    loading,
    booting,
    errorBanner,
    send,
    retry,
    reload: load,
  }
}
