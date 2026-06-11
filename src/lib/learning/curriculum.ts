import { AI_TIMEOUTS, getGroqClient, GROQ_MODEL } from '@/lib/ai/client'
import { chunksToSourceRefs } from '@/lib/ai/rag'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { formatChunksForPrompt, retrieveDocumentChunks } from '@/lib/learning/doc-retrieval'
import {
  CURRICULUM_MODULES,
  moduleById,
  modulesForLifeStage,
  type CurriculumModuleDef,
} from '@/lib/learning/curriculum-def'
import type { Breed, TrainingSourceRef } from '@/types'
import type { LifeStage } from '@/lib/dog/age'

export interface CurriculumModuleContent {
  id: string
  order: number
  title: string
  goal: string
  exerciseId?: string
  readMinutes: number
  summary: string
  body: string
  keyPoints: string[]
  sources: TrainingSourceRef[]
}

export interface CurriculumOverview {
  lifeStage: LifeStage
  modules: Array<CurriculumModuleContent & { completed: boolean; unlocked: boolean }>
  completedCount: number
}

export async function getCurriculumOverview(
  breed: Breed,
  lifeStage: LifeStage,
  completedModuleids: string[],
): Promise<CurriculumOverview> {
  const defs = modulesForLifeStage(lifeStage)
  const completedSet = new Set(completedModuleids)
  const modules: CurriculumOverview['modules'] = []

  for (const def of defs) {
    const prior = defs.filter((m) => m.order < def.order)
    const unlocked = prior.every((m) => completedSet.has(m.id))
    const content = await getModuleContent(breed, lifeStage, def)
    modules.push({
      ...content,
      completed: completedSet.has(def.id),
      unlocked,
    })
  }

  return {
    lifeStage,
    modules,
    completedCount: completedModuleids.length,
  }
}

export async function getModuleContent(
  breed: Breed,
  lifeStage: LifeStage,
  def: CurriculumModuleDef,
): Promise<CurriculumModuleContent> {
  const cacheKey = `curr_v1_${breed}_${lifeStage}_${def.id}`
  const cached = await readCache<CurriculumModuleContent>(cacheKey)
  if (cached) return cached

  const query = `${def.title}. ${def.goal}`
  const chunks = await retrieveDocumentChunks(breed, query, 4, {
    topic: def.topic,
    lifeStage: lifeStage === 'adult' ? 'adult' : lifeStage,
  })

  const documentContext = chunks.length > 0 ? formatChunksForPrompt(chunks) : ''
  const generated = await generateJson<{
    summary?: string
    body?: string
    keyPoints?: string[]
  }>([
    {
      role: 'system',
      content: [
        `Du skriver en nybörjarkurs för ${breed} (${lifeStage}).`,
        `Modul: "${def.title}". Mål: ${def.goal}`,
        'Skriv på svenska för någon som aldrig haft hund — enkelt språk, inga fackord.',
        documentContext
          ? 'Basera modulen på KÄLLDOKUMENTET. Nämn källan i texten om du citerar.'
          : 'Inget dokument — använd etablerad hundträningsmetodik (R+, korta pass, belöning i rätt timing).',
        'Returnera JSON:',
        '{"summary":"1 mening","body":"120–180 ord huvudtext","keyPoints":["punkt 1","punkt 2","punkt 3"]}',
        documentContext ? `\n=== KÄLLDOKUMENT ===\n${documentContext}` : '',
      ].join('\n'),
    },
    { role: 'user', content: `Skriv modul ${def.order}: ${def.title}` },
  ], 650)

  const content: CurriculumModuleContent = {
    id: def.id,
    order: def.order,
    title: def.title,
    goal: def.goal,
    exerciseId: def.exerciseId,
    readMinutes: def.readMinutes,
    summary: generated?.summary ?? def.goal,
    body: generated?.body ?? def.goal,
    keyPoints: Array.isArray(generated?.keyPoints) ? generated.keyPoints.slice(0, 4) : [],
    sources: chunksToSourceRefs(chunks).slice(0, 2),
  }

  await writeCache(cacheKey, 'curriculum', content)
  return content
}

export async function getModuleById(
  breed: Breed,
  lifeStage: LifeStage,
  moduleId: string,
): Promise<CurriculumModuleContent | null> {
  const def = moduleById(moduleId)
  if (!def) return null
  if (lifeStage !== 'puppy' && def.id === 'hemma') return null
  return getModuleContent(breed, lifeStage, def)
}

export function moduleListForStage(lifeStage: LifeStage): CurriculumModuleDef[] {
  return modulesForLifeStage(lifeStage)
}

export { CURRICULUM_MODULES }

// ─── cache + AI helpers ───────────────────────────────────────────────────────

 async function generateJson<T>(
  messages: Array<{ role: 'system' | 'user'; content: string }>,
  maxTokens: number,
): Promise<T | null> {
  try {
    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature: 0.35,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }, { timeout: AI_TIMEOUTS.chat })
    return JSON.parse(completion.choices[0]?.message?.content ?? '{}') as T
  } catch {
    return null
  }
}

 async function readCache<T>(key: string): Promise<T | null> {
  try {
    const { data } = await getSupabaseAdmin()
      .from('training_cache')
      .select('content')
      .eq('breed', key)
      .eq('week_number', 0)
      .single()
    if (!data) return null
    return JSON.parse(data.content) as T
  } catch {
    return null
  }
}

 async function writeCache(key: string, source: string, value: unknown): Promise<void> {
  try {
    await getSupabaseAdmin().from('training_cache').upsert({
      breed: key,
      week_number: 0,
      content: JSON.stringify(value),
      source,
    }, { onConflict: 'breed,week_number' })
  } catch { /* cache is best-effort */ }
}
