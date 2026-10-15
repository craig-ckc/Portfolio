import { getLenis } from './smooth-scroll'
import { closestImage, imageReturnScroll } from './project-gallery-layout'

/** One native dialog per project. The page remains the source of image order and content. */
export function setupProjectGallery(source: HTMLElement, dialog: HTMLDialogElement) {
  const triggers = Array.from(source.querySelectorAll<HTMLButtonElement>('[data-project-image]'))
  const track = dialog.querySelector<HTMLElement>('[data-gallery-track]')!
  const closeButton = dialog.querySelector<HTMLButtonElement>('[data-gallery-close]')!
  const previous = dialog.querySelector<HTMLButtonElement>('[data-gallery-prev]')!
  const next = dialog.querySelector<HTMLButtonElement>('[data-gallery-next]')!
  const counter = dialog.querySelector<HTMLElement>('[data-gallery-counter]')!
  const chrome = Array.from(dialog.querySelectorAll<HTMLElement>('[data-gallery-chrome]'))
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const lifecycle = new AbortController()
  const signal = lifecycle.signal
  const animations = new Set<Animation>()
  const hidden = new Map<HTMLElement, string>()
  let slides: HTMLElement[] = []
  let phase: 'closed' | 'opening' | 'open' | 'closing' = 'closed'
  let active = 0
  let destination: number | null = null
  let pinnedScroll = 0
  let opening: Promise<void> = Promise.resolve()
  let scrollFrame = 0
  let wasLenisStopped = false

  function hide(element: HTMLElement) {
    if (!hidden.has(element)) hidden.set(element, element.style.visibility)
    element.style.visibility = 'hidden'
  }

  function restoreHidden() {
    hidden.forEach((visibility, element) => { element.style.visibility = visibility })
    hidden.clear()
  }

  function reveal(element: HTMLElement) {
    if (!hidden.has(element)) return
    element.style.visibility = hidden.get(element)!
    hidden.delete(element)
  }

  async function animate(element: HTMLElement, keyframes: Keyframe[], duration: number, delay = 0) {
    const animation = element.animate(keyframes, {
      duration: reducedMotion.matches ? 0 : duration,
      delay: reducedMotion.matches ? 0 : delay,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'both',
    })
    animations.add(animation)
    await animation.finished.catch(() => undefined)
  }

  function clearAnimations() {
    animations.forEach((animation) => animation.cancel())
    animations.clear()
  }

  function imageCopy(trigger: HTMLElement) {
    const image = trigger.querySelector('img')?.cloneNode(true) as HTMLImageElement | undefined
    if (image) image.loading = 'eager'
    return image
  }

  function buildSlides() {
    slides = triggers.map((trigger, index) => {
      const slide = document.createElement('figure')
      slide.className = 'project-gallery__slide'
      slide.setAttribute('role', 'group')
      slide.setAttribute('aria-label', `Image ${index + 1} of ${triggers.length}`)
      const image = document.createElement('div')
      image.className = 'project-gallery__image'
      const copy = imageCopy(trigger)
      if (copy) image.append(copy)
      slide.append(image)
      return slide
    })
    track.replaceChildren(...slides)
  }

  function sizeTrack() {
    const heightLimit = window.innerHeight * (window.innerWidth < 600 ? 0.66 : 0.72)
    track.style.setProperty('--gallery-image-height', `${Math.min(heightLimit, track.clientHeight)}px`)
    triggers.forEach((trigger, index) => {
      const rect = trigger.getBoundingClientRect()
      slides[index].style.setProperty('--image-ratio', String(rect.width / Math.max(1, rect.height)))
    })
    track.style.paddingLeft = `${Math.max(24, (track.clientWidth - slides[0].getBoundingClientRect().width) / 2)}px`
    track.style.paddingRight = `${Math.max(24, (track.clientWidth - slides.at(-1)!.getBoundingClientRect().width) / 2)}px`
  }

  function centredScroll(index: number) {
    const slide = slides[index]
    return slide.offsetLeft + slide.offsetWidth / 2 - track.clientWidth / 2
  }

  function nearest() {
    return closestImage(slides.map((slide) => slide.offsetLeft + slide.offsetWidth / 2), track.scrollLeft + track.clientWidth / 2)
  }

  function describe(index: number) {
    active = index
    counter.textContent = `${index + 1} / ${triggers.length}`
    previous.disabled = index === 0
    next.disabled = index === triggers.length - 1
  }

  function moveTo(index: number) {
    if (phase !== 'open') return
    const target = Math.max(0, Math.min(triggers.length - 1, index))
    destination = target
    track.scrollTo({ left: centredScroll(target), behavior: reducedMotion.matches ? 'instant' : 'smooth' })
  }

  function frame(rect: DOMRect, radius: string): Keyframe {
    return { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, borderRadius: radius }
  }

  async function morph(trigger: HTMLElement, from: DOMRect, to: DOMRect, receiver: HTMLElement, returning = false) {
    const ghost = document.createElement('div')
    ghost.className = 'project-gallery__ghost'
    ghost.setAttribute('aria-hidden', 'true')
    const copy = imageCopy(trigger)
    if (copy) ghost.append(copy)
    const radius = getComputedStyle(trigger).borderRadius
    // A top-layer copy can travel between the document and the horizontal strip
    // without changing either layout or stretching the image through a scale().
    dialog.append(ghost)
    // The return begins while the neighbours are still moving away.
    await animate(ghost, [frame(from, radius), frame(to, radius)], returning ? 560 : 680, returning ? 40 : 0)
    // Keep the moving copy visible until a real image is ready to paint too.
    await receiver.querySelector<HTMLImageElement>('img')?.decode().catch(() => undefined)
    // Hand over in the same frame. Waiting for every neighbour to finish here
    // leaves a visible hole between the moving copy and its real image.
    reveal(receiver)
    ghost.remove()
  }

  function releasePage() {
    restoreHidden()
    clearAnimations()
    if (!wasLenisStopped) getLenis()?.start()
    phase = 'closed'
    destination = null
    delete dialog.dataset.phase
    track.replaceChildren()
  }

  async function open(index: number) {
    if (phase !== 'closed') return
    const start = triggers[index].getBoundingClientRect()
    pinnedScroll = window.scrollY
    wasLenisStopped = getLenis()?.isStopped ?? false
    getLenis()?.stop()
    phase = 'opening'
    dialog.dataset.phase = phase
    buildSlides()
    dialog.showModal()
    describe(index)
    sizeTrack()
    track.scrollLeft = centredScroll(index)
    closeButton.focus({ preventScroll: true })
    const current = slides[index]
    hide(triggers[index])
    hide(current)

    opening = Promise.all([
      morph(triggers[index], start, current.getBoundingClientRect(), current),
      ...slides.filter((slide) => slide !== current).map((slide) => {
        const distance = slides.indexOf(slide) - index
        return animate(slide, [
          { opacity: 0, transform: `translateX(${Math.sign(distance) * 180}px)` },
          { opacity: 1, transform: 'translateX(0)' },
        ], 640, 100 + Math.min(Math.abs(distance), 4) * 45)
      }),
      ...chrome.map((element) => animate(element, [{ opacity: 0 }, { opacity: 1 }], 300, 180)),
    ]).then(() => {
      if (phase !== 'opening') return
      restoreHidden()
      clearAnimations()
      phase = 'open'
      dialog.dataset.phase = phase
    })
    await opening
  }

  async function close() {
    if (phase === 'opening') {
      // Escape during the entrance completes that entrance before returning.
      animations.forEach((animation) => animation.finish())
      await opening
    }
    if (phase !== 'open') return
    const index = nearest()
    const trigger = triggers[index]
    const current = slides[index]
    const start = current.getBoundingClientRect()
    phase = 'closing'
    dialog.dataset.phase = phase
    // Stop any in-flight smooth scroll before measuring the departing strip.
    track.scrollTo({ left: track.scrollLeft, behavior: 'instant' })
    hide(trigger)
    hide(current)

    const sourceRect = trigger.getBoundingClientRect()
    pinnedScroll = imageReturnScroll(sourceRect.top, sourceRect.height, window.scrollY, window.innerHeight, document.documentElement.scrollHeight)
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(pinnedScroll, { immediate: true, force: true })
    else window.scrollTo({ top: pinnedScroll, behavior: 'instant' })

    await Promise.all([
      morph(trigger, start, trigger.getBoundingClientRect(), trigger, true),
      ...slides.filter((slide) => slide !== current).map((slide) => {
        const offset = slides.indexOf(slide) - index
        const distance = Math.abs(offset)
        return animate(slide, [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: `translateX(${Math.sign(offset) * 200}px)` },
        ], 460, Math.min(distance, 3) * 20)
      }),
      ...chrome.map((element) => animate(element, [{ opacity: 1 }, { opacity: 0 }], 280)),
    ])
    dialog.close()
    releasePage()
    trigger.focus({ preventScroll: true })
  }

  triggers.forEach((trigger, index) => {
    trigger.setAttribute('aria-label', `Open image ${index + 1} of ${triggers.length}: ${trigger.dataset.imageLabel}`)
    trigger.addEventListener('click', () => { void open(index) }, { signal })
  })
  closeButton.addEventListener('click', () => { void close() }, { signal })
  previous.addEventListener('click', () => moveTo((destination ?? active) - 1), { signal })
  next.addEventListener('click', () => moveTo((destination ?? active) + 1), { signal })
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); void close() }, { signal })
  dialog.addEventListener('click', (event) => {
    if (event.target === track || event.target === dialog) void close()
  }, { signal })
  dialog.addEventListener('keydown', (event) => {
    const index = destination ?? active
    const destinations: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: triggers.length - 1 }
    if (event.key in destinations) {
      event.preventDefault()
      moveTo(destinations[event.key])
    } else if ([' ', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown'].includes(event.key) && event.target === track) {
      event.preventDefault()
    }
  }, { signal })
  track.addEventListener('scroll', () => {
    if (phase !== 'open' || scrollFrame) return
    scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; if (phase === 'open') describe(nearest()) })
  }, { signal, passive: true })
  track.addEventListener('scrollend', () => { destination = null }, { signal })
  track.addEventListener('touchstart', () => { destination = null }, { signal, passive: true })

  window.addEventListener('wheel', (event) => {
    if (phase === 'closed' || event.ctrlKey) return
    if (phase === 'open' && event.target instanceof Node && track.contains(event.target)) {
      destination = null
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault()
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? track.clientWidth : 1
        track.scrollLeft += event.deltaY * unit
      }
    } else event.preventDefault()
  }, { signal, passive: false })
  window.addEventListener('touchmove', (event) => {
    if (phase !== 'closed' && !(phase === 'open' && event.target instanceof Node && track.contains(event.target))) event.preventDefault()
  }, { signal, passive: false })
  window.addEventListener('scroll', () => {
    if (phase !== 'closed' && window.scrollY !== pinnedScroll) window.scrollTo({ top: pinnedScroll, behavior: 'instant' })
  }, { signal, passive: true })
  window.addEventListener('resize', () => {
    if (phase === 'closed') return
    sizeTrack()
    track.scrollLeft = centredScroll(active)
  }, { signal })
  window.addEventListener('pagehide', (event) => {
    cancelAnimationFrame(scrollFrame)
    scrollFrame = 0
    if (dialog.open) dialog.close()
    if (phase !== 'closed') releasePage()
    // Cached pages retain their existing listeners when reached with Back.
    if (!event.persisted) lifecycle.abort()
  }, { signal })
}
