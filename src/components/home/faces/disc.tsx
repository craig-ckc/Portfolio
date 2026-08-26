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
 * Two levels of life, and disc.css keys both: hovered in the scatter, the
 * record slides out and spins — motion only, nothing to read at that size.
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

  if (tracks.length === 0) return <span className="disc" />

  const track = tracks[playing.index] ?? tracks[0]
  const duration = durations[playing.index] ?? track.durationMs
  const progress = duration > 0 ? Math.min(playing.positionMs / duration, 1) : 0

  return (
    <span className="disc">
      <span className="disc__record" aria-hidden="true">
        <span className="disc__platter">
          <span className="disc__label">
            {tracks.map((candidate, index) => (
              <img
                key={candidate.art}
                src={candidate.art}
                alt=""
                draggable={false}
                loading="lazy"
                data-current={index === playing.index}
              />
            ))}
          </span>
          <span className="disc__spindle" />
        </span>
      </span>

      <span className="disc__cover">
        {tracks.map((candidate, index) => (
          <img
            key={candidate.art}
            src={candidate.art}
            alt=""
            draggable={false}
            loading="lazy"
            data-current={index === playing.index}
          />
        ))}
      </span>

      <span className="disc__tip" aria-hidden="true">
        <span className="disc__tip-row">
          <span className="disc__tip-text">
            <span className="disc__tip-title">{track.title}</span>
            <span className="disc__tip-artist">{track.artist}</span>
          </span>
          {/* Spans with role="button", not real buttons: a <button> nested
              inside the folder's own <button> is invalid HTML. The popover
              they live in is aria-hidden, so there is no accessible name to
              give them — they are pointer-only, which is also why neither
              gets a tabIndex. */}
          <span className="disc__tip-controls">
            <span
              className="disc__tip-skip"
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
              className="disc__tip-skip"
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
        <span className="disc__tip-progress">
          <span className="disc__tip-track">
            <span className="disc__tip-fill" style={{ width: `${progress * 100}%` }} />
          </span>
          <span className="disc__tip-time">
            <span>{formatTime(playing.positionMs)}</span>
            <span>{formatTime(duration)}</span>
          </span>
        </span>
        <span className="disc__tip-arrow" />
      </span>
    </span>
  )
}
