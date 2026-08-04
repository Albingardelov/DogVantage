import { describe, it, expect } from 'vitest'
import { extractChatTopic } from './chat-topics'

describe('extractChatTopic', () => {
  it.each([
    ['Min hund skäller på allt som rör sig', 'skällande'],
    ['Hon drar i kopplet hela promenaden', 'koppeldragande'],
    ['Han kommer inte när jag ropar', 'inkallning'],
    ['Hur länge kan jag lämna honom ensam hemma?', 'ensamhet'],
    ['Valpen bits när vi leker', 'bitande'],
    ['Hon är rädd för smällar och fyrverkerier', 'rädsla'],
    ['Han gör utfall mot andra hundar i kopplet', 'reaktivitet'],
    ['Hunden verkar stressad efter träningen', 'stress'],
    ['Valpen kissar inne fast vi varit ute', 'rumsrenhet'],
  ])('extracts %s → %s', (query, topic) => {
    expect(extractChatTopic(query)).toBe(topic)
  })

  it('returns null when no topic matches', () => {
    expect(extractChatTopic('Vilket foder rekommenderar du?')).toBeNull()
  })

  it('is case-insensitive', () => {
    expect(extractChatTopic('SKÄLLER PÅ BREVBÄRAREN')).toBe('skällande')
  })

  it('matches reactivity before generic leash topics for utfall queries', () => {
    expect(extractChatTopic('utfall mot hundar när han drar i kopplet')).toBe('reaktivitet')
  })

  it('does not flag fear inside other words', () => {
    expect(extractChatTopic('Vår hund är orädd och självsäker')).toBeNull()
    expect(extractChatTopic('Vi ska rädda en hund från gatan')).toBeNull()
  })

  it('does not flag stress inside compound words', () => {
    expect(extractChatTopic('Hur undviker vi stressåterfall?')).toBeNull()
  })
})
