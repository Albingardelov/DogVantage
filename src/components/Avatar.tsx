'use client'

import { useEffect, useState } from 'react'
import { getDogPhoto } from '@/lib/dog/photo'
import styles from './Avatar.module.css'

interface AvatarProps {
  /** Optional explicit photo (base64 data URL). If omitted, photo is read from localStorage. */
  photo?: string | null
  name: string
  /** Outer diameter in pixels. */
  size?: number
  /** When false, removes the white border ring (used inside dark headers). */
  bordered?: boolean
}

export default function Avatar({ photo, name, size = 64, bordered = true }: AvatarProps) {
  const [storedPhoto, setStoredPhoto] = useState<string | null>(null)
  const explicitPhotoProvided = photo !== undefined

  useEffect(() => {
    if (!explicitPhotoProvided) {
      setStoredPhoto(getDogPhoto())
    }
  }, [explicitPhotoProvided])

  const finalPhoto = explicitPhotoProvided ? photo : storedPhoto
  const initial = name.trim()[0]?.toUpperCase() || '?'

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
      {finalPhoto ? (
        <img src={finalPhoto} alt={name} className={styles.image} />
      ) : (
        <span className={styles.initial}>{initial}</span>
      )}
    </div>
  )
}
