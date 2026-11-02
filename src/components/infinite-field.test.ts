import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { InfiniteField } from './infinite-field'

describe('shared image field', () => {
  it('accepts scenery images without inventing project links', () => {
    const markup = renderToStaticMarkup(createElement(InfiniteField, {
      images: [
        { src: '/forest.avif', width: 800, height: 1200, title: 'Forest' },
        { src: '/coast.avif', width: 1600, height: 900, title: 'Coast' },
      ],
      label: 'Scenic photographs',
    }))
    expect(markup).toContain('src="/forest.avif"')
    expect(markup).toContain('src="/coast.avif"')
    expect(markup).toContain('aria-label="Scenic photographs"')
    expect(markup).not.toMatch(/<a\b[^>]*\bhref=/)
    expect(markup).not.toContain('case study')
  })

  it('keeps a real project link when its image uses the neutral placeholder', () => {
    const markup = renderToStaticMarkup(createElement(InfiniteField, {
      images: [{ width: 640, height: 400, title: 'Preflight', href: '/work/preflight' }],
    }))
    expect(markup).toContain('href="/work/preflight"')
    expect(markup).toContain('project-field__placeholder')
    expect(markup).not.toContain('src="undefined"')
  })

  it('finishes the loading state for an empty image collection', () => {
    const markup = renderToStaticMarkup(createElement(InfiniteField, { images: [] }))
    expect(markup).toContain('No images to display.')
    expect(markup).toContain('aria-busy="false"')
  })
})
