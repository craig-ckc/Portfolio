/**
 * The site's indexable URLs, and how a page is named in a URL. Three things
 * read from here — /sitemap.xml, /robots.txt, and the og:url in every page
 * head — so all three name a page identically and one origin is written down
 * once.
 *
 * The list is written out by hand rather than globbed from src/pages, so that
 * what gets submitted to a search engine stays a deliberate choice and not a
 * side effect of a file appearing on disk — a draft or a dynamic route would
 * otherwise walk straight into it. The trade is that a new page has to be
 * added here too, and sitemap.test.ts fails when one isn't, so the list cannot
 * quietly fall behind src/pages.
 *
 * Paths carry no trailing slash, matching how the site already links to itself
 * from `navLinks` in src/content/home-page.ts. A sitemap that disagrees with a
 * site's own internal links hands the crawler two candidate URLs per page to
 * reconcile, and picks the fight over which is canonical for no gain.
 */

/** Every path the site wants indexed, root-relative. */
export const INDEXABLE_PATHS = ['/', '/writing', '/experiments'] as const

/**
 * The origin, as an absolute URL. Astro only fills `Astro.site` in when
 * `site` is set in astro.config.mjs, and a sitemap of relative paths is worth
 * nothing to a crawler — so fail the build loudly rather than emit one.
 */
export function requireSite(site: URL | undefined): URL {
  if (!site) {
    throw new Error('Set `site` in astro.config.mjs: /sitemap.xml and /robots.txt need an absolute origin.')
  }
  return site
}

/**
 * One page's canonical absolute URL, for the og:url in its head.
 *
 * Astro hands `Astro.url.pathname` over with a trailing slash on a directory
 * route, so it is trimmed here to the same shape INDEXABLE_PATHS uses. The
 * point is that a crawler reading the sitemap and a scraper reading the page
 * head come away with byte-identical URLs: the site is reachable on three
 * hosts (the apex and the .vercel.app both 308 to www), and og:url is what
 * says which of them the share, the like and the link count belong to.
 */
export function canonicalUrl(site: URL, pathname: string): string {
  return new URL(pathname === '/' ? '/' : pathname.replace(/\/+$/, ''), site).href
}

/** INDEXABLE_PATHS resolved against the configured origin. */
export function indexableUrls(site: URL): string[] {
  return INDEXABLE_PATHS.map((path) => new URL(path, site).href)
}

/**
 * No <lastmod>. The only date this build knows is its own start time, and
 * stamping that on every page would claim the whole site changed at every
 * deploy — a signal Google discounts wholesale once it stops matching what
 * actually changed. An honest sitemap of <loc>s is worth more than a
 * decorated one nobody trusts.
 */
export function sitemapXml(site: URL): string {
  const entries = indexableUrls(site)
    .map((url) => `  <url><loc>${url}</loc></url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`
}

/** Sitemap: has to be an absolute URL — robots.txt does not resolve relative paths. */
export function robotsTxt(site: URL): string {
  return `User-agent: *
Allow: /

Sitemap: ${new URL('/sitemap.xml', site).href}
`
}
