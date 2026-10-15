import { bookingTrigger, hero } from '../../content/home-page'
import { Sparkle } from '../icons'
import { HeroFolder } from './hero-folder'

export function Hero() {
  return (
    <section
      className="mx-auto flex min-h-svh w-full max-w-page-frame flex-col px-page-gutter pt-hero-top pb-3xl relative"
      id="top"
      aria-labelledby="hero-title"
    >
      {/* Row above 1200px, stacked below it — the frame's own break. The gap
          is `--spacing-hero-gap`, clamp(2xl, 5vw, 5xl), so it shrinks with the
          viewport rather than jumping between two fixed values. */}
      <div className="flex flex-1 flex-col items-start gap-4xl lg:flex-row lg:items-center lg:justify-between lg:gap-hero-gap">
        <div className="flex w-full min-w-0 max-w-none flex-1 flex-col self-stretch justify-between gap-xl lg:w-auto lg:max-w-hero">
          {/* BEYOND THE FRAME: 4.8vw lands on the frame's 92px at 1920 and
              scales down from there. */}
          <h1
            className="font-display text-display-hero font-bold [font-variation-settings:'wght'_700] tracking-snug leading-tight text-balance text-neutral-700"
            id="hero-title"
          >
            I help <span className="text-foreground">brands</span> build <span className="text-foreground">websites</span> worth visiting and <span className="text-foreground">apps</span> worth using.
          </h1>

          <div className="flex flex-col gap-xl">
            <div className="flex items-center pt-lg">
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

        {/* The folder column is `--spacing-hero-column`, min(--container-content,
            38%): a share of the row rather than a fixed width. */}
        <div className="flex w-full flex-none flex-col items-start self-stretch justify-end gap-2xs lg:w-hero-column lg:items-center">
          <HeroFolder caption={hero.objectCaption} />
          {/* Sparkle (src/components/icons.tsx) takes no className, so its
              13px size and colour are reached as a descendant variant on this
              caption instead of the `.hero__caption svg` rule they used to be. */}
          <p className="flex items-center gap-xs text-neutral-700 text-body font-normal leading-normal [&_svg]:size-icon-inline [&_svg]:shrink-0 [&_svg]:text-neutral-700">
            <Sparkle />
            {hero.objectCaption}
          </p>
        </div>
      </div>
    </section>
  )
}
