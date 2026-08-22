import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

type FrameCallback = (time: number) => void

const subscribers = new Set<FrameCallback>()
let lenis: Lenis | null = null
let frame = 0
let users = 0

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function tick(time: number) {
  lenis?.raf(time)
  for (const callback of subscribers) callback(time)
  frame = requestAnimationFrame(tick)
}

function ensureLoop() {
  if (!frame) frame = requestAnimationFrame(tick)
}

function stopLoopIfIdle() {
  if (!lenis && subscribers.size === 0 && frame) {
    cancelAnimationFrame(frame)
    frame = 0
  }
}

/**
 * Subscribe to the shared frame loop. Scroll-linked effects read their own
 * position here rather than listening for `scroll`, because under Lenis the
 * scroll position is driven per-frame — a scroll listener lags behind it and
 * the effect visibly trails the page.
 *
 * Works with or without Lenis running, so reduced-motion users still get
 * correct (just un-smoothed) values.
 */
export function onFrame(callback: FrameCallback) {
  subscribers.add(callback)
  ensureLoop()

  return () => {
    subscribers.delete(callback)
    stopLoopIfIdle()
  }
}

/** The live instance, or null when smooth scrolling is off. */
export function getLenis() {
  return lenis
}

/**
 * Lenis owns the scroll position, so a native anchor jump either does nothing
 * or fights the animation. Same-page links are routed through it instead.
 * Modified clicks and cross-page links are left alone.
 */
function handleAnchorClick(event: MouseEvent) {
  if (!lenis || event.defaultPrevented || event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  const target = event.target
  const link = target instanceof Element ? target.closest('a[href^="#"]') : null
  if (!(link instanceof HTMLAnchorElement)) return

  const hash = link.getAttribute('href')
  if (!hash || hash === '#') return

  const destination = document.querySelector(hash)
  if (!destination) return

  event.preventDefault()
  lenis.scrollTo(destination as HTMLElement)
  history.pushState(null, '', hash)
}

/**
 * Start Lenis for the lifetime of the caller; returns its teardown. Reference
 * counted, so several mounted components can ask for it safely. Skipped
 * entirely under reduced-motion, where hijacking native scroll is exactly the
 * wrong thing to do.
 */
export function startSmoothScroll() {
  users += 1

  if (!lenis && !prefersReducedMotion()) {
    lenis = new Lenis({ duration: 1.1, touchMultiplier: 1.6 })
    document.addEventListener('click', handleAnchorClick)
    ensureLoop()
  }

  return () => {
    users = Math.max(0, users - 1)
    if (users === 0 && lenis) {
      document.removeEventListener('click', handleAnchorClick)
      lenis.destroy()
      lenis = null
      stopLoopIfIdle()
    }
  }
}
