import { NextRequest, NextResponse } from 'next/server'
import { ingestPDF } from '@/lib/ai/ingest'
import type { Breed } from '@/types'

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null
  const breed = form.get('breed') as Breed | null
  const sourceUrl = (form.get('sourceUrl') as string | null) ?? ''
  const docVersion = (form.get('docVersion') as string | null) ?? ''

  if (!file || !breed) {
    return NextResponse.json({ error: 'file and breed required' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await ingestPDF(buffer, {
    breed,
    filename: file.name,
    sourceUrl,
    docVersion,
  })

  return NextResponse.json(result)
}
