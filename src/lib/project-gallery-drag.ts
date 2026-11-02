import { FieldDrag } from './project-field-drag'
import { advanceGallerySnap, gallerySnapIndex, type GalleryMotion } from './project-gallery-motion'

type Options = {
  signal: AbortSignal
  reducedMotion: MediaQueryList
  enabled: () => boolean
  positions: () => number[]
  onTarget: (index: number) => void
  onRest: () => void
}

/** Desktop pointer dragging; touch keeps the browser's native swipe and snap. */
export function setupGalleryDrag(track: HTMLElement, options: Options) {
  const { signal } = options
  let drag: FieldDrag | null = null
  let frame = 0
  let suppressClick = false

  function releasePointer(id: number) {
    if (track.hasPointerCapture(id)) track.releasePointerCapture(id)
  }

  function cancel() {
    cancelAnimationFrame(frame)
    frame = 0
    suppressClick ||= drag?.moved ?? false
    const id = drag?.id
    drag = null
    if (id !== undefined) releasePointer(id)
    delete track.dataset.galleryMotion
    options.onRest()
  }

  function settle(velocity: number) {
    const positions = options.positions()
    if (!positions.length) { cancel(); return }
    const index = gallerySnapIndex(positions, track.scrollLeft, velocity)
    const target = Math.max(0, Math.min(track.scrollWidth - track.clientWidth, positions[index]))
    options.onTarget(index)
    if (options.reducedMotion.matches) {
      track.scrollLeft = target
      cancel()
      return
    }
    track.dataset.galleryMotion = 'settling'
    let state: GalleryMotion = { position: track.scrollLeft, velocity }
    let previous = performance.now()
    function tick(now: number) {
      frame = 0
      state = advanceGallerySnap(state, target, Math.min(64, now - previous))
      previous = now
      const bounded = Math.max(0, Math.min(track.scrollWidth - track.clientWidth, state.position))
      if (bounded !== state.position) state = { position: bounded, velocity: 0 }
      track.scrollLeft = state.position
      if (Math.abs(state.position - target) < .25 && Math.abs(state.velocity) < .005) {
        track.scrollLeft = target
        cancel()
      } else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  }

  function finish(time: number, interrupted = false) {
    if (!drag) return
    const gesture = drag
    drag = null
    suppressClick = gesture.moved
    releasePointer(gesture.id)
    settle(interrupted ? 0 : -gesture.velocity(time).x)
  }

  function move(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.id) return
    const delta = drag.move({ x: event.clientX, y: 0, time: event.timeStamp }, 1)
    if (drag.moved) {
      if (!track.hasPointerCapture(drag.id)) track.setPointerCapture(drag.id)
      track.scrollLeft -= delta.x
    }
  }

  track.addEventListener('pointerdown', (event) => {
    if (!options.enabled() || drag || event.pointerType === 'touch' || event.button !== 0 || !event.isPrimary) return
    cancel()
    suppressClick = false
    track.dataset.galleryMotion = 'dragging'
    track.scrollTo({ left: track.scrollLeft, behavior: 'instant' })
    drag = new FieldDrag(event.pointerId, { x: event.clientX, y: 0, time: event.timeStamp })
    track.focus({ preventScroll: true })
    event.preventDefault()
  }, { signal })

  window.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return
    // Recover a release outside the browser even if pointerup was not delivered.
    if (!(event.buttons & 1)) { finish(event.timeStamp); return }
    for (const sample of event.getCoalescedEvents?.() ?? []) move(sample)
    move(event)
  }, { signal })
  window.addEventListener('pointerup', (event) => {
    if (!drag || event.pointerId !== drag.id || event.buttons & 1) return
    move(event)
    finish(event.timeStamp)
  }, { signal })
  track.addEventListener('lostpointercapture', (event) => {
    if (event.pointerId === drag?.id) finish(event.timeStamp, true)
  }, { signal })
  window.addEventListener('pointercancel', (event) => {
    if (event.pointerId === drag?.id) finish(event.timeStamp, true)
  }, { signal })
  window.addEventListener('blur', () => { if (drag) finish(performance.now(), true) }, { signal })
  track.addEventListener('click', (event) => {
    // A release over the strip's backdrop must not dismiss the gallery.
    if (!suppressClick) return
    suppressClick = false
    event.preventDefault()
    event.stopPropagation()
  }, { signal, capture: true })
  track.addEventListener('dragstart', (event) => event.preventDefault(), { signal })
  track.addEventListener('wheel', cancel, { signal, passive: true })
  track.addEventListener('touchstart', cancel, { signal, passive: true })
  signal.addEventListener('abort', cancel, { once: true })
  return { cancel }
}
