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
import { PhoneFace } from './faces/phone'
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
 * left out of the transition utilities below, so there is no timer in here.
 *
 * The veil is under the whole object rather than in the middle of it — the page
 * goes out of focus, the folder stays sharp — so nothing ever crosses it, and
 * its fade and the flight above are free of each other.
 *
 * This file measures. Every value being moved lives beside the element it
 * moves, as a Tailwind arbitrary property or an inline custom property.
 */

const metrics = folderMetrics(folderShape)

/**
 * Places on screen, and the rotation and zoom each card takes there. Widths
 * vary with what the card is, so a landscape frame gets the room it needs;
 * rotations are small and alternate, which is what reads as set down by hand
 * rather than laid out on a grid.
 *
 * The corner the folder sits in was the largest empty region on the screen,
 * so one card comes to rest over the folder and the rest spread out from
 * there, and what is left over is spread around the edges instead of pooled
 * in one place.
 *
 * --slot-focus is the extra scale a card takes when it is the one being
 * looked at, picked so that every card arrives at about the same 28vw
 * however small it sits here. --folder-zoom (set on the folder itself, see
 * its className below) scales all of them at once, for viewports with less
 * room to grow into.
 *
 * Breakpoints matched to the hero's own. Below 1200px the hero stacks and the
 * object column goes full width, which moves the folder from the lower right
 * to the bottom left — both bands below 1200 restyle --slot-x/--slot-y/--slot-r
 * for that; below 900 there is no room to scatter at all and it becomes two
 * columns stacked above the folder, which also restyles --slot-w/--slot-focus
 * (--slot-r stays at the 900–1199 band's value, since the sub-900 band never
 * touches it — same cascade as the old max-width rules, just written from the
 * narrow end up).
 *
 * Applied identically to every target box and every item: each is the same
 * literal class list, and `nth-[n]:` picks out which of the six a rule lands
 * on, so there is one string to keep in step with folder-shape rather than
 * six near-identical ones.
 */
const SLOT_UTILITIES = `
  nth-[1]:[--slot-x:27vw] nth-[1]:[--slot-y:16svh] nth-[1]:[--slot-w:min(24vw,17svh)] nth-[1]:[--slot-r:7deg] nth-[1]:[--slot-focus:2.75]
  md:nth-[1]:[--slot-x:88vw] md:nth-[1]:[--slot-y:42svh]
  lg:nth-[1]:[--slot-x:12vw] lg:nth-[1]:[--slot-y:42svh] lg:nth-[1]:[--slot-w:15vw] lg:nth-[1]:[--slot-r:-7deg] lg:nth-[1]:[--slot-focus:1.87]
  nth-[2]:[--slot-x:73vw] nth-[2]:[--slot-y:16svh] nth-[2]:[--slot-w:min(24vw,17svh)] nth-[2]:[--slot-r:-5deg] nth-[2]:[--slot-focus:2.75]
  md:nth-[2]:[--slot-x:70vw] md:nth-[2]:[--slot-y:17svh]
  lg:nth-[2]:[--slot-x:30vw] lg:nth-[2]:[--slot-y:17svh] lg:nth-[2]:[--slot-w:13vw] lg:nth-[2]:[--slot-r:5deg] lg:nth-[2]:[--slot-focus:2.15]
  nth-[3]:[--slot-x:30vw] nth-[3]:[--slot-y:42svh] nth-[3]:[--slot-w:min(32vw,23svh)] nth-[3]:[--slot-r:3deg] nth-[3]:[--slot-focus:2.06]
  md:nth-[3]:[--slot-x:40vw] md:nth-[3]:[--slot-y:22svh]
  lg:nth-[3]:[--slot-x:60vw] lg:nth-[3]:[--slot-y:22svh] lg:nth-[3]:[--slot-w:20vw] lg:nth-[3]:[--slot-r:-3deg] lg:nth-[3]:[--slot-focus:1.4]
  nth-[4]:[--slot-x:74vw] nth-[4]:[--slot-y:42svh] nth-[4]:[--slot-w:min(24vw,17svh)] nth-[4]:[--slot-r:-8deg] nth-[4]:[--slot-focus:2.75]
  md:nth-[4]:[--slot-x:80vw] md:nth-[4]:[--slot-y:76svh]
  lg:nth-[4]:[--slot-x:20vw] lg:nth-[4]:[--slot-y:76svh] lg:nth-[4]:[--slot-w:14vw] lg:nth-[4]:[--slot-r:8deg] lg:nth-[4]:[--slot-focus:2]
  nth-[5]:[--slot-x:27vw] nth-[5]:[--slot-y:68svh] nth-[5]:[--slot-w:min(24vw,17svh)] nth-[5]:[--slot-r:5deg] nth-[5]:[--slot-focus:2.75]
  md:nth-[5]:[--slot-x:55vw] md:nth-[5]:[--slot-y:64svh]
  lg:nth-[5]:[--slot-x:45vw] lg:nth-[5]:[--slot-y:64svh] lg:nth-[5]:[--slot-w:14vw] lg:nth-[5]:[--slot-r:-5deg] lg:nth-[5]:[--slot-focus:2]
  nth-[6]:[--slot-x:73vw] nth-[6]:[--slot-y:68svh] nth-[6]:[--slot-w:min(24vw,17svh)] nth-[6]:[--slot-r:-6deg] nth-[6]:[--slot-focus:2.75]
  md:nth-[6]:[--slot-x:21vw] md:nth-[6]:[--slot-y:62svh]
  lg:nth-[6]:[--slot-x:79vw] lg:nth-[6]:[--slot-y:62svh] lg:nth-[6]:[--slot-w:18vw] lg:nth-[6]:[--slot-r:6deg] lg:nth-[6]:[--slot-focus:1.56]
`

/**
 * The resting fan (idle, tucked to the right of the tab) and the wider fan it
 * opens into on hover or keyboard focus. The stagger on the way out runs
 * outward from the middle (--i); coming back everything eases home together,
 * so --i is never touched by the hover condition, only --x/--y/--r are.
 *
 * `:focus-visible` and not `:focus-within`, which would also match the focus
 * a mouse click leaves behind — the folder would then sit open after being
 * closed with the pointer. Applied to the item itself as one condition list,
 * matching the house style already used in nav-bar.tsx's own arbitrary
 * ancestor-state selector, opacity-0 when the folder is open, for an
 * arbitrary selector reaching off an ancestor's state.
 */
const FAN_UTILITIES = `
  nth-[1]:[--i:2] nth-[1]:[--x:-36%] nth-[1]:[--y:2%] nth-[1]:[--r:-7deg]
  [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[1]:[--x:-64%] [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[1]:[--y:-18%] [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[1]:[--r:-14deg]
  nth-[2]:[--i:1] nth-[2]:[--x:-21%] nth-[2]:[--y:0%] nth-[2]:[--r:-4deg]
  [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[2]:[--x:-38%] [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[2]:[--y:-21%] [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[2]:[--r:-8.5deg]
  nth-[3]:[--i:0] nth-[3]:[--x:-7%] nth-[3]:[--y:-1%] nth-[3]:[--r:-1.5deg]
  [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[3]:[--x:-13%] [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[3]:[--y:-23%] [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[3]:[--r:-3deg]
  nth-[4]:[--i:0] nth-[4]:[--x:7%] nth-[4]:[--y:-1%] nth-[4]:[--r:1.5deg]
  [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[4]:[--x:13%] [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[4]:[--y:-23%] [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[4]:[--r:3deg]
  nth-[5]:[--i:1] nth-[5]:[--x:21%] nth-[5]:[--y:0%] nth-[5]:[--r:4deg]
  [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[5]:[--x:38%] [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[5]:[--y:-21%] [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[5]:[--r:8.5deg]
  nth-[6]:[--i:2] nth-[6]:[--x:36%] nth-[6]:[--y:2%] nth-[6]:[--r:7deg]
  [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[6]:[--x:64%] [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[6]:[--y:-18%] [.folder:hover_&,.folder:has(:focus-visible)_&]:nth-[6]:[--r:14deg]
`

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
 * How long the return takes, read off the same token the utilities animate
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

/**
 * How far a card's offset may go before any of it would leave the screen.
 *
 * Measured off everything the card paints, not just its own box: some faces
 * draw past their card — the polaroids are a fanned pile on a card with
 * overflow left visible, and they fan wider still under the pointer — and a
 * print hanging past the edge is overflow all the same, with a scrollbar
 * grown under the scatter to reach it. So the box is the union of the card
 * and what it paints (see paintedParts), rotation and the lift included, and
 * it is taken again every frame the card moves, since the fan and the lean
 * both change while it is in hand.
 */
function reach(element: HTMLElement, parts: Element[], centre: Point, position: Point): Bounds {
  let { left, top, right, bottom } = element.getBoundingClientRect()

  for (const child of parts) {
    const box = child.getBoundingClientRect()
    if (box.width === 0 && box.height === 0) continue
    left = Math.min(left, box.left)
    top = Math.min(top, box.top)
    right = Math.max(right, box.right)
    bottom = Math.max(bottom, box.bottom)
  }

  /* Where the card's centre is now, so the extent can be carried to wherever
     the offset would put it. */
  const x = centre.x + position.x
  const y = centre.y + position.y

  return {
    minX: x - left + EDGE_MARGIN - centre.x,
    maxX: document.documentElement.clientWidth - (right - x) - EDGE_MARGIN - centre.x,
    minY: y - top + EDGE_MARGIN - centre.y,
    maxY: window.innerHeight - (bottom - y) - EDGE_MARGIN - centre.y,
  }
}

/**
 * The elements inside a card that can paint outside it: all of them, except
 * whatever sits inside something that clips. A rect does not know about
 * clipping, and the lanyard's foil and glare are laid out several times the
 * badge's size inside a badge that cuts them off — counted, they would hold
 * the lanyard far off every edge. Walked once, when the card is picked up;
 * which elements clip does not change while it is in hand.
 */
function paintedParts(element: HTMLElement) {
  const parts: Element[] = []
  const walk = (node: Element) => {
    for (const child of node.children) {
      parts.push(child)
      const style = getComputedStyle(child)
      if (style.overflowX === 'visible' && style.overflowY === 'visible') walk(child)
    }
  }

  walk(element)
  return parts
}

/** Write where a card is and how it is moving, for the transform utilities to read. */
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
  /** Where the scatter put the card's centre: the point the offset is from. */
  centre: Point
  /** What inside the card is measured for its reach. */
  parts: Element[]
  /** How far the offset may go before any of the card would leave the screen. */
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
 * The plain kinds are drawn here. The richer ones — each with a hover
 * life of its own — have a file each under ./faces, and a stylesheet each under
 * src/styles/faces, so their moving parts stay out of this file's way.
 */
function FolderFace({ item, focused }: { item: FolderItem; focused: boolean }) {
  switch (item.kind) {
    case 'photo':
      return (
        <img
          className="block h-full w-full object-cover"
          src={item.src}
          alt={item.alt ?? ''}
          loading="lazy"
          draggable={false}
        />
      )

    case 'logo':
      return (
        /* The card frame's inner drawing: a struck-off mark over its name, on
           a soft paper gradient. BEYOND THE FRAME: the gradient is a themed
           two-stop wash with no token equivalent. */
        <span
          className={`
            absolute inset-0 flex flex-col items-start justify-between p-[9cqw] gap-[4cqw]
            font-display tracking-snug leading-snug text-left
            [background:radial-gradient(120%_90%_at_15%_0%,#ffffff,transparent_60%),linear-gradient(165deg,#f4f3f1,#e7e6e3)]
          `}
        >
          <span className="grid w-[27cqw] h-[27cqw] place-items-center rounded-full bg-[#151515] text-[#f9f9f9] text-[10.5cqw] font-bold tracking-[0]">
            {item.mark}
          </span>
          <span className="text-[#616161] text-[7cqw] font-medium">{item.label}</span>
        </span>
      )

    case 'note':
      return (
        /* BEYOND THE FRAME: the paper gradient again has no token — a warm
           off-white wash behind a handwritten-feeling note. */
        <span
          className={`
            absolute inset-0 flex flex-col justify-between p-[9cqw] gap-[4cqw]
            font-display tracking-snug leading-snug text-left
            [background:linear-gradient(170deg,#fffdf6,#f6f2e6)]
          `}
        >
          <span className="text-[#2c2c2c] text-[9cqw] font-medium text-pretty">{item.body}</span>
          <span aria-hidden="true" className="h-px shrink-0 rounded-full bg-[rgb(21_21_21/14%)]" />
        </span>
      )

    case 'swatch':
      return (
        <span
          className={`
            absolute inset-0 flex flex-col justify-between p-[6cqw] gap-[5cqw]
            font-display tracking-snug leading-snug text-left
          `}
        >
          <span aria-hidden="true" className="flex flex-1 flex-col overflow-hidden rounded-[1.25cqw]">
            {item.colors.map((color) => (
              <span key={color} className="flex-1" style={{ background: color }} />
            ))}
          </span>
          <span className="pl-[2cqw] text-[#616161] text-[7cqw] font-medium">{item.label}</span>
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
      /* In the scatter the badge lifts and takes one turn on the way in. In
         the middle it follows the pointer, both ways, and the light with it. */
      return <LanyardFace item={item} presented={focused} />

    case 'phone':
      return <PhoneFace item={item} presented={focused} />
  }
}

function Card({ item, focused }: { item: FolderItem; focused: boolean }) {
  return (
    /* `card` stays a bare marker: each face component keys its own hover,
       held and focused styling off `.card[data-kind=…]` in its ``
       utilities, and the screenshot harness drives it too. The face sizes
       itself in cqw off the card's own width — the container is the item
       (below), since an element cannot be its own. */
    <span
      className={`
        card
        relative block overflow-hidden w-full rounded-[1.5cqw] bg-[#fdfdfd]
        shadow-[0_0_0_1px_rgb(21_21_21/8%),0_3px_8px_rgb(21_21_21/10%)]
        [transition:transform_var(--duration-fast)_var(--ease-out-cubic),box-shadow_var(--duration-fast)_var(--ease-standard)]
        data-[ratio=portrait]:aspect-[3/4]
        data-[ratio=landscape]:aspect-[4/3]
        data-[ratio=square]:aspect-square
        data-[ratio=bar]:aspect-[24/5]
        [.folder-slot.is-focused_&]:shadow-[0_0_0_1px_rgb(21_21_21/8%),0_10px_30px_rgb(21_21_21/18%)]
        [.folder-slot.is-held_&]:scale-[1.04] [.folder-slot.is-held_&]:shadow-[0_0_0_1px_rgb(21_21_21/8%),0_14px_30px_rgb(21_21_21/16%)]
      `}
      data-kind={item.kind}
      data-ratio={item.ratio ?? 'portrait'}
    >
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
   * They are here so the arrangement — and its breakpoints — can stay beside
   * SLOT_UTILITIES above with everything else, and this file only has to
   * measure it.
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
   * the transform below brackets the scale and rotation with a half-height
   * shift each way. That moves their pivot to the middle of the card, so a
   * translate means what it says even though the fan turns the cards about
   * their bottom edge. Without it, the rotation would have to be unpicked here
   * to work out where the centre had ended up.
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

      /* Taken off the card as it was last painted, before it is moved on. */
      grip.bounds = reach(element, grip.parts, grip.centre, grip.motion.position)

      if (grip.mode === 'held') {
        grip.target = within(grip.target, grip.bounds)
        grip.motion = confine(
          grip.instant ? { position: grip.target, velocity: { x: 0, y: 0 } } : follow(grip.motion, grip.target, dt),
          grip.bounds,
        )
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

      grip.mode = 'held'
      grip.base = offset
      grip.target = offset
      grip.motion = { position: offset, velocity: { x: 0, y: 0 } }
      grip.centre = centre
      grip.parts = paintedParts(element)
      grip.bounds = reach(element, grip.parts, centre, offset)
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
        centre: { x: 0, y: 0 },
        parts: [],
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

    /* And the page never grows sideways under the scatter. Cards are kept on
       screen by reach(), but that is measured, and a face that draws past its
       card in some way it does not catch would otherwise hand the page a
       horizontal scrollbar. Clipping only the x axis leaves the vertical bar
       exactly where it was — the one the note on Lenis below is protecting.
       Inline, because the rule in styles.css that undoes Lenis's own clip sets
       the whole overflow shorthand at a weight a stylesheet rule here would
       have to fight. */
    const page = document.documentElement
    const overflowX = page.style.overflowX
    page.style.overflowX = 'clip'
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
      page.style.overflowX = overflowX
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
    /* PAINT ORDER is what makes the whole thing work, so it is worth reading
       before anything else here. There is one copy of each card and it is the
       one that travels — nothing is cloned, nothing cross-fades. Within the
       stage:

         0  back        the flat panel behind everything
         1  contents    while the folder is shut, which is what hides all but a sliver
         2  flap
         3  veil        the blurred layer that takes the page out of focus
         4  contents    while they are out, over the veil
         5  chrome      close and caption

       The folder goes under the veil with the rest of the page. It is the
       object the contents came out of, not one of them: once they are out, it
       has nothing left to say, and leaving it sharp in the corner gives the
       eye a second thing to look at while it is trying to look at six.

       The step from 1 to 4 happens in the frame the folder is opened, and the
       step back down in the frame it is closed. There is no third state part
       way through the flight: z-index is left out of the transition utilities
       so that it simply applies, which is also why nothing here needs a timer
       in JavaScript.

       `folder`, `folder__open`, `folder__item`, `folder__close` and `card`
       stay bare markers throughout: JS classList and the faces' own
       stylesheets key off them, and the screenshot harness drives them too.
       Everything else that used to be a BEM hook has become plain elements
       styled with  utilities directly, since nothing outside this file
       ever selected them. */
    <div
      className={`
        folder
        block w-(--folder-size) max-w-content
        [--folder-tilt:32deg] [--folder-perspective:1200px] [--folder-card:40%]
        [--folder-size:min(88%,380px,47svh)] lg:[--folder-size:min(75%,47svh)]
        [@media(max-height:760px)]:[--folder-zoom:0.78]
        [--folder-shadow-rest:0_1px_2px_rgb(21_21_21/6%),0_8px_20px_rgb(21_21_21/8%)]
        dark:[--folder-shadow-rest:0_1px_2px_rgb(0_0_0/30%),0_8px_20px_rgb(0_0_0/34%)]
        [--folder-drop:drop-shadow(0_1px_2px_rgb(21_21_21/6%))_drop-shadow(0_8px_20px_rgb(21_21_21/8%))]
        dark:[--folder-drop:drop-shadow(0_1px_2px_rgb(0_0_0/30%))_drop-shadow(0_8px_20px_rgb(0_0_0/36%))]
        [--folder-face-drop:drop-shadow(0_-1px_1px_rgb(21_21_21/5%))_drop-shadow(0_6px_16px_rgb(21_21_21/10%))]
        dark:[--folder-face-drop:drop-shadow(0_-1px_1px_rgb(0_0_0/24%))_drop-shadow(0_6px_16px_rgb(0_0_0/34%))]
        [--folder-face-drop-raised:drop-shadow(0_-1px_1px_rgb(21_21_21/5%))_drop-shadow(0_2px_6px_rgb(142_143_143/18%))_drop-shadow(0_16px_30px_rgb(21_21_21/14%))]
        dark:[--folder-face-drop-raised:drop-shadow(0_-1px_1px_rgb(0_0_0/24%))_drop-shadow(0_2px_6px_rgb(0_0_0/30%))_drop-shadow(0_16px_30px_rgb(0_0_0/44%))]
        [--folder-paper:#ebe9e4] dark:[--folder-paper:#2b2b2b]
        [--folder-paper-edge:rgb(255_255_255/82%)] dark:[--folder-paper-edge:rgb(255_255_255/13%)]
        [--folder-face-top:rgb(255_255_255/80%)] dark:[--folder-face-top:rgb(45_45_45/82%)]
        [--folder-face-bottom:rgb(246_246_245/68%)] dark:[--folder-face-bottom:rgb(29_29_29/72%)]
        [--folder-flap-edge:rgb(255_255_255/76%)] dark:[--folder-flap-edge:rgb(255_255_255/8%)]
        [--folder-veil:rgb(249_249_249/82%)] dark:[--folder-veil:rgb(15_15_15/78%)]
        [--folder-chrome:rgb(255_255_255/82%)] dark:[--folder-chrome:rgb(38_38_38/82%)]
        [--folder-chrome-edge:rgb(21_21_21/10%)] dark:[--folder-chrome-edge:rgb(255_255_255/10%)]
        [&.is-open]:relative [&.is-closing]:relative [&.is-open]:z-10 [&.is-closing]:z-10
        ${stage === 'open' ? ' is-open' : ''}${stage === 'closing' ? ' is-closing' : ''}
      `}
      ref={rootRef}
    >
      {/* A stacking context of its own, so the layer numbers above mean what
          they say locally and do not have to be reconciled with the rest of
          the page. `isolate` and not a transform: a transform here would make
          the veil's `position: fixed` resolve against this box instead of the
          viewport, and the whole overlay would be trapped inside the folder.
          Same reason the flap carries its own `perspective()` rather than
          taking one from here. aspect-ratio and --folder-contents-top are set
          inline from folderMetrics(), so folder-shape.ts stays the single
          source. */}
      <span
        className="relative block w-full isolate"
        style={
          {
            aspectRatio: metrics.aspectRatio,
            '--folder-contents-top': metrics.contentsTop,
          } as CSSProperties
        }
      >
        {/* The front's edge, twice over: once as the clip that shapes the
            frosted layer, once as the gradient that fills the drawn face. Both
            come off the same path in src/lib/folder-shape.ts. Definitions
            only, never drawn, kept out of the layout. */}
        <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true" focusable="false">
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

        {/* The silhouette. One generated path, and the only shadow that
            touches the page — which is why it is a drop-shadow on the path and
            not a box-shadow on a rectangle: the tab has to cast a shadow too.
            No transform, no transition: this layer is nailed down. */}
        <svg
          className="absolute inset-0 z-0 w-full h-full [overflow:visible] [filter:var(--folder-drop)]"
          viewBox={metrics.viewBox}
          aria-hidden="true"
        >
          <path d={metrics.back} className="fill-(--folder-paper) stroke-(--folder-paper-edge) stroke-1" />
        </svg>

        {/* No z-index of its own, deliberately: the cards have to be able to
            move between layers 1 and 4, and a positioned parent with a
            z-index would trap them in one of its own. */}
        <span className="absolute inset-0" ref={stackRef} inert={inFolder}>
          {folderItems.map((item) => (
            /* Every card hangs from the body's top edge, so they all peek by
               the same amount however tall they are, and the taller ones
               simply reach further down into the folder where nothing sees
               them.

               The fan comes from rotation about each card's bottom edge, which
               swings the top out past the flap while the bottom stays inside
               it. --x is a share of the card's own width, so the fan scales
               with the object instead of blowing out of it in a narrower
               column.

               Positioned by `left` alone rather than centred with a translate,
               so that the resting transform is nothing but the move — which is
               what lets aim() work it out as a plain difference of centres.

               Coming back is a plain ease. The spring is for going out only:
               transitions take their timing from the state being entered, so
               the two directions can differ just by declaring both.

               BEYOND THE FRAME: `left: calc(50% - var(--folder-card) / 2)` has
               no token equivalent — it centres the card off its own width
               share of the stage.

               `folder-slot` rides alongside the mandatory `folder__item` marker
               purely so Card's arbitrary selectors (below) have an ancestor
               class with no underscore to key off: a literal `\_` meant for
               Tailwind's own escaping is indistinguishable from a JS string
               escape inside a template literal, so it never survives to the
               DOM as typed — the double underscore in a BEM name cannot be
               escaped from inside a class attribute written this way.

               Two of the rules below repeat `.folder` in their selector
               (`.folder.is-open.folder …`) rather than writing `.folder.is-open`
               once: as plain classes every one of these arbitrary-selector
               rules sits in the same cascade layer, so a genuine tie in
               class-count specificity falls back to source order, which
               Tailwind is not obliged to keep in the order written here. The
               plain is-open transform ties with the hover-fan transform
               (three classes each) without the repeat, and the focused
               transform in turn ties with the (repeated) plain is-open
               transform without a second repeat of its own — so it carries
               one more than that. */
            <button
              className={`
                folder__item folder-slot${focused === item.id ? ' is-focused' : ''}
                absolute top-(--folder-contents-top) left-[calc(50%_-_var(--folder-card)/2)] z-1 w-(--folder-card)
                p-0 @container cursor-pointer origin-bottom
                [transform:translate(var(--x,0%),var(--y,0%))_rotate(var(--r,0deg))]
                [transition:transform_var(--duration-base)_var(--ease-out-cubic)]
                [.folder:hover_&,.folder:has(:focus-visible)_&]:[transition:transform_var(--duration-slow)_var(--ease-spring-out)]
                [.folder:hover_&,.folder:has(:focus-visible)_&]:[transition-delay:calc(var(--i,0)_*_40ms)]
                focus-visible:outline-offset-[6px]
                ${FAN_UTILITIES}
                ${SLOT_UTILITIES}
                [.folder.is-open.folder_&]:[transform:translate(var(--out-x,0px),var(--out-y,0px))_translate(var(--drag-x,0px),var(--drag-y,0px))_translateY(-50%)_scale(var(--out-scale,1))_rotate(calc(var(--slot-r,0deg)_+_var(--drag-r,0deg)))_translateY(50%)]
                [.folder.is-open_&]:z-[calc(10+var(--raised,0))] [.folder.is-open_&]:cursor-grab [.folder.is-open_&]:touch-none
                [.folder.is-open_&]:[transition:transform_var(--duration-slow)_var(--ease-spring-out)]
                [.folder.is-open_&]:[transition-delay:calc(var(--i,0)_*_40ms)]
                [.folder.is-open_&.is-held]:[transition:none] [.folder.is-open_&.is-coasting]:[transition:none]
                [.folder.is-open_&.is-held]:cursor-grabbing
                [.folder.is-open_&.is-focused]:z-[17] [.folder.is-open_&.is-focused]:cursor-zoom-out
                [.folder.is-open.folder_&.is-focused]:[transform:translate(var(--out-x,0px),var(--out-y,0px))_translate(calc(50vw_-_var(--slot-x)),calc(50svh_-_var(--slot-y)))_translateY(-50%)_scale(calc(var(--out-scale,1)_*_var(--slot-focus,2)_*_var(--folder-zoom,1)))_rotate(0deg)_translateY(50%)]
                [.folder.is-closing_&]:[transition:transform_var(--duration-slow)_var(--ease-standard)]
                [.folder.is-open:has(.is-focused)_&:not(.is-focused)]:opacity-[0.28]
              `}
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
            once: a span carries the frost, since backdrop-filter needs a real
            box to blur behind, and is cut to the edge with a clip; the drawn
            face over it carries the fill, the hairline and the cast shadow,
            since a clip would have taken a box-shadow off with it.

            The stickers ride here rather than on the stage, so they tip with
            the front — which is most of the reason to put them on it.

            Decorative to the last pixel, so it takes no pointer events — the
            shut folder's hit target sits above it, and once open the contents
            do.

            The perspective is on this transform rather than on the stage,
            which puts the vanishing point on the hinge where it belongs and
            leaves the stage free of the transform that would otherwise capture
            the veil's `position: fixed`. */}
        <span
          aria-hidden="true"
          className={`
            absolute inset-0 z-2 pointer-events-none origin-bottom [will-change:transform]
            [transform:perspective(var(--folder-perspective))_rotateX(0deg)]
            [transition:transform_var(--duration-base)_var(--ease-out-cubic)]
            [.folder:hover_&,.folder:has(:focus-visible)_&,.folder.is-open_&]:[transform:perspective(var(--folder-perspective))_rotateX(calc(var(--folder-tilt)_*_-1))]
            [.folder:hover_&,.folder:has(:focus-visible)_&,.folder.is-open_&]:[transition:transform_var(--duration-slow)_var(--ease-spring-out)]
            [.folder.is-closing.folder_&]:[transition:transform_var(--duration-slow)_var(--ease-standard)]
          `}
        >
          {/* The frost, cut to the front's edge. It has to be a real box:
              backdrop-filter blurs what is behind an element's own background,
              and an SVG path has no background to blur behind. So the shape
              arrives as a clip instead — which is also why the fill, the
              hairline and the shadow are on the face below rather than here. A
              clip takes a box-shadow off with it.

              Blur chosen so what is behind reads as tone rather than as
              objects: at 16px the cards were still recognisable through it and
              the panel looked smudged rather than frosted. */}
          <span
            className="absolute inset-0 backdrop-blur-[26px] backdrop-saturate-[140%]"
            style={{ clipPath: `url(#${clipId})` }}
          />

          {/* The drawn front: the gradient over the frost, the hairline on the
              edge, and the cast shadow. */}
          <svg
            className={`
              absolute inset-0 w-full h-full [overflow:visible]
              [filter:var(--folder-face-drop)] transition-[filter] duration-320 ease-standard
              [.folder:hover_&,.folder:has(:focus-visible)_&,.folder.is-open_&]:[filter:var(--folder-face-drop-raised)]
            `}
            viewBox={metrics.viewBox}
          >
            <path d={metrics.front} fill={`url(#${fillId})`} className="stroke-(--folder-flap-edge) stroke-1" />
          </svg>

          {/* Placed on the stage, not on the drawn front, since the layer they
              sit in spans the whole object while the shape inside it starts a
              quarter of the way down. So these are stage percentages that
              happen to land on the front.

              A touch of their own on top of the flap's move, so they read as
              stuck on rather than printed. */}
          <span
            className={`
              absolute top-[41%] left-[12%] w-[22%] [--r:-7deg]
              [filter:drop-shadow(0_4px_8px_rgb(21_21_21/18%))] [transform:rotate(var(--r))]
              transition-transform duration-320 ease-out-cubic
              [.folder:hover_&,.folder.is-open_&]:[transform:rotate(-11deg)_scale(1.04)]
            `}
          >
            <StampSticker />
          </span>
          <span
            className={`
              absolute top-[53%] left-[62%] w-[20%] [--r:6deg]
              [filter:drop-shadow(0_4px_8px_rgb(21_21_21/18%))] [transform:rotate(var(--r))]
              transition-transform duration-320 ease-out-cubic
              [.folder:hover_&,.folder.is-open_&]:[transform:rotate(10deg)_scale(1.04)]
            `}
          >
            <ToriiSticker />
          </span>
        </span>

        {/* Never painted and never touched by the pointer. They are here to
            be measured: the arrangement, its sizes and its breakpoints stay in
            SLOT_UTILITIES above, and the cards are sent to wherever these end
            up. Each entry is read by two rules: the target box takes the
            position and width, the card itself takes the rotation and the
            zoom. */}
        <span className="fixed inset-0 z-[-1] invisible pointer-events-none" ref={targetsRef} aria-hidden="true">
          {folderItems.map((item) => (
            <span
              key={item.id}
              className={`absolute left-(--slot-x) top-(--slot-y) w-(--slot-w) h-px [transform:translate(-50%,-50%)] ${SLOT_UTILITIES}`}
            />
          ))}
        </span>

        {/* Empty space is the way out of a card. It only closes the folder
            once nothing is being looked at, so putting a card down never costs
            you the whole scatter.

            Fixed to the viewport from inside the folder, which only works
            because nothing between here and the root has a transform. Above
            the flap and below the contents, so the folder goes soft with the
            page while the cards that came out of it stay sharp over the top. */}
        <button
          type="button"
          inert={inFolder}
          aria-label={focused ? 'Put this back' : `Close ${caption}`}
          onClick={dismiss}
          className={`
            fixed inset-0 z-3 w-full h-full p-0 bg-(--folder-veil)
            backdrop-blur-[28px] backdrop-saturate-[125%] cursor-zoom-out opacity-0
            [transition:opacity_var(--veil-clear)_var(--ease-standard)]
            [.folder.is-open_&]:opacity-100 [.folder.is-open_&]:[transition-duration:var(--veil-fade)]
          `}
        />

        {/* One caption for whichever card is being looked at. A single strip
            rather than a label per card: a label riding a card that scales up
            twice over either scales with it or has to be unscaled by hand, and
            neither ends up legible.

            One beat behind the veil for the close button (below), so the
            control lands on a page that has already gone soft rather than
            racing the contents out of the folder. */}
        <p
          aria-live="polite"
          className={`
            fixed z-20 m-0 bottom-md md:bottom-2xl left-1/2 flex max-w-[min(90vw,30rem)] items-baseline gap-xs
            py-xs px-md rounded-full text-body leading-normal pointer-events-none
            [transform:translate(-50%,var(--spacing-xs))]
            border border-(--folder-chrome-edge) bg-(--folder-chrome) shadow-(--folder-shadow-rest)
            backdrop-blur-[12px] backdrop-saturate-[150%] opacity-0
            [transition:opacity_var(--duration-base)_var(--ease-standard),transform_var(--duration-base)_var(--ease-out-cubic)]
            [.folder.is-open:has(.is-focused)_&]:opacity-100 [.folder.is-open:has(.is-focused)_&]:[transform:translate(-50%,0)]
          `}
        >
          {folderItems.map((item) => (
            <span
              key={item.id}
              hidden={focused !== item.id}
              className="flex min-w-0 items-baseline gap-xs [&[hidden]]:hidden"
            >
              <strong className="overflow-hidden text-foreground font-semibold tracking-snug text-ellipsis whitespace-nowrap">
                {item.label}
              </strong>
              {item.note ? <span className="shrink-0 text-neutral-700">{item.note}</span> : null}
            </span>
          ))}
        </p>

        <button
          className="folder__close fixed top-md right-md md:top-xl md:right-xl z-20 grid w-10 h-10 place-items-center p-0 rounded-full text-foreground cursor-pointer scale-[0.92] border border-(--folder-chrome-edge) bg-(--folder-chrome) shadow-(--folder-shadow-rest) backdrop-blur-[12px] backdrop-saturate-[150%] opacity-0 [transition:opacity_var(--duration-base)_var(--ease-standard),transform_var(--duration-base)_var(--ease-out-cubic)] hover:brightness-[1.04] [.folder.is-open_&]:opacity-100 [.folder.is-open_&]:scale-100 [.folder.is-open_&]:[transition-delay:var(--veil-fade)]"
          type="button"
          ref={closeRef}
          inert={inFolder}
          onClick={closeScatter}
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="w-[15px] h-[15px] fill-none stroke-current [stroke-linecap:round] [stroke-width:1.4]"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
          <span className="sr-only">Close {caption}</span>
        </button>

        {/* The folder as one hit target while it is shut, over the whole
            object so the flap and the tab open it too. Made inert once it is
            open, which takes it out of both the tab order and the pointer's
            way in one word. */}
        <button
          className="folder__open absolute inset-0 z-6 p-0 rounded-lg cursor-pointer focus-visible:outline-offset-[6px]"
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
