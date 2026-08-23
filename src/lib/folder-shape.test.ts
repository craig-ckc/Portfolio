import { describe, expect, it } from 'vitest'
import { folderMetrics, folderPath, folderShape, resolveFolderShape } from './folder-shape'

/** Every coordinate in a `d`, so a path can be checked for leaving its box. */
function coordinates(path: string) {
  return path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
}

describe('folderPath', () => {
  it('closes a path that stays inside the viewBox', () => {
    const path = folderPath(folderShape)

    expect(path.startsWith('M0,')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
    expect(coordinates(path).every((value) => Number.isFinite(value) && value >= 0)).toBe(true)
  })

  it('draws the shoulder as the one concave corner', () => {
    /* Sweep 0 turns the other way. Exactly one corner does. */
    const sweeps = folderPath(folderShape).match(/A[\d.,]+ 0 0 (0|1)/g) ?? []

    expect(sweeps.filter((arc) => arc.endsWith('0'))).toHaveLength(1)
  })

  it('keeps a radius that will not fit from folding the path back on itself', () => {
    const greedy = folderPath({ ...folderShape, tabRadius: 900, cornerRadius: 900, bottomRadius: 900 })

    expect(coordinates(greedy).every((value) => value >= 0)).toBe(true)
    /* Nothing past the far corner of the box. */
    expect(Math.max(...coordinates(greedy))).toBeLessThanOrEqual(folderShape.width)
  })

  it('gives the tab a straight right edge only when it is taller than its curves', () => {
    /* Exactly tangent: the two curves meet, no straight edge between them. */
    const snug = resolveFolderShape({ ...folderShape, tabHeight: folderShape.tabRadius + folderShape.shoulderRadius })
    expect(snug.tabRadius + snug.shoulderRadius).toBe(snug.tabHeight)

    /* Taller than its curves, which is where the default sits. */
    const tall = resolveFolderShape(folderShape)
    expect(tall.tabRadius + tall.shoulderRadius).toBeLessThan(tall.tabHeight)

    /* And a tab shorter than its own corner cannot keep it. */
    const squashed = resolveFolderShape({ ...folderShape, tabHeight: 6 })
    expect(squashed.tabRadius).toBeLessThanOrEqual(6)
    expect(squashed.shoulderRadius).toBe(0)
  })
})

describe('folderMetrics', () => {
  /* Derived from the shape rather than written out, so tuning a radius is not
     also a test edit. */
  it('hands CSS the stage ratio and the flap position the path implies', () => {
    const { width, height, tabHeight, peek } = folderShape
    const metrics = folderMetrics(folderShape)

    expect(metrics.aspectRatio).toBe(`${width} / ${height}`)
    expect(parseFloat(metrics.bodyTop)).toBeCloseTo((tabHeight / height) * 100, 1)
    expect(parseFloat(metrics.flapTop)).toBeCloseTo(((tabHeight + peek) / height) * 100, 1)
    expect(metrics.flapTopFraction).toBeCloseTo((tabHeight + peek) / height, 4)
  })

  it('makes the flap corners round by giving the shorter axis the larger share', () => {
    const [across, down] = folderMetrics(folderShape)
      .flapRadius.split(' / ')
      .map((axis) => axis.split(' ').map(parseFloat))

    /* Four corners on each axis: two top, two bottom. */
    expect(across).toHaveLength(4)
    expect(down).toHaveLength(4)
    /* The flap is wider than it is tall, so every corner needs more of the
       vertical to come out round. */
    across.forEach((value, index) => expect(down[index]).toBeGreaterThan(value))
  })

  it('lets the flap keep its own top corners while its bottom two follow the path', () => {
    const [top, , bottom] = folderMetrics(folderShape).flapRadius.split(' ').map(parseFloat)

    expect(top).toBeLessThan(bottom)

    const matched = folderMetrics({ ...folderShape, flapTopRadius: folderShape.bottomRadius })
    const [sameTop, , sameBottom] = matched.flapRadius.split(' ').map(parseFloat)
    expect(sameTop).toBe(sameBottom)
  })
})
