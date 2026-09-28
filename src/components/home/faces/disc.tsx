import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react'
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
 * Two levels of life, and the utilities below key both: hovered in the
 * scatter, the record slides out and spins — motion only, nothing to read at
 * that size.
 * Presented, the popover comes up as well, with the track, the time and the
 * skip controls, and the clock below runs for as long as that lasts.
 */
export function DiscFace({
  item,
  presented = false,
  standalone = false,
}: {
  item: DiscItem
  presented?: boolean
  /** The experiment page is not nested inside the folder's button, so its
   * transport controls can and should be real, keyboard-accessible buttons. */
  standalone?: boolean
}) {
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
     editing the `.card` element's own `overflow-hidden` in
     hero-folder.tsx. */
  const rootClass = "absolute inset-0 rounded-[inherit] [.card:has(&)]:overflow-visible!"

  if (tracks.length === 0) return <span className={rootClass} />

  const track = tracks[playing.index] ?? tracks[0]
  const duration = durations[playing.index] ?? track.durationMs
  const progress = duration > 0 ? Math.min(playing.positionMs / duration, 1) : 0

  /* The label and cover both cross-fade between the same set of covers by
     stacking every candidate and showing only the current one — data-current
     is written above from `playing.index`, never a class, since nothing but
     this opacity switch depends on it. */
  const crossfadeImg =
    "absolute inset-0 size-full object-cover opacity-0 [transition:opacity_var(--duration-slow)_var(--ease-standard)] data-[current=true]:opacity-100"

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
          is the base, the desktop one an md: override. */}
      <span
        className="absolute top-1/2 left-1/2 z-1 size-[92cqw] overflow-clip rounded-full transform-[translate(-50%,-50%)_translateX(0%)] [transition:transform_var(--duration-base)_var(--ease-out-cubic)] [.folder.is-open_.card:hover_&]:[translate(-50%,-50%)_translateX(30%)] [.folder.is-open_.folder\_\_item.is-focused_.card_&]:[translate(-50%,-50%)_translateX(30%)] md:[.folder.is-open_.card:hover_&]:[translate(-50%,-50%)_translateX(56%)] md:[.folder.is-open_.folder\_\_item.is-focused_.card_&]:[translate(-50%,-50%)_translateX(56%)]"
        aria-hidden="true"
      >
        <span
          /* Spins only while presented or hovered; paused otherwise. Written
             as one arbitrary animation shorthand per state (rather than a
             separate animation-play-state longhand) so there is no ordering
             question between two rules touching the same sub-property. */
          className="absolute inset-0 rounded-full bg-[#0e0e0e] [background-image:conic-gradient(from_205deg_at_46%_42%,rgb(255_255_255/7%),transparent_16%,transparent_52%,rgb(255_255_255/5%)_64%,transparent_80%),repeating-radial-gradient(circle_at_50%_50%,rgb(255_255_255/3%)_0,rgb(255_255_255/3%)_1px,transparent_1px,transparent_1.5cqw)] shadow-[inset_0_0_0_1px_rgb(255_255_255/10%)] [animation:disc-spin_1.8s_linear_infinite_paused] [.folder.is-open_.card:hover_&]:[animation:disc-spin_1.8s_linear_infinite_running] [.folder.is-open_.folder\_\_item.is-focused_.card_&]:[animation:disc-spin_1.8s_linear_infinite_running] motion-reduce:[animation:none]"
        >
          {/* The label: the current cover, cropped round, so it visibly
              turns with the platter even though the spindle beneath it does
              not need to move at all. */}
          <span className="absolute top-1/2 left-1/2 size-[34cqw] [translate(-50%,-50%)] rounded-full overflow-hidden shadow-[inset_0_0_0_1px_rgb(255_255_255/12%)]">
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
          <span className="absolute top-1/2 left-1/2 size-[4cqw] [translate(-50%,-50%)] rounded-full bg-[#f9f9f9]" />
        </span>
      </span>

      <span className="absolute inset-0 z-2 rounded-[inherit] overflow-hidden">
        {tracks.map((candidate, index) => (
          <img
            key={candidate.art}
            className={`${crossfadeImg} rounded-[inherit]`}
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
        className="absolute bottom-[calc(100%+3cqw)] left-1/2 z-3 flex flex-col min-w-[66cqw] max-w-[120cqw] pt-[2.2cqw] pr-[2.6cqw] pb-[2cqw] pl-[3.2cqw] rounded-[2.4cqw] bg-[rgb(21_21_21/92%)] [backdrop-filter:blur(8px)] text-[#f9f9f9] font-display leading-tight whitespace-nowrap opacity-0 pointer-events-none [translateX(-50%)_translateY(1.5cqw)] [transition:opacity_var(--duration-fast)_var(--ease-out-cubic),transform_var(--duration-fast)_var(--ease-out-cubic)] [.folder.is-open_.folder\_\_item.is-focused_.card_&]:opacity-100 [.folder.is-open_.folder\_\_item.is-focused_.card_&]:[translateX(-50%)_translateY(0)]"
        aria-hidden={standalone ? undefined : 'true'}
      >
        <span className="flex items-center gap-[3cqw]">
          <span className="flex flex-1 flex-col gap-[0.3cqw] min-w-0 text-left">
            <span className="overflow-hidden text-[4.2cqw] font-semibold tracking-snug text-ellipsis">
              {track.title}
            </span>
            <span className="overflow-hidden text-[rgb(249_249_249/72%)] text-[3.4cqw] font-medium text-ellipsis">
              {track.artist}
            </span>
          </span>
          {/* The homepage face is nested inside the folder's button, so its
              controls remain pointer-only spans there. The standalone
              experiment has no nesting constraint and renders real buttons. */}
          <span className="flex shrink-0 gap-[1cqw]">
            {([-1, 1] as const).map((direction) => {
              const label = direction === -1 ? 'Previous track' : 'Next track'
              const icon = direction === -1 ? (
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M13 3l-8 5 8 5z" fill="currentColor" />
                  <rect x="2.2" y="3" width="1.8" height="10" rx="0.5" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 3l8 5-8 5z" fill="currentColor" />
                  <rect x="12" y="3" width="1.8" height="10" rx="0.5" fill="currentColor" />
                </svg>
              )
              const className =
                "grid size-[6.4cqw] place-items-center rounded-full border-0 bg-[rgb(255_255_255/10%)] p-0 text-inherit cursor-pointer pointer-events-auto [transition:background_var(--duration-fast)] hover:bg-[rgb(255_255_255/18%)] [&_svg]:size-[2.6cqw]"
              const activate = (event: ReactMouseEvent) => {
                event.stopPropagation()
                skip(direction)
              }

              return standalone ? (
                <button key={direction} className={className} type="button" aria-label={label} onClick={activate}>
                  {icon}
                </button>
              ) : (
                <span
                  key={direction}
                  className={className}
                  role="button"
                  aria-label={label}
                  data-dir={direction === -1 ? 'prev' : 'next'}
                  /* The folder begins a drag on pointerdown. Stopping it here
                     means this press never becomes a grip, so the control
                     still receives the click instead of moving the card. */
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={activate}
                >
                  {icon}
                </span>
              )
            })}
          </span>
        </span>
        <span className="flex flex-col gap-[1.2cqw] mt-[1.6cqw]">
          <span className="relative h-[2cqw] rounded-full bg-[rgb(249_249_249/18%)] overflow-hidden">
            <span
              className="absolute inset-y-0 left-0 rounded-[inherit] bg-[#f9f9f9] [transition:width_var(--duration-fast)_linear]"
              style={{ width: `${progress * 100}%` }}
            />
          </span>
          <span className="flex justify-between text-[rgb(249_249_249/62%)] font-sans text-[2.8cqw] [font-variant-numeric:tabular-nums]">
            <span>{formatTime(playing.positionMs)}</span>
            <span>{formatTime(duration)}</span>
          </span>
        </span>
        <span className="absolute bottom-[-1.6cqw] left-1/2 w-[2.8cqw] h-[1.6cqw] [translateX(-50%)] bg-[rgb(21_21_21/92%)] [clip-path:polygon(50%_100%,0_0,100%_0)]" />
      </span>
    </span>
  )
}
