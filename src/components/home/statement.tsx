import { statement } from '../../content/home-page'

/**
 * The standalone statement between the hero and the work list. One paragraph at
 * display size, set to the work column so it lines up with the rows below it.
 */
export function Statement() {
  return (
    <section className="statement container" id="about">
      <p className="statement__text">{statement.body}</p>
    </section>
  )
}
