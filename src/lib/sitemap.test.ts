import { readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { work, workPath } from '../content/work'
import { articles, writingPath } from '../content/writing'
import { INDEXABLE_PATHS, canonicalUrl, indexableUrls, requireSite, robotsTxt, sitemapXml } from './sitemap'

const SITE = new URL('https://www.craigchihururu.com')

/** The project route, as it is spelled on disk. */
const WORK_ROUTE = '/work/[slug]'
/** The article route, as it is spelled on disk. */
const WRITING_ROUTE = '/writing/[slug]'

/**
 * Every .astro route on disk, as the path a visitor would type.
 *
 * A dynamic route stands for one path per entry it is built from, so the work
 * and writing routes each expand to the same list their own `getStaticPaths`
 * walks. That makes the comparison below no guard at all for project or
 * article pages — both sides read `work` and `articles` — and that is the
 * point: a project or an article is published by being added to its list, so
 * there is nothing left to forget. What the comparison still catches is a new
 * static page nobody listed, and a third dynamic route added without an
 * expansion here, which arrives as a literal '[slug]' and fails to match.
 */
function routesInPagesDir(): string[] {
  const dir = new URL('../pages/', import.meta.url)

  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((entry) => entry.endsWith('.astro'))
    .map((entry) => '/' + entry.replace(/\.astro$/, '').replace(/(^|\/)index$/, ''))
    .map((route) => (route === '/' ? route : route.replace(/\/$/, '')))
    .flatMap((route) => {
      if (route === WORK_ROUTE) return work.map((entry) => workPath(entry.slug))
      if (route === WRITING_ROUTE) return articles.map((article) => writingPath(article.slug))
      return [route]
    })
}

describe('INDEXABLE_PATHS', () => {
  /* The guard on hand-maintaining the list: add a page and forget the
     sitemap, and this is what says so. If the new route genuinely should not
     be indexed, the fix is a comment here explaining why, not a silent gap. */
  it('accounts for every page in src/pages', () => {
    expect([...INDEXABLE_PATHS].sort()).toEqual(routesInPagesDir().sort())
  })

  it('holds root-relative paths with no trailing slash, matching the site’s own links', () => {
    for (const path of INDEXABLE_PATHS) {
      expect(path.startsWith('/')).toBe(true)
      expect(path === '/' || !path.endsWith('/')).toBe(true)
    }
  })

  /* sitemapXml interpolates these straight into XML. That is only safe while
     the paths stay free of the five characters XML reserves. */
  it('needs no XML escaping', () => {
    for (const path of INDEXABLE_PATHS) {
      expect(path).not.toMatch(/[<>&'"]/)
    }
  })
})

describe('requireSite', () => {
  it('passes a configured origin through', () => {
    expect(requireSite(SITE)).toBe(SITE)
  })

  it('throws when astro.config.mjs has no site', () => {
    expect(() => requireSite(undefined)).toThrow(/astro\.config\.mjs/)
  })
})

describe('canonicalUrl', () => {
  it('keeps the homepage at the bare origin', () => {
    expect(canonicalUrl(SITE, '/')).toBe('https://www.craigchihururu.com/')
  })

  /* Astro hands a directory route's pathname over with a trailing slash; the
     sitemap writes the same page without one. Both have to come out alike or
     og:url and <loc> disagree about what the page is called. */
  it('trims the trailing slash Astro puts on a directory route', () => {
    expect(canonicalUrl(SITE, '/writing/')).toBe('https://www.craigchihururu.com/writing')
    expect(canonicalUrl(SITE, '/writing')).toBe('https://www.craigchihururu.com/writing')
  })

  it('agrees with the sitemap on every indexable path', () => {
    for (const path of INDEXABLE_PATHS) {
      expect(indexableUrls(SITE)).toContain(canonicalUrl(SITE, path))
      expect(indexableUrls(SITE)).toContain(canonicalUrl(SITE, path === '/' ? path : path + '/'))
    }
  })
})

describe('indexableUrls', () => {
  it('resolves every path to an absolute URL on the configured origin', () => {
    for (const url of indexableUrls(SITE)) {
      expect(new URL(url).origin).toBe(SITE.origin)
    }
  })

  it('keeps the homepage at the bare origin', () => {
    expect(indexableUrls(SITE)).toContain('https://www.craigchihururu.com/')
  })
})

describe('sitemapXml', () => {
  const xml = sitemapXml(SITE)

  it('opens with the XML declaration, on line one and column one', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true)
  })

  it('declares the sitemap protocol namespace', () => {
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true)
  })

  it('carries one <loc> per indexable path and nothing else', () => {
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
    expect(locs).toEqual(indexableUrls(SITE))
  })
})

describe('robotsTxt', () => {
  it('declares the sitemap as an absolute URL', () => {
    expect(robotsTxt(SITE)).toContain('Sitemap: https://www.craigchihururu.com/sitemap.xml')
  })

  it('leaves the site crawlable', () => {
    expect(robotsTxt(SITE)).toMatch(/^User-agent: \*$/m)
    expect(robotsTxt(SITE)).not.toMatch(/^Disallow: \/$/m)
  })
})
