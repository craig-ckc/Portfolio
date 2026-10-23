import { describe, expect, it } from 'vitest'
import { advanceNavbarScroll, initialNavbarScroll } from './navbar-scroll'

const height = 58

describe('navbar scroll behavior', () => {
  it('scrolls away with the first screen before hiding', () => {
    let state = initialNavbarScroll(0, height)
    state = advanceNavbarScroll(state, 24, height)
    expect(state.mode).toBe('flow')
    state = advanceNavbarScroll(state, 60, height)
    expect(state.mode).toBe('hidden')
  })

  it('reveals after a small upward reversal and stays visible while going up', () => {
    let state = initialNavbarScroll(400, height)
    state = advanceNavbarScroll(state, 397, height)
    expect(state.mode).toBe('hidden')
    state = advanceNavbarScroll(state, 393, height)
    expect(state.mode).toBe('peek')
    state = advanceNavbarScroll(state, 200, height)
    expect(state.mode).toBe('peek')
  })

  it('ignores a small downward wobble, then hides on sustained downward scroll', () => {
    let state = advanceNavbarScroll(initialNavbarScroll(400, height), 380, height)
    state = advanceNavbarScroll(state, 384, height)
    expect(state.mode).toBe('peek')
    state = advanceNavbarScroll(state, 393, height)
    expect(state.mode).toBe('hidden')
  })

  it('can reveal before the initial navbar has completely left the screen', () => {
    const down = advanceNavbarScroll(initialNavbarScroll(0, height), 32, height)
    expect(advanceNavbarScroll(down, 24, height).mode).toBe('peek')
  })

  it('returns to the natural position at the top, including overscroll', () => {
    const state = advanceNavbarScroll(initialNavbarScroll(300, height), 270, height)
    expect(advanceNavbarScroll(state, -10, height)).toEqual(initialNavbarScroll(0, height))
  })

  it('starts hidden at a restored history scroll position', () => {
    expect(initialNavbarScroll(840, height).mode).toBe('hidden')
  })

  it('preserves the revealed navbar when returning from a navigation', () => {
    expect(initialNavbarScroll(840, height, true).mode).toBe('peek')
    expect(initialNavbarScroll(0, height, true).mode).toBe('flow')
  })

  it('keeps keyboard-focused controls visible', () => {
    const state = initialNavbarScroll(840, height)
    expect(advanceNavbarScroll(state, 900, height, true).mode).toBe('peek')
  })

  it('accumulates subpixel movement rather than resetting the reversal threshold', () => {
    let state = initialNavbarScroll(400, height)
    for (let y = 399.9; y >= 392; y -= 0.1) state = advanceNavbarScroll(state, y, height)
    expect(state.mode).toBe('peek')
  })
})
