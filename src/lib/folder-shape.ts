/**
 * The folder, as numbers. Two shapes: back and front.
 *
 * The back is a plain rounded rectangle with a flat top. The front is shorter,
 * so the contents stand above it across the whole width, and its own top edge
 * is not level: it stands high across the left, drops on a shallow angle, and
 * runs low across the rest. The back shows above the contents, and a little
 * more of them shows through the notch that drop leaves.
 *
 * Which way round that goes matters more than it sounds. Put the tab on the
 * back and it takes the back's colour, so the folder reads as a dark tab with a
 * pale panel clipped across it. Put it on the front and the tab is the front —
 * one continuous pale face, and the back shows only in the notch. That is the
 * shape everyone recognises.
 *
 * Values are in the SVG user space defined by `width` and `height`, so they
 * read as "26 of 400 across" rather than as pixels on screen. The stage takes
 * its aspect ratio from the same two numbers, so neither path is ever stretched
 * and a radius stays a circle at any size.
 *
 * This module is the single source for the geometry. Both paths, the clip the
 * frosted layer is cut to, and where the contents sit are all derived here in
 * `folderMetrics`, so changing a number moves every layer together instead of
 * leaving one of them behind.
 */
export type FolderShape = {
  /** SVG user-space width. With `height`, also the stage's aspect ratio. */
  width: number
  height: number
  /** Where the front's raised top edge ends and the shoulder begins. */
  tabWidth: number
  /**
   * The front's raised top edge, and so how much shorter it is than the back.
   * Everything above this line is contents and back panel.
   */
  frontTop: number
  /** How much further down the front's edge sits right of the shoulder. */
  shoulderDrop: number
  /** How far right the shoulder travels while it drops. */
  shoulderRun: number
  /** The joins at each end of the shoulder: one convex, one concave. */
  shoulderRadius: number
  /** The front's four outer corners. */
  frontRadius: number
  /** The back's four corners. Its top edge is flat, at y = 0. */
  backRadius: number
  /**
   * How much of the contents stands above the front's raised edge — the sliver
   * that shows at rest, before the front tips away. A shoulderDrop more of them
   * shows through the notch.
   */
  peek: number
}

/**
 * Starting point, not gospel. Tune these — the whole object follows.
 *
 * Ratio is 400:285, distinctly wider than tall: a folder that reads as square
 * reads as a card instead, and a tall one reads as a wallet.
 */
export const folderShape: FolderShape = {
  width: 400,
  height: 285,
  tabWidth: 140,
  frontTop: 72,
  shoulderDrop: 20,
  shoulderRun: 24,
  shoulderRadius: 8,
  frontRadius: 11,
  backRadius: 11,
  peek: 30,
}

const clamp = (value: number, max: number) => Math.max(0, Math.min(value, max))

const round = (value: number) => Math.round(value * 1000) / 1000

/**
 * Radii and runs cut into a fixed box, so any of them can be asked for more
 * room than there is. Each is clamped against what the ones before it have
 * left, in the order they are drawn, so a silly value degrades into a plausible
 * shape instead of a path that folds back through itself.
 *
 * The shoulder is the awkward one. Its two joins are rounded off a slope rather
 * than a right angle, and a corner rounded between two lines eats
 * `radius * tan(turn / 2)` off each of them — so how much radius will fit
 * depends on the angle of the slope, which depends on its run and its drop.
 * Hence the trim arithmetic rather than a flat maximum.
 */
export function resolveFolderShape(shape: FolderShape): FolderShape {
  const { width, height } = shape

  const frontTop = clamp(shape.frontTop, height / 2)
  const shoulderDrop = clamp(shape.shoulderDrop, (height - frontTop) / 2)
  const frontRadius = clamp(shape.frontRadius, Math.min(width / 2, (height - frontTop - shoulderDrop) / 2))
  const backRadius = clamp(shape.backRadius, Math.min(width / 2, height / 2))
  const tabWidth = clamp(shape.tabWidth, width - frontRadius)
  const shoulderRun = clamp(shape.shoulderRun, width - frontRadius - tabWidth)

  const slope = Math.atan2(shoulderDrop, shoulderRun)
  const maxTrim = Math.max(
    0,
    Math.min(
      tabWidth - frontRadius,
      width - frontRadius - tabWidth - shoulderRun,
      Math.hypot(shoulderRun, shoulderDrop) / 2,
    ),
  )
  const shoulderRadius = clamp(shape.shoulderRadius, slope === 0 ? 0 : maxTrim / Math.tan(slope / 2))

  return {
    ...shape,
    frontRadius,
    backRadius,
    frontTop,
    shoulderDrop,
    tabWidth,
    shoulderRun,
    shoulderRadius,
    peek: clamp(shape.peek, frontTop),
  }
}

/** The back panel: flat top, four equal corners, the whole stage. */
export function backPath(shape: FolderShape): string {
  const { width: w, height: h, backRadius: r } = resolveFolderShape(shape)

  return [
    `M${round(r)},0`,
    `H${round(w - r)}`,
    `A${round(r)},${round(r)} 0 0 1 ${round(w)},${round(r)}`,
    `V${round(h - r)}`,
    `A${round(r)},${round(r)} 0 0 1 ${round(w - r)},${round(h)}`,
    `H${round(r)}`,
    `A${round(r)},${round(r)} 0 0 1 0,${round(h - r)}`,
    `V${round(r)}`,
    `A${round(r)},${round(r)} 0 0 1 ${round(r)},0`,
    'Z',
  ].join(' ')
}

/**
 * The front panel, drawn clockwise from its top-left corner.
 *
 * `scale` divides every coordinate, which is how one path serves as both the
 * drawn edge and the clip cut from it: pass the width and height and it comes
 * out in the 0..1 space an objectBoundingBox clip is measured in. The mapping
 * is a pure scale, so a circular arc becomes an axis-aligned elliptical one
 * with its radius divided per axis — exact rather than an approximation, which
 * is what keeps the clip on the drawn edge to the pixel.
 */
export function frontPath(shape: FolderShape, scale: { x: number; y: number } = { x: 1, y: 1 }): string {
  const { width: w, height: h, tabWidth, frontTop, shoulderDrop, shoulderRun, shoulderRadius, frontRadius } =
    resolveFolderShape(shape)

  const x = (value: number) => round(value / scale.x)
  const y = (value: number) => round(value / scale.y)
  const arc = (radius: number, sweep: 0 | 1, px: number, py: number) =>
    `A${round(radius / scale.x)},${round(radius / scale.y)} 0 0 ${sweep} ${x(px)},${y(py)}`

  /* Drawn in the same box as the back, starting frontTop down it — which is
     what makes the front the shorter of the two without needing a box of its
     own to be kept in step with this one. */
  const low = frontTop + shoulderDrop

  /* Where the slope meets each of its neighbours, backed off by what the
     rounded join eats out of both. */
  const slope = Math.atan2(shoulderDrop, shoulderRun)
  const trim = shoulderRadius * Math.tan(slope / 2)
  const along = { x: Math.cos(slope) * trim, y: Math.sin(slope) * trim }

  return [
    `M${x(frontRadius)},${y(frontTop)}`,
    /* The raised edge, across the tab. */
    `H${x(tabWidth - trim)}`,
    /* Convex into the slope, the slope itself, then concave back out of it. */
    arc(shoulderRadius, 1, tabWidth + along.x, frontTop + along.y),
    `L${x(tabWidth + shoulderRun - along.x)},${y(low - along.y)}`,
    arc(shoulderRadius, 0, tabWidth + shoulderRun + trim, low),
    /* The low edge, and round the outside. */
    `H${x(w - frontRadius)}`,
    arc(frontRadius, 1, w, low + frontRadius),
    `V${y(h - frontRadius)}`,
    arc(frontRadius, 1, w - frontRadius, h),
    `H${x(frontRadius)}`,
    arc(frontRadius, 1, 0, h - frontRadius),
    `V${y(frontTop + frontRadius)}`,
    arc(frontRadius, 1, frontRadius, frontTop),
    'Z',
  ].join(' ')
}

/**
 * Everything the component and the stylesheet need to line their layers up
 * with the two paths.
 */
export function folderMetrics(shape: FolderShape) {
  const resolved = resolveFolderShape(shape)
  const { width, height, frontTop, peek } = resolved

  return {
    /** Keeps the stage the same shape as the paths inside it. */
    aspectRatio: `${width} / ${height}`,
    viewBox: `0 0 ${width} ${height}`,
    back: backPath(shape),
    front: frontPath(shape),
    /** The same front edge in the 0..1 space a clip-path is measured in. */
    frontClip: frontPath(shape, { x: width, y: height }),
    /** Top edge of the contents: one peek above the front's raised edge. */
    contentsTop: `${round(((frontTop - peek) / height) * 100)}%`,
  }
}
