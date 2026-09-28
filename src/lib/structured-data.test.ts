import { describe, expect, it } from 'vitest'
import { booking, hero, service, serviceOfferings, socials } from '../content/home-page'
import { serializeJsonLd, structuredData } from './structured-data'

const SITE = new URL('https://www.craigchihururu.com')
const HOME = 'https://www.craigchihururu.com/'
/* Any page that is not the homepage. The Service node and the references to it
   are the homepage's alone, so most of what follows needs a page to be absent
   from as well as a page to be present on. */
const INNER = 'https://www.craigchihururu.com/writing'
const ARTICLE = 'https://www.craigchihururu.com/writing/example'

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

/* The Service and the nested Service in its offer catalog share a @type, so
   the top-level one is found by its @id. */
const serviceNode = (url: string): Node | undefined =>
  nodes(url).find((n: Node) => n['@id']?.endsWith('#service'))

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
    expect(node(INNER, 'WebPage')).toMatchObject({
      url: INNER,
      name: 'Title',
      description: 'Description',
    })
  })

  it('names the homepage as the page about Craig, and no other page', () => {
    expect(node(HOME, 'WebPage')).toHaveProperty('mainEntity')
    expect(node(INNER, 'WebPage')).not.toHaveProperty('mainEntity')
  })
})

describe('article structured data', () => {
  const article = { published: '2026-09-28', topics: ['Product design', 'Front-end development'] }
  const graph = structuredData(
    SITE,
    {
      url: ARTICLE,
      title: 'Why I design and build the same product | Craig Chihururu',
      description: 'What a product gains when design and front-end development stay connected.',
    },
    article,
  )
  const graphNodes = graph['@graph'] as Node[]
  const posting = graphNodes.find((entry) => entry['@type'] === 'BlogPosting')
  const page = graphNodes.find((entry) => entry['@type'] === 'WebPage')

  it('describes the article with its author, date and topics', () => {
    expect(posting).toMatchObject({
      '@id': `${ARTICLE}#article`,
      url: ARTICLE,
      headline: 'Why I design and build the same product',
      datePublished: article.published,
      dateModified: article.published,
      keywords: article.topics,
      author: { '@id': `${HOME}#person` },
    })
  })

  it('names the article as the page main entity', () => {
    expect(page?.mainEntity).toEqual({ '@id': `${ARTICLE}#article` })
  })
})

describe('graph wiring', () => {
  /* A dangling @id reference is the quiet failure mode of a JSON-LD graph: it
     parses, it validates, and the nodes never join up. */
  it.each([HOME, INNER])('resolves every @id reference against a node in %s', (url) => {
    const graph = nodes(url)
    const ids = new Set(graph.map((n: Node) => n['@id']))
    const references = JSON.stringify(graph).matchAll(/\{"@id":"([^"]+)"\}/g)

    for (const [, reference] of references) {
      expect(ids).toContain(reference)
    }
  })

  it('gives the Person and the WebSite the same ids on every page', () => {
    for (const type of ['Person', 'WebSite']) {
      expect(node(HOME, type)['@id']).toBe(node(INNER, type)['@id'])
      expect(node(HOME, type)['@id']).toContain('https://www.craigchihururu.com/#')
    }
  })

  /* Anything naming the site itself — every @id and every url — has to sit on
     the configured origin. The two exemptions are fields whose whole job is to
     point somewhere else: sameAs, and the booking URLs on the Service, which
     are nested rather than top-level and so are not reached from here. */
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

describe('the service on offer', () => {
  /* The audit's bar: a Service entity, provided by the Person, that names the
     booking URL. Everything it claims is read off `service` in home-page.ts, so
     these assertions fail on a value being dropped or renamed, not on the copy
     being edited. */
  it('describes the service, in the terms the content file sets', () => {
    expect(serviceNode(HOME)).toMatchObject({
      '@type': 'Service',
      name: service.name,
      serviceType: service.serviceType,
      description: service.summary,
      url: HOME,
      areaServed: service.areaServed,
    })
  })

  it('lists every offering the content file names', () => {
    const offers = serviceNode(HOME)!.hasOfferCatalog.itemListElement

    expect(offers.length).toBeGreaterThan(0)
    expect(offers).toHaveLength(serviceOfferings.length)

    for (const [index, offer] of offers.entries()) {
      expect(offer).toMatchObject({ '@type': 'Offer' })
      expect(offer.itemOffered).toEqual({
        '@type': 'Service',
        name: serviceOfferings[index].name,
        description: serviceOfferings[index].description,
      })
    }
  })

  /* `source` says where on the page an offering is already visible. It is a
     note to whoever edits the copy next, and publishing it would state
     something about the site rather than about the service. */
  it('publishes what each offering is, not where its copy came from', () => {
    const published = JSON.stringify(serviceNode(HOME))
    for (const offering of serviceOfferings) {
      expect(published).toContain(offering.name)
      expect(published).not.toContain(offering.source)
    }
  })

  it('says where to book, both as a channel and as an action', () => {
    const offer = serviceNode(HOME)!

    expect(offer.availableChannel).toMatchObject({
      '@type': 'ServiceChannel',
      serviceUrl: booking.href,
    })
    expect(offer.potentialAction).toMatchObject({
      '@type': 'ReserveAction',
      target: booking.href,
    })
  })

  /* An engine that surfaces the action should offer the reader the same words
     the page's own button does. */
  it('names the action after the button a visitor would have clicked', () => {
    expect(serviceNode(HOME)!.potentialAction.name).toBe(hero.cta.label)
  })

  it('joins the person and the service in both directions', () => {
    const person = node(HOME, 'Person')
    const offer = serviceNode(HOME)!

    expect(offer.provider).toEqual({ '@id': person['@id'] })
    expect(person.makesOffer.itemOffered).toEqual({ '@id': offer['@id'] })
  })

  /* Homepage-only, and the Person's reference to it has to go with it — see the
     dangling-@id test above, which is what would catch one being dropped
     without the other. */
  it('makes the offer on the homepage and nowhere else', () => {
    expect(serviceNode(INNER)).toBeUndefined()
    expect(node(INNER, 'Person')).not.toHaveProperty('makesOffer')
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
