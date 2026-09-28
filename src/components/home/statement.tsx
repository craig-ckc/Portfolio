import { statement } from '../../content/home-page'

/**
 * The standalone statement between the hero and the work list. One paragraph at
 * display size, set to the work column so it lines up with the rows below it.
 */
export function Statement() {
  return (
    <section className="mx-auto flex w-full max-w-[calc(var(--container-page)+var(--spacing-page-gutter)*2)] flex-col items-center px-page-gutter py-section-y" id="about">
      {/* BEYOND THE FRAME: 1.67vw lands on the frame's 32px at 1920. */}
      <p className="w-full max-w-work font-display text-[clamp(1.25rem,1.67vw,2rem)] font-normal tracking-snug leading-normal text-pretty">
        {statement.body}
      </p>
    </section>
  )
}
