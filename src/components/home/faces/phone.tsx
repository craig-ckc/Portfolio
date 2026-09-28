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
    <span
      /* A cutout of the phone on a transparent card, with its Glyph lights
         as the hover life. The card's own frame is handed back — the object
         is the phone, not a card with a phone on it — cancelled from here
         with a :has() variant rather than by editing the folder agent's
         home/folder.css (that only wins once the folder area's own
         migration moves its .card declarations into the same layer — see
         the report). The cutout's own shadow lives on this group, on a
         filter rather than a box-shadow, so the lit layer fading in over
         the plain one never doubles it.

         Sized by height: the card is 3:4 (133.3cqw tall) and each render is
         1:2, so 118cqw tall is 59cqw wide (set on the images below). In the
         folder and the scatter the phone is shown a size up
         (--phone-scale) so it holds its own among the cards; presented, it
         eases back to the plain size — a transform rather than a height, so
         the two moves run together on the compositor. */
      className="tw:absolute tw:inset-0 tw:block tw:[--phone-scale:1.15] tw:[filter:drop-shadow(0_1.5cqw_3cqw_rgb(21_21_21/22%))_drop-shadow(0_0.5cqw_1cqw_rgb(21_21_21/12%))] tw:[transition:filter_var(--duration-base)_var(--ease-out-cubic)] tw:[.folder\_\_item.is-focused_.card_&]:[--phone-scale:1] tw:[.folder.is-open_.card:hover_&]:[filter:drop-shadow(0_2.5cqw_5cqw_rgb(21_21_21/26%))_drop-shadow(0_0.5cqw_1cqw_rgb(21_21_21/12%))] tw:[.folder.is-open_.folder\_\_item.is-focused_.card_&]:[filter:drop-shadow(0_2.5cqw_5cqw_rgb(21_21_21/26%))_drop-shadow(0_0.5cqw_1cqw_rgb(21_21_21/12%))] tw:[.card:has(&)]:bg-transparent! tw:[.card:has(&)]:shadow-none! tw:[.card:has(&)]:overflow-visible!"
      data-presented={presented || undefined}
    >
      <img
        className="tw:absolute tw:top-1/2 tw:left-1/2 tw:w-auto tw:h-[118cqw] tw:[transform:translate(-50%,-50%)_scale(var(--phone-scale))] tw:[transition:transform_var(--duration-slow)_var(--ease-out-cubic)]"
        src={item.src}
        alt={item.alt}
        loading="lazy"
        draggable={false}
      />
      <img
        /* The lights: off at rest, on while the pointer is over the card or
           the card is presented. A quick rise and a slower fall, the way a
           real light reads. Note the transition here is opacity only — the
           shared transform transition above is overwritten rather than
           merged, so this layer's scale change is never eased, only the
           plain one's is; that asymmetry is existing behaviour, kept as
           found. */
        className="tw:absolute tw:top-1/2 tw:left-1/2 tw:w-auto tw:h-[118cqw] tw:[transform:translate(-50%,-50%)_scale(var(--phone-scale))] tw:opacity-0 tw:[transition:opacity_var(--duration-slow)_var(--ease-standard)] tw:[.folder.is-open_.card:hover_&]:opacity-100 tw:[.folder.is-open_.card:hover_&]:[transition-duration:var(--duration-fast)] tw:[.folder.is-open_.folder\_\_item.is-focused_.card_&]:opacity-100 tw:[.folder.is-open_.folder\_\_item.is-focused_.card_&]:[transition-duration:var(--duration-fast)]"
        src={item.lit}
        alt=""
        loading="lazy"
        draggable={false}
        aria-hidden="true"
      />
    </span>
  )
}
