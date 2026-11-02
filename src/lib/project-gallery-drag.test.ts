import { afterEach, describe, expect, it, vi } from 'vitest'
import { setupGalleryDrag } from './project-gallery-drag'

function gallery(reducedMotion = false) {
  const window = new EventTarget()
  const frames = new Map<number, FrameRequestCallback>()
  let clock = 0
  let frameId = 0
  vi.stubGlobal('window', window)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback)
    return frameId
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
  const track = Object.assign(new EventTarget(), {
    dataset: {} as Record<string, string>, scrollLeft: 0, scrollWidth: 3000, clientWidth: 1000,
    focus: vi.fn(),
    hasPointerCapture: () => false,
    setPointerCapture: vi.fn(), releasePointerCapture: vi.fn(),
    scrollTo({ left }: { left: number }) { this.scrollLeft = left },
  })
  const lifecycle = new AbortController()
  const onTarget = vi.fn()
  const controller = setupGalleryDrag(track as unknown as HTMLElement, {
    signal: lifecycle.signal, reducedMotion: { matches: reducedMotion } as MediaQueryList,
    enabled: () => true, positions: () => [0, 1000, 2000], onTarget, onRest: vi.fn(),
  })
  function pointer(type: string, x: number, time: number, pointerType = 'mouse') {
    clock = time
    const event = Object.assign(new Event(type, { cancelable: true }), {
      pointerId: 1, clientX: x, pointerType, isPrimary: true,
      button: 0, buttons: type === 'pointerup' ? 0 : 1,
    })
    Object.defineProperty(event, 'timeStamp', { value: time })
    ;(type === 'pointerdown' ? track : window).dispatchEvent(event)
  }
  function tick(time: number) {
    clock = time
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach((callback) => callback(time))
  }
  return { track, pointer, tick, controller, frames, onTarget, lifecycle }
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('gallery pointer dragging', () => {
  it('tracks the hand, glides to the next image, and suppresses the release click', () => {
    const page = gallery()
    page.pointer('pointerdown', 800, 0)
    page.pointer('pointermove', 500, 100)
    expect(page.track.scrollLeft).toBe(300)
    page.pointer('pointerup', 400, 140)
    expect(page.track.scrollLeft).toBe(400)
    expect(page.onTarget).toHaveBeenLastCalledWith(1)
    expect(page.track.dataset.galleryMotion).toBe('settling')
    const click = new Event('click', { cancelable: true })
    page.track.dispatchEvent(click)
    expect(click.defaultPrevented).toBe(true)
    page.tick(156)
    expect(page.track.scrollLeft).toBeGreaterThan(400)
    expect(page.track.scrollLeft).toBeLessThan(500)
    for (let time = 172; time < 1600; time += 16) page.tick(time)
    expect(page.track.scrollLeft).toBe(1000)
    expect(page.track.dataset.galleryMotion).toBeUndefined()
    expect(page.frames.size).toBe(0)
    page.lifecycle.abort()
  })

  it('lets a new gesture take over an unfinished glide without a jump', () => {
    const page = gallery()
    page.pointer('pointerdown', 800, 0)
    page.pointer('pointermove', 400, 100)
    page.pointer('pointerup', 400, 100)
    page.tick(116)
    const position = page.track.scrollLeft
    page.pointer('pointerdown', 600, 120)
    expect(page.frames.size).toBe(0)
    expect(page.track.scrollLeft).toBe(position)
    page.pointer('pointermove', 650, 140)
    expect(page.track.scrollLeft).toBe(position - 50)
    page.lifecycle.abort()
  })

  it('leaves touch swiping to the native scroller', () => {
    const page = gallery()
    page.pointer('pointerdown', 800, 0, 'touch')
    page.pointer('pointermove', 400, 100, 'touch')
    page.pointer('pointerup', 400, 100, 'touch')
    expect(page.track.scrollLeft).toBe(0)
    expect(page.track.dataset.galleryMotion).toBeUndefined()
    expect(page.frames.size).toBe(0)
    page.lifecycle.abort()
  })

  it('centres the target immediately under reduced motion', () => {
    const page = gallery(true)
    page.pointer('pointerdown', 800, 0)
    page.pointer('pointermove', 400, 100)
    page.pointer('pointerup', 400, 100)
    expect(page.track.scrollLeft).toBe(1000)
    expect(page.frames.size).toBe(0)
    expect(page.track.dataset.galleryMotion).toBeUndefined()
    page.lifecycle.abort()
  })

  it('cancels an in-flight glide when the gallery closes', () => {
    const page = gallery()
    page.pointer('pointerdown', 800, 0)
    page.pointer('pointermove', 400, 100)
    page.pointer('pointerup', 400, 100)
    page.controller.cancel()
    page.tick(116)
    expect(page.track.scrollLeft).toBe(400)
    expect(page.frames.size).toBe(0)
    expect(page.track.dataset.galleryMotion).toBeUndefined()
    page.lifecycle.abort()
  })
})
