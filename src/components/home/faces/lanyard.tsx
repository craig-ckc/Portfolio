import { useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import type { LanyardItem } from '../../../content/home-page'

/**
 * Bar widths for the badge's barcode, in cqw. A fixed pattern rather than one
 * rolled at render time: Math.random() in render would mismatch between the
 * server markup and the client's first paint, and a prop this decorative does
 * not need a real barcode algorithm behind it — just something that reads as
 * one. 40 bars, the number the brief calls for.
 */
const BARCODE_WIDTHS = [
  2, 1, 3, 1, 2, 4, 1, 1, 3, 2, 1, 4, 2, 1, 1, 3, 2, 1, 4, 1, 2, 3, 1, 1, 4, 2, 1, 3, 1, 2, 1, 4, 1, 1, 2, 3, 1, 1, 4,
  2,
]
const BARCODE_GAP = 1.2
const BARCODE_HEIGHT = 24

/**
 * The badge's pose: where the light is over the card, 0 to 1 either way, and
 * how much of the effect is drawn at all. Flat and unlit is lx/ly centred and
 * on at nothing.
 */
type Pose = { lx: number; ly: number; on: number }

const REST: Pose = { lx: 0.5, ly: 0.5, on: 0 }
const KEYS = ['lx', 'ly', 'on'] as const

/** How much of the way to the target one frame at 60Hz travels. */
const FOLLOW = 0.18
/** Closer than this and the pose has arrived, so the loop can stop. */
const SETTLED = 0.002
/** A frame longer than this was a stall — a tab coming back, a long task —
    and easing across the whole of it would jump. */
const MAX_FRAME_MS = 64

/** A press that travels further than this is a turn, not a tap, and the click
    it produces is not the click that puts the card back. In screen px. */
const TURN_SLOP = 4

/**
 * Utilities for the badge frame and its pose. The card box (`.card[data-kind='lanyard']`)
 * belongs to the folder — hero-folder.tsx renders it — so its own frame is
 * turned off from here rather than there: the `.card:has(&)` overrides below
 * are how, since there is no element of this face's own to hang a class on
 * the card itself.
 *
 * --k, the pose defaults, and the two contexts that redrive them (scatter and
 * presented) are set as arbitrary-property utilities on the root span so the
 * calculation and its custom properties sit next to the markup they animate,
 * the way the stylesheet used to keep them next to the selector. BEYOND THE
 * FRAME: none of this is a token — it is the physics of the tilt itself.
 */
const ROOT_CLASS = [
  // Fills the card; leans out of it, so nothing here is clipped.
  'absolute inset-0 [perspective:300cqw]',
  // The badge draws its own frame, so the card it sits in drops its own —
  // including the deeper shadow the folder gives a focused or held card —
  // and stops clipping, since the badge leans past its edge. Set on the card
  // from here, the same way the dock and the phone do it; !important because
  // the folder's own card utilities would otherwise tie with these.
  '[.card:has(&)]:overflow-visible! [.card:has(&)]:bg-transparent! [.card:has(&)]:shadow-none!',
  // --k: how much bigger than its own layout the folder is showing this
  // card — read back from the same magnification hero-folder.tsx's own
  // transform utilities apply, so the badge below can undo it on itself
  // (see BADGE_CLASS's comment).
  '[--k:clamp(1,calc(var(--out-scale,1)*var(--slot-focus,2)*var(--folder-zoom,1)),5)]',
  // Flat and unlit at rest, in both places this face is ever seen.
  '[--lx:0.5] [--ly:0.5] [--on:0] [--enter:0]',
  '[--rx:0deg] [--ry:0deg] [--rise:0%] [--grow:1] [--shine:0]',
  // Scatter, under the pointer: rises and takes one turn toward the side the
  // pointer came in from — one axis, set on the way in and held.
  '[.folder.is-open_&]:[--ry:calc(var(--enter)*var(--on)*3.5deg)]',
  '[.folder.is-open_&]:[--rise:calc(var(--on)*-1.2%)]',
  '[.folder.is-open_&]:[--grow:calc(1_+_var(--on)*0.015)]',
  '[.folder.is-open_&]:[--shine:calc(var(--on)*0.6)]',
  // Presented, under the pointer: both axes follow the hand, five degrees at
  // the very edge and nothing at the middle. Keyed off `.is-focused` alone,
  // not `.folder__item.is-focused`: an escaped `__` inside a Tailwind
  // arbitrary selector is invisible to the CSS parser (it silently drops the
  // whole rule rather than erroring), and `.is-focused` is only ever the
  // folder's own item class in the first place, so the longer form added
  // nothing but risk.
  '[.folder.is-open_.is-focused_&]:[--lean:5deg]',
  '[.folder.is-open_.is-focused_&]:[--rx:calc((var(--ly)_-_0.5)*2*var(--lean))]',
  '[.folder.is-open_.is-focused_&]:[--ry:calc((0.5_-_var(--lx))*2*var(--lean))]',
  '[.folder.is-open_.is-focused_&]:[--rise:0%]',
  '[.folder.is-open_.is-focused_&]:[--grow:1]',
  '[.folder.is-open_.is-focused_&]:[--shine:var(--on)]',
].join(' ')

/**
 * The badge is laid out at --k times its own box and scaled straight back
 * down. In short: the folder shows a
 * presented card at roughly --k times the size it is laid out at, and a 3D
 * transform inside that scaled ancestor becomes a composited layer
 * rasterised at its *layout* size rather than its shown size — 148px of
 * texture stretched across 808 device pixels, visibly blocky for as long as
 * the lean was anything but exactly flat. Laying the badge out big and
 * dividing the scale back out in the same transform keeps the net geometry
 * identical and gives the rasteriser --k times the detail to work with
 * instead. scale3d rather than scale, so the depth the lean produces is
 * divided out along with width and height. will-change is permanent rather
 * than added on hover, because a layer promoted at the moment of the hover is
 * rasterised again at that moment — the very flicker this fixes.
 */
const BADGE_CLASS = [
  'absolute top-0 left-0 @container overflow-hidden will-change-transform',
  // BEYOND THE FRAME: sized and rounded off --k, not a spacing/radius token.
  'w-[calc(100%*var(--k))] h-[calc(100%*var(--k))] rounded-[calc(3cqw*var(--k))]',
  // BEYOND THE FRAME: stock white, deliberately not the page's own
  // --background token, since the badge does not follow the site's theme.
  'bg-[#fdfdfd] origin-top-left',
  '[transform:scale3d(calc(1/var(--k)),calc(1/var(--k)),calc(1/var(--k)))_translate(50%,50%)_translateY(var(--rise))_scale(var(--grow))_rotateX(var(--rx))_rotateY(var(--ry))_translate(-50%,-50%)_translate3d(0,0,0.01px)]',
  // The shadow is fixed rather than following the pointer: box-shadow is a
  // paint property, and repainting the layer the printing lives on every
  // frame for a shadow nobody is looking at is the one thing worth refusing.
  '[box-shadow:0_0_0_calc(1px*var(--k))_rgb(21_21_21/8%),0_calc(3px*var(--k))_calc(8px*var(--k))_rgb(21_21_21/10%)]',
].join(' ')

/** First and, where there is one, second initial — the .face__mark treatment,
    read off whatever name the badge actually carries. */
function initials(name: string) {
  const letters = name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
  return letters.slice(0, 2).join('').toUpperCase()
}

/** Where in the card a pointer event landed, 0 to 1 either way. */
function place(element: HTMLElement, clientX: number, clientY: number) {
  const box = element.getBoundingClientRect()
  if (box.width === 0 || box.height === 0) return null

  return {
    x: Math.min(Math.max((clientX - box.left) / box.width, 0), 1),
    y: Math.min(Math.max((clientY - box.top) / box.height, 0), 1),
  }
}

/**
 * Whether the visitor asked for less movement, kept current rather than asked
 * on every pointermove — this is read in a handler that can fire at the
 * refresh rate.
 */
function useStillness() {
  const still = useRef(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      still.current = query.matches
    }

    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return still
}

/**
 * The conference badge — the card itself and nothing else. It used to hang
 * from a strap taped to the page; both are gone, because the object worth
 * looking at was always the printed card, and a strap only anchored it to a
 * spot it can no longer be turned away from.
 *
 * The card frame is handed back to this file rather than taken from .card —
 * see BADGE_CLASS above and the `.card:has(&)` overrides in ROOT_CLASS for
 * the card element itself. A box clipped to its own edges cannot hold
 * something that leans out of them.
 *
 * It is flat at rest, in both places it is ever seen, and flat again the
 * moment the pointer leaves. Nothing about it moves on its own.
 *
 *   hovered in the scatter    it rises off the page and takes one small turn,
 *                             toward the side the pointer came in from. Set
 *                             once, on the way in, and held: a card this size
 *                             chasing a pointer is a wobble, not a lean.
 *   presented in the middle    the pointer turns it, both ways, and is also
 *                             the light — the shine follows the hand across
 *                             the card while the far corner falls into shade.
 *
 * The turn is small, five degrees at the very edge. Most of what reads as
 * depth is the light moving, not the card.
 *
 * --- Why the easing is here and not in the stylesheet ----------------------
 *
 * There is no CSS transition anywhere on this face, and that is the whole
 * point of the loop below.
 *
 * The badge has to be composited to lean at all, and the folder shows it at
 * roughly two and a half times the size it is laid out at — 148px of layout
 * inside a card scaled up to 404px, and twice that again in device pixels on
 * a retina screen. A composited layer is rasterised once at a chosen scale
 * and then handed to the GPU, and while a *compositor animation* is running
 * on it — which is exactly what a CSS transition on transform creates — the
 * scale it chose is the one it keeps. The printing came back visibly blocky
 * for the length of every transition, in and out, and snapped sharp the frame
 * it ended. Which is precisely the artefact this face had.
 *
 * Easing the numbers here instead means the compositor never sees an
 * animation at all: every frame is a static transform that happens to differ
 * from the last, rasterised at the size it is actually being shown at. The
 * movement is identical. The pixelation is gone.
 *
 * (cofounder.co's tilt does the same thing, and this is the reason: no
 * transition on the tilting element, values eased in script, will-change
 * pinned on permanently so there is no promotion to flicker through either.
 * It is not a canvas — the card is plain DOM with live text in it.)
 *
 * The loop runs only while the pose is travelling. It stops the frame it
 * arrives, so a badge sitting flat and untouched costs nothing.
 */
export function LanyardFace({ item, presented = false }: { item: LanyardItem; presented?: boolean }) {
  const { badge } = item

  const rootRef = useRef<HTMLSpanElement>(null)
  const still = useStillness()

  /** Where the pose is, where it is going, and the frame carrying it there. */
  const pose = useRef<Pose>({ ...REST })
  const target = useRef<Pose>({ ...REST })
  const frame = useRef(0)
  const last = useRef(0)

  /** A press in progress on the presented card, and whether it has travelled
      far enough to have been a turn rather than a tap. */
  const turn = useRef<{ pointerId: number; x: number; y: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  const settle = useCallback(() => {
    if (frame.current) return

    last.current = performance.now()

    const step = (now: number) => {
      const element = rootRef.current
      if (!element) {
        frame.current = 0
        return
      }

      const elapsed = Math.min(now - last.current, MAX_FRAME_MS)
      last.current = now
      /* The same journey per millisecond whichever rate the screen runs at. */
      const rate = 1 - Math.pow(1 - FOLLOW, elapsed / (1000 / 60))

      let travelling = false
      for (const key of KEYS) {
        const gap = target.current[key] - pose.current[key]
        if (Math.abs(gap) < SETTLED) pose.current[key] = target.current[key]
        else {
          pose.current[key] += gap * rate
          travelling = true
        }
      }

      element.style.setProperty('--lx', pose.current.lx.toFixed(4))
      element.style.setProperty('--ly', pose.current.ly.toFixed(4))
      element.style.setProperty('--on', pose.current.on.toFixed(4))

      frame.current = travelling ? requestAnimationFrame(step) : 0
    }

    frame.current = requestAnimationFrame(step)
  }, [])

  const aim = useCallback(
    (lx: number, ly: number, on: number) => {
      target.current = { lx, ly, on }
      settle()
    },
    [settle],
  )

  /* A card sent back to the scatter — or out of the folder entirely — while
     the pointer is still on it would otherwise keep the pose it had. */
  useEffect(() => {
    return () => {
      cancelAnimationFrame(frame.current)
      frame.current = 0
      pose.current = { ...REST }
      target.current = { ...REST }

      const element = rootRef.current
      if (!element) return
      for (const name of ['--lx', '--ly', '--on', '--enter']) element.style.removeProperty(name)
    }
  }, [presented])

  const onPointerEnter = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (still.current) return

    const element = event.currentTarget
    const at = place(element, event.clientX, event.clientY)
    if (!at) return

    /* Which side it came in from, for the scatter's single turn. Held past the
       pointer leaving, so the card unwinds the way it wound up. */
    element.style.setProperty('--enter', at.x < 0.5 ? '-1' : '1')
    aim(at.x, at.y, 1)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    /* Only the card in the middle follows the pointer. In the scatter the pose
       was set on the way in and stays there. */
    if (!presented || still.current) return

    const at = place(event.currentTarget, event.clientX, event.clientY)
    if (!at) return
    aim(at.x, at.y, 1)

    const press = turn.current
    if (press && !press.moved && Math.hypot(event.clientX - press.x, event.clientY - press.y) > TURN_SLOP) {
      press.moved = true
    }
  }

  const onPointerLeave = () => {
    turn.current = null
    aim(REST.lx, REST.ly, REST.on)
  }

  /* Only the presented card: in the scatter a press is the folder picking the
     card up, and this one has nothing to add to it. */
  const onPointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!presented) return
    turn.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false }
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const press = turn.current
    if (!press || press.pointerId !== event.pointerId) return
    turn.current = null
    if (press.moved) suppressClick.current = true
  }

  const onClick = (event: ReactMouseEvent<HTMLSpanElement>) => {
    /* A finger that dragged the badge around meant to turn it, not to put it
       back — without this, every turn on a touchscreen would end in a card
       flying back to the scatter. */
    if (!suppressClick.current) return
    suppressClick.current = false
    event.stopPropagation()
  }

  return (
    <span
      className={ROOT_CLASS}
      ref={rootRef}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onClick={onClick}
    >
      <span className={BADGE_CLASS}>
        {/* Every colour in the printing below is a literal hex, not
            --foreground/--background/--neutral-700: styles.css reassigns
            all three under .hp[data-theme='dark'], and a printed badge does
            not relight itself when the page does. BEYOND THE FRAME,
            deliberately, throughout. */}
        {/* The punched slot belongs to the stock, not to the printing. */}
        <span
          className="absolute top-[5cqw] left-1/2 -translate-x-1/2 w-[12cqw] h-[2.4cqw] rounded-[1.2cqw] bg-[rgb(21_21_21/70%)] [box-shadow:inset_0_0.2cqw_0.2cqw_rgb(21_21_21/35%)]"
          aria-hidden="true"
        />

        <span className="absolute inset-0 flex flex-col items-center p-[8cqw]">
          <span className="flex w-full justify-between mt-[4cqw] font-display text-[3cqw] font-medium uppercase tracking-wider text-[#616161]">
            <span>{badge.org}</span>
            <span>{badge.since}</span>
          </span>

          {/* The .face__mark treatment: initials on a dark circle. */}
          <span
            className="grid w-[34cqw] h-[34cqw] mt-[6cqw] place-items-center rounded-full bg-[#151515] text-[#f9f9f9] font-display text-[12cqw] font-bold tracking-[0]"
            aria-hidden="true"
          >
            {initials(badge.name)}
          </span>

          <span className="mt-[5cqw] font-display text-[9.5cqw] font-bold tracking-snug leading-tight text-center text-balance text-[#151515]">
            {badge.name}
          </span>
          <span className="mt-[1.5cqw] font-display text-[4.6cqw] text-[#616161] text-center">
            {badge.role}
          </span>

          <span className="flex w-full flex-col items-center mt-auto gap-[1.5cqw]">
            <Barcode />
            <span className="font-sans text-[3cqw] tabular-nums tracking-wide text-[#616161]">
              NO. 0019
            </span>
          </span>
        </span>

        {/* The light, in two passes over everything above: the foil in the
            laminate, and the shine and shade the card is sitting in. Both are
            pinned to the pointer rather than the lean, moved with a transform
            rather than a background-position so following the hand costs a
            matrix each and no repaint. */}
        <span
          className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] pointer-events-none [will-change:transform,opacity] [transform:translate(calc((var(--lx)_-_0.5)*50%),calc((var(--ly)_-_0.5)*50%))] mix-blend-multiply opacity-[calc(var(--shine)*0.45)] [mask-image:radial-gradient(closest-side_circle_at_50%_50%,#000_0%,rgb(0_0_0/30%)_40%,transparent_75%)] [-webkit-mask-image:radial-gradient(closest-side_circle_at_50%_50%,#000_0%,rgb(0_0_0/30%)_40%,transparent_75%)] [background-image:linear-gradient(115deg,transparent_20%,rgb(255_110_196/26%)_30%,rgb(120_115_245/26%)_38%,rgb(76_201_240/26%)_46%,rgb(128_237_153/26%)_54%,rgb(249_199_79/26%)_62%,rgb(244_132_95/26%)_70%,transparent_80%)]"
          aria-hidden="true"
        />
        <span
          className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] pointer-events-none [will-change:transform,opacity] [transform:translate(calc((var(--lx)_-_0.5)*50%),calc((var(--ly)_-_0.5)*50%))] mix-blend-hard-light opacity-[var(--shine)] [background-image:radial-gradient(closest-side_circle_at_50%_50%,rgb(255_255_255/70%)_0%,rgb(255_255_255/14%)_22%,rgb(255_255_255/0%)_42%,rgb(38_42_54/20%)_96%)]"
          aria-hidden="true"
        />
      </span>
    </span>
  )
}

function Barcode() {
  let x = 0
  const bars = BARCODE_WIDTHS.map((width, index) => {
    const bar = <rect key={index} x={x} y={0} width={width} height={BARCODE_HEIGHT} />
    x += width + BARCODE_GAP
    return bar
  })
  const total = x - BARCODE_GAP

  return (
    <svg
      className="block w-[70%] h-[10cqw] fill-[#151515]"
      viewBox={`0 0 ${total} ${BARCODE_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {bars}
    </svg>
  )
}
