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

describe('classifyChunkContent behaviour & welfare topics', () => {
  it('detects resource guarding', () => {
    expect(classifyChunkContent('Food and resource guarding: teach the dog to enjoy people approaching the food bowl.').topic).toBe('resource_guarding')
  })

  it('detects separation anxiety', () => {
    expect(classifyChunkContent('When treating a dog with separation anxiety, teach him to tolerate being left alone.').topic).toBe('separation')
  })

  it('detects fear / noise phobia', () => {
    expect(classifyChunkContent('Many dogs develop a noise phobia of fireworks and thunder storms.').topic).toBe('fear')
  })

  it('detects body language', () => {
    expect(classifyChunkContent('Reading body language: yawning and lip-licking are calming signals of stress.').topic).toBe('body_language')
  })

  it('detects enrichment', () => {
    expect(classifyChunkContent('Provide enrichment with puzzle toys and a snuffle mat for mental stimulation.').topic).toBe('enrichment')
  })

  it('detects senior / cognitive dysfunction', () => {
    expect(classifyChunkContent('Canine cognitive dysfunction is a doggie dementia affecting senior dogs.').topic).toBe('senior')
  })

  it('detects cooperative care / muzzle training', () => {
    expect(classifyChunkContent('Cooperative care: teach your dog to wear a basket muzzle willingly.').topic).toBe('cooperative_care')
  })

  it('does not mis-tag English prose as sit/down', () => {
    const meta = classifyChunkContent('Help your dog calm down and settle when guests arrive; let him sit out the chaos.')
    expect(meta.topic).not.toBe('sit')
    expect(meta.topic).not.toBe('down')
  })

  it('detects adolescent life stage over puppy when teenage terms dominate', () => {
    expect(classifyChunkContent('Teenage trouble: bonding with your adolescent dog during the teen months.').lifeStage).toBe('adolescent')
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
