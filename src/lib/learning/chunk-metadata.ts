export const CHUNK_TOPICS = [
  'marker',
  'sit',
  'down',
  'recall',
  'leash',
  'socialization',
  'crate',
  'handling',
  'general',
] as const

export type ChunkTopic = (typeof CHUNK_TOPICS)[number]

export type LifeStageFilter = 'puppy' | 'junior' | 'adolescent' | 'adult' | 'all'

export interface ChunkMetadata {
  topic: ChunkTopic
  lifeStage: LifeStageFilter
  difficulty: 1 | 2 | 3
}

const TOPIC_PATTERNS: Array<{ topic: ChunkTopic; re: RegExp }> = [
  { topic: 'marker', re: /(?:marker|clicker|markör|ladda mark|charge the mark)/i },
  { topic: 'recall', re: /(?:recall|inkallning|kom hit|come when called)/i },
  { topic: 'sit', re: /\b(?:sit|sitt)\b/i },
  { topic: 'down', re: /\b(?:down|ligg)\b/i },
  { topic: 'leash', re: /(?:leash|koppel|loose leash|gå fint|gående)/i },
  { topic: 'socialization', re: /(?:socializ|valp|puppy|mötet hund|socialisation)/i },
  { topic: 'crate', re: /(?:crate|bur|burbur)/i },
  { topic: 'handling', re: /(?:groom|borsta|handling|hantering|klokning)/i },
]

const LIFE_STAGE_PATTERNS: Array<{ stage: LifeStageFilter; re: RegExp }> = [
  { stage: 'puppy', re: /(?:valp|puppy|8 veckor|8 weeks|ny hem|hemkomst)/i },
  { stage: 'junior', re: /(?:junior|ung hund|6 månader|6 months)/i },
  { stage: 'adolescent', re: /(?:adolescent|tonår|teen)/i },
  { stage: 'adult', re: /(?:vuxen|adult|senior)/i },
]

/** Fast heuristic tagging — used at ingest and as fallback when DB columns are null. */
export function classifyChunkContent(content: string): ChunkMetadata {
  let topic: ChunkTopic = 'general'
  for (const { topic: t, re } of TOPIC_PATTERNS) {
    if (re.test(content)) {
      topic = t
      break
    }
  }

  let lifeStage: LifeStageFilter = 'all'
  for (const { stage, re } of LIFE_STAGE_PATTERNS) {
    if (re.test(content)) {
      lifeStage = stage
      break
    }
  }

  // Shorter chunks at ingest tend to be basics; long dense passages are advanced reference.
  const difficulty: 1 | 2 | 3 =
    content.length < 900 ? 1 : content.length < 1600 ? 2 : 3

  return { topic, lifeStage, difficulty }
}

export function topicForExerciseId(exerciseId: string): ChunkTopic {
  const id = exerciseId.toLowerCase()
  if (id.includes('marker') || id.includes('mark')) return 'marker'
  if (id.includes('inkall') || id.includes('recall') || id === 'kom') return 'recall'
  if (id.includes('sitt') || id === 'sit' || id.includes('plats')) return 'sit'
  if (id.includes('ligg') || id === 'down') return 'down'
  if (id.includes('lat') || id.includes('koppel') || id.includes('heel')) return 'leash'
  if (id.includes('bur') || id.includes('crate')) return 'crate'
  if (id.includes('namn') || id.includes('hanter')) return 'handling'
  return 'general'
}
