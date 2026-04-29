'use client'

import { useState } from 'react'
import type { Breed } from '@/types'
import styles from './page.module.css'

const BREEDS: { value: Breed; label: string }[] = [
  { value: 'labrador', label: 'Labrador retriever' },
  { value: 'italian_greyhound', label: 'Italiensk vinthund' },
  { value: 'braque_francais', label: 'Braque français' },
]

export default function AdminIngestPage() {
  const [adminKey, setAdminKey] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [breed, setBreed] = useState<Breed | ''>('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [docVersion, setDocVersion] = useState('')
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !breed || !adminKey) return

    setStatus('uploading')
    setMessage('')

    const form = new FormData()
    form.append('file', file)
    form.append('breed', breed)
    if (sourceUrl) form.append('sourceUrl', sourceUrl)
    if (docVersion) form.append('docVersion', docVersion)

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
        body: form,
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Något gick fel.')
      } else {
        setStatus('done')
        setMessage(`Klart! ${data.chunksInserted} chunk(s) inlagda.`)
      }
    } catch {
      setStatus('error')
      setMessage('Nätverksfel.')
    }
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Lägg till RAS-dokument</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="admin-key">Admin-nyckel</label>
          <input
            id="admin-key"
            className={styles.input}
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="ADMIN_SECRET"
          />
        </div>

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
          <label className={styles.label} htmlFor="source-url">Käll-URL (valfritt)</label>
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
          <label className={styles.label} htmlFor="doc-version">Version (valfritt)</label>
          <input
            id="doc-version"
            className={styles.input}
            type="text"
            value={docVersion}
            onChange={(e) => setDocVersion(e.target.value)}
            placeholder="t.ex. 2023"
          />
        </div>

        {message && (
          <p className={status === 'error' ? styles.error : styles.success}>{message}</p>
        )}

        <button
          type="submit"
          className={styles.submit}
          disabled={!file || !breed || !adminKey || status === 'uploading'}
        >
          {status === 'uploading' ? 'Laddar upp…' : 'Ladda upp och indexera'}
        </button>
      </form>
    </main>
  )
}
