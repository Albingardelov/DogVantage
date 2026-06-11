import { describe, it, expect } from 'vitest'
import { classifyChunkContent, topicForExerciseId } from '@/lib/learning/chunk-metadata'

describe('classifyChunkContent', () => {
  it('detects recall topic from Swedish content', () => {
    const meta = classifyChunkContent('Träna inkallning med kort rep och hög belöningsgrad.')
    expect(meta.topic).toBe('recall')
  })

  it('detects puppy life stage', () => {
    const meta = classifyChunkContent('Valp 8 veckor — socialisera försiktigt hemma.')
    expect(meta.lifeStage).toBe('puppy')
  })
})

describe('topicForExerciseId', () => {
  it('maps exercise ids to topics', () => {
    expect(topicForExerciseId('inkallning')).toBe('recall')
    expect(topicForExerciseId('marker')).toBe('marker')
  })
})
