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

  it('maps field work exercise ids to working-dog topics', () => {
    expect(topicForExerciseId('apportering')).toBe('retrieve')
    expect(topicForExerciseId('stadga')).toBe('hunting')
    expect(topicForExerciseId('stoppsignal')).toBe('hunting')
    expect(topicForExerciseId('kontrollerat_sok')).toBe('hunting')
    expect(topicForExerciseId('vatten')).toBe('hunting')
    expect(topicForExerciseId('vallning')).toBe('herding')
    expect(topicForExerciseId('nosework')).toBe('nosework')
  })
})

describe('classifyChunkContent working-dog topics', () => {
  it('detects retrieve topic from dummy training content', () => {
    const meta = classifyChunkContent('Kasta dummyn 3–5 meter och belöna när hunden apporterar och lämnar av i hand.')
    expect(meta.topic).toBe('retrieve')
  })

  it('detects hunting topic from pointing dog content', () => {
    const meta = classifyChunkContent('Hunden ska hålla fast stånd tills jägaren är framme och resa fågeln på kommando.')
    expect(meta.topic).toBe('hunting')
  })

  it('detects herding topic from vallning content', () => {
    const meta = classifyChunkContent('Vallningsarbetet kräver balans mellan hund och fårflock — vallanlagsprovet bedömer intresse och samarbete.')
    expect(meta.topic).toBe('herding')
  })

  it('detects nosework topic', () => {
    const meta = classifyChunkContent('Doftsök aktiverar hunden mentalt — göm godbitar och låt hunden söka.')
    expect(meta.topic).toBe('nosework')
  })
})
