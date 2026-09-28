import { useEffect, useRef, useState } from 'react'
import { footer } from '../../content/home-page'
import { onFrame } from '../../lib/smooth-scroll'
import { DitheredImageBackground } from '../backgrounds/dithered-image-background'
import { DitheredVideoBackground } from '../backgrounds/dithered-video-background'

/* Which backdrop the footer mounts. The still image is the original design; the
   video arrived later and drives the same shader from decoded frames. Neither
   supersedes the other, so both stay wired and this is the only line that
   decides which one ships. */
const FOOTER_DITHER_VARIANT: 'image' | 'video' = 'image'

const CLOUD_VIDEO = '/video/footer-clouds.mp4'
const CLOUD_POSTER = '/video/footer-clouds-poster.webp'
const FOOTER_IMAGE = '/img/footer-dither.webp'

/* Read off the design node, unchanged. colorBack is fully transparent on
   purpose: the dark regions of the dither are meant to be the footer's own
   ground rather than a colour of the shader's own. */
const DITHER_PALETTE_IMAGE = {
  back: '#131313',
  front: '#A4A4A4',
  highlight: '#FFFFFF',
}

/* The video's own palette, opaque where the image's is transparent — a moving
   texture behind translucent dither reads as smeared rather than as clouds. */
const DITHER_PALETTE_VIDEO = {
  back: '#131313',
  front: '#A4A4A4',
  highlight: '#FFFFFF',
}

/**
 * The footer is pinned to the bottom of the viewport and the page content
 * scrolls over it, so the CTA sits on top of the footer and the footer is
 * uncovered as you reach the end — it holds still while the page slides up.
 *
 * `--reveal` (0 → 1) tracks how much of the footer slot has been uncovered and
 * drives the slower drift of the dithered backdrop against that reveal, plus
 * the baseline fading in. Skipped entirely under reduced-motion, where the
 * footer just sits at its resting state.
 */
export function Footer() {
  const slotRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLElement>(null)
  const [videoActive, setVideoActive] = useState(false)

  useEffect(() => {
    const slot = slotRef.current
    const target = footerRef.current
    if (!slot || !target) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      target.style.setProperty('--reveal', '1')
      if (FOOTER_DITHER_VARIANT === 'video') setVideoActive(false)
      return
    }

    let last = -1
    let wasActive = false

    // Driven per frame rather than by a scroll listener: Lenis moves the page
    // every frame, and a scroll listener lags a frame or two behind it, which
    // shows up as the backdrop trailing the footer edge.
    return onFrame(() => {
      const box = slot.getBoundingClientRect()
      const progress = (window.innerHeight - box.top) / Math.max(1, box.height)
      const reveal = Math.min(1, Math.max(0, progress))
      if (FOOTER_DITHER_VARIANT === 'video') {
        const isActive = reveal > 0.01
        if (isActive !== wasActive) {
          wasActive = isActive
          setVideoActive(isActive)
        }
      }
      if (Math.abs(reveal - last) < 0.0005) return
      last = reveal
      target.style.setProperty('--reveal', reveal.toFixed(4))
    })
  }, [])

  return (
    // `--footer-h` (mobile override in src/styles/tw/chrome.css, base value
    // on `.hp` in shell.css) sizes both this slot and the fixed footer below it.
    <div className="tw:relative tw:z-[1] tw:h-(--footer-h)" ref={slotRef}>
      <footer
        // BEYOND THE FRAME: #0b0b0b is the footer's own ground colour, with no
        // token behind it — the dither's dark regions are meant to show it
        // through, not a token colour of their own (see footer.css).
        className="tw:fixed tw:right-0 tw:bottom-0 tw:left-0 tw:flex tw:h-(--footer-h) tw:flex-col tw:items-center tw:justify-end tw:overflow-clip tw:pt-4xl tw:px-page-gutter tw:pb-[40px] tw:bg-[#0b0b0b] tw:text-background tw:isolate"
        ref={footerRef}
      >
        {/* Two nested layers because they animate from different sources: the
            outer one is driven by scroll (--reveal) — oversized (-18% inset)
            so there is room to drift, and moved at a fraction of the reveal
            rate (the parallax). Sign matters: as you scroll DOWN the backdrop
            must travel UP, the same direction as the page — starting at +13%
            and easing to 0 does that; the inverse would make the image slide
            down against the scroll, reading as the whole footer fighting you.
            The inner one drifts on its own (`tw:animate-chrome-cloud-drift`,
            src/styles/tw/chrome.css) so the backdrop is never completely
            still even when the page is not moving. */}
        <div
          aria-hidden="true"
          className="tw:absolute tw:inset-x-0 tw:-inset-y-[18%] tw:z-[-1] tw:pointer-events-none tw:will-change-transform tw:[transform:translateY(calc((1_-_var(--reveal,_1))*13%))] tw:motion-reduce:[transform:none]!"
        >
          <div className="tw:w-full tw:h-full tw:will-change-transform tw:animate-chrome-cloud-drift tw:motion-reduce:animate-none! tw:motion-reduce:[transform:none]!">
            {FOOTER_DITHER_VARIANT === 'video' ? (
              <DitheredVideoBackground
                active={videoActive}
                className="tw:footer-dither"
                colorBack={DITHER_PALETTE_VIDEO.back}
                colorFront={DITHER_PALETTE_VIDEO.front}
                colorHighlight={DITHER_PALETTE_VIDEO.highlight}
                poster={CLOUD_POSTER}
                src={CLOUD_VIDEO}
              />
            ) : (
              <DitheredImageBackground
                className="tw:footer-dither"
                colorBack={DITHER_PALETTE_IMAGE.back}
                colorFront={DITHER_PALETTE_IMAGE.front}
                colorHighlight={DITHER_PALETTE_IMAGE.highlight}
                src={FOOTER_IMAGE}
              />
            )}
          </div>
        </div>
        {/* Reveal-driven opacity/transform, timed with the shader above:
            clamp(0, (reveal - 0.4) * 2.6, 1) so the baseline only starts
            fading in once the footer is already well uncovered. */}
        <p
          className="tw:relative tw:flex tw:w-full tw:items-center tw:justify-center tw:gap-2xl tw:text-white tw:text-body tw:leading-normal tw:[opacity:clamp(0,calc((var(--reveal,_1)_-_0.4)*2.6),1)] tw:[transform:translateY(calc((1_-_var(--reveal,_1))*14px))] tw:motion-reduce:[transform:none]!"
        >
          {footer.copyright}
        </p>
      </footer>
    </div>
  )
}
