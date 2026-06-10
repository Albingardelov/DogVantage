import { describe, it, expect } from 'vitest'
import { CATEGORIES, type Article } from './articles'

describe('CATEGORIES', () => {
  it('has exactly 4 categories', () => {
    expect(Object.keys(CATEGORIES)).toHaveLength(4)
  })

  it('every category has at least one article', () => {
    for (const [key, articles] of Object.entries(CATEGORIES)) {
      expect(articles.length, `category ${key} is empty`).toBeGreaterThan(0)
    }
  })

  const allArticles: Article[] = Object.values(CATEGORIES).flat()

  it('every article has a non-empty sources array', () => {
    for (const article of allArticles) {
      expect(article.sources.length, `${article.id} has no sources`).toBeGreaterThan(0)
    }
  })

  it('article IDs are unique across all categories', () => {
    const ids = allArticles.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every article has at least one section', () => {
    for (const article of allArticles) {
      expect(article.sections.length, `${article.id} has no sections`).toBeGreaterThan(0)
    }
  })
})
