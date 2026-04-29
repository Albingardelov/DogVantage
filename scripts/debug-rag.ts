import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { embedText } from '../src/lib/ai/embed'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // 1. Check chunks exist
  const { data: chunks, error: e1 } = await supabase
    .from('breed_chunks')
    .select('id, breed, source, content')
    .eq('breed', 'braque_francais')
    .limit(3)

  console.log('Chunks in DB:', chunks?.length, e1?.message ?? '')
  console.log('First chunk:', chunks?.[0]?.content?.slice(0, 80))

  // 2. Test RPC search
  const embedding = await embedText('Vad ska jag träna vecka 8?')
  console.log('\nEmbedding dims:', embedding.length)

  const { data: results, error: e2 } = await supabase.rpc('match_breed_chunks', {
    query_embedding: embedding,
    match_breed: 'braque_francais',
    match_count: 3,
  })

  console.log('RPC error:', e2?.message ?? 'none')
  console.log('RPC results:', results?.length)
  console.log('Top result:', results?.[0]?.content?.slice(0, 80))
}

main().catch(console.error)
