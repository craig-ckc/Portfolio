import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Guards for the Tailwind v4 foundation in src/styles.css, the site's only
 * stylesheet.
 *
 * The contract under test: the token block (between the `@tokens:start` and
 * `@tokens:end` markers) is the single runtime source of truth, and the
 * `@theme inline` block only *references* it — so a token renamed on one side
 * fails here instead of silently generating utilities that resolve to nothing.
 * These are file-shape assertions, deliberately narrow: they pin the wiring
 * (imports, variant, plugin) without rendering any CSS.
 */
const stylesCss = readFileSync(new URL('../styles.css', import.meta.url), 'utf8')
/** The design tokens: everything between the two markers in styles.css. */
const designTokensCss = (() => {
  const match = stylesCss.match(/\/\* @tokens:start \*\/([\s\S]*?)\/\* @tokens:end \*\//)
  if (!match) throw new Error('No @tokens:start / @tokens:end block found in src/styles.css')
  return match[1]
})()
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

  /* One exception, and it has to be one: the reduced-motion rule forces every
     duration down, and it must win over any transition a utility declares. */
  it('carries no !important outside the reduced-motion rule', () => {
    const withoutReducedMotion = stylesCss.replace(
      /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n  \}\n/,
      '',
    )
    expect(withoutReducedMotion).not.toContain('!important')
  })

  it('is the only stylesheet in src', () => {
    const sheets = readdirSync(new URL('../', import.meta.url), { recursive: true, encoding: 'utf8' }).filter((f) =>
      f.endsWith('.css'),
    )
    expect(sheets).toEqual(['styles.css'])
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

  it('only references tokens the token block actually defines', () => {
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
