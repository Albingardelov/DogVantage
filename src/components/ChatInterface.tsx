'use client'

import { useState, useRef, useEffect } from 'react'
import type { Breed, ChatMessage, TrainingResult } from '@/types'
import styles from './ChatInterface.module.css'

interface Props {
  breed: Breed
  weekNumber: number
}

export default function ChatInterface({ breed, weekNumber }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const query = input.trim()
    if (!query || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: query }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, breed, weekNumber }),
      })
      const data: TrainingResult = await res.json()
      setMessages((prev) => [...prev, { role: 'model', content: data.content }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.messages}>
        {messages.length === 0 && (
          <p className={styles.empty}>Ställ en fråga om träning för din hund.</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`${styles.bubble} ${m.role === 'user' ? styles.user : styles.model}`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className={`${styles.bubble} ${styles.model} ${styles.typing}`}>
            <span /><span /><span />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputRow}>
        <textarea
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Fråga om träning… (Enter för att skicka)"
          rows={2}
          disabled={loading}
        />
        <button
          className={styles.sendBtn}
          onClick={send}
          disabled={!input.trim() || loading}
          aria-label="Skicka"
        >
          ↑
        </button>
      </div>
    </div>
  )
}
