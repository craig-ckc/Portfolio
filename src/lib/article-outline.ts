import type { Article } from '../content/writing'

export type OutlineEntry = { id: string; title: string; preview: string }

/** One source for navigation links and the IDs rendered on the article headings. */
export function articleOutline(article: Pick<Article, 'summary' | 'sections'>): OutlineEntry[] {
  const ids = new Set(['introduction'])
  return [
    { id: 'introduction', title: 'Introduction', preview: article.summary },
    ...article.sections.map((section) => {
      const base = section.heading.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section'
      let id = base
      let suffix = 2
      while (ids.has(id)) id = `${base}-${suffix++}`
      ids.add(id)
      return { id, title: section.heading, preview: section.body[0] ?? '' }
    }),
  ]
}

/** The last heading to cross the reading line stays current until the next one arrives. */
export function activeOutlineIndex(tops: number[], readingLine: number): number {
  let active = 0
  tops.forEach((top, index) => { if (top <= readingLine) active = index })
  return active
}
