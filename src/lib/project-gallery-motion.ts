import { closestImage } from './project-gallery-layout'

export type GalleryMotion = { position: number; velocity: number }

/** A short momentum look-ahead makes a flick choose the next image naturally. */
export function gallerySnapIndex(positions: number[], position: number, velocity: number) {
  return closestImage(positions, position + velocity * 180)
}

/** Exact critically damped spring step, in pixels and milliseconds. Matching
 * the release velocity avoids a pause or a sudden change of speed at handoff. */
export function advanceGallerySnap(state: GalleryMotion, target: number, elapsed: number): GalleryMotion {
  const frequency = .011
  const offset = state.position - target
  const decay = Math.exp(-frequency * elapsed)
  const momentum = state.velocity + frequency * offset
  return {
    position: target + (offset + momentum * elapsed) * decay,
    velocity: (state.velocity - frequency * momentum * elapsed) * decay,
  }
}
