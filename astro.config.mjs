import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // The canonical origin. /sitemap.xml, /robots.txt, and every page's
  // rel=canonical, og: tags and JSON-LD build their absolute URLs from this, so
  // it is the one place the production domain is written down — Astro leaves
  // `Astro.site` undefined without it, and the endpoints fail the build rather
  // than emit URLs a crawler cannot use.
  //
  // `www`, not the apex: the apex and craigchihururu.vercel.app both answer
  // with a 308 to this host, so it is the only one of the three that serves the
  // site rather than pointing at it.
  site: 'https://www.craigchihururu.com',
  integrations: [react()],
  vite: {
    // Tailwind v4's official Vite integration: it compiles the @theme and
    // @custom-variant rules in src/styles.css and generates utilities on
    // demand for classes found in source files. No tailwind.config file —
    // v4 configures entirely through CSS.
    plugins: [tailwindcss()],
  },
  server: {
    // Bind all interfaces so the dev server is reachable from other devices
    // (phone, tablet) over Tailscale. Note this also exposes it to any local
    // network you are on, not just the tailnet.
    host: true,
  },
})
