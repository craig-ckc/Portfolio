import { describe, expect, it } from 'vitest'
import { articles } from '../content/writing'
import { activeOutlineIndex, articleOutline } from './article-outline'

describe('article outline', () => {
  it.each(articles)('covers the introduction and every section of $slug', (article) => {
    const outline = articleOutline(article)
    expect(outline[0]).toEqual({ id: 'introduction', title: 'Introduction', preview: article.summary })
    expect(outline.slice(1).map((entry) => entry.title)).toEqual(article.sections.map((section) => section.heading))
    expect(outline.slice(1).map((entry) => entry.preview)).toEqual(article.sections.map((section) => section.body[0] ?? ''))
    expect(new Set(outline.map((entry) => entry.id)).size).toBe(outline.length)
  })

  it('produces usable, unique anchors for punctuation, accents and repeated headings', () => {
    const outline = articleOutline({ summary: 'Lead', sections: ['Introduction', 'Café & code?', 'Café & code?', '...'].map((heading) => ({heading, body: []})) })
    expect(outline.map((entry) => entry.id)).toEqual(['introduction', 'introduction-2', 'cafe-code', 'cafe-code-2', 'section'])
  })
})

describe('reading position', () => {
  it('starts at the introduction before any heading crosses the reading line', () => {
    expect(activeOutlineIndex([350, 650, 1100], 180)).toBe(0)
  })

  it('advances and reverses with the reader rather than selecting the nearest heading', () => {
    expect(activeOutlineIndex([-100, 181, 700], 180)).toBe(0)
    expect(activeOutlineIndex([-100, 180, 700], 180)).toBe(1)
    expect(activeOutlineIndex([-700, -300, 100], 180)).toBe(2)
  })
})
