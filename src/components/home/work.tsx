import { work, workPath } from '../../content/work'

export function Work() {
  return (
    <section className="mx-auto w-full max-w-page-frame px-page-gutter py-section-py" id="work" aria-label="Selected work">
      <div className="flex max-w-work flex-col mx-auto gap-section-y">
        {work.map((entry) => (
          <article className="flex flex-col gap-md" key={entry.slug}>
            {/* One link around the whole row rather than one on the title: the
                tiles are the reason anybody clicks a portfolio row, and two
                links to the same page would have a screen reader announce the
                project twice on the way past it.

                `group` on the link lets the tiles zoom when the whole
                project row is hovered. */}
            <a className="group flex flex-col gap-md" href={workPath(entry.slug)}>
              <div className="grid grid-cols-1 gap-md md:grid-cols-2">
                {entry.tiles.map((tile, index) => (
                  <div
                    className={`relative h-auto aspect-work-image overflow-hidden rounded-md bg-neutral-600 md:h-80 md:aspect-auto ${index > 0 ? 'hidden md:block' : ''}`}
                    key={`${entry.slug}-${index}`}
                    data-transition-key={index === 0 ? `work-${entry.slug}` : undefined}
                    data-transition-role={index === 0 ? 'thumbnail' : undefined}
                    data-transition-source={index === 0 ? `work-${entry.slug}-home` : undefined}
                    data-transition-frame={index === 0 ? '' : undefined}
                  >
                    {tile.src ? (
                      <img
                        className="block h-full w-full object-cover transition-transform duration-760 ease-out-quart will-change-transform group-hover:scale-103"
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

              <div className="flex flex-col gap-3xs">
                <h2 className="font-display text-base font-semibold [font-variation-settings:'wght'_600] tracking-snug leading-tight">
                  {entry.title}
                </h2>
                <p className="max-w-copy text-pretty text-neutral-700 font-display text-body tracking-snug leading-normal">
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
