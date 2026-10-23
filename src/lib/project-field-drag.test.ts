import { describe, expect, it } from 'vitest'
import { FieldDrag } from './project-field-drag'

describe('field drag momentum', () => {
  it('keeps a throw through duplicate final events and release beyond the canvas', () => {
    const drag = new FieldDrag(1, { x: 300, y: 300, time: 0 })
    drag.move({ x: 200, y: 320, time: 40 }, 1)
    drag.move({ x: 100, y: 340, time: 80 }, 1)
    drag.move({ x: 100, y: 340, time: 81 }, 1)
    expect(drag.velocity(85)).toEqual({ x: -2.5, y: -.5 })
  })

  it('produces the same throw at different pointer event rates', () => {
    const velocity = (interval: number) => {
      const drag = new FieldDrag(1, { x: 0, y: 0, time: 0 })
      for (let time = interval; time <= 160; time += interval) drag.move({ x: time * 1.5, y: time * .5, time }, 1)
      return drag.velocity(160)
    }
    expect(velocity(4)).toEqual(velocity(16))
    expect(velocity(16)).toEqual(velocity(40))
  })

  it('fades a held gesture smoothly instead of cutting off at 100 ms', () => {
    const drag = new FieldDrag(1, { x: 0, y: 0, time: 0 })
    drag.move({ x: 80, y: 0, time: 80 }, 1)
    expect(drag.velocity(179).x).toBeGreaterThan(drag.velocity(180).x)
    expect(drag.velocity(180).x).toBeGreaterThan(drag.velocity(181).x)
    expect(drag.velocity(181).x).toBeGreaterThan(.1)
    expect(drag.velocity(480).x).toBeLessThan(.001)
  })

  it('retains the complete movement when a click becomes a drag', () => {
    const drag = new FieldDrag(2, { x: 30, y: 30, time: 0 })
    expect(drag.move({ x: 34, y: 31, time: 10 }, 2)).toEqual({ x: 0, y: 0 })
    expect(drag.moved).toBe(false)
    expect(drag.move({ x: 40, y: 33, time: 20 }, 2)).toEqual({ x: 20, y: -6 })
    expect(drag.moved).toBe(true)
  })

  it('uses the recent direction when a moving field is grabbed again', () => {
    const drag = new FieldDrag(3, { x: 0, y: 0, time: 0 })
    drag.move({ x: 100, y: 0, time: 50 }, 1)
    drag.move({ x: 120, y: 0, time: 80 }, 1)
    drag.move({ x: 70, y: 0, time: 120 }, 1)
    drag.move({ x: 20, y: 0, time: 160 }, 1)
    expect(drag.velocity(160).x).toBeCloseTo(-1.25)
  })
})
