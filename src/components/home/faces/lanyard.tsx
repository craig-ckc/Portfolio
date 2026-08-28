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
 * see lanyard.css. A box clipped to its own edges cannot hold something that
 * leans out of them.
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
      className="lanyard"
      ref={rootRef}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onClick={onClick}
    >
      <span className="lanyard__badge">
        {/* The punched slot belongs to the stock, not to the printing. */}
        <span className="lanyard__slot" aria-hidden="true" />

        <span className="lanyard__print">
          <span className="lanyard__header">
            <span>{badge.org}</span>
            <span>{badge.since}</span>
          </span>

          <span className="lanyard__portrait" aria-hidden="true">
            {initials(badge.name)}
          </span>

          <span className="lanyard__name">{badge.name}</span>
          <span className="lanyard__role">{badge.role}</span>

          <span className="lanyard__footer">
            <Barcode />
            <span className="lanyard__no">NO. 0019</span>
          </span>
        </span>

        {/* The light, in two passes over everything above: the foil in the
            laminate, and the shine and shade the card is sitting in. */}
        <span className="lanyard__foil" aria-hidden="true" />
        <span className="lanyard__glare" aria-hidden="true" />
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
      className="lanyard__barcode"
      viewBox={`0 0 ${total} ${BARCODE_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {bars}
    </svg>
  )
}
