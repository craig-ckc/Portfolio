import { SunGlyph } from './icons'

/**
 * Overlays the top of the hero, which reserves --spacing-hero-top for it.
 *
 * The frame includes a sun glyph in the trailing slot but does not define what
 * it does or supply a dark variant, so it is wired to the appearance toggle and
 * the dark palette is derived from the existing neutral ramp. See the
 * `.hp[data-theme='dark']` block in home-page.css.
 */
export function NavBar({
  theme,
  onToggleTheme,
}: {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}) {
  return (
    <nav className="hp-nav" aria-label="Primary">
      <a href="#top" aria-label="Craig Chihururu — home">
        <span className="hp-nav__logo" />
      </a>

      <div className="hp-nav__actions">
        <a
          className="hp-chip hp-nav__pill"
          href="mailto:hello@craigchihururu.com?subject=Hello"
        >
          Contact
        </a>
        <button
          className="hp-chip hp-nav__icon"
          type="button"
          aria-pressed={theme === 'dark'}
          aria-label={theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'}
          onClick={onToggleTheme}
        >
          <SunGlyph />
        </button>
      </div>
    </nav>
  )
}
