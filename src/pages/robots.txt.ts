// Served at /robots.txt, alongside src/pages/sitemap.xml.ts — the Sitemap line
// is the half of the pair that gets a crawler to the sitemap without waiting
// on Search Console.
import type { APIRoute } from 'astro'
import { requireSite, robotsTxt } from '../lib/sitemap'

export const GET: APIRoute = ({ site }) =>
  new Response(robotsTxt(requireSite(site)), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
