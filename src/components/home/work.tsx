import { work, workPath } from '../../content/work'

export function Work() {
  return (
    <section className="container tw:py-section-py" id="work" aria-label="Selected work">
      <div className="tw:flex tw:max-w-work tw:flex-col tw:mx-auto tw:gap-section-y">
        {work.map((entry) => (
          <article className="tw:flex tw:flex-col tw:gap-md" key={entry.slug}>
            {/* One link around the whole row rather than one on the title: the
                tiles are the reason anybody clicks a portfolio row, and two
                links to the same page would have a screen reader announce the
                project twice on the way past it.

                `tw:group` here (not on the article) so both the tile zoom and
                the title underline below key off the same hover/focus target:
                the row's single link. */}
            <a className="tw:group tw:flex tw:flex-col tw:gap-md" href={workPath(entry.slug)}>
              <div className="tw:grid tw:grid-cols-1 tw:gap-md tw:md:grid-cols-2">
                {entry.tiles.map((tile, index) => (
                  <div
                    className="tw:relative tw:h-auto tw:aspect-[542/320] tw:overflow-hidden tw:rounded-md tw:bg-neutral-600 tw:md:h-[320px] tw:md:aspect-auto"
                    key={`${entry.slug}-${index}`}
                  >
                    {tile.src ? (
                      <img
                        className="tw:block tw:h-full tw:w-full tw:object-cover tw:transition-transform tw:duration-760 tw:ease-out-quart tw:will-change-transform tw:group-hover:scale-[1.03]"
                        src={tile.src}
                        alt={tile.alt ?? ''}
                      />
                    ) : null}
                    {/* Kept on its own compositor layer at rest as well as
                        mid-zoom (`will-change-transform`, above). Otherwise
                        the browser promotes it for the transition and drops it
                        back to ordinary painting when the transition ends,
                        re-snapping it to whole pixels — the slight jump seen
                        as the zoom settles back out. */}
                  </div>
                ))}
              </div>

              <div className="tw:flex tw:flex-col tw:gap-3xs">
                <h2 className="tw:font-display tw:text-base tw:font-semibold tw:[font-variation-settings:'wght'_600] tw:tracking-snug tw:leading-tight tw:underline tw:decoration-transparent tw:decoration-1 tw:underline-offset-[3px] tw:transition-[text-decoration-color] tw:duration-320 tw:ease-out-cubic tw:group-hover:decoration-current tw:group-focus-visible:decoration-current">
                  {entry.title}
                </h2>
                <p className="tw:max-w-[56ch] tw:text-pretty tw:text-neutral-700 tw:font-display tw:text-body tw:tracking-snug tw:leading-normal">
                  {entry.description}
                </p>
              </div>
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}
