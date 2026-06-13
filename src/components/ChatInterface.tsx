'use client'

import { useState, useRef, useEffect } from 'react'
import type { ChatMessage, TrainingSourceRef } from '@/types'
import { IconPaw, IconSend } from '@/components/icons'
import { apiFetch, ApiError } from '@/lib/api/fetch'
import { TrainingResultSchema, ChatHistoryResponseSchema } from '@/types/api/schemas'
import styles from './ChatInterface.module.css'

interface Props {
  trainingWeek: number
  initialQuestion?: string
  dogId: string
}

const GREETING: ChatMessage = {
  role: 'model',
  content: 'Hej! Jag är din träningsassistent. För bäst hjälp: skriv övning + hur det gick idag, så får du en konkret plan för nästa reps.',
}

export default function ChatInterface({ trainingWeek, initialQuestion, dogId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [hasHistory, setHasHistory] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const didAutoSendRef = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    let cancelled = false
    apiFetch(`/api/chat/history?dogId=${dogId}`, ChatHistoryResponseSchema)
      .then((data) => {
        if (cancelled || data.messages.length === 0) return
        setHasHistory(true)
        setMessages(
          data.messages.map((m) => ({
            role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
            content: m.content,
          })),
        )
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setHistoryLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [dogId])

  async function send(text?: string, opts?: { isRetry?: boolean }) {
    const query = (text ?? input).trim()
    if (!query || loading) return

    if (!opts?.isRetry) {
      setInput('')
      setMessages((prev) => [...prev, { role: 'user', content: query }])
    }
    setLoading(true)

    try {
      const data = await apiFetch('/api/chat', TrainingResultSchema, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, dogId }),
      })
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: data.content,
          sources: data.sources,
          attributionNote: data.attributionNote,
        },
      ])
    } catch (err) {
      if (err instanceof ApiError) {
        setMessages((prev) => [
          ...prev,
          { role: 'model', content: `Något gick fel: ${err.message}`, retryQuery: err.retryable ? query : undefined },
        ])
        return
      }
      const msg = err instanceof Error ? err.message : 'Nätverksfel'
      setMessages((prev) => [...prev, { role: 'model', content: `Kunde inte nå assistenten: ${msg}`, retryQuery: query }])
    } finally {
      setLoading(false)
    }
  }

  function retry(index: number, query: string) {
    if (loading) return
    setMessages((prev) => prev.filter((_, i) => i !== index))
    send(query, { isRetry: true })
  }

  useEffect(() => {
    if (!initialQuestion || didAutoSendRef.current) return
    if (loading) return
    if (!historyLoaded || hasHistory) return
    didAutoSendRef.current = true
    send(initialQuestion)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion, historyLoaded, hasHistory, loading])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }, [input])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  const quickPrompts = [
    `Ge mig en plan för nästa 5 reps i programvecka ${trainingWeek}.`,
    'Hur långt pass ska vi köra idag?',
    'Vi fastnar på sitt — hur backar jag kriteriet?',
  ]

  return (
    <div className={styles.wrapper}>
      <div className={styles.messages}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`${styles.row} ${m.role === 'user' ? styles.rowUser : styles.rowModel}`}
          >
            {m.role === 'model' && (
              <div className={styles.modelAvatar}>
                <IconPaw size="md" />
              </div>
            )}
            {m.role === 'user' ? (
              <div className={`${styles.bubble} ${styles.bubbleUser}`}>{m.content}</div>
            ) : (
              <div className={styles.modelColumn}>
                <div className={`${styles.bubble} ${styles.bubbleModel} ${m.retryQuery ? styles.bubbleError : ''}`}>{m.content}</div>
                {m.retryQuery && (
                  <button
                    type="button"
                    className={styles.retryBtn}
                    onClick={() => retry(i, m.retryQuery!)}
                    disabled={loading}
                  >
                    Försök igen
                  </button>
                )}
                {(m.sources && m.sources.length > 0) || m.attributionNote ? (
                  <aside className={styles.citationBlock} aria-label="Källor och förklaring">
                    {m.sources && m.sources.length > 0 && (
                      <>
                        <span className={styles.citationTitle}>Källor</span>
                        <ul className={styles.sourceList}>
                          {m.sources.map((s, j) => (
                            <SourceRow key={`${s.source}-${j}`} s={s} />
                          ))}
                        </ul>
                        <p className={styles.methodHint}>
                          Svaret kombinerar dessutom allmän metod (t.ex. belöning, timing) med material och rasprofil.
                        </p>
                      </>
                    )}
                    {m.attributionNote && (
                      <p className={styles.attributionNote}>{m.attributionNote}</p>
                    )}
                  </aside>
                ) : null}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className={`${styles.row} ${styles.rowModel}`}>
            
            <div className={`${styles.bubble} ${styles.bubbleModel} ${styles.typing}`} aria-label="Skriver…">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {historyLoaded && !hasHistory && messages.length < 6 && (
        <div className={styles.quickRow}>
          {quickPrompts.map((q) => (
            <button
              key={q}
              type="button"
              className={styles.quickChip}
              onClick={() => send(q)}
              disabled={loading}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className={styles.inputRow}>
        <textarea
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Skriv en fråga…"
          rows={1}
          disabled={loading || !historyLoaded}
        />
        <button
          type="button"
          className={styles.sendBtn}
          onClick={() => send()}
          disabled={!input.trim() || loading || !historyLoaded}
          aria-label="Skicka"
        >
          <IconSend size="md" />
        </button>
      </div>
    </div>
  )
}

function SourceRow({ s }: { s: TrainingSourceRef }) {
  const meta = [s.doc_version, s.page_ref].filter(Boolean).join(' · ')
  return (
    <li className={styles.sourceItem}>
      {s.source_url ? (
        <a
          href={s.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.sourceLink}
        >
          {s.source || 'Dokument'}
        </a>
      ) : (
        <span className={styles.sourceName}>{s.source || 'Dokument'}</span>
      )}
      {meta && <span className={styles.sourceMeta}>{meta}</span>}
    </li>
  )
}
