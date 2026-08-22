import { useEffect, useRef, useState } from 'react'
import { DitheredBackgroundRenderer } from '../../lib/dithered-background-renderer'

type DitherImageState = 'image' | 'fallback'

interface DitheredImageBackgroundProps {
  className?: string
  colorBack: string
  colorFront: string
  colorHighlight: string
  src: string
}

/**
 * Renders Paper's Image Dithering shader over a still image, the arrangement
 * the footer was originally designed around.
 *
 * The sibling video version drives the same shader from decoded video frames;
 * this one uploads a single decoded image and never touches the texture again,
 * so there is no frame loop to schedule or tear down.
 */
export function DitheredImageBackground({
  className,
  colorBack,
  colorFront,
  colorHighlight,
  src,
}: DitheredImageBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<DitherImageState>('image')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: DitheredBackgroundRenderer
    try {
      renderer = new DitheredBackgroundRenderer(canvas, {
        colorBack,
        colorFront,
        colorHighlight,
      })
    } catch {
      setState('fallback')
      return
    }

    let disposed = false
    const image = new Image()

    // Both listeners can still fire after the effect has torn down, so they
    // check the flag before touching a disposed renderer or setting state.
    const applyImage = () => {
      if (disposed || image.naturalWidth === 0) return
      renderer.setImage(image)
      setState('image')
    }

    const handleImageError = () => {
      if (disposed) return
      setState('fallback')
    }

    image.decoding = 'async'
    image.addEventListener('load', applyImage, { once: true })
    image.addEventListener('error', handleImageError, { once: true })
    image.src = src

    return () => {
      disposed = true
      image.removeEventListener('load', applyImage)
      image.removeEventListener('error', handleImageError)
      renderer.dispose()
    }
  }, [colorBack, colorFront, colorHighlight, src])

  return (
    <div
      className={className}
      data-dither-state={state}
      /* Painted only when there is no canvas to show. This shader runs with a
         transparent colorBack, so a permanent image layer would sit in every
         dark region of the dither and show the raw, undithered photo there
         instead of the footer's own ground. */
      style={state === 'fallback' ? { backgroundImage: `url(${src})` } : undefined}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  )
}
