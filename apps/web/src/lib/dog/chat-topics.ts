const TOPIC_LEXICON: Array<{ topic: string; pattern: RegExp }> = [
  { topic: 'reaktivitet', pattern: /reaktiv|utfall mot/i },
  { topic: 'skällande', pattern: /skäll|bjäbb/i },
  { topic: 'koppeldragande', pattern: /drar i koppl|koppeldrag/i },
  { topic: 'inkallning', pattern: /inkallning|kommer inte när|springer iväg/i },
  { topic: 'ensamhet', pattern: /ensam hemma|separationsångest|lämna.{0,20}ensam/i },
  { topic: 'bitande', pattern: /\bbits\b|biter|nafsar/i },
  // \b är opålitligt runt å/ä/ö i JS-regex — svenska ordgränser kräver lookaround.
  { topic: 'rädsla', pattern: /(?<![a-zåäö])rädd(?![a-zåäö])|(?<![a-zåäö])rädsla|skotträdd/i },
  { topic: 'stress', pattern: /stressad|(?<![a-zåäö])stress(?![a-zåäö])|varva ner/i },
  { topic: 'rumsrenhet', pattern: /kissar inne|bajsar inne|rumsren/i },
  { topic: 'matvägran', pattern: /äter inte|matvägran/i },
]

export function extractChatTopic(query: string): string | null {
  for (const { topic, pattern } of TOPIC_LEXICON) {
    if (pattern.test(query)) return topic
  }
  return null
}
