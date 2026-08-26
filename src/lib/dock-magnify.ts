/**
 * The maths behind the dock's magnification: how much a tile grows as the
 * pointer nears it, and how far its neighbours have to slide so the row never
 * overlaps itself.
 *
 * Real macOS dock: the icon under the pointer grows the most, the ones either
 * side grow by a falloff of distance, and the whole row spreads apart around
 * the pointer to make room, all measured from the bar's own baseline. This
 * file only works out the numbers — how big, how far — from plain positions;
 * the component measures the tiles and writes the results as CSS custom
 * properties, and CSS does the actual easing. Distances and widths are in
 * whatever unit the caller measured in (the component uses screen px); the
 * two functions below don't care, as long as it's consistent.
 *
 * The bar here is a fixed width, not a growing one, so `layout` can work out
 * more room than the bar actually has to give. `fit`, below, is what caps
 * that: it scales the spread down to whatever slack the component measured,
 * so the row never asks the bar for width it does not have.
 */

/** How much bigger the tile nearest the pointer gets. */
export const MAX_SCALE = 1.5

/** How far the pointer's pull reaches, in tile widths either side of it. */
export const RADIUS = 1.6

/**
 * A raised-cosine falloff: `max` right at the pointer, easing down to exactly
 * `1` — no effect at all — at `radius` and beyond.
 *
 * Cosine rather than a straight line because a linear falloff has a visible
 * kink where it meets 1: the curve is still sloped when the effect is meant
 * to have already run out. Half a cosine wave has zero slope at both ends, so
 * the tiles at the edge of the pointer's reach look genuinely untouched
 * rather than clipped mid-shrink.
 */
export function magnification(distance: number, radius: number, max: number): number {
  if (radius <= 0) return distance === 0 ? max : 1

  const reach = Math.min(Math.abs(distance), radius)
  const eased = (Math.cos((reach / radius) * Math.PI) + 1) / 2
  return 1 + (max - 1) * eased
}

export type DockLayout = {
  /** How much each tile is scaled up, `MAX_SCALE` at the nearest and 1 at rest. */
  scales: number[]
  /** How far each tile has to move so the scaled tiles stay evenly spaced. */
  shifts: number[]
  /** The extra width the bar needs to hold the row without clipping it. */
  growth: number
}

/**
 * Where every tile ends up once the pointer has magnified one of them.
 *
 * The tile itself scales in place — the component pins its transform origin
 * to the bar's baseline, so the growth this file works out never has to
 * account for it — which leaves this function with one job: keep the same
 * gap between every pair of tiles that grows, so nothing overlaps.
 *
 * That falls out of a simple rule: starting from the tile nearest the pointer,
 * each tile further out picks up half of its own width increase and half of
 * its inner neighbour's, added to the shift that neighbour already has. Walked
 * outward in both directions, that is exactly enough new space to fit every
 * tile's growth without ever closing the original gap.
 *
 * Then the whole row is slid so that it grows evenly about its own middle —
 * the left edge moves out by as much as the right one does. The bar behind it
 * is centred and widens by `growth`, so this is what keeps the tiles inside
 * it: without the correction, a pointer on an end tile would push the entire
 * row one way and the far tile would hang out over the bar's edge by half the
 * growth. The tile under the pointer drifts a little as a result, which is
 * also what the real dock does.
 */
export function layout(centres: number[], pointer: number | null, tile: number): DockLayout {
  const scales = centres.map(() => 1)
  const shifts = centres.map(() => 0)

  if (pointer === null || centres.length === 0 || tile <= 0) {
    return { scales, shifts, growth: 0 }
  }

  const radius = RADIUS * tile
  for (let index = 0; index < centres.length; index += 1) {
    scales[index] = magnification(centres[index] - pointer, radius, MAX_SCALE)
  }

  const growth = scales.reduce((sum, scale) => sum + (scale - 1) * tile, 0)
  const halfExtra = scales.map((scale) => ((scale - 1) * tile) / 2)

  let pivot = 0
  for (let index = 1; index < centres.length; index += 1) {
    if (Math.abs(centres[index] - pointer) < Math.abs(centres[pivot] - pointer)) pivot = index
  }

  for (let index = pivot + 1; index < centres.length; index += 1) {
    shifts[index] = shifts[index - 1] + halfExtra[index - 1] + halfExtra[index]
  }
  for (let index = pivot - 1; index >= 0; index -= 1) {
    shifts[index] = shifts[index + 1] - halfExtra[index + 1] - halfExtra[index]
  }

  /* How far each end of the row has moved out past where it rested. Tiles
     scale about their own centre horizontally, so an end tile's edge moves by
     its shift plus half its own growth. Sliding everything by the average
     puts the two ends an equal distance out. */
  const last = centres.length - 1
  const leftOut = -(shifts[0] - halfExtra[0])
  const rightOut = shifts[last] + halfExtra[last]
  const recentre = (rightOut - leftOut) / 2
  for (let index = 0; index < shifts.length; index += 1) shifts[index] -= recentre

  return { scales, shifts, growth }
}

/**
 * Caps a layout to a bar that cannot grow past `slack` extra width.
 *
 * The tiles still scale exactly as `layout` worked out — which icon looks
 * biggest never changes — but a fixed-width bar has only so much clearance
 * either side of the row before a tile would spill past its edge. When the
 * spread `layout` asked for fits in that clearance, nothing changes; when it
 * does not, every shift is scaled down by the same factor, so the row stays
 * symmetric and tiles keep their order. Past that point neighbours overlap a
 * little at the extremes rather than pushing the row out of the bar, which is
 * closer to what a crowded real dock looks like anyway.
 */
export function fit(layout: DockLayout, slack: number): DockLayout {
  if (layout.growth <= slack) return layout

  const factor = layout.growth > 0 ? slack / layout.growth : 0
  return {
    scales: layout.scales,
    shifts: layout.shifts.map((shift) => shift * factor),
    growth: slack,
  }
}
