import { bookingTrigger, hero } from '../../content/home-page'
import { Sparkle } from '../icons'
import { HeroFolder } from './hero-folder'

export function Hero() {
  return (
    <section className="hero container" id="top" aria-labelledby="hero-title">
      <div className="hero__body">
        <div className="hero__copy">
          <h1 className="hero__title" id="hero-title">
            I help <span>brands</span> build <span>websites</span> worth visiting and <span>apps</span> worth using.
          </h1>

          <div className="hero__lower">
            <p className="hero__standfirst">{hero.standfirst}</p>
            <div className="hero__actions">
              {/* No trailing arrow — the frame dropped it. The href is the
                  booking page; `bookingTrigger` is what opens it in a modal
                  instead. */}
              <a className="chip hero__cta" href={hero.cta.href} {...bookingTrigger}>
                {hero.cta.label}
              </a>
            </div>
          </div>
        </div>

        <div className="hero__object">
          <HeroFolder caption={hero.objectCaption} />
          <p className="hero__caption">
            <Sparkle />
            {hero.objectCaption}
          </p>
        </div>
      </div>
    </section>
  )
}
