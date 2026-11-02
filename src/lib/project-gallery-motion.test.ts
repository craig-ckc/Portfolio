import { describe, expect, it } from 'vitest'
import { advanceGallerySnap, gallerySnapIndex } from './project-gallery-motion'

describe('gallery release motion', () => {
  it('uses recent momentum to distinguish a flick from a slow release', () => {
    expect(gallerySnapIndex([0, 900, 1500], 300, 0)).toBe(0)
    expect(gallerySnapIndex([0, 900, 1500], 300, 2)).toBe(1)
    expect(gallerySnapIndex([0, 900, 1500], 1200, -2)).toBe(1)
  })

  it('keeps flick targets within the first and last image', () => {
    expect(gallerySnapIndex([0, 900, 1500], 0, -3)).toBe(0)
    expect(gallerySnapIndex([0, 900, 1500], 1500, 3)).toBe(2)
  })

  it('carries the release speed continuously into the glide', () => {
    const next = advanceGallerySnap({ position: 300, velocity: 2 }, 900, .001)
    expect((next.position - 300) / .001).toBeCloseTo(2, 4)
  })

  it('settles a slow release without an oscillating bounce', () => {
    let state = { position: 340, velocity: 0 }
    for (let time = 0; time < 1200; time += 16) {
      const next = advanceGallerySnap(state, 900, 16)
      expect(next.position).toBeGreaterThan(state.position)
      expect(next.position).toBeLessThanOrEqual(900)
      state = next
    }
    expect(state.position).toBeCloseTo(900, 1)
    expect(state.velocity).toBeCloseTo(0, 3)
  })

  it('follows the same motion at 30, 60, and 120 fps', () => {
    const advance = (fps: number) => {
      let state = { position: 300, velocity: 2 }
      for (let frame = 0; frame < fps; frame++) state = advanceGallerySnap(state, 900, 1000 / fps)
      return state
    }
    const baseline = advance(30)
    for (const fps of [60, 120]) {
      expect(advance(fps).position).toBeCloseTo(baseline.position, 8)
      expect(advance(fps).velocity).toBeCloseTo(baseline.velocity, 8)
    }
  })
})
