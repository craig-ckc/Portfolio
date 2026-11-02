import type { PageTransitionPlan } from './page-transition-plan'

type Handoff = {
  from: string
  to: string | null
  navigationType: string
  shared: boolean
  sourceId?: string
  radius: string
  navVisible: boolean
  created: number
}

/**
 * Serialized into a classic head script by Base. Keep runtime dependencies
 * inside this function or in its arguments: pagereveal must be registered
 * before the first paint, including when a document returns from bfcache.
 * Navigation itself, focus and scroll restoration remain browser-owned.
 */
export function setupPageTransitions(planFor: (from: string, to: string, navigationType?: string) => PageTransitionPlan) {
  const root = document.documentElement
  const storageKey = 'portfolio:navigation'
  const captured = new Map<HTMLElement, string>()
  let active: ViewTransition | null = null
  let clicked: HTMLAnchorElement | null = null
  let navigationRequest = 0

  function visible(element: HTMLElement | null) {
    if (!element) return false
    const rect = element.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth
  }

  function navVisible() {
    const nav = document.querySelector<HTMLElement>('[data-site-nav]')
    if (!nav || !visible(nav) || Number(getComputedStyle(nav).opacity) < 0.5) return false
    return nav.getBoundingClientRect().top >= -1
  }

  function sourceFor(plan: PageTransitionPlan, role: string, sourceId?: string) {
    if (!plan.key) return null
    const candidates = Array.from(document.querySelectorAll<HTMLElement>(`[data-transition-key="${CSS.escape(plan.key)}"][data-transition-role="${role}"]`))
    return candidates.find((element) => element.dataset.transitionSource === sourceId && visible(element))
      ?? candidates.find(visible) ?? null
  }

  function name(element: HTMLElement | null, value: string) {
    if (!element) return
    if (!captured.has(element)) captured.set(element, element.style.viewTransitionName)
    element.style.viewTransitionName = value
  }

  function radius(element: HTMLElement | null) {
    return element ? getComputedStyle(element.closest('[data-transition-frame]') ?? element).borderTopLeftRadius : '0px'
  }

  function reset() {
    captured.forEach((value, element) => { element.style.viewTransitionName = value })
    captured.clear()
    delete root.dataset.transitionActive
    delete root.dataset.transitionKind
    delete root.dataset.navEnter
    delete root.dataset.navExit
    delete root.dataset.navigationPending
    delete root.dataset.transitionMask
    active = null
  }

  function prepare(transition: ViewTransition, plan: PageTransitionPlan, source: HTMLElement | null) {
    active = transition
    root.dataset.transitionActive = ''
    root.dataset.navigationEntered = ''
    root.dataset.transitionKind = source ? plan.kind : 'generic'
    if (source && plan.key?.startsWith('work-')) root.dataset.transitionMask = 'cover'
    const page = document.querySelector('.hp')
    if (page) root.style.setProperty('--transition-background', getComputedStyle(page).backgroundColor)
    name(source, 'shared-media')
    if (source) name(document.querySelector<HTMLElement>('[data-transition-gradient]'), 'shared-gradient')
    if (source?.dataset.transitionRole === 'thumbnail') {
      name(source.closest('a')?.querySelector<HTMLElement>('[data-transition-caption]') ?? null, 'shared-caption')
    }
    if (navVisible()) name(document.querySelector<HTMLElement>('[data-site-nav]'), 'site-nav')
    // A rejected ready promise means the browser skipped the visual effect.
    void transition.ready.catch(() => undefined)
    void transition.finished.catch(() => undefined).then(() => { if (active === transition) reset() })
  }

  function readHandoff(): Handoff | null {
    try {
      const value = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as Handoff | null
      sessionStorage.removeItem(storageKey)
      return value && typeof value.from === 'string' && Date.now() - value.created < 10000 ? value : null
    } catch { return null }
  }

  function historyState() {
    return history.state && typeof history.state === 'object' ? history.state : {}
  }

  // Also release the temporary pin on browsers without cross-document
  // transition events when a page returns from the back/forward cache.
  window.addEventListener('pageshow', () => { delete root.dataset.navigationPending })

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null
    if (!(link instanceof HTMLAnchorElement) || link.target && link.target !== '_self' || link.hasAttribute('download')) return
    const url = new URL(link.href)
    if (url.origin !== location.origin || url.pathname === location.pathname && url.search === location.search) return
    clicked = link
    const request = ++navigationRequest
    const source = link.querySelector<HTMLElement>('[data-transition-role="thumbnail"]')
    if (source?.dataset.transitionSource) {
      history.replaceState({ ...historyState(), portfolioTransitionSource: source.dataset.transitionSource }, '')
    }

    const nav = document.querySelector<HTMLElement>('[data-site-nav]')
    if (!nav || navVisible()) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nav.dataset.navState = 'peek'
      nav.style.setProperty('--nav-offset', '0px')
      return
    }
    event.preventDefault()
    root.dataset.navigationPending = ''
    // Finish the navbar entrance on the current page, before the browser
    // captures either document. An already visible navbar takes no detour.
    const offset = Math.max(-nav.offsetHeight, Math.min(0, nav.getBoundingClientRect().top))
    nav.dataset.navState = 'hidden'
    nav.style.setProperty('--nav-offset', `${offset}px`)
    nav.getBoundingClientRect()
    nav.dataset.navState = 'peek'
    nav.style.setProperty('--nav-offset', '0px')
    void Promise.all(nav.getAnimations().map((animation) => animation.finished.catch(() => undefined))).then(() => {
      if (request === navigationRequest) location.assign(url.href)
    })
  }, true)

  window.addEventListener('pageswap', (event) => {
    const transition = event.viewTransition
    if (!transition) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { transition.skipTransition(); return }
    // A browser Back gesture can interrupt an unfinished entrance. Clear its
    // temporary names before choosing the outgoing elements for this hop.
    reset()
    const entry = event.activation?.entry
    const remembered = historyState().portfolioTransitionReturn
    const target = entry?.url ?? clicked?.href ?? remembered?.overviewUrl ?? null
    const navigationType = event.activation?.navigationType ?? (clicked ? 'push' : 'traverse')
    const plan = target ? planFor(location.href, target, navigationType) : { kind: 'generic' as const, key: null }
    const sourceId = plan.kind === 'open' ? historyState().portfolioTransitionSource : remembered?.sourceId
    // A canvas field (or another link without a capturable thumbnail) opens
    // with the page fade. Its return must not extract a stranded cover image.
    const source = plan.kind === 'close' && remembered?.shared === false
      ? null : sourceFor(plan, plan.kind === 'open' ? 'thumbnail' : 'detail', sourceId)
    const handoff: Handoff = {
      from: location.href, to: target, navigationType, shared: !!source,
      sourceId, radius: radius(source), navVisible: navVisible(), created: Date.now(),
    }
    try { sessionStorage.setItem(storageKey, JSON.stringify(handoff)) } catch { /* Navigation still works without storage. */ }
    prepare(transition, plan, source)
  })

  window.addEventListener('pagereveal', (event) => {
    reset()
    clicked = null
    const handoff = readHandoff()
    const transition = event.viewTransition
    if (!transition) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { transition.skipTransition(); return }
    const activation = window.navigation?.activation
    const from = activation?.from?.url ?? handoff?.from
    const navigationType = activation?.navigationType ?? handoff?.navigationType ?? 'push'
    // Back returns with the navbar still present, including a non-bfcache
    // restore. The scroll controller adopts this state when it hydrates.
    if (navigationType === 'traverse' && handoff?.navVisible) {
      const nav = document.querySelector<HTMLElement>('[data-site-nav]')
      if (nav) {
        nav.dataset.navState = 'peek'
        nav.style.setProperty('--nav-offset', '0px')
      }
    }
    const plan = from ? planFor(from, location.href, navigationType) : { kind: 'generic' as const, key: null }
    const sourceId = historyState().portfolioTransitionSource ?? handoff?.sourceId
    const handoffMatches = !handoff || handoff.from === from && (!handoff.to || new URL(handoff.to).href === location.href)
    const source = handoffMatches && handoff?.shared !== false
      ? sourceFor(plan, plan.kind === 'open' ? 'detail' : 'thumbnail', sourceId) : null

    if (plan.kind === 'open') {
      history.replaceState({ ...historyState(), portfolioTransitionReturn: {
        sourceId: handoff?.sourceId, overviewUrl: from, shared: !!source,
      } }, '')
    }
    prepare(transition, plan, source)
    root.style.setProperty('--shared-from-radius', handoff?.radius ?? (plan.kind === 'open' ? '8px' : '0px'))
    root.style.setProperty('--shared-to-radius', radius(source))
    if (handoff?.navVisible === false && navVisible()) root.dataset.navEnter = ''
    if (handoff?.navVisible && !navVisible()) root.dataset.navExit = ''
  })
}
