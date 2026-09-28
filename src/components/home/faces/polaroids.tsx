import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { PolaroidsItem } from '../../../content/home-page'

/** Slack on each beat's timer, so the class driving it outlasts the
    transition rather than cutting the tail off — see hero-folder.tsx's own
    RETURN_GRACE_MS, which this mirrors. */
const RIFFLE_GRACE_MS = 60

/**
 * How long one beat of the riffle takes, read off the same token the
 * stylesheet transitions on so the timer and the CSS cannot drift apart.
 * Read rather than waited on, and for the same reason hero-folder.tsx reads
 * --duration-slow instead of listening for the transition to end: in the
 * frame the class lands in, the transition it would drive does not exist
 * yet, so there is nothing a getAnimations()/transitionend approach could
 * find or wait on.
 */
function stageDuration(element: HTMLElement | null, token: string, fallback: number) {
  const declared = element ? parseFloat(getComputedStyle(element).getPropertyValue(token)) : NaN
  return (Number.isFinite(declared) ? declared : fallback) + RIFFLE_GRACE_MS
}

/**
 * The utilities for one print. Position, rotation and paint order all key off
 * `data-depth` — 0 for the front, counting back — via the `data-[depth=…]`
 * variant below; the component writes and rewrites the attribute as the
 * riffle turns the pile over, and the DOM order itself never changes (see the
 * component's own note on why). `is-leaving` / `is-returning` are matched with
 * `[&.is-leaving]` / `[&.is-returning]`, kept exactly as the names the riffle
 * timer above adds and removes; `is-dragging` the same, added and removed
 * imperatively while the front print is in hand.
 *
 * Every state below writes the same five transform terms and the shadow —
 * scale and lift default to 1 and 0, the drag pair to 0 — so nothing ever
 * changes the shape of the transform, only the values inside it.
 * --print-drag-x / --print-drag-r are written by this component while the
 * front print is in hand on the presented card, and cleared the moment it is
 * let go. Not --drag-*: hero-folder.tsx writes those on the card itself while
 * the whole card is dragged, and custom properties inherit — sharing the
 * name, every print took the card's drag a second time and flew off ahead of
 * it.
 *
 * The two-context duplication below (bare, and again under
 * `.folder.is-open .card[data-kind=polaroids]:hover`) is the fan's own: the
 * hover rules are the ones actually in the running whenever a shuffle can
 * fire, since the pointer is always over the card when it does, and each pair
 * is written at matching specificity so the tie always resolves to whichever
 * is written last, regardless of which context is live.
 */
/** Which transient state, if any, a print currently carries. */
function frameClass(index: number, leaving: number | null, returning: number | null) {
  if (leaving === index) return 'polaroid-frame is-leaving'
  if (returning === index) return 'polaroid-frame is-returning'
  return 'polaroid-frame'
}

/** How far a print has to be dragged, as a share of its own width, before
    letting go sends it to the back rather than back where it was. */
const SHUFFLE_THRESHOLD = 0.22

/** Degrees of lean per local px of drag: a print pushed sideways turns a
    little in the direction it is going, as one slid across a desk does. */
const DRAG_LEAN = 0.06

/** A press that moves less than this is a click, and the folder's own click
    handler gets it. In screen px. */
const DRAG_SLOP = 4

/**
 * One print in hand. Drag distances are converted to the card's own px — the
 * card sits inside a scaled ancestor while it is presented, so a screen px is
 * not a local px — using the ratio measured at the moment of the press.
 */
type Drag = {
  pointerId: number
  originX: number
  scale: number
  dx: number
  moved: boolean
}

/**
 * A little stack of instant photos, fanned like they landed on a desk.
 *
 * The DOM order never changes. Each print is rendered in the order the photos
 * are listed and told how deep in the pile it currently sits — `data-depth`,
 * 0 for the front — and polaroid-frame keys position, rotation and z-index
 * off that. `order` is only the bookkeeping behind the depth.
 *
 * It used to be simpler: reorder the array, let sibling order do the
 * stacking. That is what made the riffle jump. Moving one keyed child to the
 * front makes React re-insert every child after it, and a node that has just
 * been re-inserted has no style to transition from — so the two prints that
 * were meant to ease one slot forward snapped there instead, while the one
 * actually travelling eased. With the DOM left alone only attributes change,
 * and every print keeps its transition.
 *
 * Two levels of life, the same split every face in the folder makes. Hovered
 * in the scatter the fan opens, and that is all — the utilities above do it,
 * and nothing here runs. Presented in the middle, the front print can be
 * picked up and slid to either side: let go past SHUFFLE_THRESHOLD it goes to
 * the back of the pile on that side, short of it it settles back where it
 * was.
 *
 * The shuffle itself is two beats rather than a jump, so the print is seen to
 * travel rather than teleport:
 *
 *   beat one   the front print's key goes into `leaving`. polaroid-frame reads
 *              that as `is-leaving` and gives it a transform that carries it
 *              on out to the side it was dragged toward — `--side` says which
 *              — over --duration-base, from wherever the hand let go of it.
 *   beat two   timed off that same --duration-base, read live rather than
 *              hard-coded so the timer can never drift from the CSS: `order`
 *              rotates so the print's depth becomes the deepest, and
 *              `leaving` clears in the same update. Its z-index drops at once
 *              — that is the moment it goes behind the pile — and because a
 *              transition starts from whatever the element's transform
 *              currently computes to, it eases straight from its slid-out
 *              pose into the back slot's rather than snapping through the
 *              middle. `returning` gives it --duration-slow for that leg, so
 *              the settle reads slower than the departure; the prints
 *              shifting forward by one slot around it keep the plain
 *              --duration-base transition they already had.
 *
 * A shuffle already in flight ignores the next press rather than queuing it.
 * Reduced motion skips beat one and rotates `order` on the spot: nothing here
 * animates a class for its own sake, so with the global 1ms transition rule
 * already in force there is nothing left to shorten.
 *
 * The drag lives entirely inside the presented card, where the folder has
 * already stepped back — its own pointer handlers return early for the card
 * being looked at, which is what makes it safe to take pointer capture here.
 * The one thing it still does is turn the click after a press into a zoom
 * out, so a press that became a drag stops that click on the way up.
 */
export function PolaroidsFace({ item, presented = false }: { item: PolaroidsItem; presented?: boolean }) {
  const [order, setOrder] = useState<number[]>(() => item.photos.map((_, index) => index))
  const [leaving, setLeaving] = useState<number | null>(null)
  const [returning, setReturning] = useState<number | null>(null)
  const rootRef = useRef<HTMLSpanElement>(null)
  const busyRef = useRef(false)
  const dragRef = useRef<Drag | null>(null)
  const suppressClick = useRef(false)
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(
    () => () => {
      timeouts.current.forEach((id) => clearTimeout(id))
    },
    [],
  )

  /** Send the front print to the back, leaving by the side given. */
  const shuffle = useCallback(
    (side: 1 | -1) => {
      if (order.length < 2 || busyRef.current) return

      const front = order[order.length - 1]
      const toBack = (current: number[]) => [front, ...current.slice(0, -1)]

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setOrder(toBack)
        return
      }

      busyRef.current = true
      rootRef.current?.style.setProperty('--side', String(side))
      setLeaving(front)

      const departure = setTimeout(() => {
        setOrder(toBack)
        setLeaving(null)
        setReturning(front)

        const settle = setTimeout(() => {
          setReturning(null)
          busyRef.current = false
        }, stageDuration(rootRef.current, '--duration-slow', 560))
        timeouts.current.push(settle)
      }, stageDuration(rootRef.current, '--duration-base', 320))
      timeouts.current.push(departure)
    },
    [order],
  )

  /* Write where the hand has the print, for the transform above. */
  const paint = (element: HTMLElement, dx: number) => {
    element.style.setProperty('--print-drag-x', `${dx.toFixed(2)}px`)
    element.style.setProperty('--print-drag-r', `${(dx * DRAG_LEAN).toFixed(2)}deg`)
  }

  const clear = (element: HTMLElement) => {
    element.style.removeProperty('--print-drag-x')
    element.style.removeProperty('--print-drag-r')
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!presented || busyRef.current || event.button !== 0) return

    const element = event.currentTarget
    /* Local px per screen px: the presented card is scaled up by the folder,
       and offsetWidth is the unscaled width the drag is written in. */
    const scale = element.offsetWidth > 0 ? element.getBoundingClientRect().width / element.offsetWidth : 1

    dragRef.current = { pointerId: event.pointerId, originX: event.clientX, scale, dx: 0, moved: false }
    element.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const element = event.currentTarget
    const screenDx = event.clientX - drag.originX

    if (!drag.moved) {
      if (Math.abs(screenDx) < DRAG_SLOP) return
      /* Class and offset land in the same frame: the class is what turns the
         transition off, so the print snaps to under the hand rather than
         easing after it. */
      drag.moved = true
      element.classList.add('is-dragging')
    }

    drag.dx = screenDx / drag.scale
    paint(element, drag.dx)
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const element = event.currentTarget
    dragRef.current = null
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)

    /* Never moved: a click, and the folder's zoom-out takes it from here. */
    if (!drag.moved) return

    suppressClick.current = true
    /* Off in the same frame the drag values go, so the transition back on
       starts from where the print was let go — into the back of the pile if
       it was carried far enough, back into place if not. */
    element.classList.remove('is-dragging')
    clear(element)

    if (Math.abs(drag.dx) > element.offsetWidth * SHUFFLE_THRESHOLD) shuffle(drag.dx > 0 ? 1 : -1)
  }

  const onClick = (event: ReactMouseEvent<HTMLSpanElement>) => {
    /* The click that ends a drag is not a click on the card. */
    if (!suppressClick.current) return
    suppressClick.current = false
    event.stopPropagation()
  }

  const front = order[order.length - 1]

  return (
    /* The prints carry their own frames and shadows and fan past the card's
       edge, so the card drops its own frame and clipping — in every state,
       focused and held included — set from here as the dock and the phone
       do. */
    <span
      className="absolute inset-0 [.card:has(&)]:overflow-visible! [.card:has(&)]:bg-transparent! [.card:has(&)]:shadow-none!"
      ref={rootRef}
      onClick={onClick}
    >
      <span className="absolute inset-0">
        {item.photos.map((photo, index) => {
          /* 0 is the front of the pile. */
          const depth = order.length - 1 - order.indexOf(index)
          const inHand = presented && index === front
          return (
            <span
              className={frameClass(index, leaving, returning)}
              key={index}
              data-depth={depth}
              style={{ '--depth': depth } as CSSProperties}
              onPointerDown={inHand ? onPointerDown : undefined}
              onPointerMove={inHand ? onPointerMove : undefined}
              onPointerUp={inHand ? onPointerUp : undefined}
              onPointerCancel={inHand ? onPointerUp : undefined}
            >
              <img
                className="block w-full aspect-square object-cover"
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                draggable={false}
              />
              {photo.caption ? (
                /* Sits in the thick bottom margin a real instant print has,
                   left-aligned like something written there by hand. */
                <span className="mt-[2cqw] font-sans text-[3.6cqw] text-[#616161] text-left">
                  {photo.caption}
                </span>
              ) : null}
            </span>
          )
        })}
      </span>
    </span>
  )
}
