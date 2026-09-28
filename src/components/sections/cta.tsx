import { bookingTrigger, contact, cta, siteNav, socials } from '../../content/home-page'
import { CtaMark, LinkedInLogo, WavingHand, XLogo } from '../icons'

const socialIcons = {
  x: XLogo,
  linkedin: LinkedInLogo,
} as const

function Siteline() {
  return (
    <div className="flex w-full flex-col items-start gap-2xl pt-5xl md:flex-row md:items-center md:justify-between md:gap-4xl">
      <nav className="flex flex-wrap items-center gap-2xl" aria-label="Sections">
        {siteNav.map((item) => (
          <a
            className="text-neutral-700 text-body font-normal leading-normal transition-colors duration-180 ease-standard hover:text-foreground"
            href={item.href}
            key={item.label}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-lg md:flex-nowrap">
        {/* Collapsed to just the hand; the label wipes open on hover/focus.
            `group` here is what WavingHand's own `group-hover:` reaches
            for — the hand's svg (and its wave keyframes) live inside
            icons.tsx, reached through a `className` prop rather than a BEM
            hook. */}
        <a
          className="group -ml-3xs md:ml-0 inline-flex items-center pt-3xs px-3xs pb-2xs border-b border-neutral-600 text-neutral-900 text-body leading-normal whitespace-nowrap transition-[border-color] duration-320 ease-standard hover:border-foreground focus-visible:border-foreground"
          href={contact.href}
        >
          <span className="inline-flex w-lg h-xl shrink-0 items-center justify-center text-neutral-900">
            <WavingHand />
          </span>
          {/* BEYOND THE FRAME: the label's own three-property transition mixes
              two timings (320ms quint for the width/padding wipe, 200ms
              standard for the fade), which a single transition-* utility
              cannot express — kept as one arbitrary declaration rather than
              split across utilities that would silently share one timing. */}
          <span className="inline-block max-w-0 overflow-clip opacity-0 [transition:max-width_320ms_var(--ease-out-quint),padding-left_320ms_var(--ease-out-quint),opacity_200ms_var(--ease-standard)] group-hover:max-w-[8rem] group-hover:pl-3xs group-hover:opacity-100 group-focus-visible:max-w-[8rem] group-focus-visible:pl-3xs group-focus-visible:opacity-100">
            {contact.label}
          </span>
        </a>

        {/* `social` (the `@utility social` in src/styles.css): shared with
            src/components/writing/article-share.astro. */}
        <div className="social">
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
      className="mx-auto flex w-full max-w-[calc(var(--container-page)+var(--spacing-page-gutter)*2)] flex-col items-center px-page-gutter pt-[calc(4*var(--spacing-section-py))] pb-section-py"
      id="contact"
      aria-labelledby="cta-title"
    >
      <span className="w-[44px] h-[44px] shrink-0" aria-hidden="true">
        <CtaMark />
      </span>

      {/* BEYOND THE FRAME: the clamp() and the font-variation-settings axis
          have no token behind them, same as the equivalent heading in
          project-page.css. */}
      <h2
        className="pt-2xl whitespace-pre-line font-display text-[clamp(2rem,3.9vw,3.75rem)] font-bold [font-variation-settings:'wght'_700] tracking-snug leading-tight text-center text-balance"
        id="cta-title"
      >
        {cta.title}
      </h2>

      {/* BEYOND THE FRAME: the 7px gap between the lead sentence and the link
          has no token behind it. */}
      <p className="flex flex-wrap items-center justify-center gap-[7px] pt-3xl text-neutral-700 text-body leading-normal">
        <span>{cta.invitationLead}</span>
        <a
          className="inline-flex items-center pb-4xs border-b border-neutral-600 text-foreground font-normal transition-[border-color] duration-320 ease-standard hover:border-foreground"
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
              gradient). The animation itself (`animate-chrome-shimmer`)
              lives in src/styles/tw/chrome.css. */}
          <span className="[background-image:linear-gradient(100deg,var(--foreground)_0%,var(--foreground)_24%,var(--neutral-600)_40%,var(--neutral-300)_50%,var(--neutral-600)_60%,var(--foreground)_76%,var(--foreground)_100%)] [background-size:250%_100%] [background-position:130%_0] bg-clip-text text-transparent animate-chrome-shimmer motion-reduce:animate-none! motion-reduce:bg-none! motion-reduce:text-foreground!">
            {cta.invitationLink.label}
          </span>
        </a>
      </p>

      <Siteline />
    </section>
  )
}
