import { hero } from '../../content/home-page'
import { Sparkle } from '../icons'
import { PhotoFolder } from './photo-folder'

export function Hero() {
  return (
    <section className="hp-hero hp-container" id="top" aria-labelledby="hp-hero-title">
      <div className="hp-hero__body">
        <div className="hp-hero__copy">
          <h1 className="hp-hero__title" id="hp-hero-title">
            {hero.title}
          </h1>

          <div className="hp-hero__lower">
            <p className="hp-hero__standfirst">{hero.standfirst}</p>
            <div className="hp-hero__actions">
              {/* No trailing arrow — the frame dropped it. */}
              <a className="hp-chip hp-hero__cta" href={hero.cta.href}>
                {hero.cta.label}
              </a>
            </div>
          </div>
        </div>

        <div className="hp-hero__object">
          <PhotoFolder caption={hero.objectCaption} />
          <p className="hp-hero__caption">
            <Sparkle />
            {hero.objectCaption}
          </p>
        </div>
      </div>
    </section>
  )
}
