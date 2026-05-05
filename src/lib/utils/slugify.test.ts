import { describe, it, expect } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('lowercases and replaces spaces', () => {
    expect(slugify('Canicross')).toBe('canicross')
    expect(slugify('Cykla med hunden')).toBe('cykla_med_hunden')
  })
  it('replaces Swedish vowels', () => {
    expect(slugify('Övning')).toBe('ovning')
    expect(slugify('Åktur')).toBe('aktur')
    expect(slugify('Söka')).toBe('soka')
  })
  it('removes special characters', () => {
    expect(slugify('test (canicross)!')).toBe('test_canicross')
  })
  it('collapses multiple underscores', () => {
    expect(slugify('a  b')).toBe('a_b')
  })
  it('truncates to 30 chars', () => {
    expect(slugify('a'.repeat(50))).toHaveLength(30)
  })
  it('trims leading/trailing underscores', () => {
    expect(slugify('(test)')).toBe('test')
  })
})
