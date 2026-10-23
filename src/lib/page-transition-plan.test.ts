import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { pageTransitionPlan } from './page-transition-plan'

describe('page transition matching', () => {
  it('matches a homepage project to its cover', () => {
    expect(pageTransitionPlan('/', '/work/preflight')).toEqual({ kind: 'open', key: 'work-preflight' })
  })

  it('matches both Writing card placements to their article', () => {
    expect(pageTransitionPlan('/writing', '/writing/design-and-development-stay-together')).toEqual({
      kind: 'open', key: 'writing-design-and-development-stay-together',
    })
  })

  it('reverses project and article transitions on history traversal', () => {
    expect(pageTransitionPlan('/work/preflight', '/', 'traverse')).toEqual({ kind: 'close', key: 'work-preflight' })
    expect(pageTransitionPlan('/writing/example', '/writing', 'traverse')).toEqual({ kind: 'close', key: 'writing-example' })
  })

  it('does not fly toward a thumbnail below the fold on a fresh overview visit', () => {
    expect(pageTransitionPlan('/work/preflight', '/').kind).toBe('generic')
  })

  it('fades unrelated pages, experiments, and different details', () => {
    for (const [from, to] of [
      ['/writing/example', '/experiments'], ['/experiments', '/experiments/infinite-field'],
      ['/work/preflight', '/work/richard-james'], ['/writing/example', '/'],
    ]) expect(pageTransitionPlan(from, to)).toEqual({ kind: 'generic', key: null })
  })

  it('normalizes trailing slashes, queries and hashes without mixing collections', () => {
    expect(pageTransitionPlan('/#work', '/work/preflight/?ref=home').key).toBe('work-preflight')
    expect(pageTransitionPlan('/writing/', '/writing/preflight/#intro').key).toBe('writing-preflight')
  })

  it('never matches across origins or malformed paths', () => {
    expect(pageTransitionPlan('https://example.com/', 'https://other.com/work/preflight').kind).toBe('generic')
    expect(pageTransitionPlan('/', '/work/not/a/project').kind).toBe('generic')
    expect(pageTransitionPlan('/', 'https://[').kind).toBe('generic')
  })

  it('remains self-contained when embedded as an early browser script', () => {
    const embedded = runInNewContext(`(${pageTransitionPlan.toString()})`, { URL })
    expect(embedded('/writing', '/writing/example')).toEqual({ kind: 'open', key: 'writing-example' })
  })
})
