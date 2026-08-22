import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

export default defineConfig({
  integrations: [react()],
  server: {
    // Bind all interfaces so the dev server is reachable from other devices
    // (phone, tablet) over Tailscale. Note this also exposes it to any local
    // network you are on, not just the tailnet.
    host: true,
  },
})
