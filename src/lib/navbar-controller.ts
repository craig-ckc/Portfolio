import { onFrame } from './smooth-scroll'
import { advanceNavbarScroll, initialNavbarScroll } from './navbar-scroll'

export function setupNavbar(nav: HTMLElement) {
  let height = nav.offsetHeight
  let state = initialNavbarScroll(window.scrollY, height, nav.dataset.navState === 'peek')

  function paint() {
    nav.dataset.navState = state.mode
    nav.style.setProperty('--nav-offset', `${state.mode === 'flow' ? -state.y : state.mode === 'hidden' ? -height : 0}px`)
  }

  function restore() {
    state = initialNavbarScroll(window.scrollY, height, nav.dataset.navState === 'peek')
    paint()
  }

  const observer = new ResizeObserver(() => { height = nav.offsetHeight; paint() })
  observer.observe(nav)
  const stop = onFrame(() => {
    const pinned = nav.contains(document.activeElement) || document.documentElement.hasAttribute('data-navigation-pending')
    const next = advanceNavbarScroll(state, window.scrollY, height, pinned)
    if (next !== state) { state = next; paint() }
  })
  window.addEventListener('pageshow', restore)
  paint()

  return () => {
    stop()
    observer.disconnect()
    window.removeEventListener('pageshow', restore)
    delete nav.dataset.navState
    nav.style.removeProperty('--nav-offset')
  }
}
