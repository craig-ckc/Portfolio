import { work, workPath } from '../../content/work'

export function Work() {
  return (
    <section className="work container" id="work" aria-label="Selected work">
      <div className="work__list">
        {work.map((entry) => (
          <article className="work__item" key={entry.slug}>
            {/* One link around the whole row rather than one on the title: the
                tiles are the reason anybody clicks a portfolio row, and two
                links to the same page would have a screen reader announce the
                project twice on the way past it. */}
            <a className="work__link" href={workPath(entry.slug)}>
              <div className="work__tiles">
                {entry.tiles.map((tile, index) => (
                  <div className="work__tile" key={`${entry.slug}-${index}`}>
                    {tile.src ? <img src={tile.src} alt={tile.alt ?? ''} /> : null}
                  </div>
                ))}
              </div>

              <div className="work__meta">
                <h2 className="work__title">{entry.title}</h2>
                <p className="work__description">{entry.description}</p>
              </div>
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}
