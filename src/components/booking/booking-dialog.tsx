import { useCallback, useEffect, useRef, useState } from 'react'
import { booking, bookingDialog } from '../../content/home-page'
import { applyCalTheme, CAL_MOUNT_ID, calEmbedRendered, mountCalInline } from '../../lib/cal-embed'
import { getLenis } from '../../lib/smooth-scroll'
import { appliedTheme } from '../../lib/theme'

/**
 * Where a project starts. One per page, opened by every element carrying
 * `data-booking` — the hero button and the closing invitation.
 *
 * It used to be Cal's popover, opened by Cal's own script, and the trouble
 * with that was never the calendar. It was that the calendar was the whole
 * screen. Somebody who clicks "start your project" is not usually ready to
 * pick a Tuesday; they are working out whether to get in touch at all, and a
 * grid of time slots is an odd answer to that question. Whoever decided it was
 * not worth answering left, and there was nothing else here for them.
 *
 * So the modal is the site's own and Cal is inline inside it. That buys three
 * things, in order of how much they matter:
 *
 *   the framing   The left-hand side says what the call is, how long it takes,
 *                 what gets covered and that nothing has to come of it. That is
 *                 the answer to the question actually being asked, and it is
 *                 said here rather than on somebody else's domain.
 *   a way out     An email link sits beside the calendar, not behind it, for
 *                 the people who would simply rather write than talk.
 *   the failure   Cal's script is a third party and third parties get blocked.
 *                 When it does not arrive, this says so and offers the other
 *                 two doors instead of showing an empty rectangle.
 *
 * `<dialog>` and showModal() rather than the hand-built overlay the hero
 * folder uses: that one needs its veil *between* two layers of a single object,
 * so it cannot go in the top layer. This has no such problem, and in exchange
 * the browser handles the focus trap, Escape, returning focus to whatever was
 * clicked, and painting above the navbar — all of which would otherwise be
 * code here to get wrong.
 */

type Status = 'idle' | 'loading' | 'ready' | 'failed'

export function BookingDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  /* What became of the one attempt to fetch Cal. A ref and not the state below
     because `show` has to read it without being rebuilt every time it changes,
     and nothing is drawn from it — `status` is what the render reads. */
  const attempt = useRef<Status>('idle')

  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>('idle')

  const settle = (next: Status) => {
    attempt.current = next
    setStatus(next)
  }

  const show = useCallback(() => {
    const dialog = dialogRef.current
    const mount = mountRef.current
    if (!dialog || !mount || dialog.open) return

    dialog.showModal()
    setOpen(true)

    const theme = appliedTheme(dialog)

    /* Cal is fetched and mounted once and then kept, so reopening costs
       nothing. The only thing that can have changed under it while the dialog
       was shut is the appearance. */
    if (attempt.current === 'loading' || attempt.current === 'ready') {
      applyCalTheme(booking, theme)
      return
    }

    /* Reopening after giving up. Cal is asked for again rather than mounted
       again — a second `inline` call against an element that has since been
       drawn into would leave two calendars in it — so this only catches the
       case the wait was too short for: a script that was slow, not blocked. */
    if (attempt.current === 'failed') {
      if (calEmbedRendered(mount)) settle('ready')
      return
    }

    settle('loading')
    mountCalInline(mount, booking, theme).then(
      () => settle('ready'),
      () => settle('failed'),
    )
  }, [])

  const close = useCallback(() => dialogRef.current?.close(), [])

  /* One listener on the document rather than a handler per trigger. The
     triggers are in islands of their own and the closing section is not
     hydrated at all, so there is no shared React tree to pass a callback down.
     This is the same shape Cal's own embed used, and it keeps every trigger a
     plain link in the markup.
   *
   * A modified click is left alone on purpose: cmd-clicking the CTA should
   * still open the booking page in a new tab, which is what its href is for. */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target
      if (!(target instanceof Element) || !target.closest('[data-booking]')) return

      event.preventDefault()
      show()
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [show])

  /* Everything that has to be true of the page underneath while the dialog is
     up. showModal() puts the rest of the document out of reach on its own; what
     it does not reliably do is hold it still. */
  useEffect(() => {
    if (!open) return

    /* Lenis owns the scroll position, so stopping it is most of the lock.
       Nothing here touches overflow — see the note in src/styles.css on why
       clipping the document is worse than the problem it solves. The panel
       carries `data-lenis-prevent` so its own scrolling stays native and does
       not go through Lenis at all. */
    const lenis = getLenis()
    lenis?.stop()

    /* The wheel, which Lenis being stopped does not cover: under reduced
       motion it was never started. Allowed through inside the panel, which is
       the one thing on screen that is meant to scroll. */
    const panel = panelRef.current
    const blockWheel = (event: Event) => {
      const target = event.target
      if (target instanceof Node && panel?.contains(target)) return
      event.preventDefault()
    }

    /* And a drag on the scrollbar itself, which is not an event anything can
       cancel. The position is put back instead, which reads as a bar that will
       not be dragged rather than a page that scrolled and returned. */
    const pinned = window.scrollY
    const repin = () => {
      if (window.scrollY !== pinned) window.scrollTo(0, pinned)
    }

    window.addEventListener('wheel', blockWheel, { passive: false })
    window.addEventListener('touchmove', blockWheel, { passive: false })
    window.addEventListener('scroll', repin, { passive: true })

    return () => {
      lenis?.start()
      window.removeEventListener('wheel', blockWheel)
      window.removeEventListener('touchmove', blockWheel)
      window.removeEventListener('scroll', repin)
    }
  }, [open])

  /* The link beside the calendar and every link in the unavailable state share
     one look: a hairline underline in --neutral-600 that steps up to the ink
     colour on hover. Kept as a single string rather than repeated per call
     site. */
  const inlineLink =
    'tw:pb-4xs tw:border-b tw:border-neutral-600 tw:text-foreground tw:font-semibold tw:transition-colors tw:duration-320 tw:ease-standard tw:hover:border-foreground'

  return (
    <dialog
      /* The three themed custom properties (edge/rule/shadow) are declared
         right here, with a `tw:dark:` pair each, where they are read.

         The open/close choreography — the entrance transition, its
         `@starting-style` counterpart, the `display`/`overlay` allow-discrete
         legs, and `::backdrop` — is written with the `open`, `starting` and
         `backdrop` variants, which reach every leg a native <dialog> needs
         without a class of its own. `display` still can't be unconditional
         (the UA's `dialog:not([open]) { display: none }` must win while shut),
         so only `tw:open:flex` sets it, exactly as `.booking[open]` did. */
      className="tw:[--booking-edge:rgb(21_21_21/10%)] tw:dark:[--booking-edge:rgb(255_255_255/12%)] tw:[--booking-rule:rgb(21_21_21/8%)] tw:dark:[--booking-rule:rgb(255_255_255/10%)] tw:[--booking-shadow:0_2px_8px_rgb(0_0_0/6%),0_28px_64px_rgb(0_0_0/14%)] tw:dark:[--booking-shadow:0_2px_8px_rgb(0_0_0/44%),0_28px_64px_rgb(0_0_0/56%)] tw:w-screen tw:h-dvh tw:rounded-none tw:sm:w-[min(560px,calc(100vw-var(--spacing-md)*2))] tw:sm:h-[min(860px,calc(100dvh-var(--spacing-md)*2))] tw:sm:rounded-lg tw:md:w-[min(1280px,calc(100vw-var(--spacing-2xl)*2))] tw:md:h-[min(700px,calc(100dvh-var(--spacing-2xl)*2))] tw:max-w-none tw:max-h-none tw:overflow-hidden tw:p-0 tw:border tw:border-(--booking-edge) tw:bg-background tw:shadow-(--booking-shadow) tw:text-foreground tw:font-sans tw:tracking-normal tw:opacity-0 tw:[transform:translateY(8px)_scale(0.99)] tw:[transition:opacity_var(--duration-base)_var(--ease-standard),transform_var(--duration-base)_var(--ease-out-cubic),display_var(--duration-base)_allow-discrete,overlay_var(--duration-base)_allow-discrete] tw:open:flex tw:open:opacity-100 tw:open:[transform:none] tw:open:starting:opacity-0 tw:open:starting:[transform:translateY(8px)_scale(0.99)] tw:backdrop:[background:rgb(249_249_249/72%)] tw:dark:backdrop:[background:rgb(12_12_12/70%)] tw:backdrop:[backdrop-filter:blur(24px)_saturate(125%)] tw:backdrop:opacity-0 tw:backdrop:[transition:opacity_var(--duration-base)_var(--ease-standard),display_var(--duration-base)_allow-discrete,overlay_var(--duration-base)_allow-discrete] tw:open:backdrop:opacity-100 tw:open:backdrop:starting:opacity-0 tw:motion-reduce:backdrop:[transition-duration:1ms]!"
      ref={dialogRef}
      aria-labelledby="booking-title"
      /* Escape and the close button both end up here, so this is the one place
         the open state is written back. */
      onClose={() => setOpen(false)}
      /* The backdrop is the dialog's own pseudo-element, so a click on it
         lands on the dialog and a click on anything real does not. */
      onClick={(event) => {
        if (event.target === dialogRef.current) close()
      }}
    >
      {/* Mobile-first: one column at the top of the file, the desktop grid and
          padding riding in on `tw:md:`, matching the `@media (max-width: 899.98px)`
          rule it replaces. */}
      <div
        className="tw:relative tw:grid tw:flex-1 tw:min-h-0 tw:grid-cols-1 tw:md:grid-cols-[minmax(0,340px)_minmax(0,1fr)] tw:gap-2xl tw:pt-xl tw:px-md tw:pb-2xl tw:sm:p-2xl tw:md:p-3xl tw:overflow-auto tw:overscroll-contain"
        ref={panelRef}
        data-lenis-prevent
      >
        <button
          className="tw:absolute tw:top-xs tw:right-xs tw:sm:top-md tw:sm:right-md tw:z-1 tw:grid tw:size-[34px] tw:place-items-center tw:p-0 tw:border tw:border-(--booking-edge) tw:rounded-full tw:bg-background tw:text-foreground tw:cursor-pointer tw:transition-[background-color,transform] tw:duration-180 tw:ease-standard tw:hover:bg-neutral-300 tw:active:scale-[0.94]"
          type="button"
          onClick={close}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={1.4} aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
          <span className="tw:sr-only">{bookingDialog.close}</span>
        </button>

        <div className="tw:flex tw:min-w-0 tw:flex-col tw:items-start">
          <p className="tw:text-neutral-700 tw:text-2xs tw:font-semibold tw:tracking-wider tw:leading-normal tw:uppercase">
            {bookingDialog.eyebrow}
          </p>
          {/* BEYOND THE FRAME: the clamp() sizes the title between the two
              breakpoints rather than jumping between two fixed scale steps —
              there is no token for a fluid size. */}
          <h2
            className="tw:pt-sm tw:font-display tw:text-[clamp(1.75rem,2.2vw,2.375rem)] tw:font-bold tw:[font-variation-settings:'wght'_700] tw:tracking-snug tw:leading-tight"
            id="booking-title"
          >
            {bookingDialog.title}
          </h2>
          <p className="tw:pt-md tw:text-neutral-700 tw:text-body tw:leading-loose">{bookingDialog.lead}</p>

          <p className="tw:pt-2xl tw:text-2xs tw:font-semibold tw:tracking-wider tw:leading-normal tw:uppercase">
            {bookingDialog.coversLead}
          </p>
          <ul className="tw:flex tw:flex-col tw:m-0 tw:p-0 tw:pt-sm tw:gap-xs tw:list-none tw:text-body tw:leading-relaxed">
            {/* A rule per line rather than a bullet: the list is three short
                sentences, and bullets at this size read as a form being filled
                in. */}
            {bookingDialog.covers.map((line) => (
              <li key={line} className="tw:pt-xs tw:border-t tw:border-(--booking-rule)">
                {line}
              </li>
            ))}
          </ul>

          <p className="tw:pt-lg tw:text-neutral-700 tw:text-2xs tw:leading-relaxed">{bookingDialog.prep}</p>

          {/* The way in for anybody who would rather not open a calendar.
              Pushed to the bottom of the column on the wide layout (`tw:md:mt-auto`)
              so it sits level with the foot of the scheduler beside it; on the
              stacked layout the panel itself is the scroller, so there is
              nothing to push against and the margin is dropped. */}
          <p className="tw:w-full tw:mt-0 tw:md:mt-auto tw:pt-md tw:border-t tw:border-(--booking-rule) tw:text-neutral-700 tw:text-2xs tw:leading-relaxed">
            <span>{bookingDialog.fallbackLead}</span>{' '}
            <a className={inlineLink} href={bookingDialog.fallbackLink.href}>
              {bookingDialog.fallbackLink.label}
            </a>{' '}
            <span>{bookingDialog.fallbackTrail}</span>
          </p>
        </div>

        {/* No edge and no radius of its own. Cal's booker is already a bordered
            card, and a second frame around it reads as two panels that happen
            to be nested rather than as one calendar. This is a slot for it,
            not a container. */}
        <div className="tw:relative tw:min-w-0 tw:overflow-hidden tw:min-h-[380px] tw:md:min-h-[420px]" data-status={status}>
          {/* Cal draws into this by id — see CAL_MOUNT_ID. It stays in the tree
              whatever the status, because the element has to be there before
              Cal is told to use it and has to stay there afterwards. Cal sizes
              its own iframe and expects the element it was handed to give it
              room, which is what the `tw:h-full`/`tw:h-auto` pair is. */}
          <div
            className="tw:w-full tw:h-auto tw:min-h-[380px] tw:md:h-full tw:md:min-h-0 tw:overflow-auto tw:overscroll-contain tw:[&_iframe]:border-0"
            id={CAL_MOUNT_ID}
            ref={mountRef}
          />

          {/* Over the mount rather than instead of it: the element Cal was
              pointed at has to stay in the tree whether or not Cal ever turns
              up. */}
          {status === 'loading' ? (
            <p
              className="tw:absolute tw:inset-0 tw:grid tw:content-center tw:justify-items-center tw:p-2xl tw:gap-md tw:bg-background tw:text-neutral-700 tw:text-body tw:leading-relaxed tw:text-center tw:text-balance"
              aria-live="polite"
            >
              {bookingDialog.loading}
            </p>
          ) : null}

          {status === 'failed' ? (
            <div
              className="tw:absolute tw:inset-0 tw:grid tw:content-center tw:justify-items-center tw:p-2xl tw:gap-md tw:bg-background tw:text-neutral-700 tw:text-body tw:leading-relaxed tw:text-center tw:text-balance"
              role="alert"
            >
              <p>{bookingDialog.unavailable}</p>
              <p className="tw:flex tw:flex-wrap tw:justify-center tw:gap-lg">
                {bookingDialog.unavailableLinks.map((link) => (
                  <a
                    key={link.label}
                    className={inlineLink}
                    href={link.href}
                    {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  >
                    {link.label}
                  </a>
                ))}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </dialog>
  )
}
