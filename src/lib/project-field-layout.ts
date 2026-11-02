import { DEFAULT_FIELD_SETTINGS, type ProjectFieldSettings } from './project-field-settings'

export type FieldImage = {
  src?: string
  width: number
  height: number
  title: string
  href?: string
}

export type FieldTile = { image: number; x: number; y: number; width: number; height: number }
export type FieldLayout = { tiles: FieldTile[]; periodX: number; periodY: number; size: number; settings: Readonly<ProjectFieldSettings> }
export type FieldPan = { x: number; y: number }

export const wrap = (value: number, period: number) =>
  ((value + period / 2) % period + period) % period - period / 2

const smoothstep = (low: number, high: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)))
  return t * t * (3 - 2 * t)
}

/** These two profiles match the vertex and composite shaders. Hit areas follow
 * the visible, scaled artwork, including the soft circular boundary. */
export function fieldScale(radius: number, settings: Readonly<ProjectFieldSettings> = DEFAULT_FIELD_SETTINGS): number {
  // A tighter, continuous bell keeps the frontmost area small. No tile can
  // receive the maximum scale just because its identity was selected.
  return settings.edgeScale + (settings.centerScale - settings.edgeScale) * Math.pow(1 - smoothstep(0, 1.08, radius), settings.scaleFalloff * 2)
}

export function fieldOpacity(x: number, y: number, settings: Readonly<ProjectFieldSettings> = DEFAULT_FIELD_SETTINGS): number {
  x /= settings.radius
  y /= settings.radius
  const outer = 1 - smoothstep(settings.outerFade, 1, Math.hypot(x, y))
  const middle = 1 - smoothstep(settings.middleFade, .98, Math.hypot(x + settings.maskOffset, y * .95 - settings.maskOffset * .5))
  const inner = 1 - smoothstep(settings.innerFade, 1.02, Math.hypot(x * .98 - settings.maskOffset, y * 1.03 + settings.maskOffset * 2 / 3))
  return outer * (1 - settings.middleStrength + settings.middleStrength * middle) * (1 - settings.innerStrength + settings.innerStrength * inner)
}

/** The largest combined half-extents of two neighbors anywhere through the
 * radial lens. Each interval uses both ends' largest scale, so this is an upper
 * bound, not a sampling guess that can miss a narrow overlap between samples. */
function safeSeparation(a: number, b: number, gap: number, size: number, settings: Readonly<ProjectFieldSettings>) {
  const scaleAt = (distance: number) => fieldScale(distance * 2 / size / settings.radius, settings)
  function fits(distance: number) {
    const available = distance - gap
    for (let interval = 0; interval < 64; interval++) {
      if (a * scaleAt(distance * interval / 64) + b * scaleAt(distance * (63 - interval) / 64) > available) return false
    }
    return true
  }
  let low = (a + b) * settings.edgeScale + gap
  let high = (a + b) * settings.centerScale + gap
  for (let iteration = 0; iteration < 14; iteration++) {
    const middle = (low + high) / 2
    if (fits(middle)) high = middle
    else low = middle
  }
  return high + .000001
}

/** Each column contains the same source sequence with a staggered start. Its
 * period therefore stays identical even when the sources have different ratios. */
export function buildFieldLayout(images: readonly FieldImage[], size: number, settings: Readonly<ProjectFieldSettings> = DEFAULT_FIELD_SETTINGS): FieldLayout {
  if (!images.length || size <= 0) return { tiles: [], periodX: 1, periodY: 1, size, settings }
  const width = size * settings.imageSize
  const gap = Math.max(4, width * settings.spacing * .75)
  const pitch = safeSeparation(width / 2, width / 2, Math.max(4, width * settings.spacing), size, settings)
  const heights = images.map((image) => width * image.height / image.width)
  const separations = heights.map((height, index) => safeSeparation(height / 2, heights[(index + 1) % heights.length] / 2, gap, size, settings))
  const sequenceHeight = separations.reduce((sum, distance) => sum + distance, 0)
  const repeats = Math.ceil((size + Math.max(...heights) * settings.centerScale * 2) / sequenceHeight)
  const periodY = sequenceHeight * repeats
  // Keep the wrapping seam beyond even the largest allowed tile at either edge.
  const requiredColumns = Math.ceil((size + width * settings.centerScale * 2) / pitch)
  const columns = Math.max(5, requiredColumns + (requiredColumns % 2 === 0 ? 1 : 0))
  const tiles: FieldTile[] = []
  for (let column = 0; column < columns; column++) {
    let y = -periodY / 2 + [0.13, 0.47, 0.24, 0.74, 0.38][column % 5] * pitch
    for (let row = 0; row < images.length * repeats; row++) {
      const image = (row + column * 3) % images.length
      const height = heights[image]
      tiles.push({ image, x: (column - Math.floor(columns / 2)) * pitch, y, width, height })
      y += separations[image]
    }
  }
  return { tiles, periodX: columns * pitch, periodY, size, settings }
}

/** Pick a tile instance, rather than a project ID that repeats in the field. */
export function nearestFieldTile(layout: FieldLayout, pan: FieldPan, image?: number): FieldTile | undefined {
  let nearest: FieldTile | undefined
  let distance = Infinity
  for (const tile of layout.tiles) {
    if (image !== undefined && tile.image !== image) continue
    const position = fieldPosition(tile, layout, pan)
    const next = Math.hypot(position.x, position.y)
    if (next < distance) { nearest = tile; distance = next }
  }
  return nearest
}

export function fieldPosition(tile: FieldTile, layout: FieldLayout, pan: FieldPan) {
  const x = wrap(tile.x + pan.x, layout.periodX)
  const y = wrap(tile.y + pan.y, layout.periodY)
  return { x, y }
}

/** Scale depends only on the item's current distance from the canvas center. */
export function projectTile(tile: FieldTile, layout: FieldLayout, pan: FieldPan) {
  const { x, y } = fieldPosition(tile, layout, pan)
  const scale = fieldScale(Math.hypot(x, y) * 2 / layout.size / layout.settings.radius, layout.settings)
  return { x, y, width: tile.width * scale, height: tile.height * scale }
}

export function hitField(layout: FieldLayout, pan: FieldPan, x: number, y: number): FieldTile | undefined {
  if (fieldOpacity(x * 2 / layout.size, y * 2 / layout.size, layout.settings) < 0.12) return
  return layout.tiles.findLast((tile) => {
    const frame = projectTile(tile, layout, pan)
    return Math.abs(x - frame.x) <= frame.width / 2 && Math.abs(y - frame.y) <= frame.height / 2
  })
}
