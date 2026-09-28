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
    <div className="footer-slot" ref={slotRef}>
      <footer className="footer" ref={footerRef}>
        {/* Two nested layers because they animate from different sources: the
            outer one is driven by scroll (--reveal), the inner one drifts on its
            own so the backdrop is never completely still. */}
        <div className="footer__shader" aria-hidden="true">
          <div className="footer__drift">
            {FOOTER_DITHER_VARIANT === 'video' ? (
              <DitheredVideoBackground
                active={videoActive}
                className="footer__dither"
                colorBack={DITHER_PALETTE_VIDEO.back}
                colorFront={DITHER_PALETTE_VIDEO.front}
                colorHighlight={DITHER_PALETTE_VIDEO.highlight}
                poster={CLOUD_POSTER}
                src={CLOUD_VIDEO}
              />
            ) : (
              <DitheredImageBackground
                className="footer__dither"
                colorBack={DITHER_PALETTE_IMAGE.back}
                colorFront={DITHER_PALETTE_IMAGE.front}
                colorHighlight={DITHER_PALETTE_IMAGE.highlight}
                src={FOOTER_IMAGE}
              />
            )}
          </div>
        </div>
        <p className="footer__baseline">{footer.copyright}</p>
      </footer>
    </div>
  )
}
