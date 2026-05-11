import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import type { Breed } from '@/types'

// Community submission endpoint — stores file metadata for admin review.
// Does NOT ingest directly; admin uses /admin/ingest after vetting.
// Requires auth so the table can't be flooded anonymously.
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const breed = form.get('breed') as Breed | null
  const sourceUrl = (form.get('sourceUrl') as string | null) ?? ''
  const docVersion = (form.get('docVersion') as string | null) ?? ''

  if (!file || !breed) {
    return NextResponse.json({ error: 'file and breed required' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
  }

  const maxSize = 20 * 1024 * 1024 // 20 MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 400 })
  }

  const { error } = await getSupabaseAdmin().from('community_submissions').insert({
    breed,
    filename: file.name,
    file_size: file.size,
    source_url: sourceUrl,
    doc_version: docVersion,
  })

  if (error) {
    console.error('Community submission log failed:', error.message)
  }

  return NextResponse.json({ received: true })
}
