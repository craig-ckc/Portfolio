/**
 * The folder silhouette, as numbers.
 *
 * The shape is one closed path: a rounded body with a tab on the top left and a
 * concave shoulder where the tab meets the body. Every radius is its own knob,
 * so the silhouette can be reshaped without redrawing the path by hand — set
 * them all to 0 for a hard-edged manila folder, push `cornerRadius` up for a
 * soft app-icon feel, raise `tabHeight` past `tabRadius + shoulderRadius` and
 * the tab grows a straight right edge between the two curves.
 *
 * Values are in the SVG user space defined by `width` and `height`, so they
 * read as "24 of 400 across" rather than as pixels on screen. The stage takes
 * its aspect ratio from the same two numbers, so the path is never stretched
 * and a radius stays a circle at any size.
 *
 * This module is the single source for the geometry. The stage, the front
 * flap's inset and the flap's own corner radius are all derived from it in
 * `folderMetrics` and handed to CSS as custom properties, so changing a number
 * here moves every layer together instead of leaving the flap behind.
 */
export type FolderShape = {
  /** SVG user-space width. With `height`, also the stage's aspect ratio. */
  width: number
  height: number
  /** Where the tab ends and the shoulder into the body begins. */
  tabWidth: number
  /** How far down the body's top edge sits — so, the tab's height. */
  tabHeight: number
  /** The tab's two top corners. */
  tabRadius: number
  /** The concave curve from the tab down onto the body's top edge. */
  shoulderRadius: number
  /** The body's top-right corner. */
  cornerRadius: number
  /** Both bottom corners. The front flap's bottom two follow these. */
  bottomRadius: number
  /**
   * The flap's own top corners. Separate from everything above because the
   * silhouette has no opinion about them — nothing in the path is there. A
   * small value reads as the lip of a pocket; take it up towards
   * `bottomRadius` and the flap starts reading as a card lying on the folder.
   */
  flapTopRadius: number
  /**
   * The gap between the body's top edge and the top of the front flap. This is
   * the sliver of the items that shows at rest, before the flap tips away.
   */
  peek: number
}

/**
 * Starting point, not gospel. Tune these — the whole object follows.
 *
 * Ratio is 400:285, distinctly wider than tall: a folder that reads as square
 * reads as a card instead, and a tall one reads as a wallet.
 *
 * The tab is now taller than its two curves need, which gives it a short
 * straight edge on the right between them — a real manila tab rather than a
 * bump.
 */
export const folderShape: FolderShape = {
  width: 400,
  height: 285,
  tabWidth: 176,
  tabHeight: 44,
  tabRadius: 10,
  shoulderRadius: 16,
  cornerRadius: 11,
  bottomRadius: 11,
  flapTopRadius: 7,
  peek: 18,
}

const clamp = (value: number, max: number) => Math.max(0, Math.min(value, max))

const round = (value: number) => Math.round(value * 100) / 100

/**
 * Radii cut into a fixed box, so any one of them can be asked for more room
 * than there is. Each is clamped to what is left after the ones before it, in
 * the order they are drawn — a tab radius that swallows the tab wins over the
 * shoulder, and the shoulder wins over the body's corner. The result is that
 * silly values degrade into a plausible shape instead of a path that folds
 * back through itself.
 */
export function resolveFolderShape(shape: FolderShape): FolderShape {
  const tabRadius = clamp(shape.tabRadius, Math.min(shape.tabWidth / 2, shape.tabHeight))
  const shoulderRadius = clamp(
    shape.shoulderRadius,
    Math.min(shape.tabHeight - tabRadius, (shape.width - shape.tabWidth) / 2),
  )
  const cornerRadius = clamp(
    shape.cornerRadius,
    Math.min(shape.width - shape.tabWidth - shoulderRadius, (shape.height - shape.tabHeight) / 2),
  )
  const bottomRadius = clamp(
    shape.bottomRadius,
    Math.min(shape.width / 2, shape.height - shape.tabHeight - cornerRadius),
  )
  const peek = clamp(shape.peek, (shape.height - shape.tabHeight) / 2)
  const flapTopRadius = clamp(shape.flapTopRadius, shape.width / 2)

  return { ...shape, tabRadius, shoulderRadius, cornerRadius, bottomRadius, flapTopRadius, peek }
}

/**
 * The silhouette as an SVG `d`. Drawn clockwise from the tab's left edge; the
 * closing `Z` runs straight back up the left side.
 */
export function folderPath(shape: FolderShape): string {
  const { width, height, tabWidth, tabHeight, tabRadius, shoulderRadius, cornerRadius, bottomRadius } =
    resolveFolderShape(shape)

  const arc = (radius: number, sweep: 0 | 1, x: number, y: number) =>
    `A${round(radius)},${round(radius)} 0 0 ${sweep} ${round(x)},${round(y)}`

  return [
    `M0,${round(tabRadius)}`,
    arc(tabRadius, 1, tabRadius, 0),
    `L${round(tabWidth - tabRadius)},0`,
    arc(tabRadius, 1, tabWidth, tabRadius),
    `L${round(tabWidth)},${round(tabHeight - shoulderRadius)}`,
    /* Sweep 0: the only concave corner in the path. */
    arc(shoulderRadius, 0, tabWidth + shoulderRadius, tabHeight),
    `L${round(width - cornerRadius)},${round(tabHeight)}`,
    arc(cornerRadius, 1, width, tabHeight + cornerRadius),
    `L${round(width)},${round(height - bottomRadius)}`,
    arc(bottomRadius, 1, width - bottomRadius, height),
    `L${round(bottomRadius)},${round(height)}`,
    arc(bottomRadius, 1, 0, height - bottomRadius),
    'Z',
  ].join(' ')
}

/**
 * The handful of values CSS needs in order to line the other layers up with
 * the silhouette. Percentages are of the stage, which is why they can be
 * written straight into custom properties.
 */
export function folderMetrics(shape: FolderShape) {
  const resolved = resolveFolderShape(shape)
  const { width, height, tabHeight, bottomRadius, flapTopRadius, peek } = resolved

  const flapTop = tabHeight + peek
  const flapHeight = height - flapTop
  const pct = (value: number) => `${round(value * 100)}%`

  /* Both radii, on both axes. The flap is much shorter than it is wide, so a
     corner needs a bigger share of its height than of its width to come out
     round — which is what the two halves of the elliptical shorthand are for. */
  const topX = pct(flapTopRadius / width)
  const topY = pct(flapTopRadius / flapHeight)
  const bottomX = pct(bottomRadius / width)
  const bottomY = pct(bottomRadius / flapHeight)

  return {
    /** Keeps the stage the same shape as the path inside it. */
    aspectRatio: `${width} / ${height}`,
    viewBox: `0 0 ${width} ${height}`,
    path: folderPath(shape),
    /** Top edge of the body — where the items sit at rest. */
    bodyTop: pct(tabHeight / height),
    /** Top edge of the front flap. */
    flapTop: pct(flapTop / height),
    /** The same edge as a fraction, for aiming the contents back into it. */
    flapTopFraction: flapTop / height,
    flapRadius: `${topX} ${topX} ${bottomX} ${bottomX} / ${topY} ${topY} ${bottomY} ${bottomY}`,
  }
}
