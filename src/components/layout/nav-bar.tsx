import { useEffect, useRef, useState } from 'react'
import { contact } from '../../content/home-page'
import { AppearanceGlyph } from '../icons'
import {
  appliedTheme,
  applyTheme,
  readStoredTheme,
  storeTheme,
  watchSystemTheme,
  type Theme,
} from '../../lib/theme'

/**
 * Overlays the top of the page, which reserves --spacing-hero-top for it.
 *
 * The frame includes a sun glyph in the trailing slot but does not define what
 * it does or supply a dark variant, so it is wired to the appearance toggle,
 * the crescent it turns into is drawn to match it, and the dark palette is
 * derived from the existing neutral ramp. See the `.hp[data-theme='dark']`
 * block in home-page.css.
 *
 * NavBar owns the theme state itself rather than reading it as a prop: each
 * `client:*` island hydrates as its own React root, so a value that used to
 * live at the page root has nowhere shared to live any more. The Astro layout
 * renders the `.hp` wrapper as static markup with `data-theme="light"`, and
 * this component writes the live value onto that ancestor element directly
 * once it hydrates, rather than the wrapper needing to know the toggle exists.
 *
 * What it does *not* own is the appearance a visit opens on. That is settled
 * before paint by the inline resolver in src/layouts/page-shell.astro, and
 * this component adopts the answer on mount — hydration is too late to decide
 * it without a flash. See src/lib/theme.ts for how a stored choice and the
 * operating system rank against each other.
 */
export function NavBar({
  homeHref = '#top',
}: {
  /** '#top' on the homepage; '/' anywhere else, where the anchor goes nowhere. */
  homeHref?: string
}) {
  // Both start at the value the server rendered, so hydration agrees with the
  // markup, and are corrected on mount: neither the resolved appearance nor
  // whether a stored choice exists is knowable during the server render.
  const [theme, setTheme] = useState<Theme>('light')
  const [chosen, setChosen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setTheme(appliedTheme(navRef.current))
    setChosen(readStoredTheme() !== null)
  }, [])

  // Only while the toggle has never been used: until then the system is the
  // source of truth, so a visitor flipping their OS to dark with the page open
  // should see it follow. A choice of their own ends this for good.
  useEffect(() => {
    if (chosen) return

    return watchSystemTheme((next) => {
      setTheme(next)
      applyTheme(navRef.current, next)
    })
  }, [chosen])

  // Imperative rather than an effect on `theme`, which could not tell a click
  // apart from either sync above and would persist an appearance the visitor
  // never actually asked for.
  //
  // `next` is derived from the DOM at the callsite rather than from `theme`,
  // because a click can land in the gap between the listener attaching and the
  // mount effect above committing — during which `theme` still says 'light'
  // while the page is already dark, and toggling off it would store the
  // appearance the visitor is looking at instead of the one they asked for.
  const choose = (next: Theme) => {
    setTheme(next)
    setChosen(true)
    applyTheme(navRef.current, next)
    storeTheme(next)
  }

  return (
    <nav className="nav" aria-label="Primary" ref={navRef}>
      <a href={homeHref} aria-label="Craig Chihururu — home">
        <span className="nav__logo" />
      </a>

      <div className="nav__actions">
        <a className="chip nav__pill" href={contact.href}>
          Contact
        </a>
        <button
          className="chip nav__icon"
          type="button"
          aria-pressed={theme === 'dark'}
          aria-label={theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'}
          onClick={() => choose(appliedTheme(navRef.current) === 'light' ? 'dark' : 'light')}
        >
          <AppearanceGlyph />
        </button>
      </div>
    </nav>
  )
}
