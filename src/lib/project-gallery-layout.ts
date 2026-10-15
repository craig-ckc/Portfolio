/** The image closest to the horizontal viewport centre, including mixed widths. */
export function closestImage(centres: number[], viewportCentre: number): number {
  let closest = 0
  for (let index = 1; index < centres.length; index += 1) {
    if (Math.abs(centres[index] - viewportCentre) < Math.abs(centres[closest] - viewportCentre)) closest = index
  }
  return closest
}

/** Keep a visible source still; otherwise bring it back into view for the return animation. */
export function imageReturnScroll(top: number, height: number, scrollY: number, viewportHeight: number, pageHeight: number): number {
  if (top >= 80 && top + height <= viewportHeight - 40) return scrollY
  const target = scrollY + top - Math.max(80, (viewportHeight - height) / 2)
  return Math.max(0, Math.min(target, Math.max(0, pageHeight - viewportHeight)))
}
