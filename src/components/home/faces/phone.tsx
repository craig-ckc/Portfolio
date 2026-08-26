import type { PhoneItem } from '../../../content/home-page'

/**
 * The phone the weekend photos are taken on, lying face down so the back —
 * the interesting side — is what shows. Two renders of it, framed alike: the
 * plain back, and the same back with the Glyph lights on. The lit one sits
 * over the other at zero opacity and fades up, which is the whole hover life:
 * the lights come on when the pointer arrives, and stay on while the card is
 * the one being looked at. Nothing to read at any size, so nothing is gated
 * behind the click — a light coming on is a gesture, not a label.
 *
 * `presented` is the folder saying this is the card in the middle. phone.css
 * keys the lit state off the folder's own .is-focused class, so the prop is
 * carried only for symmetry with the other faces and any future use.
 */
export function PhoneFace({ item, presented = false }: { item: PhoneItem; presented?: boolean }) {
  return (
    <span className="phone" data-presented={presented || undefined}>
      <img className="phone__back" src={item.src} alt={item.alt} loading="lazy" draggable={false} />
      <img className="phone__lit" src={item.lit} alt="" loading="lazy" draggable={false} aria-hidden="true" />
    </span>
  )
}
