import { bookingTrigger, contact, cta, siteNav, socials } from '../../content/home-page'
import { CtaMark, LinkedInLogo, WavingHand, XLogo } from '../icons'

const socialIcons = {
  x: XLogo,
  linkedin: LinkedInLogo,
} as const

function Siteline() {
  return (
    <div className="tw:flex tw:w-full tw:flex-col tw:items-start tw:gap-2xl tw:pt-5xl tw:md:flex-row tw:md:items-center tw:md:justify-between tw:md:gap-4xl">
      <nav className="tw:flex tw:flex-wrap tw:items-center tw:gap-2xl" aria-label="Sections">
        {siteNav.map((item) => (
          <a
            className="tw:text-neutral-700 tw:text-body tw:font-normal tw:leading-normal tw:transition-colors tw:duration-180 tw:ease-standard tw:hover:text-foreground"
            href={item.href}
            key={item.label}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-lg tw:md:flex-nowrap">
        {/* Collapsed to just the hand; the label wipes open on hover/focus.
            `tw:group` here is what WavingHand's own `group-hover:` reaches
            for — the hand's svg (and its wave keyframes) live inside
            icons.tsx, reached through a `className` prop rather than a BEM
            hook. */}
        <a
          className="tw:group tw:-ml-3xs tw:md:ml-0 tw:inline-flex tw:items-center tw:pt-3xs tw:px-3xs tw:pb-2xs tw:border-b tw:border-neutral-600 tw:text-neutral-900 tw:text-body tw:leading-normal tw:whitespace-nowrap tw:transition-[border-color] tw:duration-320 tw:ease-standard tw:hover:border-foreground tw:focus-visible:border-foreground"
          href={contact.href}
        >
          <span className="tw:inline-flex tw:w-lg tw:h-xl tw:shrink-0 tw:items-center tw:justify-center tw:text-neutral-900">
            <WavingHand />
          </span>
          {/* BEYOND THE FRAME: the label's own three-property transition mixes
              two timings (320ms quint for the width/padding wipe, 200ms
              standard for the fade), which a single transition-* utility
              cannot express — kept as one arbitrary declaration rather than
              split across utilities that would silently share one timing. */}
          <span className="tw:inline-block tw:max-w-0 tw:overflow-clip tw:opacity-0 tw:[transition:max-width_320ms_var(--ease-out-quint),padding-left_320ms_var(--ease-out-quint),opacity_200ms_var(--ease-standard)] tw:group-hover:max-w-[8rem] tw:group-hover:pl-3xs tw:group-hover:opacity-100 tw:group-focus-visible:max-w-[8rem] tw:group-focus-visible:pl-3xs tw:group-focus-visible:opacity-100">
            {contact.label}
          </span>
        </a>

        {/* `tw:social` (the `@utility social` in src/styles.css): shared with
            src/components/writing/article-share.astro. */}
        <div className="tw:social">
          {socials.map((social) => {
            const Icon = socialIcons[social.icon]
            return (
              <a href={social.href} key={social.label} target="_blank" rel="noreferrer" aria-label={social.label}>
                <Icon />
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function Cta() {
  return (
    <section
      className="container tw:flex tw:flex-col tw:items-center tw:pt-[calc(4*var(--spacing-section-py))] tw:pb-section-py"
      id="contact"
      aria-labelledby="cta-title"
    >
      <span className="tw:w-[44px] tw:h-[44px] tw:shrink-0" aria-hidden="true">
        <CtaMark />
      </span>

      {/* BEYOND THE FRAME: the clamp() and the font-variation-settings axis
          have no token behind them, same as the equivalent heading in
          project-page.css. */}
      <h2
        className="tw:pt-2xl tw:whitespace-pre-line tw:font-display tw:text-[clamp(2rem,3.9vw,3.75rem)] tw:font-bold tw:[font-variation-settings:'wght'_700] tw:tracking-snug tw:leading-tight tw:text-center tw:text-balance"
        id="cta-title"
      >
        {cta.title}
      </h2>

      {/* BEYOND THE FRAME: the 7px gap between the lead sentence and the link
          has no token behind it. */}
      <p className="tw:flex tw:flex-wrap tw:items-center tw:justify-center tw:gap-[7px] tw:pt-3xl tw:text-neutral-700 tw:text-body tw:leading-normal">
        <span>{cta.invitationLead}</span>
        <a
          className="tw:inline-flex tw:items-center tw:pb-4xs tw:border-b tw:border-neutral-600 tw:text-foreground tw:font-normal tw:transition-[border-color] tw:duration-320 tw:ease-standard tw:hover:border-foreground"
          href={cta.invitationLink.href}
          {...bookingTrigger}
        >
          {/* Shimmers on its own every few seconds — a periodic hint that
              this is clickable, since it carries no button chrome. A wide,
              soft band peaking near the page colour, so the pass is legible
              rather than a faint grey flicker; the base stop is the text
              colour, so the label stays readable if the animation never
              runs (and reduced motion turns it off and restores a flat
              colour, rather than leaving the label clipped to a static
              gradient). The animation itself (`tw:animate-chrome-shimmer`)
              lives in src/styles/tw/chrome.css. */}
          <span className="tw:[background-image:linear-gradient(100deg,var(--foreground)_0%,var(--foreground)_24%,var(--neutral-600)_40%,var(--neutral-300)_50%,var(--neutral-600)_60%,var(--foreground)_76%,var(--foreground)_100%)] tw:[background-size:250%_100%] tw:[background-position:130%_0] tw:bg-clip-text tw:text-transparent tw:animate-chrome-shimmer tw:motion-reduce:animate-none! tw:motion-reduce:bg-none! tw:motion-reduce:text-foreground!">
            {cta.invitationLink.label}
          </span>
        </a>
      </p>

      <Siteline />
    </section>
  )
}
