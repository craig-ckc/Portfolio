import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { pageTransitionPlan } from './page-transition-plan'
import { setupPageTransitions } from './page-transitions'

const overview = 'https://portfolio.test/'
const project = `${overview}work/preflight`
const storageKey = 'portfolio:navigation'

function navigationHarness(shared?: boolean) {
  const listeners = new Map<string, (event: unknown) => void>()
  const storage = new Map<string, string>()
  const root = { dataset: {} as Record<string, string>, style: { setProperty() {} } }
  const cover = {
    dataset: { transitionKey: 'work-preflight', transitionRole: 'detail' },
    style: { viewTransitionName: '' },
    closest: () => null,
    getBoundingClientRect: () => ({ width: 1200, height: 700, top: 0, bottom: 700, left: 0, right: 1200 }),
  }
  const history = {
    state: {} as Record<string, unknown>,
    replaceState(state: Record<string, unknown>) { this.state = state },
  }
  const window = {
    addEventListener(type: string, listener: (event: unknown) => void) { listeners.set(type, listener) },
    navigation: { activation: { from: { url: overview }, navigationType: 'push' } },
  }
  if (shared !== undefined) storage.set(storageKey, JSON.stringify({
    from: overview, to: project, navigationType: 'push', shared,
    sourceId: shared ? 'work-preflight-home' : undefined, created: Date.now(),
  }))
  runInNewContext(`(${setupPageTransitions.toString()})(planFor)`, {
    planFor: pageTransitionPlan,
    document: {
      documentElement: root,
      addEventListener() {},
      querySelector: () => null,
      querySelectorAll: (selector: string) => selector.includes('"detail"') ? [cover] : [],
    },
    window, history, location: { href: project }, URL,
    sessionStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
    innerWidth: 1200, innerHeight: 800,
    getComputedStyle: () => ({ borderTopLeftRadius: '0px' }),
    matchMedia: () => ({ matches: false }), CSS: { escape: (value: string) => value },
  })
  function emit(type: string) {
    listeners.get(type)?.({
      viewTransition: { ready: Promise.resolve(), finished: new Promise(() => {}) },
      activation: { entry: { url: overview }, navigationType: 'traverse' },
    })
  }
  return { root, cover, history, emit, handoff: () => JSON.parse(storage.get(storageKey) ?? 'null') }
}

describe('project return transitions', () => {
  it('remembers an unpaired field entry and fades its cover on Back', () => {
    const page = navigationHarness(false)
    page.emit('pagereveal')
    expect(page.history.state.portfolioTransitionReturn).toMatchObject({ overviewUrl: overview, shared: false })
    page.emit('pageswap')
    expect(page.handoff().shared).toBe(false)
    expect(page.root.dataset.transitionKind).toBe('generic')
    expect(page.cover.style.viewTransitionName).toBe('')
  })

  it('keeps the reverse morph for a paired project card', () => {
    const page = navigationHarness(true)
    page.emit('pagereveal')
    page.emit('pageswap')
    expect(page.handoff()).toMatchObject({ shared: true, sourceId: 'work-preflight-home' })
    expect(page.root.dataset.transitionKind).toBe('close')
    expect(page.cover.style.viewTransitionName).toBe('shared-media')
  })

  it('supports history entries created before pairing was remembered', () => {
    const page = navigationHarness()
    page.history.state.portfolioTransitionReturn = { overviewUrl: overview, sourceId: 'work-preflight-home' }
    page.emit('pageswap')
    expect(page.handoff().shared).toBe(true)
  })
})
