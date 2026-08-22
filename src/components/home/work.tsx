import { work } from '../../content/home-page'

export function Work() {
  return (
    <section className="hp-work hp-container" id="work" aria-label="Selected work">
      <div className="hp-work__list">
        {work.map((entry) => (
          <article className="hp-work__item" key={entry.slug}>
            <div className="hp-work__tiles">
              {entry.tiles.map((tile, index) => (
                <div className="hp-work__tile" key={`${entry.slug}-${index}`}>
                  {tile.src ? <img src={tile.src} alt={tile.alt ?? ''} /> : null}
                </div>
              ))}
            </div>

            <div className="hp-work__meta">
              <h2 className="hp-work__title">
                <a href={entry.href}>{entry.title}</a>
              </h2>
              <p className="hp-work__description">{entry.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
