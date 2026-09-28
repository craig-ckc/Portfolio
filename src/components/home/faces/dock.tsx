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
     at the bar's edge (1.2cqw, set by `tw:pb-[1.2cqw]` below) — reading it
     in local px and scaling it up is simpler than restating the cqw figure
     here, and it can never drift out of step with that utility. */
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
      /* The card is already the bar's exact shape (aspect-ratio 24 / 5, set by
         `tw:data-[ratio=bar]:aspect-[24/5]` on the card element in
         hero-folder.tsx), so filling it with inset-0 is the whole layout: no
         width to measure, no padding that grows. --dock-tile/--dock-gap are
         the row's own geometry, read by the tiles below and by measure()
         above; overflow stays visible so a tile magnifying, or the tooltip
         rising, do it in open air rather than inside a clipped box.

         The card frame itself is the folder agent's element: its default
         background/shadow are cancelled from here with a :has() variant
         rather than by editing the card element directly, forced with `!`
         since an unlayered bespoke rule otherwise always beats a layered
         utility regardless of specificity.

         -webkit-backdrop-filter only, no plain backdrop-filter: the build's
         CSS minifier folds the two into one declaration when they live
         together in one rule, dropping the standard property, so the bar
         would render with no blur. Kept as two separate utility rules so the
         minifier has nothing to merge. */
      className="tw:group tw:absolute tw:inset-0 tw:flex tw:items-end tw:justify-center tw:gap-(--dock-gap) tw:pt-[1.6cqw] tw:px-0 tw:pb-[1.2cqw] tw:rounded-[4.6cqw] tw:border tw:border-[rgb(255_255_255/60%)] tw:bg-[rgb(255_255_255/62%)] tw:shadow-[0_0_0_1px_rgb(21_21_21/8%),0_1px_1px_rgb(21_21_21/6%),0_1cqw_2.6cqw_rgb(21_21_21/16%)] tw:font-sans tw:[--dock-tile:calc(100cqw*5/24-4.6cqw)] tw:[--dock-gap:2.4cqw] tw:[-webkit-backdrop-filter:blur(1.6cqw)] tw:[.card:has(&)]:overflow-visible! tw:[.card:has(&)]:bg-transparent! tw:[.card:has(&)]:shadow-none! tw:[.folder_.folder\_\_item:has(&)]:[--y:-6%]! tw:[.folder:hover_.folder\_\_item:has(&)]:[--y:-125%]! tw:[.folder:has(:focus-visible)_.folder\_\_item:has(&)]:[--y:-125%]!"
      ref={barRef}
      style={{ '--dock-count': item.apps.length } as CSSProperties}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {item.apps.map((app, index) => (
        <span
          /* --shift moves the whole slot sideways, so the tooltip and the
             dot travel with the tile they belong to. While the bar's own
             :hover is live the follow keeps up with the pointer at 120ms;
             the moment it leaves this reverts to the slower, eased return
             every other hover state on the site uses. */
          className="tw:relative tw:flex tw:flex-none tw:flex-col tw:items-center tw:gap-[0.6cqw] tw:w-(--dock-tile) tw:[transform:translateX(var(--shift,0px))] tw:[transition:transform_var(--duration-base)_var(--ease-out-cubic)] tw:group-hover:[transition:transform_120ms_var(--ease-out-cubic)] tw:motion-reduce:transition-none"
          key={app.id}
          ref={(element) => {
            slotRefs.current[index] = element
          }}
        >
          <span
            /* Centred over its own tile. Rises with the tile: a tile at
               --mag grows upward by (mag - 1) tile widths, and the tooltip
               has to clear that or it sits inside the icon. Only on the
               presented card and only for the nearest slot (data-active,
               written above) — in the scatter the dock is too small for a
               name to read as anything but a smudge. */
            className="tw:absolute tw:left-1/2 tw:bottom-[calc(100%+1.4cqw)] tw:w-max tw:max-w-[64cqw] tw:rounded-[1.8cqw] tw:bg-[rgb(30_30_30/88%)] tw:px-[2.4cqw] tw:py-[1.5cqw] tw:text-center tw:text-[#f9f9f9] tw:opacity-0 tw:pointer-events-none tw:[transform:translate(-50%,calc((1-var(--mag,1))*var(--dock-tile)+0.8cqw))] tw:[transition:opacity_var(--duration-fast)_var(--ease-out-cubic),transform_var(--duration-fast)_var(--ease-out-cubic)] tw:motion-reduce:transition-none tw:after:content-[''] tw:after:absolute tw:after:top-full tw:after:left-1/2 tw:after:size-[1.6cqw] tw:after:bg-[inherit] tw:after:[transform:translate(-50%,-55%)_rotate(45deg)] tw:after:rounded-[0_0_0.3cqw_0] tw:[.folder\_\_item.is-focused_.card[data-kind='dock']_[data-active]_&]:opacity-100 tw:[.folder\_\_item.is-focused_.card[data-kind='dock']_[data-active]_&]:[transform:translate(-50%,calc((1-var(--mag,1))*var(--dock-tile)))]"
            aria-hidden="true"
          >
            <span className="tw:block tw:font-display tw:text-[4.6cqw] tw:font-semibold tw:tracking-snug tw:leading-tight">
              {app.name}
            </span>
            <span className="tw:block tw:mt-[0.5cqw] tw:text-pretty tw:text-[3.2cqw] tw:leading-normal tw:text-[rgb(249_249_249/70%)]">
              {app.note}
            </span>
          </span>
          <img
            /* Grows up off the bar, never down into it or sideways into a
               neighbour — the neighbour clearance is --shift's job. The
               images already carry their own squircle, shadow and inset —
               no frame to add here. */
            className="tw:block tw:w-(--dock-tile) tw:h-(--dock-tile) tw:origin-bottom tw:[transform:scale(var(--mag,1))] tw:[transition:transform_var(--duration-base)_var(--ease-out-cubic)] tw:group-hover:[transition:transform_120ms_var(--ease-out-cubic)] tw:motion-reduce:transition-none"
            src={app.icon}
            alt=""
            draggable={false}
          />
        </span>
      ))}
    </span>
  )
}
