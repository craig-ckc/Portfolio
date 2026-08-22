import { useEffect, useRef, useState } from 'react'
import { contact } from '../../content/home-page'
import { SunGlyph } from '../icons'

/**
 * Overlays the top of the page, which reserves --spacing-hero-top for it.
 *
 * The frame includes a sun glyph in the trailing slot but does not define what
 * it does or supply a dark variant, so it is wired to the appearance toggle and
 * the dark palette is derived from the existing neutral ramp. See the
 * `.hp[data-theme='dark']` block in home-page.css.
 *
 * NavBar owns the theme state itself rather than reading it as a prop: each
 * `client:*` island hydrates as its own React root, so a value that used to
 * live at the page root has nowhere shared to live any more. The Astro layout
 * renders the `.hp` wrapper as static markup with `data-theme="light"`, and
 * this component writes the live value onto that ancestor element directly
 * once it hydrates, rather than the wrapper needing to know the toggle exists.
 */
export function NavBar({
  homeHref = '#top',
}: {
  /** '#top' on the homepage; '/' anywhere else, where the anchor goes nowhere. */
  homeHref?: string
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    navRef.current?.closest('.hp')?.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <nav className="hp-nav" aria-label="Primary" ref={navRef}>
      <a href={homeHref} aria-label="Craig Chihururu — home">
        <span className="hp-nav__logo" />
      </a>

      <div className="hp-nav__actions">
        <a className="hp-chip hp-nav__pill" href={contact.href}>
          Contact
        </a>
        <button
          className="hp-chip hp-nav__icon"
          type="button"
          aria-pressed={theme === 'dark'}
          aria-label={theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'}
          onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
        >
          <SunGlyph />
        </button>
      </div>
    </nav>
  )
}
