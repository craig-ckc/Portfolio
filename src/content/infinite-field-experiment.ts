import type { FieldImage } from '../lib/project-field-layout'
import type { ProjectFieldSettings } from '../lib/project-field-settings'

/** Local scenery fixtures. Photo sources and credits are stored beside the AVIFs. */
export const experimentFieldImages = [
  { src: '/img/experiments/infinite-field/lake-tekapo.avif', width: 1600, height: 1066, title: 'Lake Tekapo beneath snow-capped mountains' },
  { src: '/img/experiments/infinite-field/forest-rays.avif', width: 1600, height: 1066, title: 'Sun rays through a green forest' },
  { src: '/img/experiments/infinite-field/forest-path.avif', width: 1280, height: 1600, title: 'A sunlit path through tall trees' },
  { src: '/img/experiments/infinite-field/alpine-reflections.avif', width: 1600, height: 1066, title: 'A mountain reflected in an alpine lake' },
  { src: '/img/experiments/infinite-field/pacific-coast.avif', width: 1600, height: 1066, title: 'Ocean waves along a rugged green coastline' },
  { src: '/img/experiments/infinite-field/desert-dunes.avif', width: 1600, height: 1200, title: 'Wind-shaped dunes in warm desert light' },
] as const satisfies readonly FieldImage[]

export const EXPERIMENT_FIELD_SETTINGS_KEY = 'portfolio.experiments.infinite-field.v1'

/** Owned by the experiment. Reset and unsaved controls start from this preset. */
export const EXPERIMENT_FIELD_SETTINGS = Object.freeze({
  imageSize: .285,
  spacing: .4,
  centerScale: 1.32,
  edgeScale: .58,
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
