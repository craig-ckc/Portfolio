import { describe, expect, it } from 'vitest'
import { articles } from './writing'

describe('writing content', () => {
  it('publishes four articles with one explicit feature', () => {
    expect(articles).toHaveLength(4)
    expect(articles.filter((article) => article.featured)).toHaveLength(1)
  })

  it('keeps slugs and dates unique', () => {
    expect(new Set(articles.map((article) => article.slug)).size).toBe(articles.length)
    expect(new Set(articles.map((article) => article.published)).size).toBe(articles.length)
  })

  it('uses descriptions that fit search result summaries', () => {
    for (const article of articles) {
      expect(article.description.length).toBeGreaterThanOrEqual(50)
      expect(article.description.length).toBeLessThanOrEqual(160)
    }
  })

  it('keeps em dashes out of published article copy', () => {
    expect(JSON.stringify(articles)).not.toContain('—')
  })

  it('leads headlines with the enduring idea instead of the tool', () => {
    expect(articles.every((article) => !/^AI\b/i.test(article.title))).toBe(true)
  })

  it('makes the idea, not the author, the subject of the featured article', () => {
    const featured = articles.find((article) => article.featured)
    expect(JSON.stringify(featured)).not.toMatch(/\b(?:I|me|my)\b/)
  })
})
