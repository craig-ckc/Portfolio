import { describe, expect, it } from 'vitest'
import { formatTime, positionAt, skip } from './now-playing'

describe('positionAt', () => {
  it('starts the loop at the first track, at zero', () => {
    expect(positionAt([1000, 2000, 3000], 0)).toEqual({ index: 0, positionMs: 0 })
  })

  it('holds position inside whichever track it lands in', () => {
    expect(positionAt([1000, 2000, 3000], 400)).toEqual({ index: 0, positionMs: 400 })
    expect(positionAt([1000, 2000, 3000], 1500)).toEqual({ index: 1, positionMs: 500 })
  })

  it('lands exactly on the next track at zero when one ends', () => {
    expect(positionAt([1000, 2000, 3000], 1000)).toEqual({ index: 1, positionMs: 0 })
    expect(positionAt([1000, 2000, 3000], 3000)).toEqual({ index: 2, positionMs: 0 })
  })

  it('wraps around after the last track, as many times as it takes', () => {
    const durations = [1000, 2000, 3000]
    const total = 6000

    expect(positionAt(durations, total)).toEqual({ index: 0, positionMs: 0 })
    expect(positionAt(durations, total + 400)).toEqual({ index: 0, positionMs: 400 })
    expect(positionAt(durations, total * 2 + 1500)).toEqual({ index: 1, positionMs: 500 })
  })

  it('treats an empty list as track zero at zero', () => {
    expect(positionAt([], 5000)).toEqual({ index: 0, positionMs: 0 })
  })

  it('clamps negative elapsed to zero', () => {
    expect(positionAt([1000, 2000], -500)).toEqual({ index: 0, positionMs: 0 })
  })

  it('handles a single track by looping it on itself', () => {
    expect(positionAt([1000], 999)).toEqual({ index: 0, positionMs: 999 })
    expect(positionAt([1000], 1000)).toEqual({ index: 0, positionMs: 0 })
    expect(positionAt([1000], 2500)).toEqual({ index: 0, positionMs: 500 })
  })
})

describe('skip', () => {
  const durations = [1000, 2000, 3000]

  it('moves forward to the start of the next track', () => {
    expect(skip(durations, 1500, 1)).toBe(3000) // mid track 1 -> start of track 2
  })

  it('wraps forward past the last track back to the first', () => {
    expect(skip(durations, 5500, 1)).toBe(0) // mid track 2 (the last) -> start of track 0
  })

  it('moves back to the previous track when early in the current one', () => {
    expect(skip(durations, 1200, -1)).toBe(0) // 200ms into track 1 -> start of track 0
  })

  it('restarts the current track when past the grace window', () => {
    expect(skip(durations, 4500, -1)).toBe(1000) // 3500ms into track 1 -> its own start
  })

  it('treats exactly the grace window as still early', () => {
    expect(skip(durations, 4000, -1)).toBe(1000) // exactly 3000ms in -> still restarts track 1
  })

  it('wraps back past the first track to the last when early', () => {
    expect(skip(durations, 200, -1)).toBe(3000) // 200ms into track 0 -> start of the last track
  })

  it('treats an empty list as a no-op, staying at zero', () => {
    expect(skip([], 5000, 1)).toBe(0)
    expect(skip([], 5000, -1)).toBe(0)
  })
})

describe('formatTime', () => {
  it('formats minutes and seconds, floored, with no hours', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(59999)).toBe('0:59')
    expect(formatTime(60000)).toBe('1:00')
    expect(formatTime(220893)).toBe('3:40')
  })

  it('clamps negative durations to zero', () => {
    expect(formatTime(-100)).toBe('0:00')
  })
})
