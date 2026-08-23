import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { folderItems, type FolderItem } from '../../content/home-page'
import { folderMetrics, folderShape } from '../../lib/folder-shape'
import { getLenis } from '../../lib/smooth-scroll'
import { StampSticker, ToriiSticker } from '../icons'

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
 *          it to the middle to be looked at properly.
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

/** The face of one item. `kind` picks the drawing; the card frame is shared. */
function FolderFace({ item }: { item: FolderItem }) {
  if (item.kind === 'photo') {
    return <img className="hp-face__photo" src={item.src} alt={item.alt ?? ''} loading="lazy" draggable={false} />
  }

  if (item.kind === 'logo') {
    return (
      <span className="hp-face hp-face--logo">
        <span className="hp-face__mark">{item.mark}</span>
        <span className="hp-face__name">{item.label}</span>
      </span>
    )
  }

  if (item.kind === 'note') {
    return (
      <span className="hp-face hp-face--note">
        <span className="hp-face__body">{item.body}</span>
        <span className="hp-face__rule" aria-hidden="true" />
      </span>
    )
  }

  return (
    <span className="hp-face hp-face--swatch">
      <span className="hp-face__chips" aria-hidden="true">
        {item.colors?.map((color) => (
          <span key={color} style={{ background: color }} />
        ))}
      </span>
      <span className="hp-face__name">{item.label}</span>
    </span>
  )
}

function Card({ item }: { item: FolderItem }) {
  return (
    <span className="hp-card" data-kind={item.kind} data-ratio={item.ratio ?? 'portrait'}>
      <FolderFace item={item} />
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
      className={`hp-folder${stage === 'open' ? ' is-open' : ''}${stage === 'closing' ? ' is-closing' : ''}`}
      ref={rootRef}
    >
      <span
        className="hp-folder__stage"
        style={
          {
            aspectRatio: metrics.aspectRatio,
            '--hp-folder-contents-top': metrics.contentsTop,
          } as CSSProperties
        }
      >
        {/* The front's edge, twice over: once as the clip that shapes the
            frosted layer, once as the gradient that fills the drawn face. Both
            come off the same path in src/lib/folder-shape.ts. */}
        <svg className="hp-folder__defs" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <path d={metrics.frontClip} />
            </clipPath>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--hp-folder-face-top)" />
              <stop offset="1" stopColor="var(--hp-folder-face-bottom)" />
            </linearGradient>
          </defs>
        </svg>

        <svg className="hp-folder__back" viewBox={metrics.viewBox} aria-hidden="true">
          <path d={metrics.back} />
        </svg>

        <span className="hp-folder__stack" ref={stackRef} inert={inFolder}>
          {folderItems.map((item) => (
            <button
              className={`hp-folder__item${focused === item.id ? ' is-focused' : ''}`}
              key={item.id}
              type="button"
              aria-pressed={focused === item.id}
              onClick={() => setFocused((current) => (current === item.id ? null : item.id))}
            >
              <Card item={item} />
              <span className="hp-sr-only">
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
        <span className="hp-folder__flap" aria-hidden="true">
          <span className="hp-folder__frost" style={{ clipPath: `url(#${clipId})` }} />

          <svg className="hp-folder__face" viewBox={metrics.viewBox}>
            <path d={metrics.front} fill={`url(#${fillId})`} />
          </svg>

          <span className="hp-folder__sticker hp-folder__sticker--stamp">
            <StampSticker />
          </span>
          <span className="hp-folder__sticker hp-folder__sticker--torii">
            <ToriiSticker />
          </span>
        </span>

        <span className="hp-folder__targets" ref={targetsRef} aria-hidden="true">
          {folderItems.map((item) => (
            <span className="hp-folder__target" key={item.id} />
          ))}
        </span>

        {/* Empty space is the way out of a card. It only closes the folder once
            nothing is being looked at, so putting a card down never costs you
            the whole scatter. */}
        <button
          className="hp-folder__veil"
          type="button"
          inert={inFolder}
          aria-label={focused ? 'Put this back' : `Close ${caption}`}
          onClick={dismiss}
        />

        {/* One caption for whichever card is being looked at. A single strip
            rather than a label per card: a label riding a card that scales up
            twice over either scales with it or has to be unscaled by hand, and
            neither ends up legible. */}
        <p className="hp-folder__caption" aria-live="polite">
          {folderItems.map((item) => (
            <span key={item.id} hidden={focused !== item.id}>
              <strong>{item.label}</strong>
              {item.note ? <span>{item.note}</span> : null}
            </span>
          ))}
        </p>

        <button className="hp-folder__close" type="button" ref={closeRef} inert={inFolder} onClick={closeScatter}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
          <span className="hp-sr-only">Close {caption}</span>
        </button>

        {/* The folder as one hit target while it is shut, over the whole object
            so the flap and the tab open it too. */}
        <button
          className="hp-folder__open"
          type="button"
          ref={openRef}
          inert={stage === 'open'}
          aria-expanded={active}
          onClick={() => setStage('open')}
        >
          <span className="hp-sr-only">Open {caption}</span>
        </button>
      </span>
    </div>
  )
}
