import { activeOutlineIndex } from './article-outline'
import { getLenis, onFrame } from './smooth-scroll'

export function setupArticleOutline(nav: HTMLElement, body: HTMLElement) {
  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('[data-outline-link]'))
  const targets = links.map((link) => document.getElementById(link.hash.slice(1))!)
  const title = nav.querySelector<HTMLElement>('[data-outline-title]')!
  const description = nav.querySelector<HTMLElement>('[data-outline-description]')!
  const content = nav.querySelector<HTMLElement>('[data-outline-preview-content]')!
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const lifecycle = new AbortController()
  const signal = lifecycle.signal
  let active = -1
  let previewIndex = -1
  let previewAnimation: Animation | undefined

  function hidePreview() {
    delete nav.dataset.preview
    previewIndex = -1
    previewAnimation?.cancel()
  }

  function showPreview(index: number) {
    const link = links[index]
    const rect = link.getBoundingClientRect()
    nav.style.setProperty('--preview-y', `${rect.top - nav.getBoundingClientRect().top + rect.height / 2}px`)
    nav.dataset.preview = 'true'
    if (index === previewIndex) return
    previewIndex = index
    title.textContent = link.getAttribute('aria-label')
    description.textContent = link.dataset.preview ?? ''
    previewAnimation?.cancel()
    if (!reducedMotion.matches) {
      previewAnimation = content.animate([
        { opacity: 0, transform: 'translateY(3px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
    }
  }

  links.forEach((link, index) => {
    link.addEventListener('pointerenter', () => showPreview(index), { signal })
    link.addEventListener('focus', () => showPreview(index), { signal })
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      hidePreview()
      const target = targets[index]
      const keyboard = event.detail === 0
      const focus = () => { if (keyboard) target.focus({ preventScroll: true }) }
      const lenis = getLenis()
      if (lenis && !reducedMotion.matches) lenis.scrollTo(target, { duration: 1, onComplete: focus })
      else {
        const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0
        window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top - margin, behavior: 'instant' })
        focus()
      }
      history.pushState(null, '', link.hash)
    }, { signal })
  })

  nav.addEventListener('pointerleave', () => {
    const focused = links.indexOf(document.activeElement as HTMLAnchorElement)
    if (focused >= 0) showPreview(focused)
    else hidePreview()
  }, { signal })
  nav.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node) || !nav.contains(event.relatedTarget)) hidePreview()
  }, { signal })
  nav.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    hidePreview()
  }, { signal })
  document.addEventListener('pointerdown', (event) => {
    if (event.target instanceof Node && !nav.contains(event.target)) hidePreview()
  }, { signal })

  const unsubscribe = onFrame(() => {
    const rect = body.getBoundingClientRect()
    const readingLine = Math.min(200, window.innerHeight * 0.28)
    const visible = (rect.top < window.innerHeight * 0.65 && rect.bottom > readingLine) || nav.contains(document.activeElement)
    const visibility = String(visible)
    if (nav.dataset.visible !== visibility) {
      nav.dataset.visible = visibility
      if (!visible) hidePreview()
    }
    if (!visible) return
    const index = activeOutlineIndex(targets.map((target) => target.getBoundingClientRect().top), readingLine)
    if (index === active) return
    active = index
    links.forEach((link, item) => {
      if (item === index) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
      link.dataset.complete = String(item < index)
    })
  })

  window.addEventListener('pagehide', (event) => {
    hidePreview()
    if (!event.persisted) { unsubscribe(); lifecycle.abort() }
  }, { signal })
}
