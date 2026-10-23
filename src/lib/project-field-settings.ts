export type ProjectFieldSettings = {
  imageSize: number
  spacing: number
  centerScale: number
  edgeScale: number
  scaleFalloff: number
  edgeBlur: number
  blurStart: number
  blurFalloff: number
  radius: number
  outerFade: number
  middleFade: number
  middleStrength: number
  innerFade: number
  innerStrength: number
  maskOffset: number
  autoDrift: boolean
  driftSpeed: number
  inertia: number
  dragSpeed: number
}

export type NumericFieldSetting = Exclude<keyof ProjectFieldSettings, 'autoDrift'>

/** The original hero treatment is the baseline for reset and unconfigured fields. */
export const DEFAULT_FIELD_SETTINGS: Readonly<ProjectFieldSettings> = Object.freeze({
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
})

export const FIELD_SETTING_LIMITS = {
  imageSize: [.14, .38],
  spacing: [.15, .85],
  centerScale: [1, 2],
  edgeScale: [.2, 1],
  scaleFalloff: [.5, 3],
  edgeBlur: [0, 20],
  blurStart: [0, .8],
  blurFalloff: [.5, 3],
  radius: [.65, 1],
  outerFade: [.4, .95],
  middleFade: [.1, .8],
  middleStrength: [0, 1],
  innerFade: [.1, .85],
  innerStrength: [0, 1],
  maskOffset: [0, .2],
  driftSpeed: [0, 20],
  inertia: [0, .98],
  dragSpeed: [.5, 2],
} as const satisfies Record<NumericFieldSetting, readonly [number, number]>

export const FIELD_SETTINGS_KEY = 'portfolio.infinite-field.v1'

/** All paths into the renderer (props, storage, and import) use the same bounds. */
export function normalizeFieldSettings(value: unknown): ProjectFieldSettings {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const result = { ...DEFAULT_FIELD_SETTINGS }
  for (const key of Object.keys(FIELD_SETTING_LIMITS) as NumericFieldSetting[]) {
    const candidate = input[key]
    const [min, max] = FIELD_SETTING_LIMITS[key]
    if (typeof candidate === 'number' && Number.isFinite(candidate)) result[key] = Math.max(min, Math.min(max, candidate))
  }
  if (typeof input.autoDrift === 'boolean') result.autoDrift = input.autoDrift
  return result
}

export function serializeFieldSettings(settings: Readonly<ProjectFieldSettings>): string {
  return JSON.stringify({ version: 1, settings: normalizeFieldSettings(settings) }, null, 2)
}

export function parseFieldSettings(json: string): ProjectFieldSettings {
  if (json.length > 16000) throw new Error('These settings are too large. Paste a copied field preset.')
  let document: unknown
  try { document = JSON.parse(json) } catch { throw new Error('Enter valid JSON copied from the field controls.') }
  if (!document || typeof document !== 'object' || !('version' in document) || document.version !== 1 || !('settings' in document)) {
    throw new Error('This preset format is not supported. Copy settings from this preview.')
  }
  const settings = document.settings
  if (!settings || typeof settings !== 'object') throw new Error('The preset has no field settings.')
  const candidate = settings as Record<string, unknown>
  if (typeof candidate.autoDrift !== 'boolean' || Object.keys(FIELD_SETTING_LIMITS).some((key) => typeof candidate[key] !== 'number' || !Number.isFinite(candidate[key]))) {
    throw new Error('Some settings are missing or invalid. Paste a complete field preset.')
  }
  return normalizeFieldSettings(settings)
}
