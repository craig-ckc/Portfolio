import { describe, expect, it } from 'vitest'
import { closestImage, imageReturnScroll } from './project-gallery-layout'

describe('gallery selection', () => {
  it('selects the centred image rather than assuming equal slide widths', () => {
    expect(closestImage([400, 1050, 1600, 2400], 1620)).toBe(2)
    expect(closestImage([400, 1050, 1600, 2400], 2380)).toBe(3)
  })

  it('keeps the first or last image selected at the ends of the strip', () => {
    expect(closestImage([400, 1050, 1600], 0)).toBe(0)
    expect(closestImage([400, 1050, 1600], 2400)).toBe(2)
  })
})

describe('returning an image to the page', () => {
  it('preserves the page position when the source is already visible', () => {
    expect(imageReturnScroll(150, 460, 900, 900, 6000)).toBe(900)
  })

  it('brings a later image into view before it morphs back', () => {
    expect(imageReturnScroll(3200, 460, 900, 900, 6000)).toBe(3880)
  })

  it('keeps a tall source below the navigation and clamps to the page bounds', () => {
    expect(imageReturnScroll(-1000, 1000, 900, 800, 6000)).toBe(0)
    expect(imageReturnScroll(6000, 460, 900, 900, 6000)).toBe(5100)
  })
})
