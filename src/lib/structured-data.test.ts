import { describe, expect, it } from 'vitest'
import { socials } from '../content/home-page'
import { serializeJsonLd, structuredData } from './structured-data'

const SITE = new URL('https://www.craigchihururu.com')
const HOME = 'https://www.craigchihururu.com/'

const graphFor = (url: string, title = 'Title', description = 'Description') =>
  structuredData(SITE, { url, title, description })

/* The graph is a heterogeneous list — a Person carries fields a WebSite does
   not — so the tests index into nodes rather than narrow them. `node` throws
   on a miss so a renamed @type fails where it is looked up, not later as an
   undefined-property error three assertions down. */
type Node = Record<string, any>

const nodes = (url: string): Node[] => graphFor(url)['@graph']

const node = (url: string, type: string): Node => {
  const found = nodes(url).find((n: Node) => n['@type'] === type)
  if (!found) throw new Error(`no ${type} node in the graph for ${url}`)
  return found
}

describe('structuredData', () => {
  it('declares the schema.org context', () => {
    expect(graphFor(HOME)['@context']).toBe('https://schema.org')
  })

  /* The audit's bar: a block that describes an Organization or WebSite entity. */
  it('describes a WebSite entity', () => {
    const website = node(HOME, 'WebSite')
    expect(website).toBeDefined()
    expect(website).toMatchObject({ url: HOME, name: 'Craig Chihururu', inLanguage: 'en' })
  })

  it('describes the person the site is about', () => {
    expect(node(HOME, 'Person')).toMatchObject({
      name: 'Craig Chihururu',
      url: HOME,
      jobTitle: expect.any(String),
    })
  })

  it('describes the page it is embedded in, not just the site', () => {
    const url = 'https://www.craigchihururu.com/writing'
    expect(node(url, 'WebPage')).toMatchObject({ url, name: 'Title', description: 'Description' })
  })

  it('names the homepage as the page about Craig, and no other page', () => {
    expect(node(HOME, 'WebPage')).toHaveProperty('mainEntity')
    expect(node('https://www.craigchihururu.com/writing', 'WebPage')).not.toHaveProperty('mainEntity')
  })
})

describe('graph wiring', () => {
  /* A dangling @id reference is the quiet failure mode of a JSON-LD graph: it
     parses, it validates, and the nodes never join up. */
  it('resolves every @id reference against a node in the same graph', () => {
    const graph = nodes(HOME)
    const ids = new Set(graph.map((n: Node) => n['@id']))
    const references = JSON.stringify(graph).matchAll(/\{"@id":"([^"]+)"\}/g)

    for (const [, reference] of references) {
      expect(ids).toContain(reference)
    }
  })

  it('gives the Person and the WebSite the same ids on every page', () => {
    const writing = 'https://www.craigchihururu.com/writing'
    for (const type of ['Person', 'WebSite']) {
      expect(node(HOME, type)['@id']).toBe(node(writing, type)['@id'])
      expect(node(HOME, type)['@id']).toContain('https://www.craigchihururu.com/#')
    }
  })

  /* Anything naming the site itself — every @id and every url — has to sit on
     the configured origin. sameAs is exempt by definition: it is the one field
     whose whole job is to point somewhere else. */
  it('keeps the ids and urls it owns on the configured origin', () => {
    for (const n of nodes(HOME)) {
      expect(new URL(n['@id']).origin).toBe(SITE.origin)
      expect(new URL(n.url).origin).toBe(SITE.origin)
    }
  })

  it('gives sameAs absolute https urls pointing off-site', () => {
    for (const profile of node(HOME, 'Person').sameAs ?? []) {
      const url = new URL(profile)
      expect(url.protocol).toBe('https:')
      expect(url.origin).not.toBe(SITE.origin)
    }
  })
})

describe('sameAs', () => {
  /* The load-bearing one. sameAs is an identity claim, and home-page.ts flags
     the X handle as an unverified guess — publishing it would merge someone
     else's account into Craig's entity. This fails if that flag is ever
     ignored, whatever the handle happens to be at the time. */
  it('never publishes a profile the content file has not verified', () => {
    const published: string[] = node(HOME, 'Person').sameAs ?? []
    for (const profile of socials.filter((s) => !s.verified)) {
      expect(published).not.toContain(profile.href)
    }
  })

  it('publishes every profile that is verified', () => {
    const published: string[] = node(HOME, 'Person').sameAs ?? []
    for (const profile of socials.filter((s) => s.verified)) {
      expect(published).toContain(profile.href)
    }
  })
})

describe('serializeJsonLd', () => {
  it('round-trips as valid JSON', () => {
    expect(() => JSON.parse(serializeJsonLd(graphFor(HOME)))).not.toThrow()
    expect(JSON.parse(serializeJsonLd(graphFor(HOME)))).toEqual(graphFor(HOME))
  })

  /* Whatever else it does, the string must not be able to close the <script>
     element it is injected into. */
  it('leaves no raw < for a description to break the script tag with', () => {
    const hostile = serializeJsonLd(graphFor(HOME, '</script><img>', 'a < b'))
    expect(hostile).not.toContain('<')
    expect(JSON.parse(hostile)['@graph'][2].name).toBe('</script><img>')
  })
})
