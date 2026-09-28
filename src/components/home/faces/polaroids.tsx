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
const FRAME_BASE = [
  // top is not 0: the card is 3:4 (133.3cqw tall at this width), and a
  // 76cqw print with its 3.5/3.5/11cqw padding runs to roughly 94cqw of its
  // own height, so anchoring it at the card's top edge would sit the pile
  // high and off-centre. Offsetting it down by half the difference puts the
  // resting print's centre on the card's.
  'tw:absolute tw:top-[19.7cqw] tw:left-1/2 tw:w-[76cqw] tw:flex tw:flex-col',
  'tw:pt-[3.5cqw] tw:px-[3.5cqw] tw:pb-[11cqw] tw:rounded-[1cqw]',
  // BEYOND THE FRAME: print stock white, deliberately independent of the
  // page's --background token — a photograph does not follow the site's
  // theme.
  'tw:bg-[#fff]',
  'tw:z-[calc(10_-_var(--depth,0))]',
  'tw:[box-shadow:0_0_0_1px_rgb(21_21_21/8%),0_2cqw_5cqw_rgb(21_21_21/12%)]',
  'tw:[transform:translate(-50%,0)_translate(var(--x,0cqw),var(--y,0cqw))_translate(var(--print-drag-x,0px),0)_rotate(calc(var(--r,0deg)_+_var(--print-drag-r,0deg)))_translateY(var(--lift,0cqw))_scale(var(--scale,1))]',
  'tw:transition-[transform,box-shadow] tw:duration-320 tw:ease-out-cubic tw:[transition-delay:0ms]',

  // Resting fan: alternating sides, growing outward, so it reads as dropped
  // rather than arranged. Open enough that the backs show as photographs
  // and not as a white edge, since at rest is how the card spends most of
  // its time.
  'tw:data-[depth=0]:[--i:0] tw:data-[depth=0]:[--r:1deg] tw:data-[depth=0]:[--x:0cqw] tw:data-[depth=0]:[--y:0cqw]',
  'tw:data-[depth=1]:[--i:1] tw:data-[depth=1]:[--r:9deg] tw:data-[depth=1]:[--x:13cqw] tw:data-[depth=1]:[--y:-2cqw]',
  'tw:data-[depth=2]:[--i:2] tw:data-[depth=2]:[--r:-11deg] tw:data-[depth=2]:[--x:-14cqw] tw:data-[depth=2]:[--y:-3cqw]',
  'tw:data-[depth=3]:[--i:3] tw:data-[depth=3]:[--r:-15deg] tw:data-[depth=3]:[--x:-19cqw] tw:data-[depth=3]:[--y:-4cqw]',
  'tw:data-[depth=4]:[--i:4] tw:data-[depth=4]:[--r:14deg] tw:data-[depth=4]:[--x:18cqw] tw:data-[depth=4]:[--y:-5cqw]',

  // Hover: the pile opens. Back prints swing further out; the top print
  // lifts toward the viewer instead of sliding sideways, and its shadow
  // goes with it. Staggered going out only — the return is one plain ease
  // together, so a cursor that keeps crossing the edge never reads as a
  // stutter.
  'tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&]:[transition-delay:calc(var(--i,0)*35ms)]',
  'tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&]:data-[depth=0]:[--lift:-2cqw]',
  'tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&]:data-[depth=0]:[--scale:1.05]',
  'tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&]:data-[depth=0]:[box-shadow:0_0_0_1px_rgb(21_21_21/8%),0_3cqw_7cqw_rgb(21_21_21/20%)]',
  'tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&]:data-[depth=1]:[--r:14deg] tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&]:data-[depth=1]:[--x:22cqw] tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&]:data-[depth=1]:[--y:-5cqw]',
  'tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&]:data-[depth=2]:[--r:-17deg] tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&]:data-[depth=2]:[--x:-24cqw] tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&]:data-[depth=2]:[--y:-6cqw]',
  'tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&]:data-[depth=3]:[--r:-22deg] tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&]:data-[depth=3]:[--x:-30cqw] tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&]:data-[depth=3]:[--y:-7cqw]',
  'tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&]:data-[depth=4]:[--r:20deg] tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&]:data-[depth=4]:[--x:28cqw] tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&]:data-[depth=4]:[--y:-8cqw]',

  // Beat one of the shuffle: the front print mid-air, carried on out to the
  // side it was dragged toward and up, rather than sitting in any fan slot.
  // All five transform terms are set, per the convention above, so nothing
  // is left for the hover lift rule to still be contributing underneath.
  // --side is ±1, written by this component from the drag direction.
  'tw:[&.is-leaving]:[--x:calc(var(--side,1)*52cqw)] tw:[&.is-leaving]:[--y:-10cqw] tw:[&.is-leaving]:[--r:calc(var(--side,1)*16deg)] tw:[&.is-leaving]:[--scale:1.02] tw:[&.is-leaving]:[--lift:0cqw]',
  'tw:[&.is-leaving]:[box-shadow:0_0_0_1px_rgb(21_21_21/8%),0_4cqw_9cqw_rgb(21_21_21/26%)]',
  // Ease-in-out rather than the fan's ease-out: a print picked off the top
  // of a pile gathers speed as it goes, and this leg hands straight over to
  // the slower ease back in — so the two read as one arc, out and round.
  'tw:[&.is-leaving]:[transition-timing-function:var(--ease-standard)] tw:[&.is-leaving]:[transition-delay:0ms]',
  'tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&.is-leaving]:[--x:calc(var(--side,1)*52cqw)] tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&.is-leaving]:[--y:-10cqw] tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&.is-leaving]:[--r:calc(var(--side,1)*16deg)] tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&.is-leaving]:[--scale:1.02] tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&.is-leaving]:[--lift:0cqw]',
  'tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&.is-leaving]:[box-shadow:0_0_0_1px_rgb(21_21_21/8%),0_4cqw_9cqw_rgb(21_21_21/26%)]',
  'tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&.is-leaving]:[transition-timing-function:var(--ease-standard)] tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&.is-leaving]:[transition-delay:0ms]',

  // Beat two: the same print, now the deepest and so already behind the
  // pile (its z-index changed with its depth, and z-index does not
  // transition). Only timing changes here — the slot's own --x/--y/--r come
  // from whichever data-depth rule now matches.
  'tw:[&.is-returning]:duration-560 tw:[&.is-returning]:[transition-delay:0ms]',
  'tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&.is-returning]:duration-560 tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&.is-returning]:[transition-delay:0ms]',

  // In hand: only the front print on the presented card — in the scatter a
  // press on the pile picks up the whole card, so there is nothing to
  // invite. Keyed off `.is-focused` alone, not `.folder__item.is-focused`:
  // an escaped `__` inside a Tailwind arbitrary selector is invisible to the
  // CSS parser (the whole rule is silently dropped, not just the escape), and
  // `.is-focused` is only ever the folder's own item class regardless.
  'tw:[.is-focused_.card[data-kind=polaroids]_&]:data-[depth=0]:cursor-grab',

  // The transform is written every frame by this component while a print is
  // in hand; a transition under that would trail the hand. Off the moment
  // it lands, back the moment the print is let go, so the settle — into
  // place or into the pile — eases.
  'tw:[&.is-dragging]:[transition:none] tw:[&.is-dragging]:cursor-grabbing tw:[&.is-dragging]:[box-shadow:0_0_0_1px_rgb(21_21_21/8%),0_4cqw_9cqw_rgb(21_21_21/26%)]',
  'tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&.is-dragging]:[transition:none] tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&.is-dragging]:cursor-grabbing tw:[.folder.is-open_.card[data-kind=polaroids]:hover_&.is-dragging]:[box-shadow:0_0_0_1px_rgb(21_21_21/8%),0_4cqw_9cqw_rgb(21_21_21/26%)]',

  // Reduced motion needs nothing of its own here: transitions are already
  // cut globally by the reduced-motion rule in styles.css, the resting fan
  // is open enough to read as a fan without a hover to animate into, and
  // the component itself skips beat one and rotates `order` on the spot
  // when the preference is set, so there is no travelling pose for
  // is-leaving/is-returning to ever produce.
].join(' ')

/** Which extra class, if any, a print's key currently carries — the two are
    mutually exclusive, since only one print is ever mid-riffle at a time. */
function frameClass(index: number, leaving: number | null, returning: number | null) {
  if (leaving === index) return `${FRAME_BASE} is-leaving`
  if (returning === index) return `${FRAME_BASE} is-returning`
  return FRAME_BASE
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
 * 0 for the front — and FRAME_BASE above keys position, rotation and z-index
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
 *   beat one   the front print's key goes into `leaving`. FRAME_BASE reads
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
      className="tw:absolute tw:inset-0 tw:[.card:has(&)]:overflow-visible! tw:[.card:has(&)]:bg-transparent! tw:[.card:has(&)]:shadow-none!"
      ref={rootRef}
      onClick={onClick}
    >
      <span className="tw:absolute tw:inset-0">
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
                className="tw:block tw:w-full tw:aspect-square tw:object-cover"
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                draggable={false}
              />
              {photo.caption ? (
                /* Sits in the thick bottom margin a real instant print has,
                   left-aligned like something written there by hand. */
                <span className="tw:mt-[2cqw] tw:font-sans tw:text-[3.6cqw] tw:text-[#616161] tw:text-left">
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
