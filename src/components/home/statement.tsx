import { statement } from '../../content/home-page'

/**
 * The standalone statement between the hero and the work list. Paragraphs at
 * display size, set to the work column so it lines up with the rows below it.
 */
export function Statement() {
  return (
    <section className="mx-auto flex w-full max-w-page-frame flex-col items-center px-page-gutter py-section-y" id="about">
      {/* BEYOND THE FRAME: 1.67vw lands on the frame's 32px at 1920. */}
      <div className="w-full max-w-work space-y-lg font-display text-display-statement font-normal tracking-snug leading-normal text-pretty">
        {statement.body.split('\n\n').map((paragraph) => (
          <p key={paragraph}>
            {paragraph.split(/(\*\*[^*]+\*\*)/g).map((part, index) => (
              part.startsWith('**')
                ? <strong className="font-bold [font-variation-settings:'wght'_700]" key={index}>{part.slice(2, -2)}</strong>
                : part
            ))}
          </p>
        ))}
      </div>
    </section>
  )
}
