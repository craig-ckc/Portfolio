import { bookingTrigger, hero } from '../../content/home-page'
import { Sparkle } from '../icons'
import { HeroFolder } from './hero-folder'

export function Hero() {
  return (
    <section
      className="container tw:relative tw:flex tw:min-h-[100svh] tw:flex-col tw:pt-hero-top tw:pb-3xl"
      id="top"
      aria-labelledby="hero-title"
    >
      {/* Row above 1200px, stacked below it — the frame's own break. BEYOND THE
          FRAME: the gap has no token: clamp(2xl, 5vw, 5xl) so it shrinks with
          the viewport rather than jumping between two fixed values. */}
      <div className="tw:flex tw:flex-1 tw:flex-col tw:items-start tw:gap-4xl tw:lg:flex-row tw:lg:items-center tw:lg:justify-between tw:lg:gap-[clamp(var(--spacing-2xl),5vw,var(--spacing-5xl))]">
        <div className="tw:flex tw:w-full tw:min-w-0 tw:max-w-none tw:flex-1 tw:flex-col tw:self-stretch tw:justify-between tw:gap-xl tw:lg:w-auto tw:lg:max-w-hero">
          {/* BEYOND THE FRAME: 4.8vw lands on the frame's 92px at 1920 and
              scales down from there. */}
          <h1
            className="tw:font-display tw:text-[clamp(2.5rem,4.8vw,5.75rem)] tw:font-bold tw:[font-variation-settings:'wght'_700] tw:tracking-snug tw:leading-tight tw:text-balance tw:text-neutral-700"
            id="hero-title"
          >
            I help <span className="tw:text-foreground">brands</span> build <span className="tw:text-foreground">websites</span> worth visiting and <span className="tw:text-foreground">apps</span> worth using.
          </h1>

          <div className="tw:flex tw:flex-col tw:gap-xl">
            <div className="tw:flex tw:items-center tw:pt-lg">
              {/* No trailing arrow — the frame dropped it. The href is the
                  booking page; `bookingTrigger` is what opens it in the site's
                  own dialog instead. */}
              {/* `.chip .chip-cta`, the shared primary-button component in
                  src/styles.css: the writing page's "Read article" and the
                  article share row's copy link are the same button. */}
              <a className="chip chip-cta" href={hero.cta.href} {...bookingTrigger}>
                {hero.cta.label}
              </a>
            </div>
          </div>
        </div>

        {/* BEYOND THE FRAME: width is min(--container-content, 38%), a share
            of the row rather than a token width. */}
        <div className="tw:flex tw:w-full tw:flex-none tw:flex-col tw:items-start tw:self-stretch tw:justify-end tw:gap-2xs tw:lg:w-[min(var(--container-content),38%)] tw:lg:items-center">
          <HeroFolder caption={hero.objectCaption} />
          {/* Sparkle (src/components/icons.tsx) takes no className, so its
              13px size and colour are reached as a descendant variant on this
              caption instead of the `.hero__caption svg` rule they used to be. */}
          <p className="tw:flex tw:items-center tw:gap-xs tw:text-neutral-700 tw:text-body tw:font-normal tw:leading-normal tw:[&_svg]:size-[13px] tw:[&_svg]:shrink-0 tw:[&_svg]:text-neutral-700">
            <Sparkle />
            {hero.objectCaption}
          </p>
        </div>
      </div>
    </section>
  )
}
