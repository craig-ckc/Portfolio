import { work, workPath } from './work'
import type { ProjectFieldSettings } from '../lib/project-field-settings'

/** Share the project's lead image and its neutral placeholder with the work list. */
export const homeFieldImages = work.map((project) => ({
  src: project.tiles[0].src ?? project.cover?.src,
  width: 640,
  height: 400,
  title: project.title,
  href: workPath(project.slug),
}))

/** Explicit page preset: experiment tuning and engine defaults cannot change it. */
export const HOME_FIELD_SETTINGS = Object.freeze({
  imageSize: .285,
  spacing: .15,
  centerScale: 1.79,
  edgeScale: .5,
  scaleFalloff: 1.35,
  edgeBlur: 5,
  blurStart: .28,
  blurFalloff: 1.35,
  radius: 1,
  outerFade: .78,
  middleFade: .44,
  middleStrength: .55,
  innerFade: .55,
  innerStrength: .32,
  maskOffset: .06,
  autoDrift: true,
  driftSpeed: 5,
  inertia: .94,
  dragSpeed: 1,
} satisfies ProjectFieldSettings)
