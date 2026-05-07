'use client'

import { useActiveDog } from '@/lib/dog/active-dog-context'
import { saveDogProfile } from '@/lib/dog/profile'
import { saveDogPhoto } from '@/lib/dog/photo'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import DogProfileForm from '@/components/DogProfileForm'
import type { DogProfile } from '@/types'
import styles from './AddDogModal.module.css'

interface Props {
  onClose: () => void
}

export default function AddDogModal({ onClose }: Props) {
  const { switchDog, refreshDogs } = useActiveDog()

  async function handleSaved(profile: DogProfile, photo: string | null) {
    const { data: { user } } = await getSupabaseBrowser().auth.getUser()
    if (!user) throw new Error('Inte inloggad')
    const saved = await saveDogProfile(profile, user.id)
    if (photo) await saveDogPhoto(photo)
    await refreshDogs()
    if (saved.id) await switchDog(saved.id)
    onClose()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.fullScreen}>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Stäng">✕</button>
        <DogProfileForm onSaved={handleSaved} />
      </div>
    </div>
  )
}
