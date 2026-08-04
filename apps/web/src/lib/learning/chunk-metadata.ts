export const CHUNK_TOPICS = [
  'marker',
  'sit',
  'down',
  'recall',
  'leash',
  'socialization',
  'crate',
  'handling',
  'retrieve',
  'hunting',
  'herding',
  'nosework',
  // Behaviour & welfare topics — cross-breed content shown in chat/learning.
  'resource_guarding',
  'separation',
  'fear',
  'body_language',
  'enrichment',
  'senior',
  'cooperative_care',
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
  // Behaviour & welfare topics first — their multi-word vocabulary is specific
  // and must win over generic command words (sit/down) that occur in English prose.
  // Ordered by specificity: doc-defining topics win over broader ones (a senior
  // CCD guide also mentions anxiety/enrichment, but should be tagged 'senior').
  { topic: 'resource_guarding', re: /(?:resource[- ]guard|food[- ]guard|guarding (?:food|toys|resources|objects)|possessive aggress|resursförsvar|mataggress|vaktar (?:mat|resurser))/i },
  { topic: 'senior', re: /(?:cognitive dysfunction|cognitive decline|cognitive impairment|senior dog|geriatric|\bdementia\b|doggie dementia|kognitiv svikt|åldrande hund|seniorhund)/i },
  { topic: 'cooperative_care', re: /(?:cooperative care|co-operative care|muzzle train|basket muzzle|wear (?:a |the )?muzzle|husbandry behaviou?r|consent[- ]based|veterinary handling|vet visit|munkorg|samarbetsträning)/i },
  { topic: 'fear', re: /(?:noise phobia|storm phobia|firework|thunder|sound sensitiv|fearful|fear of|\bphobia\b|ljudrädsl|skotträdd|rädsla|rädd för|orolig)/i },
  { topic: 'separation', re: /(?:separation anxiety|separation-related|home alone|left alone|being alone|separationsångest|ensam hemma|hemmaensam)/i },
  { topic: 'body_language', re: /(?:body language|calming signal|stress signal|appeasement signal|kroppsspråk|stressignal|lugnande signal)/i },
  { topic: 'enrichment', re: /(?:enrichment|mental stimulation|puzzle (?:toy|feeder)|snuffle mat|food puzzle|berikning|mental stimulans|aktivering)/i },
  // Working-dog topics — specific vocabulary, must win over generic commands.
  { topic: 'retrieve', re: /(?:apporter|apport\b|dummy|dummies|avlämning|lämna av i hand|markering av fall|retriev(?:e|ing) (?:the )?(?:dummy|bumper|bird)|\bfetch\b)/i },
  { topic: 'hunting', re: /(?:stånd\b|stadga|stoppsignal|fågelhund|jaktprov|fältarbete|eftersök|duck search|pointing dog|gun ?dog|bird dog|viltspår|resning av fågel|flush)/i },
  { topic: 'herding', re: /(?:vallning|vallhund|vallanlag|herding|fårflock|kreatur|sheepdog|drive the flock)/i },
  { topic: 'nosework', re: /(?:nosework|nose work|doftsök|luktsök|scent ?work|sökövning)/i },
  { topic: 'marker', re: /(?:marker|clicker|markör|ladda mark|charge the mark)/i },
  { topic: 'recall', re: /(?:recall|inkallning|kom hit|come when called)/i },
  { topic: 'leash', re: /(?:leash|koppel|loose lead|loose leash|lead walking|gå fint|gående)/i },
  { topic: 'socialization', re: /(?:socializ|socialisation|mötet hund|möten med (?:hundar|människor))/i },
  { topic: 'crate', re: /(?:crate train|crate\b|\bbur\b|burträning)/i },
  { topic: 'handling', re: /(?:grooming|borsta|handling|hantering|klokning|nail trim|klippa klor)/i },
  // Generic command words last — tightened so English prose ("calm down",
  // "the dog will sit") does not capture unrelated content.
  { topic: 'sit', re: /(?:\bsitt\b|sit[- ]?stay|sit command|cue (?:a |the )?sit|teach\w* .{0,25}\bto sit\b)/i },
  { topic: 'down', re: /(?:\bligg\b|lie down|down[- ]?stay|down position|down command|teach\w* .{0,25}\bdown\b)/i },
]

const LIFE_STAGE_PATTERNS: Array<{ stage: LifeStageFilter; re: RegExp }> = [
  { stage: 'adolescent', re: /(?:adolescent|adolescence|teenage|teenager|tonår|\bteen\b)/i },
  { stage: 'puppy', re: /(?:valp|puppy|8 veckor|8 weeks|ny hem|hemkomst)/i },
  { stage: 'junior', re: /(?:junior|ung hund|6 månader|6 months)/i },
  { stage: 'adult', re: /(?:vuxen|\badult\b|senior|geriatric|äldre hund)/i },
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
  if (id.includes('apport')) return 'retrieve'
  if (id.includes('stadga') || id.includes('stoppsignal') || id.includes('sok') || id.includes('vatten') || id.includes('orientering')) return 'hunting'
  if (id.includes('vallning') || id.includes('vall_')) return 'herding'
  if (id.includes('nosework')) return 'nosework'
  if (id.includes('marker') || id.includes('mark')) return 'marker'
  if (id.includes('inkall') || id.includes('recall') || id === 'kom') return 'recall'
  if (id.includes('sitt') || id === 'sit' || id.includes('plats')) return 'sit'
  if (id.includes('ligg') || id === 'down') return 'down'
  if (id === 'lat' || id.startsWith('lat_')) return 'fear'
  if (id.includes('koppel') || id.includes('heel') || id.includes('leash')) return 'leash'
  if (id.includes('bur') || id.includes('crate')) return 'crate'
  if (id.includes('namn') || id.includes('hanter')) return 'handling'
  return 'general'
}
