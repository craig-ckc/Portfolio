import { useEffect, useRef } from 'react'
import { ImageDithering } from '@paper-design/shaders-react'
import { footer } from '../../content/home-page'
import { onFrame } from '../../lib/smooth-scroll'

/* The exact shader the frame uses, read off the design node:
 *
 *   <ImageDithering originalColors={false} inverted={false} type="4x4"
 *     size={2.4} colorSteps={2} scale={1} fit="cover"
 *     colorBack="#00000000" colorFront="#1F1F1F" colorHighlight="#313131" />
 *
 * Same package (@paper-design/shaders-react), same props, so the footer is the
 * design rather than an approximation of it.
 */
const DITHER_IMAGE =
  'https://app.paper.design/file-assets/01M0F2SSGA0QC11HPY8HZFYHAQ/01M0K7Q84Y7RM5FW1TSXA5F9ZA.webp'

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

  useEffect(() => {
    const slot = slotRef.current
    const target = footerRef.current
    if (!slot || !target) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      target.style.setProperty('--reveal', '1')
      return
    }

    let last = -1

    // Driven per frame rather than by a scroll listener: Lenis moves the page
    // every frame, and a scroll listener lags a frame or two behind it, which
    // shows up as the backdrop trailing the footer edge.
    return onFrame(() => {
      const box = slot.getBoundingClientRect()
      const progress = (window.innerHeight - box.top) / Math.max(1, box.height)
      const reveal = Math.min(1, Math.max(0, progress))
      if (Math.abs(reveal - last) < 0.0005) return
      last = reveal
      target.style.setProperty('--reveal', reveal.toFixed(4))
    })
  }, [])

  return (
    <div className="hp-footer-slot" ref={slotRef}>
      <footer className="hp-footer" ref={footerRef}>
        {/* Two nested layers because they animate from different sources: the
            outer one is driven by scroll (--reveal), the inner one drifts on its
            own so the backdrop is never completely still. */}
        <div className="hp-footer__shader" aria-hidden="true">
          <div className="hp-footer__drift">
            <ImageDithering
              image={DITHER_IMAGE}
              originalColors={false}
              inverted={false}
              type="4x4"
              size={2.4}
              colorSteps={2}
              scale={1}
              fit="cover"
              colorBack="#00000000"
              colorFront="#1F1F1F"
              colorHighlight="#313131"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
        <p className="hp-footer__baseline">{footer.copyright}</p>
      </footer>
    </div>
  )
}
