/**
 * How a card moves in the hand, and how it comes to rest once let go.
 *
 * Two regimes, and the seam between them is what has to feel right:
 *
 *   held      the card follows the pointer through a short lag — long enough
 *             to round off the pointer's jitter and let a stop land softly,
 *             short enough that the card never reads as late
 *   coasting  let go, it keeps the speed it had and sheds it steadily, so a
 *             flick carries it a little way and a plain release sets it down
 *
 * The follow is a first-order lag and the coast is exponential decay, and both
 * are integrated exactly over each frame rather than stepped. That is what
 * makes the same gesture read the same at 60Hz and at 120Hz, and it is why the
 * hand-off between the two is seamless: the speed the card has at the moment
 * it is let go is the speed the coast starts from.
 *
 * Pure functions over numbers. hero-folder.tsx owns the events and the DOM and
 * only calls in, so the feel can be tuned and tested here without a browser.
 * Distances are in px and time in seconds throughout.
 */

export type Point = { x: number; y: number }
export type Motion = { position: Point; velocity: Point }
export type Bounds = { minX: number; minY: number; maxX: number; maxY: number }

/** How far the pointer has to travel before a press is a drag and not a click. */
export const DRAG_THRESHOLD = 5

/**
 * The lag, as a time constant: how long the card takes to close 63% of the gap
 * to the pointer. 40ms is a hair over two frames. At a brisk 800px/s the card
 * sits about 30px behind the hand, which is felt as weight rather than seen as
 * delay; when the hand stops, the card is on it within a tenth of a second.
 */
export const FOLLOW_TAU = 0.04

/**
 * How slowly a card sheds speed once let go, as a time constant. It coasts for
 * three or four of these before it is still, and travels its speed times this
 * — so a moderate flick of 700px/s carries it about 125px.
 */
export const GLIDE_TAU = 0.18

/**
 * The furthest a card will coast however hard it is thrown. Cards are things
 * set down on a desk, not pucks; past this the throw is braked harder rather
 * than let run.
 */
export const MAX_GLIDE = 180

/** Below this speed a card that is let go is simply put down where it is. */
export const THROW_THRESHOLD = 60

/** Below this speed a coasting card has stopped. Under a fifth of a pixel a frame. */
export const REST_SPEED = 10

/**
 * The lean: degrees per px/s of horizontal speed, and the most the card will
 * tip. A card pushed across a desk leans a little into the push; this is that,
 * kept small enough to be felt and not seen.
 */
export const LEAN_PER_SPEED = 0.003
export const LEAN_MAX = 3

const STILL: Point = { x: 0, y: 0 }

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/** One frame of the card following the hand. */
export function follow(motion: Motion, target: Point, dt: number): Motion {
  if (dt <= 0) return motion

  const gain = 1 - Math.exp(-dt / FOLLOW_TAU)
  const position = {
    x: motion.position.x + (target.x - motion.position.x) * gain,
    y: motion.position.y + (target.y - motion.position.y) * gain,
  }

  return {
    position,
    velocity: {
      x: (position.x - motion.position.x) / dt,
      y: (position.y - motion.position.y) / dt,
    },
  }
}

/** How quickly a coasting card sheds speed, as the reciprocal of a time constant. */
export type Glide = { velocity: Point; rate: number }

/**
 * What the card does the moment it is let go: nothing, if it was all but
 * still; otherwise coast with the speed it has.
 *
 * The distance cap is applied by shortening the coast, not by cutting the
 * speed. A card that left the hand slower than the hand was moving would be
 * seen to catch on something; one braked harder is simply heavier than it
 * looked.
 */
export function release(velocity: Point): Glide | null {
  const speed = Math.hypot(velocity.x, velocity.y)
  if (speed < THROW_THRESHOLD) return null

  const tau = Math.min(GLIDE_TAU, MAX_GLIDE / speed)
  return { velocity, rate: 1 / tau }
}

/** One frame of a card coasting to rest. */
export function coast(motion: Motion, rate: number, dt: number): { motion: Motion; settled: boolean } {
  if (dt <= 0) return { motion, settled: false }

  const decay = Math.exp(-rate * dt)
  /* The distance covered while the speed fell from v to v·decay. */
  const travel = (1 - decay) / rate
  const velocity = { x: motion.velocity.x * decay, y: motion.velocity.y * decay }
  const settled = Math.hypot(velocity.x, velocity.y) < REST_SPEED

  return {
    settled,
    motion: {
      position: {
        x: motion.position.x + motion.velocity.x * travel,
        y: motion.position.y + motion.velocity.y * travel,
      },
      velocity: settled ? STILL : velocity,
    },
  }
}

/** A point held inside a box. */
export function within(point: Point, bounds: Bounds): Point {
  return {
    x: clamp(point.x, bounds.minX, bounds.maxX),
    y: clamp(point.y, bounds.minY, bounds.maxY),
  }
}

/**
 * A card held inside a box. An edge it runs into stops it dead on that axis
 * and leaves the other alone, so a card thrown into a corner slides along the
 * side rather than bouncing off it — a desk has an edge, not a wall.
 */
export function confine(motion: Motion, bounds: Bounds): Motion {
  const position = within(motion.position, bounds)

  return {
    position,
    velocity: {
      x: position.x === motion.position.x ? motion.velocity.x : 0,
      y: position.y === motion.position.y ? motion.velocity.y : 0,
    },
  }
}

/** The lean a card takes at this speed, in degrees. */
export function lean(velocity: Point) {
  return clamp(velocity.x * LEAN_PER_SPEED, -LEAN_MAX, LEAN_MAX)
}
