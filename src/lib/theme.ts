/**
 * The appearance preference, shared between the inline resolver in
 * src/layouts/page-shell.astro and the navbar's toggle.
 *
 * Two values are kept deliberately apart:
 *
 * - the *stored* theme, which does not exist until the visitor has used the
 *   toggle at least once, and
 * - the *resolved* theme, which is the stored one when there is one and the
 *   operating system's otherwise.
 *
 * Only a click writes to storage. Someone who has never touched the toggle
 * keeps following their system for as long as that stays true — which is what
 * watchSystemTheme is for — and an explicit choice outranks the system from
 * the moment it is made.
 */

export type Theme = 'light' | 'dark'

/**
 * Also read by the inline resolver, which is plain JS in a `<script is:inline>`
 * and cannot import from here, so the key is handed to it through
 * `define:vars` rather than written out twice.
 */
export const THEME_STORAGE_KEY = 'theme'

const SYSTEM_DARK = '(prefers-color-scheme: dark)'

/**
 * localStorage throws rather than no-ops when a browser has storage locked
 * down (Safari's private windows, blocked third-party data), so every access
 * is guarded. Anything other than the two known values is treated as absent.
 */
export function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage is unavailable. The toggle still works for this page view; only
    // the memory of it is lost, which is better than throwing out of a click.
  }
}

/**
 * Reads back what the inline resolver settled on, so the navbar adopts that
 * answer instead of deriving its own and risking a different one.
 */
export function appliedTheme(within: Element | null): Theme {
  return within?.closest('.hp')?.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

/** `.hp` is the element every dark rule in home-page.css is scoped to. */
export function applyTheme(within: Element | null, theme: Theme): void {
  within?.closest('.hp')?.setAttribute('data-theme', theme)
}

/** Returns its own teardown, so it can be handed straight back from an effect. */
export function watchSystemTheme(onChange: (theme: Theme) => void): () => void {
  const query = matchMedia(SYSTEM_DARK)
  const handle = (event: MediaQueryListEvent) => onChange(event.matches ? 'dark' : 'light')

  query.addEventListener('change', handle)
  return () => query.removeEventListener('change', handle)
}
