import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import type { DockItem } from '../../../content/home-page'
import { fit, layout } from '../../../lib/dock-magnify'

/**
 * The row's resting geometry, in screen px, worked out fresh for every pointer
 * event from things the magnification cannot disturb: the bar's own box and
 * the tiles' unscaled layout widths. Measuring the tiles themselves would read
 * back whatever growth the last frame wrote, and measuring once on entry — the
 * obvious alternative — misses the case where the card is brought to the
 * middle with the pointer already over it: the bar changes size under the
 * pointer, no enter fires, and the row keeps working from a stale reading.
 */
type Reading = {
  /** Each tile's resting centre. */
  centres: number[]
  /** A tile's width — same units as `centres`, for `layout()`. */
  tile: number
  /** Screen px per local px, so a shift worked out on screen can be written
      as a transform that means the same thing inside a scaled ancestor. */
  ancestorScale: number
  /** How much wider the row may get before a tile would cross the bar's edge. */
  slack: number
}

function measure(bar: HTMLElement, slots: HTMLElement[]): Reading | null {
  const barRect = bar.getBoundingClientRect()
  if (bar.offsetWidth === 0 || slots.length === 0) return null

  const ancestorScale = barRect.width / bar.offsetWidth
  const style = getComputedStyle(bar)
  /* Layout widths ignore transforms, so these are the resting sizes however
     magnified the row is right now. */
  const tileLocal = slots[0].offsetWidth
  const gapLocal = parseFloat(style.columnGap) || 0
  const tile = tileLocal * ancestorScale
  const pitch = (tileLocal + gapLocal) * ancestorScale
  const middle = barRect.left + barRect.width / 2
  const centres = slots.map((_, index) => middle + (index - (slots.length - 1) / 2) * pitch)

  /* The bar's own padding-bottom is exactly the clearance a tile has to keep
     at the bar's edge (1.2cqw, see dock.css) — reading it in local px and
     scaling it up is simpler than restating the cqw figure here, and it can
     never drift out of step with the stylesheet. */
  const rowWidth = (slots.length - 1) * pitch + tile
  const minEdge = parseFloat(style.paddingBottom) * ancestorScale
  const slack = barRect.width - rowWidth - 2 * minEdge

  return { centres, tile, ancestorScale, slack }
}

/** The tile whose centre the pointer is closest to. */
function nearest(centres: number[], pointer: number): number {
  let best = 0
  for (let index = 1; index < centres.length; index += 1) {
    if (Math.abs(centres[index] - pointer) < Math.abs(centres[best] - pointer)) best = index
  }
  return best
}

/**
 * The dock bar the hero's builder keeps open: the apps that are actually in
 * use while this site gets made. The card itself is the bar now, a fixed
 * width start to finish, so the point of this component is purely the
 * magnification — the maths for that lives in src/lib/dock-magnify.ts, pure
 * and tested; all this does is work out where the tiles rest, feed it the
 * pointer, and write the answer onto the DOM for the stylesheet to ease into
 * place.
 *
 * Nothing about the bar itself is ever measured for its own sake. It fills
 * the card and never grows; what dock-magnify.ts works out is capped by
 * `fit()` to whatever room is left either side of the row before a tile
 * would cross the bar's own edge, so the row spreads inside a fixed box
 * rather than pushing the box wider.
 */
export function DockFace({ item }: { item: DockItem }) {
  const barRef = useRef<HTMLSpanElement>(null)
  const slotRefs = useRef<(HTMLSpanElement | null)[]>([])
  const reduced = useRef(false)

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const onPointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const bar = barRef.current
    const slots = slotRefs.current.filter((slot): slot is HTMLSpanElement => slot !== null)
    const state = bar ? measure(bar, slots) : null
    if (!state) return

    const active = nearest(state.centres, event.clientX)
    slots.forEach((slot, index) => slot.toggleAttribute('data-active', index === active))

    /* Reduced motion: the tooltip above still tracks the nearest tile, but
       nothing grows or slides — the row just sits at rest. */
    if (reduced.current) return

    const { scales, shifts } = fit(layout(state.centres, event.clientX, state.tile), state.slack)

    slots.forEach((slot, index) => {
      slot.style.setProperty('--mag', scales[index].toFixed(3))
      slot.style.setProperty('--shift', `${(shifts[index] / state.ancestorScale).toFixed(2)}px`)
    })
  }

  const onPointerLeave = () => {
    for (const slot of slotRefs.current) {
      slot?.style.removeProperty('--mag')
      slot?.style.removeProperty('--shift')
      slot?.removeAttribute('data-active')
    }
  }

  return (
    <span
      className="dock"
      ref={barRef}
      style={{ '--dock-count': item.apps.length } as CSSProperties}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {item.apps.map((app, index) => (
        <span
          className="dock__slot"
          key={app.id}
          ref={(element) => {
            slotRefs.current[index] = element
          }}
        >
          <span className="dock__tip" aria-hidden="true">
            <span className="dock__tip-name">{app.name}</span>
            <span className="dock__tip-note">{app.note}</span>
          </span>
          <img className="dock__tile" src={app.icon} alt="" draggable={false} />
          <span className="dock__dot" aria-hidden="true" />
        </span>
      ))}
    </span>
  )
}
