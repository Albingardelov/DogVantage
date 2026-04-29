'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Breed } from '@/types'
import styles from './page.module.css'

const BREEDS: { value: Breed; label: string }[] = [
  { value: 'labrador', label: 'Labrador retriever' },
  { value: 'italian_greyhound', label: 'Italiensk vinthund' },
  { value: 'braque_francais', label: 'Braque français' },
]

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [breed, setBreed] = useState<Breed | ''>('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [docVersion, setDocVersion] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !breed) return

    setStatus('sending')
    setMessage('')

    const form = new FormData()
    form.append('file', file)
    form.append('breed', breed)
    if (sourceUrl) form.append('sourceUrl', sourceUrl)
    if (docVersion) form.append('docVersion', docVersion)

    try {
      // Community uploads go to ingest without an admin key — admin reviews before publishing
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Något gick fel. Försök igen.')
      } else {
        setStatus('done')
        setMessage('Tack! Dokumentet skickades in och granskas av oss innan det publiceras.')
      }
    } catch {
      setStatus('error')
      setMessage('Nätverksfel. Kontrollera din anslutning.')
    }
  }

  return (
    <main className={styles.main}>
      <Link href="/dashboard" className={styles.back}>← Tillbaka</Link>

      <h1 className={styles.heading}>Bidra med ett RAS-dokument</h1>
      <p className={styles.sub}>
        Hjälp andra hundägare genom att dela officiella rasklubbsdokument.
        Alla bidrag granskas manuellt innan de läggs till.
      </p>

      {status === 'done' ? (
        <div className={styles.success}>
          <p>{message}</p>
          <Link href="/dashboard" className={styles.backBtn}>Tillbaka till appen</Link>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="breed">Ras</label>
            <select
              id="breed"
              className={styles.input}
              value={breed}
              onChange={(e) => setBreed(e.target.value as Breed)}
            >
              <option value="" disabled>Välj ras</option>
              {BREEDS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="pdf-file">PDF-fil</label>
            <input
              id="pdf-file"
              className={styles.input}
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="source-url">
              Länk till originalet (valfritt men rekommenderat)
            </label>
            <input
              id="source-url"
              className={styles.input}
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://rasklubb.se/ras.pdf"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="doc-version">
              Dokumentversion (valfritt)
            </label>
            <input
              id="doc-version"
              className={styles.input}
              type="text"
              value={docVersion}
              onChange={(e) => setDocVersion(e.target.value)}
              placeholder="t.ex. 2023"
            />
          </div>

          {status === 'error' && (
            <p className={styles.error} role="alert">{message}</p>
          )}

          <button
            type="submit"
            className={styles.submit}
            disabled={!file || !breed || status === 'sending'}
          >
            {status === 'sending' ? 'Skickar…' : 'Skicka in dokument'}
          </button>
        </form>
      )}
    </main>
  )
}
