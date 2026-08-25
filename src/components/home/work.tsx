import { work } from '../../content/home-page'

export function Work() {
  return (
    <section className="work container" id="work" aria-label="Selected work">
      <div className="work__list">
        {work.map((entry) => (
          <article className="work__item" key={entry.slug}>
            <div className="work__tiles">
              {entry.tiles.map((tile, index) => (
                <div className="work__tile" key={`${entry.slug}-${index}`}>
                  {tile.src ? <img src={tile.src} alt={tile.alt ?? ''} /> : null}
                </div>
              ))}
            </div>

            <div className="work__meta">
              <h2 className="work__title">
                <a href={entry.href}>{entry.title}</a>
              </h2>
              <p className="work__description">{entry.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
