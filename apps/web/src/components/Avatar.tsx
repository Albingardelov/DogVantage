'use client'

import { useEffect, useState } from 'react'
import { getDogPhoto } from '@/lib/dog/photo'
import styles from './Avatar.module.css'

interface AvatarProps {
  /** Optional explicit photo URL. If omitted, the photo is loaded from Supabase Storage. */
  photo?: string | null
  name: string
  /** Dog UUID — used to load the correct per-dog photo from storage. */
  dogId?: string
  /** Outer diameter in pixels. */
  size?: number
  /** When false, removes the white border ring (used inside dark headers). */
  bordered?: boolean
}

export default function Avatar({ photo, name, dogId, size = 64, bordered = true }: AvatarProps) {
  const [storedPhoto, setStoredPhoto] = useState<string | null>(null)
  const [imgFailed, setImgFailed] = useState(false)
  const explicitPhotoProvided = photo !== undefined

  useEffect(() => {
    if (!explicitPhotoProvided) {
      let alive = true
      ;(async () => {
        const url = await getDogPhoto(dogId)
        if (alive) setStoredPhoto(url)
      })().catch((e) => console.error('[Avatar getDogPhoto]', e))
      return () => { alive = false }
    }
  }, [explicitPhotoProvided, dogId])

  const finalPhoto = explicitPhotoProvided ? photo : storedPhoto
  const initial = name.trim()[0]?.toUpperCase() || '?'
  const showImage = Boolean(finalPhoto) && !imgFailed

  return (
    <div
      className={`${styles.avatar} ${bordered ? styles.bordered : ''}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
      }}
      aria-label={name}
    >
      {showImage ? (
        <img
          src={finalPhoto!}
          alt={name}
          className={styles.image}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className={styles.initial}>{initial}</span>
      )}
    </div>
  )
}
