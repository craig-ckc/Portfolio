/* Icons taken verbatim from the Paper page frame, plus the two folder stickers,
   which are redrawn as vectors because the frame only had them as a raster. */

export function Sparkle() {
  return (
    <svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true">
      <path
        d="M3 1.8l7 4.1-3 .8 1.7 3.1-1.5.8-1.7-3.1L3 8.9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * The appearance glyph in the navbar: a sun in light, a crescent in dark.
 *
 * Both are drawn, always. Which one shows is a matter of opacity and a twist,
 * handled in home-page.css off the `data-theme` on the `.hp` wrapper — so the
 * two cross over rather than one being swapped out for the other, and nothing
 * has to be mounted or unmounted mid-transition.
 *
 * The rotation on hover belongs to the svg and not to either path, which is why
 * the shared class sits out here. Both are on the same 12 unit grid as the box,
 * and the sun's dots are zero-length segments with round caps.
 */
export function AppearanceGlyph() {
  return (
    <svg className="nav__icon-glyph" viewBox="0 0 12 12" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path
          className="nav__glyph nav__glyph--sun"
          d="M6 2H6.005M10 6H10.005M6 10H6.005M2 6H2.005M8.829 3.171H8.834M8.829 8.829H8.834M3.171 8.829H3.176M3.171 3.171H3.176M8 6C8 7.105 7.105 8 6 8C4.895 8 4 7.105 4 6C4 4.895 4.895 4 6 4C7.105 4 8 4.895 8 6Z"
        />
        <path className="nav__glyph nav__glyph--moon" d="M6 1.5a3 3 0 0 0 4.5 4.5 4.5 4.5 0 1 1-4.5-4.5Z" />
      </g>
    </svg>
  )
}

/* The waving hand beside "Say hello". Pivots on the wrist, not the centre, so
   the wave reads as a hand rather than a spinning shape. */
export function WavingHand() {
  return (
    <svg viewBox="0 0 17 21" aria-hidden="true" className="wave">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="0.98"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6.54031 6.37478C6.37716 6.08783 6.33414 5.748 6.42062 5.42945C6.50711 5.1109 6.71608 4.83948 7.00194 4.67444C7.2878 4.50939 7.62734 4.46411 7.94646 4.54848C8.26558 4.63285 8.53837 4.84002 8.70531 5.12478L10.5803 8.37478" />
        <path d="M4.83087 8.41712L3.94087 6.87525C3.77511 6.58807 3.73022 6.2468 3.81608 5.92652C3.90193 5.60625 4.1115 5.33319 4.39868 5.16743C4.68586 5.00167 5.02713 4.95678 5.34741 5.04264C5.66768 5.1285 5.94074 5.33807 6.1065 5.62525L8.05462 9.00025" />
        <path d="M10.4298 12.5C10.07 11.9682 9.92853 11.3184 10.0348 10.6852C10.141 10.052 10.4868 9.48391 11.0005 9.09871L10.583 8.37496C10.4172 8.08753 10.3724 7.74603 10.4584 7.42557C10.5445 7.10512 10.7543 6.83197 11.0417 6.66621C11.3291 6.50045 11.6706 6.45566 11.9911 6.54169C12.3116 6.62772 12.5847 6.83753 12.7505 7.12496L13.8323 8.99996C14.1606 9.56879 14.3737 10.1967 14.4593 10.8479C14.545 11.499 14.5015 12.1607 14.3314 12.7951C14.1613 13.4294 13.868 14.0241 13.4681 14.5451C13.0682 15.0661 12.5696 15.5032 12.0008 15.8315C10.852 16.4946 9.48683 16.6741 8.20567 16.3306C6.9245 15.9871 5.83226 15.1488 5.16922 14L2.66922 9.66746C2.50607 9.38051 2.46305 9.04068 2.54953 8.72213C2.63602 8.40358 2.84499 8.13216 3.13085 7.96712C3.41671 7.80207 3.75624 7.75679 4.07536 7.84116C4.39448 7.92553 4.66728 8.1327 4.83422 8.41746L6.03609 10.5" />
        <path d="M12.498 4.61133C12.9116 4.72052 13.2994 4.9105 13.6391 5.1703C13.9788 5.43011 14.2637 5.75461 14.4774 6.12508L14.498 6.1607" />
        <path d="M5.1618 17C4.46452 16.4491 3.87865 15.7703 3.43555 15" />
      </g>
    </svg>
  )
}

/* The 44px mark that opens the CTA section. */
export function CtaMark() {
  const bar = 'var(--neutral-700)'

  return (
    <svg viewBox="0 0 35 34" aria-hidden="true">
      <defs>
        <linearGradient id="mark-tile" x1="11.785" y1="0.44" x2="33.258" y2="35.396" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F9FAF7" stopOpacity="0.12" />
          <stop offset="1" stopColor="#F9FAF7" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <rect x="0.922" width="34" height="34" rx="6" fill="url(#mark-tile)" />
      <rect x="6.5" y="20.992" width="22.841" height="1.269" fill={bar} />
      <rect x="24.898" y="16.548" width="2.538" height="1.269" fill={bar} />
      <rect x="8.445" y="16.548" width="2.538" height="1.269" fill={bar} />
      <rect x="18.563" y="9.571" width="2.538" height="1.269" transform="rotate(90 18.563 9.571)" fill={bar} />
      <rect x="24.27" y="11.471" width="1.269" height="1.269" transform="rotate(90 24.27 11.471)" fill={bar} />
      <rect x="25.535" y="10.202" width="1.269" height="1.269" transform="rotate(90 25.535 10.202)" fill={bar} />
      <rect width="1.269" height="1.269" transform="matrix(0 1 1 0 11.578 11.471)" fill={bar} />
      <rect width="1.269" height="1.269" transform="matrix(0 1 1 0 10.313 10.202)" fill={bar} />
      <rect x="14.113" y="14.01" width="7.614" height="1.269" fill={bar} />
      <rect x="22.996" y="15.279" width="5.713" height="1.269" transform="rotate(90 22.996 15.279)" fill={bar} />
      <rect x="14.113" y="15.279" width="5.713" height="1.269" transform="rotate(90 14.113 15.279)" fill={bar} />
    </svg>
  )
}

export function XLogo() {
  return (
    <svg viewBox="0 0 15 15" aria-hidden="true">
      <path
        d="M11.453 1.19H13.561L8.955 6.455L14.374 13.619H10.131L6.808 9.274L3.005 13.619H0.896L5.822 7.988L0.624 1.19H4.975L7.979 5.161L11.453 1.19ZM10.713 12.357H11.881L4.34 2.386H3.086L10.713 12.357Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function LinkedInLogo() {
  return (
    <svg viewBox="0 0 15 15" aria-hidden="true">
      <path d="M3.726 4.585H0.813V13.875H3.726V4.585Z" fill="currentColor" />
      <path
        d="M11.607 4.383C11.499 4.37 11.385 4.363 11.271 4.356C9.64 4.289 8.72 5.256 8.398 5.672C8.311 5.786 8.27 5.853 8.27 5.853V4.612H5.484V13.902H8.27H8.398C8.398 12.956 8.398 12.016 8.398 11.069C8.398 10.559 8.398 10.049 8.398 9.539C8.398 8.908 8.351 8.237 8.666 7.659C8.935 7.176 9.418 6.934 9.962 6.934C11.573 6.934 11.607 8.391 11.607 8.525V13.943H14.52V7.881C14.52 5.806 13.466 4.585 11.607 4.383Z"
        fill="currentColor"
      />
      <path
        d="M2.269 3.383C3.203 3.383 3.96 2.626 3.96 1.692C3.96 0.757 3.203 0 2.269 0C1.335 0 0.577 0.757 0.577 1.692C0.577 2.626 1.335 3.383 2.269 3.383Z"
        fill="currentColor"
      />
    </svg>
  )
}

/* Sticker: a postage stamp. The dotted round-cap stroke gives the perforation. */
export function StampSticker() {
  return (
    <svg viewBox="0 0 100 86" aria-hidden="true">
      <rect
        x="7"
        y="7"
        width="86"
        height="72"
        rx="3"
        fill="#fff"
        stroke="#fff"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray="0.01 9"
      />
      <rect x="14" y="14" width="72" height="58" rx="2" fill="#fff" stroke="#E3E3E3" strokeWidth="1.5" />
      <circle cx="50" cy="43" r="14" fill="#BC002D" />
    </svg>
  )
}

/* Sticker: a torii gate. Drawn twice — once as a fat white outline, once filled. */
export function ToriiSticker() {
  const shape = (
    <>
      <path d="M5 21C30 14 70 14 95 21L95 31C70 24 30 24 5 31Z" />
      <path d="M18 39H82V49H18Z" />
      <path d="M27 31H39L35 93H23Z" />
      <path d="M61 31H73L77 93H65Z" />
    </>
  )

  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <g fill="#fff" stroke="#fff" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round">
        {shape}
      </g>
      <g fill="#E8442E" stroke="#141414" strokeWidth="3.5" strokeLinejoin="round">
        {shape}
      </g>
    </svg>
  )
}
