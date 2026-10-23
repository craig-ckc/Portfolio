import { describe, expect, it } from 'vitest'
import { advanceFieldPan } from './project-field-motion'
import { buildFieldLayout, projectTile } from './project-field-layout'

const layout = buildFieldLayout([{ src: '/project.svg', width: 640, height: 420, title: 'Project', href: '/project' }], 900)

describe('free field motion', () => {
  it('keeps the diagonal heading from a fling all the way into continuous drift', () => {
    const pan = { x: 0, y: 0, vx: 1.6, vy: -.8 }
    const drift = { x: .008, y: -.004 }
    for (let frame = 0; frame < 240; frame++) {
      const previous = { ...pan }
      advanceFieldPan(pan, 16.667, .94, drift)
      expect(pan.x).toBeGreaterThan(previous.x)
      expect(pan.y).toBeLessThan(previous.y)
      expect((pan.x - previous.x) / (pan.y - previous.y)).toBeCloseTo(-2)
    }
    expect(pan.vx).toBeCloseTo(drift.x, 5)
    expect(pan.vy).toBeCloseTo(drift.y, 5)
    expect(Math.hypot(pan.vx, pan.vy)).toBeGreaterThan(0)
  })

  it('leaves a disabled-drift fling at its natural endpoint without alignment', () => {
    const pan = { x: 33, y: 57, vx: .8, vy: .4 }
    const friction = -Math.log(.94) / 16.667
    for (let frame = 0; frame < 600; frame++) advanceFieldPan(pan, 16.667, .94, { x: 0, y: 0 })
    expect(pan.x).toBeCloseTo(33 + .8 / friction)
    expect(pan.y).toBeCloseTo(57 + .4 / friction)
  })

  it('never changes the gallery trajectory as projects grow and shrink', () => {
    const pan = { x: 40, y: 70, vx: .4, vy: .8 }
    const baseline = { ...pan }
    for (let frame = 0; frame < 100; frame++) {
      advanceFieldPan(pan, 16.667, .94, { x: .004, y: .008 })
      layout.tiles.forEach(tile => projectTile(tile, layout, pan))
      advanceFieldPan(baseline, 16.667, .94, { x: .004, y: .008 })
      expect(pan).toEqual(baseline)
    }
  })

  it('has the same inertia and drift at 30, 60, and 120 fps', () => {
    const advance = (fps: number) => {
      const pan = { x: 150, y: -75, vx: -.8, vy: .4 }
      for (let frame = 0; frame < fps; frame++) advanceFieldPan(pan, 1000 / fps, .94, { x: -.008, y: .004 })
      return pan
    }
    const baseline = advance(30)
    for (const fps of [60, 120]) {
      const result = advance(fps)
      for (const key of ['x', 'y', 'vx', 'vy'] as const) expect(result[key]).toBeCloseTo(baseline[key], 10)
    }
  })

  it('eases a new grab instead of stopping the moving field on pointer-down', () => {
    const pan = { x: 0, y: 0, vx: 1, vy: .5 }
    advanceFieldPan(pan, 16, .94, { x: 0, y: 0 }, true)
    expect(pan.x).toBeGreaterThan(0)
    expect(pan.vx).toBeGreaterThan(0)
    expect(pan.vx).toBeLessThan(1)
  })

  it('keeps zero-inertia and zero-time updates finite', () => {
    const pan = { x: 0, y: 0, vx: 1, vy: .5 }
    advanceFieldPan(pan, 0, 0, { x: .005, y: 0 })
    expect(pan).toEqual({ x: 0, y: 0, vx: .005, vy: 0 })
  })
})
