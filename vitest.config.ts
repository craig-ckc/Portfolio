import { defineConfig } from 'vitest/config'

/* Deliberately not Astro's `getViteConfig`. Vitest 4 resolves Vite 8 while
   Astro 5 pins its own nested Vite 6, and the two Plugin types do not unify,
   so the wrapper cannot be typed without a cast. Nothing here needs it: the
   only suite covers src/lib/dithered-background-renderer.ts, which is plain
   TypeScript with no Astro or JSX in its import graph. Revisit if a test ever
   needs to render an .astro component. */
export default defineConfig({ test: { environment: 'node' } })
