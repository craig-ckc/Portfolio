import { useEffect, useMemo, useState } from 'react'
import type { DiscItem } from '../../../content/home-page'
import { formatTime, positionAt, skip as skipTo, type Position } from '../../../lib/now-playing'

const REST: Position = { index: 0, positionMs: 0 }

/**
 * What is on while the work gets done: a cover that is also the card, a
 * record sleeved behind it that slides out and spins on hover, and a small
 * popover naming the track.
 *
 * The transport is simulated — see src/lib/now-playing.ts — and starts from
 * an epoch read in an effect rather than at render, so SSR always shows track
 * zero at 0:00 and hydration takes over silently from there.
 *
 * Two clocks, not one: a slow one keeps the current track (and so the cover
 * cross-fade) correct even while nobody is looking, by sleeping until the
 * exact moment the track changes rather than polling for it; a fast one only
 * runs while the popover can be seen, to keep its elapsed time live. Both
 * read the same positionAt(durations, Date.now() - epoch), so there is never
 * a moment where they disagree about what is playing.
 *
 * `presented` is the folder telling this card it is the one being looked at.
 * Two levels of life, and the `tw:` utilities below key both: hovered in the
 * scatter, the record slides out and spins — motion only, nothing to read at
 * that size.
 * Presented, the popover comes up as well, with the track, the time and the
 * skip controls, and the clock below runs for as long as that lasts.
 */
export function DiscFace({ item, presented = false }: { item: DiscItem; presented?: boolean }) {
  const tracks = item.tracks
  const durations = useMemo(() => tracks.map((track) => track.durationMs), [tracks])

  const [epoch, setEpoch] = useState<number | null>(null)
  const [playing, setPlaying] = useState<Position>(REST)

  useEffect(() => {
    setEpoch(Date.now())
  }, [])

  /* The slow clock: always running, but it only wakes at track boundaries, so
     a song ending while the card is untouched still cross-fades the cover. */
  useEffect(() => {
    if (epoch === null || durations.length === 0) return

    let timer: ReturnType<typeof setTimeout>

    const settle = () => {
      const current = positionAt(durations, Date.now() - epoch)
      setPlaying(current)

      const remaining = (durations[current.index] ?? 0) - current.positionMs
      /* A floor under the wait so a zero-length track (or float rounding
         right on a boundary) can never spin this into a tight loop. */
      timer = setTimeout(settle, Math.max(remaining, 50))
    }

    settle()
    return () => clearTimeout(timer)
  }, [epoch, durations])

  /* The fast clock: only while the popover is up, which is only while the
     card is presented — hovered in the scatter, the record slides out and
     spins but says nothing, since at that size nothing it could say would be
     legible. So the elapsed time is live exactly when it can be read, without
     a per-second re-render for every card in the folder all the time. */
  const showing = presented
  useEffect(() => {
    if (epoch === null || !showing || durations.length === 0) return

    setPlaying(positionAt(durations, Date.now() - epoch))
    const id = setInterval(() => setPlaying(positionAt(durations, Date.now() - epoch)), 1000)
    return () => clearInterval(id)
  }, [epoch, showing, durations])

  /* Skipping only moves the epoch — the clocks above both derive from it, so
     the slow one settles at the new boundary and the fast one (if running)
     just keeps ticking from the new offset. setPlaying here is the one thing
     that wouldn't otherwise happen until those clocks next fire, which could
     be up to a second away; without it the click would land but the title,
     cover and bar would lag behind the epoch that already changed. */
  const skip = (direction: 1 | -1) => {
    if (epoch === null) return
    const now = Date.now()
    const elapsed = skipTo(durations, now - epoch, direction)
    setEpoch(now - elapsed)
    setPlaying(positionAt(durations, elapsed))
  }

  /* The card's own overflow: visible (needed because the record and the
     popover both poke outside the card's square) targets the folder agent's
     element, so it is asserted from here with a :has() variant instead of
     editing the `.card` element's own `tw:overflow-hidden` in
     hero-folder.tsx. */
  const rootClass = "tw:absolute tw:inset-0 tw:rounded-[inherit] tw:[.card:has(&)]:overflow-visible!"

  if (tracks.length === 0) return <span className={rootClass} />

  const track = tracks[playing.index] ?? tracks[0]
  const duration = durations[playing.index] ?? track.durationMs
  const progress = duration > 0 ? Math.min(playing.positionMs / duration, 1) : 0

  /* The label and cover both cross-fade between the same set of covers by
     stacking every candidate and showing only the current one — data-current
     is written above from `playing.index`, never a class, since nothing but
     this opacity switch depends on it. */
  const crossfadeImg =
    "tw:absolute tw:inset-0 tw:size-full tw:object-cover tw:opacity-0 tw:[transition:opacity_var(--duration-slow)_var(--ease-standard)] tw:data-[current=true]:opacity-100"

  return (
    <span className={rootClass}>
      {/* Centred behind the cover at rest, so "shut" and "open but not
          hovered" both read as a plain cover with nothing behind it. Two
          things bring it out: the pointer arriving, and the card being
          presented — a record brought to the middle should not need finding
          with the cursor as well. Slide and spin are two different elements
          on purpose: a translate here and a rotate on the platter below
          compose cleanly, where the same element doing both would need its
          rotation pivot fighting its own offset.

          The platter inside is a square that rotates, and a rotated square's
          box is wider than the circle drawn in it — up to 41% wider at 45°.
          overflow-clip on this sliding box (rather than on the platter
          itself) keeps that overflow from growing the page a scrollbar on a
          narrow screen, since the circle fits the square exactly and nothing
          drawn is lost.

          Below 900px the presented card is two thirds of the screen wide,
          and a record slid the full 56% would run past its right edge; it
          comes out only a third of the way there instead — the mobile value
          is the base, the desktop one a tw:md: override. */}
      <span
        className="tw:absolute tw:top-1/2 tw:left-1/2 tw:z-[1] tw:size-[92cqw] tw:overflow-clip tw:rounded-full tw:[transform:translate(-50%,-50%)_translateX(0%)] tw:[transition:transform_var(--duration-base)_var(--ease-out-cubic)] tw:[.folder.is-open_.card:hover_&]:[transform:translate(-50%,-50%)_translateX(30%)] tw:[.folder.is-open_.folder\_\_item.is-focused_.card_&]:[transform:translate(-50%,-50%)_translateX(30%)] tw:md:[.folder.is-open_.card:hover_&]:[transform:translate(-50%,-50%)_translateX(56%)] tw:md:[.folder.is-open_.folder\_\_item.is-focused_.card_&]:[transform:translate(-50%,-50%)_translateX(56%)]"
        aria-hidden="true"
      >
        <span
          /* Spins only while presented or hovered; paused otherwise. Written
             as one arbitrary animation shorthand per state (rather than a
             separate animation-play-state longhand) so there is no ordering
             question between two rules touching the same sub-property. */
          className="tw:absolute tw:inset-0 tw:rounded-full tw:bg-[#0e0e0e] tw:[background-image:conic-gradient(from_205deg_at_46%_42%,rgb(255_255_255/7%),transparent_16%,transparent_52%,rgb(255_255_255/5%)_64%,transparent_80%),repeating-radial-gradient(circle_at_50%_50%,rgb(255_255_255/3%)_0,rgb(255_255_255/3%)_1px,transparent_1px,transparent_1.5cqw)] tw:shadow-[inset_0_0_0_1px_rgb(255_255_255/10%)] tw:[animation:disc-spin_1.8s_linear_infinite_paused] tw:[.folder.is-open_.card:hover_&]:[animation:disc-spin_1.8s_linear_infinite_running] tw:[.folder.is-open_.folder\_\_item.is-focused_.card_&]:[animation:disc-spin_1.8s_linear_infinite_running] tw:motion-reduce:[animation:none]"
        >
          {/* The label: the current cover, cropped round, so it visibly
              turns with the platter even though the spindle beneath it does
              not need to move at all. */}
          <span className="tw:absolute tw:top-1/2 tw:left-1/2 tw:size-[34cqw] tw:[transform:translate(-50%,-50%)] tw:rounded-full tw:overflow-hidden tw:shadow-[inset_0_0_0_1px_rgb(255_255_255/12%)]">
            {tracks.map((candidate, index) => (
              <img
                key={candidate.art}
                className={crossfadeImg}
                src={candidate.art}
                alt=""
                draggable={false}
                loading="lazy"
                data-current={index === playing.index}
              />
            ))}
          </span>
          <span className="tw:absolute tw:top-1/2 tw:left-1/2 tw:size-[4cqw] tw:[transform:translate(-50%,-50%)] tw:rounded-full tw:bg-[#f9f9f9]" />
        </span>
      </span>

      <span className="tw:absolute tw:inset-0 tw:z-[2] tw:rounded-[inherit] tw:overflow-hidden">
        {tracks.map((candidate, index) => (
          <img
            key={candidate.art}
            className={`${crossfadeImg} tw:rounded-[inherit]`}
            src={candidate.art}
            alt=""
            draggable={false}
            loading="lazy"
            data-current={index === playing.index}
          />
        ))}
      </span>

      {/* Presented only — never on a scatter hover. Small, the title and the
          times are not legible, and a label that cannot be read is noise;
          the record sliding out is enough to say what this is. Brought to
          the middle, it can be read and used. The popover as a whole is
          pointer-events: none so it never steals the drag; the skip
          controls opt back in individually below. */}
      <span
        className="tw:absolute tw:bottom-[calc(100%+3cqw)] tw:left-1/2 tw:z-[3] tw:flex tw:flex-col tw:min-w-[66cqw] tw:max-w-[120cqw] tw:pt-[2.2cqw] tw:pr-[2.6cqw] tw:pb-[2cqw] tw:pl-[3.2cqw] tw:rounded-[2.4cqw] tw:bg-[rgb(21_21_21/92%)] tw:[backdrop-filter:blur(8px)] tw:text-[#f9f9f9] tw:font-display tw:leading-tight tw:whitespace-nowrap tw:opacity-0 tw:pointer-events-none tw:[transform:translateX(-50%)_translateY(1.5cqw)] tw:[transition:opacity_var(--duration-fast)_var(--ease-out-cubic),transform_var(--duration-fast)_var(--ease-out-cubic)] tw:[.folder.is-open_.folder\_\_item.is-focused_.card_&]:opacity-100 tw:[.folder.is-open_.folder\_\_item.is-focused_.card_&]:[transform:translateX(-50%)_translateY(0)]"
        aria-hidden="true"
      >
        <span className="tw:flex tw:items-center tw:gap-[3cqw]">
          <span className="tw:flex tw:flex-1 tw:flex-col tw:gap-[0.3cqw] tw:min-w-0 tw:text-left">
            <span className="tw:overflow-hidden tw:text-[4.2cqw] tw:font-semibold tw:tracking-snug tw:text-ellipsis">
              {track.title}
            </span>
            <span className="tw:overflow-hidden tw:text-[rgb(249_249_249/72%)] tw:text-[3.4cqw] tw:font-medium tw:text-ellipsis">
              {track.artist}
            </span>
          </span>
          {/* Spans with role="button", not real buttons: a <button> nested
              inside the folder's own <button> is invalid HTML. The popover
              they live in is aria-hidden, so there is no accessible name to
              give them — they are pointer-only, which is also why neither
              gets a tabIndex. */}
          <span className="tw:flex tw:flex-shrink-0 tw:gap-[1cqw]">
            <span
              className="tw:grid tw:size-[6.4cqw] tw:place-items-center tw:rounded-full tw:bg-[rgb(255_255_255/10%)] tw:cursor-pointer tw:pointer-events-auto tw:[transition:background_var(--duration-fast)] tw:hover:bg-[rgb(255_255_255/18%)] tw:[&_svg]:size-[2.6cqw]"
              role="button"
              aria-label="Previous track"
              data-dir="prev"
              /* The folder begins a drag on pointerdown. Stopping it here
                 means this press never becomes a grip, so the button still
                 gets its own pointerup and click rather than the card being
                 grabbed instead — the trade is that the card can't be
                 dragged by this control, which is fine. */
              onPointerDown={(event) => event.stopPropagation()}
              /* Chrome fires click on the nearest common ancestor of the
                 pointerdown and pointerup targets, which is the folder's
                 <button> unless this is stopped — without it every skip
                 would also toggle the card's focused state. */
              onClick={(event) => {
                event.stopPropagation()
                skip(-1)
              }}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M13 3l-8 5 8 5z" fill="currentColor" />
                <rect x="2.2" y="3" width="1.8" height="10" rx="0.5" fill="currentColor" />
              </svg>
            </span>
            <span
              className="tw:grid tw:size-[6.4cqw] tw:place-items-center tw:rounded-full tw:bg-[rgb(255_255_255/10%)] tw:cursor-pointer tw:pointer-events-auto tw:[transition:background_var(--duration-fast)] tw:hover:bg-[rgb(255_255_255/18%)] tw:[&_svg]:size-[2.6cqw]"
              role="button"
              aria-label="Next track"
              data-dir="next"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                skip(1)
              }}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 3l8 5-8 5z" fill="currentColor" />
                <rect x="12" y="3" width="1.8" height="10" rx="0.5" fill="currentColor" />
              </svg>
            </span>
          </span>
        </span>
        <span className="tw:flex tw:flex-col tw:gap-[1.2cqw] tw:mt-[1.6cqw]">
          <span className="tw:relative tw:h-[2cqw] tw:rounded-full tw:bg-[rgb(249_249_249/18%)] tw:overflow-hidden">
            <span
              className="tw:absolute tw:inset-y-0 tw:left-0 tw:rounded-[inherit] tw:bg-[#f9f9f9] tw:[transition:width_var(--duration-fast)_linear]"
              style={{ width: `${progress * 100}%` }}
            />
          </span>
          <span className="tw:flex tw:justify-between tw:text-[rgb(249_249_249/62%)] tw:font-sans tw:text-[2.8cqw] tw:[font-variant-numeric:tabular-nums]">
            <span>{formatTime(playing.positionMs)}</span>
            <span>{formatTime(duration)}</span>
          </span>
        </span>
        <span className="tw:absolute tw:bottom-[-1.6cqw] tw:left-1/2 tw:w-[2.8cqw] tw:h-[1.6cqw] tw:[transform:translateX(-50%)] tw:bg-[rgb(21_21_21/92%)] tw:[clip-path:polygon(50%_100%,0_0,100%_0)]" />
      </span>
    </span>
  )
}
