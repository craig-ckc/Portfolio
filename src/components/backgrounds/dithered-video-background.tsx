import { useEffect, useRef, useState } from 'react'
import { DitheredBackgroundRenderer } from '../../lib/dithered-background-renderer'

type DitherState = 'poster' | 'video' | 'fallback'

interface DitheredVideoBackgroundProps {
  active: boolean
  className?: string
  colorBack: string
  colorFront: string
  colorHighlight: string
  poster: string
  src: string
}

function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reducedMotion
}

/**
 * Renders Paper's Image Dithering shader with an HTML video as its live WebGL
 * texture. The poster remains the texture until playback succeeds, so every
 * failure mode has a real dithered still when WebGL2 is available.
 */
export function DitheredVideoBackground({
  active,
  className,
  colorBack,
  colorFront,
  colorHighlight,
  poster,
  src,
}: DitheredVideoBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const rendererRef = useRef<DitheredBackgroundRenderer | null>(null)
  const posterImageRef = useRef<HTMLImageElement | null>(null)
  const syncPlaybackRef = useRef<() => void>(() => undefined)
  const activeRef = useRef(active)
  const reducedMotion = useReducedMotion()
  const reducedMotionRef = useRef(reducedMotion)
  const [state, setState] = useState<DitherState>('poster')

  activeRef.current = active
  reducedMotionRef.current = reducedMotion

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    let renderer: DitheredBackgroundRenderer
    try {
      renderer = new DitheredBackgroundRenderer(canvas, {
        colorBack,
        colorFront,
        colorHighlight,
      })
    } catch {
      video.pause()
      setState('fallback')
      return
    }

    rendererRef.current = renderer
    let disposed = false
    let playbackFailed = false
    let playAttempt = 0
    let animationFrameId: number | null = null
    let videoFrameId: number | null = null

    const cancelFrameSchedule = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
      if (videoFrameId !== null && video.cancelVideoFrameCallback) {
        video.cancelVideoFrameCallback(videoFrameId)
        videoFrameId = null
      }
    }

    const restorePoster = () => {
      const posterImage = posterImageRef.current
      if (posterImage?.complete && posterImage.naturalWidth > 0) {
        renderer.setImage(posterImage)
      }
      setState('poster')
    }

    const shouldPlay = () =>
      !disposed &&
      !playbackFailed &&
      activeRef.current &&
      !reducedMotionRef.current &&
      !document.hidden

    const scheduleFrame = () => {
      cancelFrameSchedule()
      if (!shouldPlay()) return

      if (video.requestVideoFrameCallback) {
        videoFrameId = video.requestVideoFrameCallback(() => {
          videoFrameId = null
          if (!shouldPlay()) return
          renderer.uploadVideoFrame(video)
          scheduleFrame()
        })
        return
      }

      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null
        if (!shouldPlay()) return
        renderer.uploadVideoFrame(video)
        scheduleFrame()
      })
    }

    const syncPlayback = () => {
      playAttempt += 1
      const thisAttempt = playAttempt

      if (!shouldPlay()) {
        cancelFrameSchedule()
        video.pause()
        if (reducedMotionRef.current || playbackFailed) restorePoster()
        return
      }

      if (!video.paused) {
        setState('video')
        scheduleFrame()
        return
      }

      void video.play().then(
        () => {
          if (disposed || thisAttempt !== playAttempt || !shouldPlay()) {
            video.pause()
            return
          }
          setState('video')
          renderer.uploadVideoFrame(video)
          scheduleFrame()
        },
        () => {
          if (disposed || thisAttempt !== playAttempt) return
          playbackFailed = true
          cancelFrameSchedule()
          video.pause()
          restorePoster()
        },
      )
    }

    syncPlaybackRef.current = syncPlayback

    const posterImage = new Image()
    posterImage.decoding = 'async'
    posterImageRef.current = posterImage
    posterImage.addEventListener('load', restorePoster, { once: true })
    posterImage.src = poster

    const handleLoadedData = () => syncPlayback()
    const handleVideoError = () => {
      playbackFailed = true
      cancelFrameSchedule()
      video.pause()
      restorePoster()
    }
    const handleVisibilityChange = () => syncPlayback()

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('error', handleVideoError)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    syncPlayback()

    return () => {
      disposed = true
      playAttempt += 1
      cancelFrameSchedule()
      video.pause()
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('error', handleVideoError)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      posterImage.removeEventListener('load', restorePoster)
      posterImageRef.current = null
      syncPlaybackRef.current = () => undefined
      renderer.dispose()
      rendererRef.current = null
    }
  }, [colorBack, colorFront, colorHighlight, poster])

  useEffect(() => {
    syncPlaybackRef.current()
  }, [active, reducedMotion])

  return (
    <div
      className={className}
      data-dither-state={state}
      style={{ backgroundImage: `url(${poster})` }}
    >
      <canvas className="tw:absolute tw:inset-0 tw:block tw:w-full tw:h-full" ref={canvasRef} aria-hidden="true" />
      {/* Kept in the document as the decoded WebGL texture source, never as a
          visible layer — the canvas above is the only moving image the
          footer displays. */}
      <video
        ref={videoRef}
        aria-hidden="true"
        autoPlay
        className="tw:absolute tw:w-px tw:h-px tw:opacity-0 tw:pointer-events-none"
        loop
        muted
        playsInline
        poster={poster}
        preload="metadata"
        src={src}
        tabIndex={-1}
      />
    </div>
  )
}
