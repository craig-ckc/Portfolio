import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Guards for the Tailwind v4 foundation in src/styles.css.
 *
 * The contract under test: design-tokens.css is the single runtime source of
 * truth, and styles.css only *references* it — so a token renamed on one side
 * fails here instead of silently generating utilities that resolve to nothing.
 * These are file-shape assertions, deliberately narrow: they pin the wiring
 * (imports, variant, plugin) without rendering any CSS.
 */
const stylesCss = readFileSync(new URL('../styles.css', import.meta.url), 'utf8')
const designTokensCss = readFileSync(new URL('./design-tokens.css', import.meta.url), 'utf8')
const astroConfig = readFileSync(new URL('../../astro.config.mjs', import.meta.url), 'utf8')

/** The `@theme inline { ... }` body, which holds only var() references. */
function inlineThemeBody(): string {
  const match = stylesCss.match(/@theme\s+inline\s*\{([^}]*)\}/)
  if (!match) throw new Error('No `@theme inline` block found in src/styles.css')
  return match[1]
}

describe('tailwind foundation wiring', () => {
  it('imports theme and utilities without the preflight reset', () => {
    expect(stylesCss).toContain(`@import 'tailwindcss/theme.css' layer(theme) prefix(tw)`)
    expect(stylesCss).toContain(`@import 'tailwindcss/utilities.css' layer(utilities) prefix(tw)`)
    expect(stylesCss).not.toMatch(/@import\s+['"]tailwindcss\/(preflight|index)/)
  })

  it('prefixes utilities and generated variables away from existing class and token names', () => {
    expect(stylesCss).toContain('prefix(tw)')
    expect(stylesCss).not.toMatch(/@import\s+['"]tailwindcss\/(?:theme|utilities)\.css['"]\s*;/)
  })

  it('scopes the dark variant to the .hp wrapper', () => {
    expect(stylesCss).toMatch(
      /@custom-variant\s+dark\s+\([^)]*\.hp\[data-theme='dark'\][^)]*\)/,
    )
  })

  it('registers the official Vite plugin and no legacy config', () => {
    expect(astroConfig).toContain('@tailwindcss/vite')
    expect(astroConfig).toContain('tailwindcss()')
  })

  it('carries no !important of its own', () => {
    expect(stylesCss).not.toContain('!important')
  })
})

describe('@theme inline token references', () => {
  it('maps every token through a var() reference, never a copied value', () => {
    const declarations = inlineThemeBody()
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('--'))

    expect(declarations.length).toBeGreaterThan(0)
    for (const declaration of declarations) {
      expect(declaration).toMatch(/^--[\w-]+\s*:\s*var\(--[\w-]+\)\s*;$/)
    }
  })

  it('only references tokens design-tokens.css actually defines', () => {
    const defined = new Set(designTokensCss.match(/--[\w-]+(?=\s*:)/g) ?? [])
    const referenced = new Set(inlineThemeBody().match(/var\((--[\w-]+)\)/g)?.map((ref) => ref.slice(4, -1)) ?? [])

    expect(referenced.size).toBeGreaterThan(0)
    for (const token of referenced) {
      expect(defined, `token ${token} has no definition`).toContain(token)
    }
  })

  it('keeps breakpoint overrides in step with the token widths', () => {
    for (const [name, width] of [
      ['sm', '600px'],
      ['md', '900px'],
      ['lg', '1200px'],
      ['xl', '1600px'],
    ]) {
      expect(stylesCss).toContain(`--breakpoint-${name}: ${width}`)
      expect(designTokensCss).toContain(`--breakpoint-${name}: ${width}`)
    }
  })
})
