import { statement } from '../../content/home-page'

/**
 * The standalone statement between the hero and the work list. One paragraph at
 * display size, set to the work column so it lines up with the rows below it.
 */
export function Statement() {
  return (
    <section className="container tw:flex tw:flex-col tw:items-center tw:py-section-y" id="about">
      {/* BEYOND THE FRAME: 1.67vw lands on the frame's 32px at 1920. */}
      <p className="tw:w-full tw:max-w-work tw:font-display tw:text-[clamp(1.25rem,1.67vw,2rem)] tw:font-normal tw:tracking-snug tw:leading-normal tw:text-pretty">
        {statement.body}
      </p>
    </section>
  )
}
