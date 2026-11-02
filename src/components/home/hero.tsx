import { bookingTrigger, hero } from '../../content/home-page'
import { HOME_FIELD_SETTINGS, homeFieldImages } from '../../content/home-field'
import { InfiniteField } from '../infinite-field'

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
        <div className="relative z-10 flex w-full min-w-0 max-w-none flex-1 flex-col self-stretch gap-xl lg:w-auto lg:max-w-hero">
          {/* BEYOND THE FRAME: 4.8vw lands on the frame's 92px at 1920 and
              scales down from there. */}
          <h1
            className="font-display text-display-hero font-normal tracking-snug leading-tight text-balance text-neutral-600"
            id="hero-title"
          >
            I help <span className="text-foreground">brands</span> build <span className="text-foreground">websites</span> worth visiting and <span className="text-foreground">apps</span> worth using.
          </h1>

          <div className="flex flex-col gap-xl">
            <div className="flex items-center pt-lg">
              {/* No trailing arrow — the frame dropped it. The href is the
                  booking page; `bookingTrigger` is what opens it in the site's
                  own dialog instead. */}
              {/* The shared primary-button treatment also used for "Read
                  article" on the writing page. */}
              <a className="chip chip-cta" href={hero.cta.href} {...bookingTrigger}>
                {hero.cta.label}
              </a>
            </div>
          </div>
        </div>

        {/* Keep the field in the same flow on smaller screens. On desktop its
            column anchors a larger absolute canvas without squeezing the copy. */}
        <div className="flex w-full min-w-0 flex-none items-center self-stretch justify-center lg:relative lg:w-hero-column">
          <div className="relative aspect-square w-full max-w-content lg:absolute lg:top-[calc(50%_-_var(--spacing-lg))] lg:-right-lg lg:w-[min(48vw,calc(100svh_-_var(--spacing-5xl)),var(--container-hero))] lg:max-w-none lg:-translate-y-1/2">
            <div className="absolute inset-0">
              <InfiniteField
                images={homeFieldImages}
                settings={HOME_FIELD_SETTINGS}
                label="Selected projects. Drag to explore, or use arrow keys. Tab to a project to open its case study."
                imagesLabel="Project case studies"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
