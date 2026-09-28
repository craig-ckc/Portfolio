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
    <nav
      // Out of the way while the folder's contents are out (see the note this
      // rule used to carry in nav.css). Keyed off the folder's own class, not
      // the page's data-scatter attribute — that attribute stays on for the
      // whole return, so the navbar would come back only once the cards were
      // home, a beat later than the fault this is fixing.
      className="tw:absolute tw:top-0 tw:inset-x-0 tw:z-50 tw:flex tw:items-center tw:justify-between tw:p-md tw:transition-opacity tw:duration-(--veil-clear) tw:ease-standard tw:[.hp:has(.folder.is-open)_&]:opacity-0 tw:[.hp:has(.folder.is-open)_&]:duration-(--veil-fade)"
      aria-label="Primary"
      ref={navRef}
    >
      <a href={homeHref} aria-label="Craig Chihururu, home">
        {/* BEYOND THE FRAME: 78.57px/20px and the mask's own values have no
            token behind them — the mark is drawn at the logo svg's native
            size. */}
        <span className="tw:block tw:w-[78.57px] tw:h-lg tw:bg-current tw:[mask:url(/figma/logo.svg)_center/contain_no-repeat] tw:[-webkit-mask:url(/figma/logo.svg)_center/contain_no-repeat]" />
      </a>

      <div className="tw:flex tw:gap-3xs">
        <a
          className="chip tw:h-[26px] tw:px-xs tw:py-3xs tw:text-body tw:leading-tight tw:tracking-snug"
          href={contact.href}
        >
          Contact
        </a>
        <button
          className="chip tw:group tw:h-[26px] tw:w-[26px] tw:p-0"
          type="button"
          aria-pressed={theme === 'dark'}
          aria-label={theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'}
          onClick={() => choose(appliedTheme(navRef.current) === 'light' ? 'dark' : 'light')}
        >
          {/* BEYOND THE FRAME: drawn at 12px rather than filling the button —
              the glyphs are on a 12 unit grid, so at 12px their 1px strokes
              land on whole pixels; at 16 they fell between them and the dots
              around the sun read as smudges. */}
          <AppearanceGlyph className="tw:w-[12px] tw:h-[12px] tw:group-hover:rotate-[60deg]" />
        </button>
      </div>
    </nav>
  )
}
