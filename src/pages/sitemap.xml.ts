// Served at /sitemap.xml. An endpoint rather than a file in public/ so the
// URLs are built from one list and one origin (see src/lib/sitemap.ts) instead
// of a second copy of the domain that drifts the first time it moves.
import type { APIRoute } from 'astro'
import { requireSite, sitemapXml } from '../lib/sitemap'

export const GET: APIRoute = ({ site }) =>
  new Response(sitemapXml(requireSite(site)), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
