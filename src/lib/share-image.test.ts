import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SHARE_IMAGE } from './share-image'

/**
 * PNG dimensions live in the IHDR chunk: an 8-byte signature, a 4-byte length
 * and the 4-byte type, then width and height as big-endian uint32s. Read here
 * by hand rather than through an image library, so the check costs the test
 * suite no dependency it does not otherwise have.
 */
function pngSize(path: URL): { width: number; height: number } {
  const png = readFileSync(path)
  expect(png.subarray(1, 4).toString('ascii')).toBe('PNG')
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) }
}

describe('SHARE_IMAGE', () => {
  const file = new URL('../../public' + SHARE_IMAGE.src, import.meta.url)

  it('points at a file that exists in public/', () => {
    expect(() => readFileSync(file)).not.toThrow()
  })

  /* The one that matters: og:image:width and og:image:height are a promise to
     the scraper, and a card regenerated at another size quietly breaks it. */
  it('declares the dimensions the PNG actually has', () => {
    expect(pngSize(file)).toEqual({ width: SHARE_IMAGE.width, height: SHARE_IMAGE.height })
  })

  it('is the 1200×630 every scraper crops to', () => {
    expect(SHARE_IMAGE.width).toBe(1200)
    expect(SHARE_IMAGE.height).toBe(630)
  })

  it('is a root-relative path, so it resolves against the origin', () => {
    expect(SHARE_IMAGE.src.startsWith('/')).toBe(true)
  })

  it('carries alt text', () => {
    expect(SHARE_IMAGE.alt.length).toBeGreaterThan(0)
  })
})
