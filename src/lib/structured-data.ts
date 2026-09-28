/**
 * The JSON-LD graph in every page head: who the site is about, what the site
 * is, which page this one is, and — on the homepage — what is on offer.
 *
 * Modelled as a Person, not an Organization. Craig works independently, and
 * Person is the type search and answer engines resolve a named individual
 * against; an Organization node would assert a company that does not exist.
 * The WebSite node carries the site-level identity, and the nodes are joined by
 * @id so a consumer landing on any one of them can reach the others.
 *
 * The Service node is the homepage's alone. Person and WebSite describe things
 * that are true on every page, but the placeholder pages do not sell anything,
 * and the homepage is where the offer is actually made — the hero states it and
 * both project CTAs open the booking dialog. See `service` in home-page.ts for
 * why it is a Service and not a ProfessionalService or a LocalBusiness.
 *
 * Every value is derived from src/content/home-page.ts or from the page's own
 * title and description rather than restated here, so the markup cannot come
 * to disagree with what the page actually says.
 */
import { booking, email, hero, service, serviceOfferings, socials } from '../content/home-page'

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
  const serviceId = `${home}#service`

  /* Read three times below, and the answer has to be the same all three: the
     Service node, the Person's reference to it and the WebPage's mainEntity all
     appear or none do. A reference to a node that was left out still parses and
     still validates — it just never joins up. */
  const isHomepage = page.url === home

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
    /* The Service names its provider, but only in that direction. This is the
       return leg, so a consumer that resolved the Person first still finds the
       work on offer. `makesOffer` and not `worksFor`: worksFor takes an
       Organization, and the whole point of the Person modelling is that there
       isn't one. Homepage-only, because the Service node is. */
    ...(isHomepage && { makesOffer: { '@type': 'Offer', itemOffered: { '@id': serviceId } } }),
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
    ...(isHomepage && { mainEntity: { '@id': personId } }),
  }

  /**
   * What Craig is hired to do, and how to start.
   *
   * The offer catalog takes only `name` and `description` off each offering.
   * `source` is provenance for whoever edits the copy next — it says where on
   * the page the offering is already visible — and publishing it would state
   * something about the site rather than about the service.
   *
   * Two fields carry the booking link, because they answer two different
   * questions. `availableChannel` is the descriptive one: where this service is
   * obtained. `potentialAction` is the actionable one, and the type search and
   * answer engines look for when they want something to offer a reader. A
   * ReserveAction rather than the more general ContactAction, because the link
   * books a specific slot in a calendar rather than opening a conversation —
   * and `name` is the button's own label, so what an engine surfaces is what a
   * visitor would have clicked.
   */
  const offer = {
    '@type': 'Service',
    '@id': serviceId,
    name: service.name,
    serviceType: service.serviceType,
    description: service.summary,
    url: home,
    provider: { '@id': personId },
    areaServed: service.areaServed,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: serviceOfferings.map((offering) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: offering.name,
          description: offering.description,
        },
      })),
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      name: `Book a ${booking.minutes}-minute call`,
      serviceUrl: booking.href,
    },
    potentialAction: {
      '@type': 'ReserveAction',
      name: hero.cta.label,
      target: booking.href,
    },
  }

  /* Order is for whoever opens view-source: the person, the site, this page,
     then what the page is selling. */
  return {
    '@context': 'https://schema.org',
    '@graph': [person, website, webpage, ...(isHomepage ? [offer] : [])],
  }
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
