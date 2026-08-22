import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // Bind all interfaces so the dev server is reachable from other devices
    // (phone, tablet) over Tailscale. Note this also exposes it to any local
    // network you are on, not just the tailnet.
    host: true,
  },
})
