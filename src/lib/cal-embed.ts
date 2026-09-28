import type { Theme } from './theme'

/**
 * Cal.com's booker, fetched on demand and mounted inside this site's own
 * dialog.
 *
 * What this replaces: Cal's element-click embed, which the site loaded on
 * every page. It listened on the document, opened Cal's own popover from any
 * element carrying `data-cal-link`, and cost every visitor a third-party
 * script whether or not they ever went near it. It also handed the whole
 * booking moment — the one screen where somebody decides whether to get in
 * touch — to a modal this site has no say in, so there was nowhere to put a
 * word about what the call actually is.
 *
 * Now the modal is ours (src/components/booking/booking-dialog.tsx) and Cal is
 * the calendar inside it. This module owns only the calendar: bring the script
 * in the first time someone opens the dialog, mount the booker, and say
 * whether it arrived — because when it does not, the dialog has an email
 * address to fall back on and needs to know to lean on it.
 */

/** Cal's loader, as they publish it. */
export const CAL_EMBED_SRC = 'https://app.cal.com/embed/embed.js'

/**
 * The element Cal is told to draw itself into. An id rather than the element
 * itself because a selector is the shape Cal's own snippet uses, and there is
 * exactly one booking dialog per page for it to collide with.
 */
export const CAL_MOUNT_ID = 'booking-scheduler'

/**
 * How long the calendar has to appear before the dialog stops waiting for it.
 *
 * Long enough not to give up on a slow connection, short enough that a visitor
 * whose browser is never going to receive the script — an extension blocking
 * third parties, a network that drops it — is pointed at the email path while
 * they are still interested rather than after they have gone.
 */
export const EMBED_TIMEOUT_MS = 8000

/** The event this site books, and where Cal serves it from. */
export type CalEmbed = {
  /** `owner/event-type`, as it appears in the cal.com URL. */
  link: string
  namespace: string
  origin: string
}

/**
 * Cal's global. It starts life as the queue below and is replaced by the real
 * API once embed.js runs, which is why every call goes through `window.Cal`
 * rather than a reference held from installation.
 */
export interface CalApi {
  (...args: unknown[]): void
  loaded?: boolean
  ns?: Record<string, CalApi>
  q?: unknown[][]
}

declare global {
  interface Window {
    Cal?: CalApi
  }
}

/**
 * How Cal is configured, kept apart from the calls that deliver it so the
 * wiring can be read in one piece.
 *
 * `hideEventTypeDetails` is the one worth explaining. Cal's booker normally
 * leads with a panel naming the event, its length and its description — which
 * is exactly what the left-hand side of the dialog already says, in this
 * site's own words. Two of them side by side reads as a page that has been
 * assembled rather than designed, so Cal draws the calendar and the dialog
 * does the talking.
 */
export function calEmbedOptions(embed: CalEmbed, theme: Theme) {
  return {
    inline: {
      elementOrSelector: `#${CAL_MOUNT_ID}`,
      calLink: embed.link,
      /* `useSlotsViewOnSmallScreen` is what stops the month grid being squeezed
         into a phone: below Cal's own breakpoint it shows the next available
         times as a list instead. */
      config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true', theme },
    },
    ui: {
      theme,
      layout: 'month_view',
      hideEventTypeDetails: true,
      /* The calendar sits on the page's own surface, so its accent follows the
         page's ink rather than Cal's default blue. */
      cssVarsPerTheme: {
        light: { 'cal-brand': '#151515' },
        dark: { 'cal-brand': '#f9f9f9' },
      },
    },
  } as const
}

/**
 * Cal's loader, transcribed.
 *
 * It is theirs in behaviour and ours in spelling: the published snippet is one
 * minified line, and a minified line is not something the rest of this
 * codebase can be asked to read. What it does is stand in for the real API
 * until that arrives — every call made against it is pushed onto a queue that
 * embed.js drains once it runs — and, on the first call and not before, append
 * the script tag that fetches it. That last part is the whole reason the
 * dialog can sit on every page without costing anybody anything.
 */
function installCal(): CalApi {
  const existing = window.Cal
  if (existing) return existing

  const enqueue = (api: CalApi, args: unknown[]) => {
    api.q = api.q ?? []
    api.q.push(args)
  }

  /* One queue per namespace, so calls made before embed.js lands still arrive
     addressed to the right event type. */
  const namespaced = (): CalApi => {
    const api = ((...args: unknown[]) => enqueue(api, args)) as CalApi
    api.q = []
    return api
  }

  const cal = ((...args: unknown[]) => {
    cal.ns = cal.ns ?? {}
    cal.q = cal.q ?? []

    if (!cal.loaded) {
      document.head.appendChild(document.createElement('script')).src = CAL_EMBED_SRC
      cal.loaded = true
    }

    const namespace = args[1]
    if (args[0] !== 'init' || typeof namespace !== 'string') {
      enqueue(cal, args)
      return
    }

    const ns = (cal.ns[namespace] = cal.ns[namespace] ?? namespaced())
    enqueue(ns, args)
    enqueue(cal, ['initNamespace', namespace])
  }) as CalApi

  window.Cal = cal
  return cal
}

/**
 * Whether Cal has drawn itself into `mount` yet.
 *
 * The iframe is the signal, rather than anything Cal reports about the booking
 * page itself, because the failure being watched for is the script never
 * arriving at all — blocked, or lost on the way. Past that point the page
 * inside the frame is Cal's to report on, and it does: a link that cannot be
 * loaded renders as Cal's own message, which is more use than this site
 * guessing at what went wrong.
 *
 * Exported because the dialog asks again each time it is reopened. An embed
 * that turned up a second after the wait below gave up on it is still an
 * embed, and the visitor should get it rather than the apology.
 */
export function calEmbedRendered(mount: HTMLElement): boolean {
  return mount.querySelector('iframe') !== null
}

/** The same question, waited on — up to EMBED_TIMEOUT_MS, then given up. */
function embedRendered(mount: HTMLElement): Promise<void> {
  if (calEmbedRendered(mount)) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const stop = () => {
      observer.disconnect()
      window.clearTimeout(timer)
    }

    const observer = new MutationObserver(() => {
      if (!calEmbedRendered(mount)) return
      stop()
      resolve()
    })

    observer.observe(mount, { childList: true, subtree: true })

    const timer = window.setTimeout(() => {
      stop()
      reject(new Error('Cal’s embed did not arrive'))
    }, EMBED_TIMEOUT_MS)
  })
}

/**
 * Fetch Cal if it is not here yet, draw the booker into `mount`, and settle
 * once it is on screen. Called once, the first time the dialog opens.
 */
export async function mountCalInline(mount: HTMLElement, embed: CalEmbed, theme: Theme): Promise<void> {
  const cal = installCal()
  const { inline, ui } = calEmbedOptions(embed, theme)

  cal('init', embed.namespace, { origin: embed.origin })

  const namespace = cal.ns?.[embed.namespace]
  if (!namespace) throw new Error('Cal did not open a namespace to configure')

  namespace('inline', inline)
  namespace('ui', ui)

  await embedRendered(mount)
}

/**
 * Put the calendar back in step with the page's appearance.
 *
 * The embed is mounted once and kept, so a visitor who opens the dialog,
 * closes it, flips the site to dark and opens it again would otherwise be
 * looking at a white calendar on a dark page. Re-sent on every open, which is
 * the only moment the two can have drifted: the appearance toggle lives in the
 * navbar, and the navbar is out of reach while the dialog is up.
 */
export function applyCalTheme(embed: CalEmbed, theme: Theme): void {
  window.Cal?.ns?.[embed.namespace]?.('ui', calEmbedOptions(embed, theme).ui)
}
