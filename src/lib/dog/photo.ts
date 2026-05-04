import { getSupabaseBrowser } from '@/lib/supabase/browser'

const BUCKET = 'dog-photos'

function getPhotoPath(userId: string): string {
  return `${userId}/avatar`
}

export async function saveDogPhoto(dataUrl: string): Promise<void> {
  const { data: { user } } = await getSupabaseBrowser().auth.getUser()
  if (!user) return

  // Convert base64 data URL to Blob
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: mime })

  await getSupabaseBrowser().storage
    .from(BUCKET)
    .upload(getPhotoPath(user.id), blob, { upsert: true, contentType: mime })
}

export async function getDogPhoto(): Promise<string | null> {
  const { data: { user } } = await getSupabaseBrowser().auth.getUser()
  if (!user) return null

  const { data, error } = await getSupabaseBrowser().storage
    .from(BUCKET)
    .createSignedUrl(getPhotoPath(user.id), 3600)
  if (error || !data) return null
  return data.signedUrl
}

export async function clearDogPhoto(): Promise<void> {
  const { data: { user } } = await getSupabaseBrowser().auth.getUser()
  if (!user) return
  await getSupabaseBrowser().storage
    .from(BUCKET)
    .remove([getPhotoPath(user.id)])
}
