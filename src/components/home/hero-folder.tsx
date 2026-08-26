import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { folderItems, type FolderItem } from '../../content/home-page'
import {
  coast,
  confine,
  DRAG_THRESHOLD,
  follow,
  lean,
  release,
  within,
  type Bounds,
  type Motion,
  type Point,
} from '../../lib/card-motion'
import { folderMetrics, folderShape } from '../../lib/folder-shape'
import { getLenis } from '../../lib/smooth-scroll'
import { StampSticker, ToriiSticker } from '../icons'
import { DiscFace } from './faces/disc'
import { DockFace } from './faces/dock'
import { LanyardFace } from './faces/lanyard'
import { PolaroidsFace } from './faces/polaroids'

/**
 * The hero object: a folder holding the things a project leaves behind — a
 * reference shot, a client mark, a note, a palette. Three layers, back to
 * front:
 *
 *   back   a flat-topped panel, the plainer of the two generated paths
 *   items  the contents, showing in the notch the front leaves
 *   flap   the front, which is where the tab and its angled shoulder live
 *
 * Three states:
 *
 *   idle   only a sliver of the contents shows above the flap
 *   hover  the flap tips toward the viewer on its bottom edge, and the contents
 *          fan up out from behind it. The back never moves.
 *   open   the contents leave the folder and take places across the screen, on
 *          a blurred layer that puts the page out of focus. Clicking one brings
 *          it to the middle to be looked at properly. Out there they can also
 *          be picked up and moved about; how a card follows the hand and how
 *          it comes to rest once let go is in src/lib/card-motion.ts.
 *
 * There is one copy of each item and it is the one that moves. Nothing is
 * cloned into an overlay and nothing cross-fades: the cards in the folder are
 * the cards that come out of it and the cards that go back in.
 *
 * What makes that work is the order the layers paint in, and one change of
 * layer at each end of the move:
 *
 *   shut   contents under the flap, which is what hides all but a sliver
 *   out    contents over it, clear of the folder they came from
 *
 * Nothing in between: the layer changes in the frame the click lands, in both
 * directions. Delayed, the cards spend half their flight still behind the flap
 * and then come whole in one frame out over open screen. It is a plain z-index
 * left out of the transitions in home-page.css, so there is no timer in here.
 *
 * The veil is under the whole object rather than in the middle of it — the page
 * goes out of focus, the folder stays sharp — so nothing ever crosses it, and
 * its fade and the flight above are free of each other.
 *
 * This file measures. Every value being moved between lives in the stylesheet.
 */

const metrics = folderMetrics(folderShape)

/** Keys that would scroll the page out from under a scatter pinned to it. */
const SCROLL_KEYS = new Set(['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'])

/** Slack on the return, so the class outlasts the move rather than cutting it. */
const RETURN_GRACE_MS = 60

/**
 * How far in from the screen's edge a card stops, in px. The whole card stays
 * on screen, not just enough of it to take hold of again: a card hanging past
 * the edge still counts as overflow, and the page grows a scrollbar under the
 * scatter to reach it.
 */
const EDGE_MARGIN = 8

/**
 * How long the return takes, read off the same token the stylesheet animates
 * it with, so the two cannot drift.
 *
 * Read rather than waited on. The obvious alternative — find the transition
 * with getAnimations() and await its `finished` — has to be done in the frame
 * the class lands in, and at that point the transition reliably does not exist
 * yet: style has not been recalculated, so there is nothing to find and the
 * return ends one frame after it began. A `transitionend` listener has the
 * opposite problem, catching the tail of whatever was already moving — put a
 * card down and close in the same second and the close ends before it starts.
 */
function returnDuration(element: HTMLElement | null) {
  const declared = element ? parseFloat(getComputedStyle(element).getPropertyValue('--duration-slow')) : NaN
  return (Number.isFinite(declared) ? declared : 560) + RETURN_GRACE_MS
}

/**
 * Where an element's centre sits on screen with its transform taken off — the
 * point every move is measured from and to. A rect will not do: the cards are
 * rotated and scaled, and working out what transform to give them is the whole
 * job. Safe because the offset parent, the card stack, is never transformed.
 */
function restingCentre(element: HTMLElement) {
  const parent = element.offsetParent
  const base = parent instanceof HTMLElement ? parent.getBoundingClientRect() : new DOMRect()

  return {
    x: base.left + element.offsetLeft + element.offsetWidth / 2,
    y: base.top + element.offsetTop + element.offsetHeight / 2,
  }
}

/**
 * Where the scatter put a card's centre before anyone touched it: its resting
 * centre plus the aim. Every drag offset is measured from here.
 */
function scatterCentre(element: HTMLElement): Point {
  const rest = restingCentre(element)

  return {
    x: rest.x + (parseFloat(element.style.getPropertyValue('--out-x')) || 0),
    y: rest.y + (parseFloat(element.style.getPropertyValue('--out-y')) || 0),
  }
}

/** Write where a card is and how it is moving, for the transform in home-page.css to read. */
function paint(element: HTMLElement, motion: Motion) {
  element.style.setProperty('--drag-x', `${motion.position.x.toFixed(2)}px`)
  element.style.setProperty('--drag-y', `${motion.position.y.toFixed(2)}px`)
  element.style.setProperty('--drag-r', `${lean(motion.velocity).toFixed(2)}deg`)
}

/**
 * One card being handled: pressed and not yet moved, in the hand, or coasting
 * to rest after leaving it. Positions are offsets from where the scatter put
 * the card — the space --drag-x / --drag-y are in — so putting a card down is
 * nothing more than leaving the last pair written.
 */
type Grip = {
  pointerId: number
  mode: 'pressed' | 'held' | 'coasting'
  /** Where the pointer went down. Nothing moves until it is DRAG_THRESHOLD from here. */
  origin: Point
  /** The offset the card already had when it was picked up. */
  base: Point
  /** Where the hand is asking the card to be. */
  target: Point
  motion: Motion
  /** How far the offset may go before the card's centre would leave the screen. */
  bounds: Bounds
  /** How quickly it sheds speed once let go. Set at that moment. */
  rate: number
  /** Under reduced motion the card sits under the pointer and stops where it is let go. */
  instant: boolean
}

/**
 * Put the rest of the page out of reach the way a modal dialog would: walk up
 * from the folder marking everything alongside it inert, and hand back the undo.
 *
 * A dialog is not an option here. The top layer would lift the whole object out
 * of the page's own stacking order, and the veil's whole job is to sit between
 * the two — over the page, under the object.
 */
function inertOutside(root: HTMLElement) {
  const marked: HTMLElement[] = []

  for (let node: HTMLElement | null = root; node && node !== document.body; node = node.parentElement) {
    for (const sibling of node.parentElement?.children ?? []) {
      if (sibling === node || !(sibling instanceof HTMLElement) || sibling.inert) continue
      sibling.inert = true
      marked.push(sibling)
    }
  }

  return () => {
    for (const element of marked) element.inert = false
  }
}

/**
 * The face of one item. `kind` picks the drawing; the card frame is shared.
 *
 * The plain kinds are drawn here. The four richer ones — each with a hover
 * life of its own — have a file each under ./faces, and a stylesheet each under
 * src/styles/faces, so their moving parts stay out of this file's way.
 */
function FolderFace({ item, focused }: { item: FolderItem; focused: boolean }) {
  switch (item.kind) {
    case 'photo':
      return <img className="face__photo" src={item.src} alt={item.alt ?? ''} loading="lazy" draggable={false} />

    case 'logo':
      return (
        <span className="face face--logo">
          <span className="face__mark">{item.mark}</span>
          <span className="face__name">{item.label}</span>
        </span>
      )

    case 'note':
      return (
        <span className="face face--note">
          <span className="face__body">{item.body}</span>
          <span className="face__rule" aria-hidden="true" />
        </span>
      )

    case 'swatch':
      return (
        <span className="face face--swatch">
          <span className="face__chips" aria-hidden="true">
            {item.colors.map((color) => (
              <span key={color} style={{ background: color }} />
            ))}
          </span>
          <span className="face__name">{item.label}</span>
        </span>
      )

    case 'dock':
      return <DockFace item={item} />

    case 'polaroids':
      /* Dragging a print to shuffle the pile is only for the card being
         looked at; in the scatter a press on it moves the whole card. */
      return <PolaroidsFace item={item} presented={focused} />

    case 'disc':
      /* Brought to the middle, the record presents itself — platter out,
         popover up — without waiting for the pointer to find it. */
      return <DiscFace item={item} presented={focused} />

    case 'lanyard':
      return <LanyardFace item={item} />
  }
}

function Card({ item, focused }: { item: FolderItem; focused: boolean }) {
  return (
    <span className="card" data-kind={item.kind} data-ratio={item.ratio ?? 'portrait'}>
      <FolderFace item={item} focused={focused} />
    </span>
  )
}

/**
 * `open` covers the whole time the contents are out, the flight included.
 * `closing` is them on the way back with the folder shutting around them, which
 * needs its own timing and its own paint order — so it cannot just be `closed`
 * arriving early.
 */
type Stage = 'closed' | 'open' | 'closing'

export function HeroFolder({ caption }: { caption: string }) {
  const [stage, setStage] = useState<Stage>('closed')
  const [focused, setFocused] = useState<string | null>(null)
  const active = stage !== 'closed'

  /* One per instance, since both are referenced by id from CSS and from an
     attribute rather than scoped the way a class would be. */
  const ids = useId()
  const clipId = `${ids}-front`
  const fillId = `${ids}-face`

  const rootRef = useRef<HTMLDivElement>(null)
  const stackRef = useRef<HTMLSpanElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  /**
   * Empty boxes, never painted, laid out where the contents are meant to land.
   * They are here so the arrangement — and its breakpoints — can stay in the
   * stylesheet with everything else, and this file only has to measure it.
   */
  const targetsRef = useRef<HTMLSpanElement>(null)
  const openRef = useRef<HTMLButtonElement>(null)
  /** Whether the folder had focus when it was closed, so it can be given back. */
  const returnFocus = useRef(false)

  /** Every card in hand or still moving, by element. */
  const grips = useRef(new Map<HTMLElement, Grip>())
  const frame = useRef(0)
  const lastFrame = useRef(0)
  /**
   * The click that follows a drag is not a click. Set when a press becomes a
   * drag and spent by the click it produces; a press that never moves leaves
   * it alone, so a tap still opens the card.
   */
  const suppressClick = useRef(false)
  /** The cards in paint order, the one handled last at the end. */
  const pile = useRef<HTMLElement[]>([])

  /**
   * Give every item the offset and scale that lands it on its target.
   *
   * The offset is a plain difference of centres, which it can only be because
   * the transform in the stylesheet brackets the scale and rotation with a
   * half-height shift each way. That moves their pivot to the middle of the
   * card, so a translate means what it says even though the fan turns the cards
   * about their bottom edge. Without it, the rotation would have to be unpicked
   * here to work out where the centre had ended up.
   */
  const aim = useCallback(() => {
    const items = stackRef.current?.children
    const targets = targetsRef.current?.children
    if (!items || !targets) return

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index]
      const target = targets[index]
      if (!(item instanceof HTMLElement) || !(target instanceof HTMLElement) || item.offsetWidth === 0) continue

      const from = restingCentre(item)
      const to = target.getBoundingClientRect()

      item.style.setProperty('--out-x', `${Math.round(to.left + to.width / 2 - from.x)}px`)
      item.style.setProperty('--out-y', `${Math.round(to.top + to.height / 2 - from.y)}px`)
      item.style.setProperty('--out-scale', (to.width / item.offsetWidth).toFixed(4))
    }
  }, [])

  /**
   * One frame for every card that is moving: the ones in hand follow, the ones
   * let go coast, and the loop stops itself when nothing is left moving.
   */
  const step = useCallback((now: number) => {
    const dt = lastFrame.current ? Math.min((now - lastFrame.current) / 1000, 0.05) : 0
    lastFrame.current = now
    let moving = false

    for (const [element, grip] of grips.current) {
      if (grip.mode === 'pressed') continue

      if (grip.mode === 'held') {
        grip.motion = grip.instant
          ? { position: grip.target, velocity: { x: 0, y: 0 } }
          : follow(grip.motion, grip.target, dt)
        moving = true
      } else {
        const coasted = coast(grip.motion, grip.rate, dt)
        grip.motion = confine(coasted.motion, grip.bounds)

        if (coasted.settled) {
          element.classList.remove('is-coasting')
          grips.current.delete(element)
        } else {
          moving = true
        }
      }

      paint(element, grip.motion)
    }

    frame.current = moving ? requestAnimationFrame(step) : 0
    if (!moving) lastFrame.current = 0
  }, [])

  const wake = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(step)
  }, [step])

  /** Bring a card to the top of the pile, as picking it up would. */
  const raise = useCallback((element: HTMLElement) => {
    const cards = pile.current.length ? pile.current : Array.from(stackRef.current?.children ?? [])
    const order = cards.filter((card): card is HTMLElement => card instanceof HTMLElement && card !== element)
    order.push(element)

    pile.current = order
    order.forEach((card, index) => card.style.setProperty('--raised', String(index)))
  }, [])

  /**
   * The moment a press becomes a drag. Measured from where the card actually
   * is rather than where it was sent, so one caught still in flight comes away
   * with the hand from there instead of jumping to where it would have landed.
   */
  const lift = useCallback(
    (element: HTMLElement, grip: Grip) => {
      const centre = scatterCentre(element)
      const box = element.getBoundingClientRect()
      const offset = { x: box.left + box.width / 2 - centre.x, y: box.top + box.height / 2 - centre.y }
      /* The box of the card as it sits, rotation included, so the reach is
         measured to its corner and not to the edge of an upright card. */
      const reachX = box.width / 2 + EDGE_MARGIN
      const reachY = box.height / 2 + EDGE_MARGIN

      grip.mode = 'held'
      grip.base = offset
      grip.target = offset
      grip.motion = { position: offset, velocity: { x: 0, y: 0 } }
      grip.bounds = {
        minX: reachX - centre.x,
        maxX: document.documentElement.clientWidth - reachX - centre.x,
        minY: reachY - centre.y,
        maxY: window.innerHeight - reachY - centre.y,
      }
      grip.instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      /* Class and offset land in the same frame, and the class is what turns
         the transition off: the card snaps to exactly where it already is. */
      element.classList.add('is-held')
      paint(element, grip.motion)
      raise(element)
      suppressClick.current = true
    },
    [raise],
  )

  /** The hand opens. */
  const drop = useCallback(
    (element: HTMLElement, grip: Grip) => {
      element.classList.remove('is-held')
      const glide = grip.instant ? null : release(grip.motion.velocity)

      if (!glide) {
        grips.current.delete(element)
        paint(element, { position: grip.motion.position, velocity: { x: 0, y: 0 } })
        return
      }

      grip.mode = 'coasting'
      grip.rate = glide.rate
      grip.motion = { position: grip.motion.position, velocity: glide.velocity }
      element.classList.add('is-coasting')
      wake()
    },
    [wake],
  )

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    /* The card being looked at is not for moving. And only the main button. */
    if (stage !== 'open' || focused === id || event.button !== 0) return

    const element = event.currentTarget
    const grip = grips.current.get(element)
    if (grip && grip.mode !== 'coasting') return

    suppressClick.current = false
    const origin = { x: event.clientX, y: event.clientY }

    if (grip) {
      /* Caught on the move: it stops in the hand. */
      element.classList.remove('is-coasting')
      grip.mode = 'pressed'
      grip.pointerId = event.pointerId
      grip.origin = origin
      grip.motion = { position: grip.motion.position, velocity: { x: 0, y: 0 } }
      paint(element, grip.motion)
    } else {
      grips.current.set(element, {
        pointerId: event.pointerId,
        mode: 'pressed',
        origin,
        base: { x: 0, y: 0 },
        target: { x: 0, y: 0 },
        motion: { position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 } },
        bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
        rate: 0,
        instant: false,
      })
    }

    /* Taken now, ahead of the threshold, so a fast start cannot slip off the card. */
    element.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const element = event.currentTarget
    const grip = grips.current.get(element)
    if (!grip || grip.pointerId !== event.pointerId || grip.mode === 'coasting') return

    const pointer = { x: event.clientX, y: event.clientY }

    if (grip.mode === 'pressed') {
      if (Math.hypot(pointer.x - grip.origin.x, pointer.y - grip.origin.y) < DRAG_THRESHOLD) return
      lift(element, grip)
    }

    grip.target = within(
      { x: grip.base.x + pointer.x - grip.origin.x, y: grip.base.y + pointer.y - grip.origin.y },
      grip.bounds,
    )
    wake()
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const element = event.currentTarget
    const grip = grips.current.get(element)
    if (!grip || grip.pointerId !== event.pointerId || grip.mode === 'coasting') return

    /* Never moved: a click, and the click handler takes it from here. */
    if (grip.mode === 'pressed') grips.current.delete(element)
    else drop(element, grip)
  }

  const onPointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    onPointerUp(event)
    /* No click follows a cancel, so there is nothing for this to wait for. */
    suppressClick.current = false
  }

  const closeScatter = useCallback(() => {
    if (stage !== 'open') return

    /* Noted now, because the control being used to close is about to go inert
       and focus will land on the document with nothing to say where it came
       from. */
    returnFocus.current = !!rootRef.current?.contains(document.activeElement)

    setFocused(null)
    setStage('closing')

    window.setTimeout(() => setStage('closed'), returnDuration(rootRef.current))
  }, [stage])

  /** Escape, and a click on empty space, both step back one level at a time. */
  const dismiss = useCallback(() => {
    if (focused) setFocused(null)
    else closeScatter()
  }, [closeScatter, focused])

  /* Aimed before the browser paints the open state, so the cards leave for a
     place that has already been worked out. Re-aimed on resize, since the
     targets are sized in viewport units and will have moved. */
  useLayoutEffect(() => {
    if (!active) return

    aim()
    window.addEventListener('resize', aim)
    return () => window.removeEventListener('resize', aim)
  }, [active, aim])

  /* Everything that has to be true of the page while the contents are out, and
     undone the moment they are back in. */
  useEffect(() => {
    if (!active) return

    const root = rootRef.current
    const host = root?.closest('.hp')

    /* The folder's layer has to clear the navbar, which by default paints above
       the whole content column. */
    host?.setAttribute('data-scatter', 'open')
    const releaseInert = root ? inertOutside(root) : undefined

    /* Lenis owns the scroll position, so stopping it is the lock. Nothing here
       touches overflow, and lenis.css's own attempt at it is overridden in
       styles.css: hiding or clipping the document takes the scrollbar away, and
       the page then jumps sideways by its width the moment the folder opens.
       The bar stays where it was, real and untouched, and simply does not
       move. */
    const lenis = getLenis()
    lenis?.stop()

    const blockWheel = (event: Event) => event.preventDefault()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        dismiss()
        return
      }
      /* Not the space bar: that is how a focused card gets opened. */
      if (SCROLL_KEYS.has(event.key)) event.preventDefault()
    }

    /* The wheel and the keys, which Lenis being stopped does not cover on its
       own: under reduced motion it never starts at all, and the page would
       otherwise scroll out from under a scatter pinned to wherever the folder
       happens to be. */
    window.addEventListener('wheel', blockWheel, { passive: false })
    window.addEventListener('touchmove', blockWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)

    /* And the one path left, now that the scrollbar is still there to be used:
       a drag on the bar itself, which is not an event anything can cancel. So
       it is not cancelled — the position is just put back, which reads as a bar
       that will not be dragged rather than a page that scrolled and returned.
       Read once here rather than per event, so a drag cannot walk it along. */
    const pinned = window.scrollY
    const repin = () => {
      if (window.scrollY !== pinned) window.scrollTo(0, pinned)
    }

    window.addEventListener('scroll', repin, { passive: true })

    return () => {
      host?.removeAttribute('data-scatter')
      releaseInert?.()
      lenis?.start()
      window.removeEventListener('wheel', blockWheel)
      window.removeEventListener('touchmove', blockWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', repin)
    }
  }, [active, dismiss])

  /* Nothing stays in hand once the contents are on their way home. Before the
     paint rather than after it, so no card spends the first frame of the
     return with its transition still switched off. The way back never read the
     drag, so clearing it here changes nothing that can be seen — it just means
     the next opening starts from the arrangement, not from wherever the cards
     were last left. */
  useLayoutEffect(() => {
    if (stage === 'open') return

    cancelAnimationFrame(frame.current)
    frame.current = 0
    lastFrame.current = 0

    for (const [element, grip] of grips.current) {
      element.classList.remove('is-held', 'is-coasting')
      if (element.hasPointerCapture(grip.pointerId)) element.releasePointerCapture(grip.pointerId)
    }
    grips.current.clear()
    pile.current = []

    for (const card of stackRef.current?.children ?? []) {
      if (!(card instanceof HTMLElement)) continue
      for (const property of ['--drag-x', '--drag-y', '--drag-r', '--raised']) card.style.removeProperty(property)
    }
  }, [stage])

  /* Focus follows the contents: into the scatter as they come out, back onto
     the folder as they go in.

     The close button and not the first card, even though the cards are the
     content: moving focus programmatically still draws a focus ring, and a
     2px ring around a photograph reads as a border someone left on it. On a
     round 40px button it reads as what it is. Tab goes on to the cards. */
  useEffect(() => {
    if (stage === 'open') {
      closeRef.current?.focus()
      return
    }

    if (stage === 'closed' && returnFocus.current) {
      returnFocus.current = false
      openRef.current?.focus()
    }
  }, [stage])

  /* Inert rather than hidden: it keeps the contents out of the tab order and
     out of the way of the pointer while they are in the folder, without taking
     them out of the layout that every move is measured against. */
  const inFolder = stage !== 'open'

  return (
    <div
      className={`folder${stage === 'open' ? ' is-open' : ''}${stage === 'closing' ? ' is-closing' : ''}`}
      ref={rootRef}
    >
      <span
        className="folder__stage"
        style={
          {
            aspectRatio: metrics.aspectRatio,
            '--folder-contents-top': metrics.contentsTop,
          } as CSSProperties
        }
      >
        {/* The front's edge, twice over: once as the clip that shapes the
            frosted layer, once as the gradient that fills the drawn face. Both
            come off the same path in src/lib/folder-shape.ts. */}
        <svg className="folder__defs" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <path d={metrics.frontClip} />
            </clipPath>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--folder-face-top)" />
              <stop offset="1" stopColor="var(--folder-face-bottom)" />
            </linearGradient>
          </defs>
        </svg>

        <svg className="folder__back" viewBox={metrics.viewBox} aria-hidden="true">
          <path d={metrics.back} />
        </svg>

        <span className="folder__stack" ref={stackRef} inert={inFolder}>
          {folderItems.map((item) => (
            <button
              className={`folder__item${focused === item.id ? ' is-focused' : ''}`}
              key={item.id}
              type="button"
              aria-pressed={focused === item.id}
              onPointerDown={(event) => onPointerDown(event, item.id)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false
                  return
                }
                setFocused((current) => (current === item.id ? null : item.id))
              }}
            >
              <Card item={item} focused={focused === item.id} />
              <span className="sr-only">
                {item.label}
                {item.note ? `, ${item.note}` : ''}
              </span>
            </button>
          ))}
        </span>

        {/* The front. Two layers, because no one element can be both shapes at
            once: a div carries the frost, since backdrop-filter needs a real
            box to blur behind, and is cut to the edge with a clip; the drawn
            face over it carries the fill, the hairline and the cast shadow,
            since a clip would have taken a box-shadow off with it.

            The stickers ride here rather than on the stage, so they tip with
            the front — which is most of the reason to put them on it. */}
        <span className="folder__flap" aria-hidden="true">
          <span className="folder__frost" style={{ clipPath: `url(#${clipId})` }} />

          <svg className="folder__face" viewBox={metrics.viewBox}>
            <path d={metrics.front} fill={`url(#${fillId})`} />
          </svg>

          <span className="folder__sticker folder__sticker--stamp">
            <StampSticker />
          </span>
          <span className="folder__sticker folder__sticker--torii">
            <ToriiSticker />
          </span>
        </span>

        <span className="folder__targets" ref={targetsRef} aria-hidden="true">
          {folderItems.map((item) => (
            <span className="folder__target" key={item.id} />
          ))}
        </span>

        {/* Empty space is the way out of a card. It only closes the folder once
            nothing is being looked at, so putting a card down never costs you
            the whole scatter. */}
        <button
          className="folder__veil"
          type="button"
          inert={inFolder}
          aria-label={focused ? 'Put this back' : `Close ${caption}`}
          onClick={dismiss}
        />

        {/* One caption for whichever card is being looked at. A single strip
            rather than a label per card: a label riding a card that scales up
            twice over either scales with it or has to be unscaled by hand, and
            neither ends up legible. */}
        <p className="folder__caption" aria-live="polite">
          {folderItems.map((item) => (
            <span key={item.id} hidden={focused !== item.id}>
              <strong>{item.label}</strong>
              {item.note ? <span>{item.note}</span> : null}
            </span>
          ))}
        </p>

        <button className="folder__close" type="button" ref={closeRef} inert={inFolder} onClick={closeScatter}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
          <span className="sr-only">Close {caption}</span>
        </button>

        {/* The folder as one hit target while it is shut, over the whole object
            so the flap and the tab open it too. */}
        <button
          className="folder__open"
          type="button"
          ref={openRef}
          inert={stage === 'open'}
          aria-expanded={active}
          onClick={() => setStage('open')}
        >
          <span className="sr-only">Open {caption}</span>
        </button>
      </span>
    </div>
  )
}
