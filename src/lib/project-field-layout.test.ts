import { describe, expect, it } from 'vitest'
import { buildFieldLayout, fieldOpacity, fieldScale, hitField, nearestFieldTile, projectTile, wrap, type FieldImage, type FieldLayout } from './project-field-layout'
import { DEFAULT_FIELD_SETTINGS } from './project-field-settings'

const images: FieldImage[] = [
  { src: '/wide.jpg', width: 1600, height: 900, title: 'Wide', href: '/work/wide' },
  { src: '/portrait.jpg', width: 600, height: 900, title: 'Portrait', href: '/work/portrait' },
  { src: '/landscape.jpg', width: 640, height: 420, title: 'Landscape', href: '/work/landscape' },
]

describe('project field layout', () => {
  it('keeps native image proportions at every distance from the center', () => {
    const layout = buildFieldLayout(images, 700)
    for (const tile of layout.tiles) {
      for (const pan of [{ x: 0, y: 0 }, { x: 300, y: -450 }]) {
        const frame = projectTile(tile, layout, pan)
        expect(frame.width / frame.height).toBeCloseTo(images[tile.image].width / images[tile.image].height)
      }
    }
  })

  it('grows smoothly toward the center with a bounded, smaller periphery', () => {
    expect(fieldScale(0)).toBeCloseTo(1.32)
    expect(fieldScale(1.1)).toBeCloseTo(.58)
    for (let radius = 0; radius < 1.1; radius += .01) {
      expect(fieldScale(radius)).toBeGreaterThanOrEqual(fieldScale(radius + .01))
      expect(fieldScale(radius) - fieldScale(radius + .01)).toBeLessThan(.02)
    }
  })

  it('wraps long throws in both axes without changing image identity or position', () => {
    const layout = buildFieldLayout(images, 700)
    for (const tile of layout.tiles) {
      const initial = projectTile(tile, layout, { x: 32, y: -79 })
      const thrown = projectTile(tile, layout, { x: 32 + layout.periodX * 10000, y: -79 - layout.periodY * 10000 })
      expect(thrown.x).toBeCloseTo(initial.x, 5)
      expect(thrown.y).toBeCloseTo(initial.y, 5)
      expect(thrown.width).toBeCloseTo(initial.width, 5)
    }
    expect(wrap(-100001, 100)).toBe(-1)
  })

  it('keeps repeated rows outside the visible area, including tall source images', () => {
    for (const size of [280, 600, 900]) {
      const layout = buildFieldLayout(images, size)
      expect(layout.periodX).toBeGreaterThan(size + size * .285 * 1.32)
      expect(layout.periodY).toBeGreaterThan(size + size * .285 * 1.5 * 2.64)
      expect(new Set(layout.tiles.map((tile) => tile.image)).size).toBe(images.length)
    }
  })

  it('hits the scaled artwork and excludes empty or fully faded areas', () => {
    const layout = buildFieldLayout(images, 700)
    const tile = layout.tiles[0]
    const pan = { x: -tile.x, y: -tile.y }
    const frame = projectTile(tile, layout, pan)
    expect(hitField(layout, pan, 0, 0)?.image).toBe(tile.image)
    expect(hitField(layout, pan, frame.width * .49, 0)?.image).toBe(tile.image)
    expect(hitField(layout, pan, 350, 0)).toBeUndefined()
    expect(fieldOpacity(0, 0)).toBe(1)
    expect(fieldOpacity(.6, 0)).toBeGreaterThan(fieldOpacity(.85, 0))
    expect(fieldOpacity(1, 0)).toBe(0)
  })

  it('accepts an empty collection without generating invalid geometry', () => {
    expect(buildFieldLayout([], 700).tiles).toEqual([])
    expect(buildFieldLayout(images, 0).tiles).toEqual([])
  })

  it('never overlaps through the lens, across wraps, or at extreme control settings', () => {
    const settings = [
      DEFAULT_FIELD_SETTINGS,
      { ...DEFAULT_FIELD_SETTINGS, spacing: .15, centerScale: 1.5, edgeScale: .6, scaleFalloff: 1.9 },
      { ...DEFAULT_FIELD_SETTINGS, imageSize: .38, spacing: .15, centerScale: 2, edgeScale: 1, scaleFalloff: .5 },
      { ...DEFAULT_FIELD_SETTINGS, imageSize: .14, spacing: .15, centerScale: 2, edgeScale: .2, scaleFalloff: 3, radius: .65 },
      { ...DEFAULT_FIELD_SETTINGS, spacing: .85, centerScale: 1, edgeScale: 1 },
    ]
    let random = 1234567
    const next = () => { random = (random * 1664525 + 1013904223) >>> 0; return random / 2 ** 32 }
    for (const config of settings) {
      for (const size of [320, 940]) {
        const layout = buildFieldLayout(images, size, config)
        for (let sample = 0; sample < 60; sample++) {
          const pan = { x: (next() - .5) * layout.periodX * 20, y: (next() - .5) * layout.periodY * 20 }
          const frames = layout.tiles.map((tile) => projectTile(tile, layout, pan))
          let minimumGap = Infinity
          for (let a = 0; a < frames.length; a++) {
            for (let b = a + 1; b < frames.length; b++) {
              const x = Math.abs(frames[a].x - frames[b].x) - (frames[a].width + frames[b].width) / 2
              const y = Math.abs(frames[a].y - frames[b].y) - (frames[a].height + frames[b].height) / 2
              minimumGap = Math.min(minimumGap, Math.max(x, y))
            }
          }
          expect(minimumGap).toBeGreaterThan(0)
        }
      }
    }
  })

  it('tightens only the gutter when spacing is reduced', () => {
    const tight = buildFieldLayout(images, 900, { ...DEFAULT_FIELD_SETTINGS, spacing: .15 })
    const loose = buildFieldLayout(images, 900, { ...DEFAULT_FIELD_SETTINGS, spacing: .85 })
    const pitch = (layout: typeof tight) => {
      const columns = [...new Set(layout.tiles.map((tile) => tile.x))].sort((a, b) => a - b)
      return columns[1] - columns[0]
    }
    expect(pitch(tight)).toBeLessThan(pitch(loose))
    expect(tight.tiles[0].width).toBe(loose.tiles[0].width)
    expect(tight.tiles[0].height).toBe(loose.tiles[0].height)
  })

  it('gives a centered tile the unique largest scale and selects it consistently', () => {
    const layout = buildFieldLayout(images, 900)
    const tile = layout.tiles[4]
    const pan = { x: -tile.x, y: -tile.y }
    expect(nearestFieldTile(layout, pan)).toBe(tile)
    const centered = projectTile(tile, layout, pan)
    expect(centered.width).toBeCloseTo(tile.width * DEFAULT_FIELD_SETTINGS.centerScale)
    for (const other of layout.tiles.filter((item) => item !== tile)) {
      expect(projectTile(other, layout, pan).width).toBeLessThan(centered.width)
    }
  })

  it('grows progressively toward the canvas center and shrinks as it leaves', () => {
    const layout = buildFieldLayout(images, 900)
    const tile = layout.tiles[4]
    let previous = tile.width * DEFAULT_FIELD_SETTINGS.edgeScale
    for (let distance = 450; distance >= 0; distance -= 3) {
      const frame = projectTile(tile, layout, { x: distance - tile.x, y: -tile.y })
      expect(frame.width).toBeGreaterThanOrEqual(previous)
      expect(frame.width - previous).toBeLessThan(tile.width * .03)
      const leaving = projectTile(tile, layout, { x: -distance - tile.x, y: -tile.y })
      expect(leaving.width).toBeCloseTo(frame.width)
      previous = frame.width
    }
    expect(previous).toBeCloseTo(tile.width * DEFAULT_FIELD_SETTINGS.centerScale)
  })

  it('hands off the largest size continuously when two projects pass the middle', () => {
    const tiles = [-100, 100].map((x, image) => ({ x, y: 0, image, width: 120, height: 80 }))
    const layout: FieldLayout = { tiles, periodX: 2000, periodY: 2000, size: 900, settings: DEFAULT_FIELD_SETTINGS }
    const before = tiles.map(tile => projectTile(tile, layout, { x: -1, y: 0 }).width)
    const middle = tiles.map(tile => projectTile(tile, layout, { x: 0, y: 0 }).width)
    const after = tiles.map(tile => projectTile(tile, layout, { x: 1, y: 0 }).width)
    expect(before[1]).toBeGreaterThan(before[0])
    expect(middle[0]).toBeCloseTo(middle[1])
    expect(after[0]).toBeGreaterThan(after[1])
    for (let index = 0; index < tiles.length; index++) expect(Math.abs(before[index] - after[index])).toBeLessThan(1)
  })
})
