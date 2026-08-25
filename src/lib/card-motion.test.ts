import { describe, expect, it } from 'vitest'
import {
  coast,
  confine,
  follow,
  FOLLOW_TAU,
  GLIDE_TAU,
  lean,
  LEAN_MAX,
  MAX_GLIDE,
  release,
  THROW_THRESHOLD,
  type Motion,
  type Point,
} from './card-motion'

const still: Point = { x: 0, y: 0 }
const at = (x: number, y: number): Motion => ({ position: { x, y }, velocity: still })

/** Run a coast to rest at a fixed frame length: where it stopped, and how long it took. */
function coastOut(motion: Motion, rate: number, dt = 1 / 60) {
  let frames = 0
  for (;;) {
    const step = coast(motion, rate, dt)
    motion = step.motion
    frames += 1
    if (step.settled) return { motion, seconds: frames * dt }
    if (frames > 100_000) throw new Error('never settled')
  }
}

describe('follow', () => {
  it('closes 63% of the gap in one time constant, whatever the frame length', () => {
    const target = { x: 100, y: 0 }
    const whole = follow(at(0, 0), target, FOLLOW_TAU)
    expect(whole.position.x).toBeCloseTo(100 * (1 - Math.exp(-1)), 5)

    let split = at(0, 0)
    for (let index = 0; index < 4; index += 1) split = follow(split, target, FOLLOW_TAU / 4)
    expect(split.position.x).toBeCloseTo(whole.position.x, 5)
  })

  it('reports the speed it moved at', () => {
    const step = follow(at(0, 0), { x: 100, y: 50 }, 1 / 60)

    expect(step.velocity.x).toBeCloseTo(step.position.x * 60)
    expect(step.velocity.y).toBeCloseTo(step.position.y * 60)
  })

  it('is still once it is on the target', () => {
    const step = follow(at(30, 30), { x: 30, y: 30 }, 1 / 60)

    expect(step.position).toEqual({ x: 30, y: 30 })
    expect(step.velocity).toEqual(still)
  })

  it('does nothing in no time', () => {
    const motion = at(1, 2)
    expect(follow(motion, { x: 9, y: 9 }, 0)).toBe(motion)
  })
})

describe('release', () => {
  it('puts a near-still card down', () => {
    expect(release({ x: THROW_THRESHOLD - 1, y: 0 })).toBeNull()
  })

  it('lets a moderate throw run its full time', () => {
    expect(release({ x: 500, y: 0 })?.rate).toBeCloseTo(1 / GLIDE_TAU)
  })

  it('keeps the speed of a hard throw and brakes it harder instead', () => {
    const velocity = { x: 3000, y: 0 }
    const glide = release(velocity)

    expect(glide?.velocity).toBe(velocity)
    expect(glide?.rate).toBeGreaterThan(1 / GLIDE_TAU)
    /* Speed over rate is the distance the coast will cover. */
    expect(3000 / (glide?.rate ?? 0)).toBeCloseTo(MAX_GLIDE)
  })
})

describe('coast', () => {
  it('travels speed times the time constant, and never past the cap', () => {
    for (const speed of [100, 700, 3000]) {
      const glide = release({ x: speed, y: 0 })
      if (!glide) throw new Error(`${speed}px/s should coast`)

      const { motion } = coastOut({ position: still, velocity: glide.velocity }, glide.rate)
      const expected = Math.min(speed * GLIDE_TAU, MAX_GLIDE)

      expect(motion.position.x).toBeLessThanOrEqual(expected)
      /* Short by whatever was left under the rest speed: a couple of px at most. */
      expect(motion.position.x).toBeGreaterThan(expected - 2)
    }
  })

  it('covers the same ground at 60Hz and at 120Hz', () => {
    const glide = release({ x: 900, y: -400 })
    if (!glide) throw new Error('should coast')

    const slow = coastOut({ position: still, velocity: glide.velocity }, glide.rate, 1 / 60)
    const fast = coastOut({ position: still, velocity: glide.velocity }, glide.rate, 1 / 120)

    expect(slow.motion.position.x).toBeCloseTo(fast.motion.position.x, 0)
    expect(slow.motion.position.y).toBeCloseTo(fast.motion.position.y, 0)
  })

  it('is still within a second, however it was thrown', () => {
    for (const speed of [100, 700, 3000]) {
      const glide = release({ x: 0, y: speed })
      if (!glide) throw new Error(`${speed}px/s should coast`)

      const { motion, seconds } = coastOut({ position: still, velocity: glide.velocity }, glide.rate)

      expect(seconds).toBeLessThan(1)
      expect(motion.velocity).toEqual(still)
    }
  })

  it('does nothing in no time', () => {
    const motion = { position: still, velocity: { x: 500, y: 0 } }
    expect(coast(motion, 5, 0)).toEqual({ motion, settled: false })
  })
})

describe('confine', () => {
  const bounds = { minX: -100, maxX: 100, minY: -100, maxY: 100 }

  it('stops a card at the edge it ran into and lets it slide along it', () => {
    const hit = confine({ position: { x: 140, y: 20 }, velocity: { x: 500, y: 300 } }, bounds)

    expect(hit.position).toEqual({ x: 100, y: 20 })
    expect(hit.velocity).toEqual({ x: 0, y: 300 })
  })

  it('leaves a card inside alone', () => {
    const motion = { position: { x: 40, y: -60 }, velocity: { x: 500, y: 300 } }
    expect(confine(motion, bounds)).toEqual(motion)
  })
})

describe('lean', () => {
  it('tips into the push, and no further than the cap', () => {
    expect(lean({ x: 200, y: 0 })).toBeCloseTo(0.6)
    expect(lean({ x: -200, y: 0 })).toBeCloseTo(-0.6)
    expect(lean({ x: 5000, y: 0 })).toBe(LEAN_MAX)
    /* Up and down is not a push. */
    expect(lean({ x: 0, y: 900 })).toBe(0)
  })
})
