import { describe, expect, it } from 'vitest'
import { DEFAULT_FIELD_SETTINGS, FIELD_SETTING_LIMITS, normalizeFieldSettings, parseFieldSettings, serializeFieldSettings, type NumericFieldSetting } from './project-field-settings'
import { buildFieldLayout, fieldOpacity, fieldScale, hitField, projectTile } from './project-field-layout'

describe('field settings', () => {
  it('round-trips a tuned preset without losing precision or the motion toggle', () => {
    const settings = { ...DEFAULT_FIELD_SETTINGS, imageSize: .235, edgeBlur: 12.5, centerScale: 1.67, autoDrift: false }
    expect(parseFieldSettings(serializeFieldSettings(settings))).toEqual(settings)
  })

  it('rejects malformed, incomplete, oversized, and unknown-version presets', () => {
    for (const value of ['{', '{}', 'null', JSON.stringify({ version: 2, settings: DEFAULT_FIELD_SETTINGS }), JSON.stringify({ version: 1, settings: { edgeBlur: 10 } }), ' '.repeat(16001)]) {
      expect(() => parseFieldSettings(value)).toThrow()
    }
    expect(() => parseFieldSettings(serializeFieldSettings(DEFAULT_FIELD_SETTINGS).replace('"edgeBlur": 5', '"edgeBlur": 1e400'))).toThrow()
  })

  it('bounds every imported or programmatic setting and keeps nonfinite values out of shaders', () => {
    for (const key of Object.keys(FIELD_SETTING_LIMITS) as NumericFieldSetting[]) {
      const [min, max] = FIELD_SETTING_LIMITS[key]
      expect(normalizeFieldSettings({ [key]: -1000 })[key]).toBe(min)
      expect(normalizeFieldSettings({ [key]: 1000 })[key]).toBe(max)
      expect(normalizeFieldSettings({ [key]: NaN })[key]).toBe(DEFAULT_FIELD_SETTINGS[key])
      expect(normalizeFieldSettings({ [key]: Infinity })[key]).toBe(DEFAULT_FIELD_SETTINGS[key])
    }
    expect(normalizeFieldSettings({ autoDrift: 'false' }).autoDrift).toBe(true)
  })

  it('uses tuned scale and mask settings for the visible link hit areas', () => {
    const images = [{ src: '/image.svg', width: 640, height: 420, title: 'Project', href: '/work/project' }]
    const settings = { ...DEFAULT_FIELD_SETTINGS, centerScale: 1.8, edgeScale: .3, radius: .7 }
    const layout = buildFieldLayout(images, 700, settings)
    const tile = layout.tiles[0]
    const pan = { x: -tile.x, y: -tile.y }
    const frame = projectTile(tile, layout, pan)
    expect(frame.width).toBeCloseTo(tile.width * 1.8)
    expect(fieldScale(0, settings)).toBe(1.8)
    expect(hitField(layout, pan, frame.width * .48, 0)?.image).toBe(0)
    expect(fieldOpacity(.8, 0, settings)).toBe(0)
    expect(hitField(layout, pan, 280, 0)).toBeUndefined()
  })

  it('keeps infinite seams outside the visible field at the smallest tiles and largest scaling', () => {
    const images = [{ src: '/portrait.jpg', width: 600, height: 900, title: 'Portrait', href: '/work/portrait' }]
    const settings = { ...DEFAULT_FIELD_SETTINGS, imageSize: .14, spacing: .15, centerScale: 2 }
    const layout = buildFieldLayout(images, 700, settings)
    const tile = layout.tiles[0]
    expect(layout.periodX).toBeGreaterThanOrEqual(700 + tile.width * settings.centerScale * 2)
    expect(layout.periodY).toBeGreaterThanOrEqual(700 + tile.height * settings.centerScale * 2)
    expect(layout.tiles.length).toBeLessThan(200)
    expect(projectTile(tile, layout, { x: 1e7, y: -1e7 }).width / projectTile(tile, layout, { x: 1e7, y: -1e7 }).height).toBeCloseTo(600 / 900)
  })
})
