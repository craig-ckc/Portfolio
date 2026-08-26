import { describe, expect, it } from 'vitest'
import { fit, layout, magnification, MAX_SCALE, RADIUS } from './dock-magnify'

describe('magnification', () => {
  it('is max at zero distance', () => {
    expect(magnification(0, 100, MAX_SCALE)).toBe(MAX_SCALE)
  })

  it('is exactly 1 at or beyond the radius', () => {
    expect(magnification(100, 100, MAX_SCALE)).toBeCloseTo(1, 10)
    expect(magnification(500, 100, MAX_SCALE)).toBe(1)
  })

  it('is symmetric either side of zero', () => {
    expect(magnification(40, 100, MAX_SCALE)).toBeCloseTo(magnification(-40, 100, MAX_SCALE))
  })

  it('falls off monotonically from zero to the radius', () => {
    const near = magnification(10, 100, MAX_SCALE)
    const mid = magnification(50, 100, MAX_SCALE)
    const far = magnification(90, 100, MAX_SCALE)

    expect(near).toBeGreaterThan(mid)
    expect(mid).toBeGreaterThan(far)
  })

  it('is a curve, not a straight line, between the two ends', () => {
    /* A raised cosine has zero slope at both ends, so a point a quarter of
       the way out has barely eased at all — well above where a straight
       line between max and 1 would put it. */
    const quarter = magnification(25, 100, MAX_SCALE)
    const linear = MAX_SCALE - (MAX_SCALE - 1) * 0.25

    expect(quarter).toBeGreaterThan(linear)
  })
})

describe('layout', () => {
  const tile = 40
  /* Five tiles, evenly spaced by tile width plus a gap — same shape the
     component measures off the real dock. */
  const centres = [40, 100, 160, 220, 280]

  it('does nothing without a pointer', () => {
    const result = layout(centres, null, tile)

    expect(result.scales).toEqual([1, 1, 1, 1, 1])
    expect(result.shifts).toEqual([0, 0, 0, 0, 0])
    expect(result.growth).toBe(0)
  })

  it('magnifies the tile the pointer sits on to the max, and holds the middle one still', () => {
    const result = layout(centres, 160, tile)

    expect(result.scales[2]).toBeCloseTo(MAX_SCALE)
    expect(result.shifts[2]).toBeCloseTo(0)
  })

  it('is symmetric around a pointer centred on the row', () => {
    const result = layout(centres, 160, tile)

    expect(result.scales[1]).toBeCloseTo(result.scales[3])
    expect(result.scales[0]).toBeCloseTo(result.scales[4])
    expect(result.shifts[1]).toBeCloseTo(-result.shifts[3])
    expect(result.shifts[0]).toBeCloseTo(-result.shifts[4])
  })

  it('opens the gaps either side of the pointer, wherever it is', () => {
    for (const pointer of [40, 100, 220, 280]) {
      const result = layout(centres, pointer, tile)
      const settled = centres.map((centre, index) => centre + result.shifts[index])

      for (let index = 1; index < settled.length; index += 1) {
        const before = centres[index] - centres[index - 1]
        const after = settled[index] - settled[index - 1]
        expect(after).toBeGreaterThanOrEqual(before - 1e-9)
      }
    }
  })

  it('grows the row evenly about its middle, so it stays inside a centred bar', () => {
    for (const pointer of [40, 95, 160, 210, 280]) {
      const result = layout(centres, pointer, tile)
      const first = 0
      const last = centres.length - 1
      const leftEdge = centres[first] + result.shifts[first] - (result.scales[first] * tile) / 2
      const rightEdge = centres[last] + result.shifts[last] + (result.scales[last] * tile) / 2
      const leftOut = centres[first] - tile / 2 - leftEdge
      const rightOut = rightEdge - (centres[last] + tile / 2)

      expect(leftOut).toBeCloseTo(rightOut)
      expect(leftOut + rightOut).toBeCloseTo(result.growth)
    }
  })

  it('never lets a tile cross the one beside it', () => {
    const result = layout(centres, 220, tile)
    const settled = centres.map((centre, index) => centre + result.shifts[index])

    for (let index = 1; index < settled.length; index += 1) {
      expect(settled[index]).toBeGreaterThan(settled[index - 1])
    }
  })

  it('grows the bar by exactly the width every tile gained', () => {
    for (const pointer of [40, 95, 160, 210, 280]) {
      const result = layout(centres, pointer, tile)
      const expected = result.scales.reduce((sum, scale) => sum + (scale - 1) * tile, 0)
      expect(result.growth).toBeCloseTo(expected)
    }
  })

  it('reaches out to about RADIUS tile widths and no further', () => {
    const farAway = layout(centres, 40 + RADIUS * tile + tile * 2, tile)
    expect(farAway.scales[0]).toBeCloseTo(1, 10)
  })

  it('does nothing for an empty or zero-width row', () => {
    expect(layout([], 0, tile)).toEqual({ scales: [], shifts: [], growth: 0 })
    expect(layout(centres, 100, 0)).toEqual({ scales: [1, 1, 1, 1, 1], shifts: [0, 0, 0, 0, 0], growth: 0 })
  })
})

describe('fit', () => {
  const tile = 40
  const centres = [40, 100, 160, 220, 280]

  it('leaves the layout unchanged when there is room for it', () => {
    const grown = layout(centres, 160, tile)
    const result = fit(grown, grown.growth + 10)

    expect(result).toEqual(grown)
  })

  it('leaves the layout unchanged when the slack exactly matches', () => {
    const grown = layout(centres, 220, tile)
    const result = fit(grown, grown.growth)

    expect(result).toEqual(grown)
  })

  it('scales every shift proportionally when there is not enough room', () => {
    const grown = layout(centres, 220, tile)
    const slack = grown.growth / 2
    const result = fit(grown, slack)

    expect(result.growth).toBeCloseTo(slack)
    expect(result.scales).toEqual(grown.scales)
    for (let index = 0; index < grown.shifts.length; index += 1) {
      expect(result.shifts[index]).toBeCloseTo(grown.shifts[index] / 2)
    }
  })

  it('collapses every shift to zero when there is no slack at all', () => {
    const grown = layout(centres, 160, tile)
    const result = fit(grown, 0)

    expect(result.shifts.every((shift) => shift === 0)).toBe(true)
    expect(result.growth).toBe(0)
  })

  it('keeps the row symmetric around a pointer centred on the row', () => {
    const grown = layout(centres, 160, tile)
    const result = fit(grown, grown.growth / 3)

    expect(result.shifts[1]).toBeCloseTo(-result.shifts[3])
    expect(result.shifts[0]).toBeCloseTo(-result.shifts[4])
  })
})
