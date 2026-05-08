import { getSupabaseBrowser } from '@/lib/supabase/browser'

const BUCKET = 'dog-photos'

function getPhotoPath(userId: string, dogId?: string): string {
  return dogId ? `${userId}/${dogId}` : `${userId}/avatar`
}

async function dataUrlToBlob(dataUrl: string): Promise<{ blob: Blob; mime: string }> {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return { blob: new Blob([bytes], { type: mime }), mime }
}

export async function saveDogPhoto(dataUrl: string, dogId?: string): Promise<void> {
  const { data: { user } } = await getSupabaseBrowser().auth.getUser()
  if (!user) return
  const { blob, mime } = await dataUrlToBlob(dataUrl)
  await getSupabaseBrowser().storage
    .from(BUCKET)
    .upload(getPhotoPath(user.id, dogId), blob, { upsert: true, contentType: mime })
}

export async function getDogPhoto(dogId?: string): Promise<string | null> {
  const { data: { user } } = await getSupabaseBrowser().auth.getUser()
  if (!user) return null

  const path = getPhotoPath(user.id, dogId)
  const { data, error } = await getSupabaseBrowser().storage
    .from(BUCKET)
    .createSignedUrl(path, 3600)
  if (error || !data) return null
  return data.signedUrl
}

export async function clearDogPhoto(dogId?: string): Promise<void> {
  const { data: { user } } = await getSupabaseBrowser().auth.getUser()
  if (!user) return
  await getSupabaseBrowser().storage
    .from(BUCKET)
    .remove([getPhotoPath(user.id, dogId)])
}
