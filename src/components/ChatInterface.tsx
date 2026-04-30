'use client'

import { useState, useRef, useEffect } from 'react'
import type { Breed, ChatMessage, TrainingResult } from '@/types'
import styles from './ChatInterface.module.css'

interface Props {
  breed: Breed
  ageWeeks: number
  trainingWeek: number
  initialQuestion?: string
  dogKey?: string
  onboardingContext?: string
}

export default function ChatInterface({ breed, ageWeeks, trainingWeek, initialQuestion, dogKey, onboardingContext }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: 'Hej! Jag är din träningsassistent. Vad undrar du om träningen?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const didAutoSendRef = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const query = (text ?? input).trim()
    if (!query || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: query }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, breed, ageWeeks, trainingWeek, dogKey, onboardingContext }),
      })
      const data: TrainingResult = await res.json()
      setMessages((prev) => [...prev, { role: 'model', content: data.content }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialQuestion || didAutoSendRef.current) return
    if (loading) return
    // Only auto-send when the chat is still fresh (1 greeting message)
    if (messages.length !== 1) return
    didAutoSendRef.current = true
    send(initialQuestion)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion, messages.length, loading])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const quickPrompts = [
    `Vad ska vi träna i programvecka ${trainingWeek}?`,
    'Hur länge bör ett pass vara?',
    'Apportering — när börja?',
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
              <div className={styles.modelAvatar} aria-hidden="true">🐾</div>
            )}
            <div
              className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleModel}`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className={`${styles.row} ${styles.rowModel}`}>
            <div className={styles.modelAvatar} aria-hidden="true">🐾</div>
            <div className={`${styles.bubble} ${styles.bubbleModel} ${styles.typing}`} aria-label="Skriver…">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {messages.length < 3 && (
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
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Skriv en fråga…"
          rows={1}
          disabled={loading}
        />
        <button
          type="button"
          className={styles.sendBtn}
          onClick={() => send()}
          disabled={!input.trim() || loading}
          aria-label="Skicka"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )
}

function SendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}
