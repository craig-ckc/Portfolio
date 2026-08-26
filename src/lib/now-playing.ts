/**
 * Where the needle is, simulated.
 *
 * There is no audio: the disc face just needs to look like something is
 * actually playing, on a loop, whether or not anyone is watching. So the
 * whole state of the player is a pure function of one clock reading — the
 * epoch a visitor's session began — rather than anything accumulated frame
 * to frame. Two timers end up reading that function (a fast one while the
 * popover is visible, a slow one that only cares when the track changes) and
 * because both always recompute from Date.now() - epoch instead of nudging
 * whatever they last wrote, they can never disagree or drift apart.
 *
 * Pure functions over numbers, in the style of card-motion.ts. Durations and
 * elapsed time are both in milliseconds throughout.
 */

export type Position = { index: number; positionMs: number }

/**
 * The track and offset playing at `elapsedMs` into a loop of `durations`.
 *
 * The playlist repeats forever — there is always a "now playing", whenever a
 * visitor happens to land — so elapsed time is taken modulo the loop's total
 * length before walking the list. A duration's own end belongs to the track
 * after it: elapsed landing exactly on a boundary reports index 0ms into the
 * next track, not the last ms of the one before, which is what makes a
 * cross-fade triggered by "did the index change" fire once per boundary
 * instead of never.
 */
export function positionAt(durations: number[], elapsedMs: number): Position {
  if (durations.length === 0) return { index: 0, positionMs: 0 }

  const total = durations.reduce((sum, duration) => sum + duration, 0)
  if (total <= 0) return { index: 0, positionMs: 0 }

  let remainder = Math.max(elapsedMs, 0) % total

  for (let index = 0; index < durations.length; index += 1) {
    const duration = durations[index]
    if (remainder < duration) return { index, positionMs: remainder }
    remainder -= duration
  }

  /* Only reachable if floating-point left a sliver of remainder unspent after
     the last track — the loop point itself, which is where it started. */
  return { index: 0, positionMs: 0 }
}

/**
 * The elapsed value to jump to when the visitor asks for the next or
 * previous track, so a skip is expressed the same way as everything else
 * here: a new point in the loop, for the caller to turn into a new epoch.
 *
 * Forward always means the next track's start, wrapping past the last back
 * to the first. Back is the two-stage behaviour every player's previous
 * button has, because a single press three seconds into a song almost never
 * means "I meant to hear the one before this": early in a track it goes to
 * the previous track's start (wrapping before the first to the last), but
 * past that grace window it restarts the current track instead of leaving
 * it. The result is always inside one loop of the playlist, same as
 * positionAt's own elapsed handling.
 */
const SKIP_BACK_GRACE_MS = 3000

export function skip(durations: number[], elapsedMs: number, direction: 1 | -1): number {
  if (durations.length === 0) return 0

  const total = durations.reduce((sum, duration) => sum + duration, 0)
  if (total <= 0) return 0

  const { index, positionMs } = positionAt(durations, elapsedMs)
  const startOf = (trackIndex: number) => durations.slice(0, trackIndex).reduce((sum, duration) => sum + duration, 0)

  if (direction === 1) {
    return startOf((index + 1) % durations.length)
  }

  if (positionMs > SKIP_BACK_GRACE_MS) {
    return startOf(index)
  }

  return startOf((index - 1 + durations.length) % durations.length)
}

/** `m:ss`, floored to the second. Playlists here never run long enough to need hours. */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(Math.max(ms, 0) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
