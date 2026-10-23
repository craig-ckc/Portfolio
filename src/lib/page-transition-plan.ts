export type PageTransitionPlan = { kind: 'open' | 'close' | 'generic'; key: string | null }

/** Pure and self-contained: also serialized into the early navigation script. */
export function pageTransitionPlan(from: string, to: string, navigationType = 'push'): PageTransitionPlan {
  const fallback: PageTransitionPlan = { kind: 'generic', key: null }
  try {
    const source = new URL(from, 'https://portfolio.invalid')
    const destination = new URL(to, source)
    if (source.origin !== destination.origin) return fallback
    const fromPath = source.pathname.replace(/\/$/, '') || '/'
    const toPath = destination.pathname.replace(/\/$/, '') || '/'
    const toDetail = /^\/(work|writing)\/([a-z0-9-]+)$/.exec(toPath)
    const fromDetail = /^\/(work|writing)\/([a-z0-9-]+)$/.exec(fromPath)

    if (toDetail && fromPath === (toDetail[1] === 'work' ? '/' : '/writing')) {
      return { kind: 'open', key: `${toDetail[1]}-${toDetail[2]}` }
    }
    // Ordinary links to an overview start at its top. Only history traversal
    // restores the thumbnail's previous scroll position for a return morph.
    if (navigationType === 'traverse' && fromDetail && toPath === (fromDetail[1] === 'work' ? '/' : '/writing')) {
      return { kind: 'close', key: `${fromDetail[1]}-${fromDetail[2]}` }
    }
    return fallback
  } catch {
    return fallback
  }
}
