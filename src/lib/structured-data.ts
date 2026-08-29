/**
 * The JSON-LD graph in every page head: who the site is about, what the site
 * is, and which page this one is.
 *
 * Modelled as a Person, not an Organization. Craig works independently, and
 * Person is the type search and answer engines resolve a named individual
 * against; an Organization node would assert a company that does not exist.
 * The WebSite node carries the site-level identity, and the three nodes are
 * joined by @id so a consumer landing on any one of them can reach the others.
 *
 * Every value is derived from src/content/home-page.ts or from the page's own
 * title and description rather than restated here, so the markup cannot come
 * to disagree with what the page actually says.
 */
import { email, hero, socials } from '../content/home-page'

export type PageInfo = {
  /** The page's canonical absolute URL, as og:url gives it. */
  url: string
  title: string
  description: string
}

/**
 * Only profiles the content file marks `verified: true`.
 *
 * sameAs is an identity claim — it tells an answer engine that this account is
 * this person. The X handle in `socials` is flagged there as an unverified
 * guess, and a wrong sameAs does not simply go unused: it merges a stranger's
 * account into Craig's entity. Better to publish one profile that is right
 * than two where one is a guess. Resolve the TODO in home-page.ts and flip the
 * flag, and it appears here on its own.
 */
function verifiedProfiles(): string[] {
  return socials.filter((profile) => profile.verified).map((profile) => profile.href)
}

export function structuredData(site: URL, page: PageInfo) {
  const home = new URL('/', site).href
  /* Fragment ids on the origin, so the Person and the WebSite are the same two
     nodes on every page rather than three unrelated copies. */
  const personId = `${home}#person`
  const websiteId = `${home}#website`

  const profiles = verifiedProfiles()

  const person = {
    '@type': 'Person',
    '@id': personId,
    name: 'Craig Chihururu',
    url: home,
    email,
    jobTitle: 'Designer and front-end developer',
    /* The hero standfirst is already a first-person description of the
       practice; anything written fresh here would be a second version of it. */
    description: hero.standfirst,
    knowsAbout: ['Product design', 'Front-end development', 'Design engineering'],
    ...(profiles.length > 0 && { sameAs: profiles }),
  }

  const website = {
    '@type': 'WebSite',
    '@id': websiteId,
    url: home,
    name: 'Craig Chihururu',
    inLanguage: 'en',
    publisher: { '@id': personId },
  }

  const webpage = {
    '@type': 'WebPage',
    '@id': `${page.url}#webpage`,
    url: page.url,
    name: page.title,
    description: page.description,
    isPartOf: { '@id': websiteId },
    inLanguage: 'en',
    /* Only the homepage is *about* Craig. The placeholder pages are part of
       the site but do not profile him, and saying otherwise would point an
       answer engine at "Nothing published yet" as though it described a person. */
    ...(page.url === home && { mainEntity: { '@id': personId } }),
  }

  return { '@context': 'https://schema.org', '@graph': [person, website, webpage] }
}

/**
 * JSON, hardened for embedding in a <script>.
 *
 * Astro's `set:html` injects the string raw, so a `<` anywhere in the data
 * would be enough to close the tag early. Escaped to the \u003c sequence it
 * parses as the same character but cannot terminate the element. No copy on
 * the site contains an angle bracket today, which is the reason to pin this
 * now rather than the first time someone writes one into a description.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
