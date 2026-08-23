import { describe, expect, it } from 'vitest'
import { backPath, folderMetrics, folderShape, frontPath, resolveFolderShape } from './folder-shape'

/** Every number in a `d`, so a path can be checked for leaving its box. */
function coordinates(path: string) {
  return path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
}

/** The arc commands, as their radii-and-sweep prefixes. */
function arcs(path: string) {
  return path.match(/A[\d.,]+ 0 0 [01]/g) ?? []
}

describe('backPath', () => {
  it('closes a flat-topped rectangle inside the box', () => {
    const path = backPath(folderShape)

    expect(path.endsWith('Z')).toBe(true)
    /* Four corners and nothing else: no tab, no shoulder. */
    expect(arcs(path)).toHaveLength(4)
    expect(coordinates(path).every((value) => value >= 0)).toBe(true)
    expect(Math.max(...coordinates(path))).toBeLessThanOrEqual(folderShape.width)
  })

  it('keeps a corner that will not fit from folding the path over itself', () => {
    const greedy = backPath({ ...folderShape, backRadius: 900 })

    expect(coordinates(greedy).every((value) => value >= 0)).toBe(true)
    expect(Math.max(...coordinates(greedy))).toBeLessThanOrEqual(folderShape.width)
  })
})

describe('frontPath', () => {
  it('draws the tab, the shoulder and four outer corners', () => {
    const path = frontPath(folderShape)

    expect(path.endsWith('Z')).toBe(true)
    /* Four corners plus the shoulder's two joins. */
    expect(arcs(path)).toHaveLength(6)
    expect(coordinates(path).every((value) => Number.isFinite(value) && value >= 0)).toBe(true)
  })

  it('turns the shoulder out one way and back the other', () => {
    /* Exactly one arc runs counter to the rest: the concave join at the bottom
       of the slope. Everything else on the outline is convex. */
    const counter = arcs(frontPath(folderShape)).filter((arc) => arc.endsWith('0'))

    expect(counter).toHaveLength(1)
  })

  it('starts high across the tab and ends low across the rest', () => {
    const { tabWidth, frontTop, shoulderDrop, shoulderRun } = resolveFolderShape(folderShape)
    const path = frontPath(folderShape)

    /* The raised edge sits frontTop down the box and stops short of the tab's
       full width by whatever the rounded join eats. */
    expect(path.startsWith(`M11,${frontTop}`)).toBe(true)
    const raised = Number(path.match(/H([\d.]+) A/)?.[1])
    expect(raised).toBeLessThan(tabWidth)
    expect(raised).toBeGreaterThan(tabWidth * 0.8)

    /* The slope lands one drop lower, past the tab by its own run. */
    const landing = path.match(new RegExp(`0 0 0 ([\\d.]+),${frontTop + shoulderDrop}`))
    expect(landing).not.toBeNull()
    expect(Number(landing?.[1])).toBeGreaterThan(tabWidth + shoulderRun)
  })

  it('leaves the front shorter than the back, and the drop shallower still', () => {
    const { height, frontTop, shoulderDrop } = resolveFolderShape(folderShape)

    /* Short enough that the contents clear it across the whole width, not just
       through the notch. */
    expect((height - frontTop) / height).toBeGreaterThan(0.6)
    expect((height - frontTop) / height).toBeLessThan(0.85)
    /* And the notch is a step, not a second panel. */
    expect(shoulderDrop).toBeLessThan(frontTop / 2)
  })

  it('gives a shoulder that will not fit only the radius there is room for', () => {
    const greedy = frontPath({ ...folderShape, shoulderRadius: 900 })

    expect(coordinates(greedy).every((value) => Number.isFinite(value) && value >= 0)).toBe(true)
    expect(Math.max(...coordinates(greedy))).toBeLessThanOrEqual(folderShape.width)
  })

  it('scales into the 0..1 space a clip is measured in', () => {
    const { width, height } = folderShape
    const clipped = frontPath(folderShape, { x: width, y: height })

    expect(Math.max(...coordinates(clipped))).toBeLessThanOrEqual(1)
    /* Same shape, same number of arcs — a scale, not a redraw. */
    expect(arcs(clipped)).toHaveLength(arcs(frontPath(folderShape)).length)
  })

  it('makes a clip arc elliptical by exactly the box it will be stretched into', () => {
    const { width, height, frontRadius } = resolveFolderShape(folderShape)
    const clipped = frontPath(folderShape, { x: width, y: height })

    /* A pure scale turns a circle into an ellipse with each axis divided on its
       own, which is what cancels out when the browser stretches the 0..1 box
       back to the element. The taller-than-wide correction is the whole point. */
    const [rx, ry] = clipped.match(/A([\d.]+),([\d.]+)/)?.slice(1).map(Number) ?? []
    expect(ry / rx).toBeCloseTo(width / height, 1)
    expect(rx).toBeLessThan(frontRadius)
  })
})

describe('folderMetrics', () => {
  /* Derived from the shape rather than written out, so tuning a radius is not
     also a test edit. */
  it('hands CSS the stage ratio and where the contents sit', () => {
    const { width, height, frontTop, peek } = folderShape
    const metrics = folderMetrics(folderShape)

    expect(metrics.aspectRatio).toBe(`${width} / ${height}`)
    expect(metrics.viewBox).toBe(`0 0 ${width} ${height}`)
    expect(parseFloat(metrics.contentsTop)).toBeCloseTo(((frontTop - peek) / height) * 100, 1)
  })

  it('keeps the contents below the back panel however far they peek', () => {
    /* A peek deeper than the front is tall would stand them above the folder
       rather than in its notch. */
    const greedy = folderMetrics({ ...folderShape, peek: 900 })

    expect(parseFloat(greedy.contentsTop)).toBe(0)
  })
})
