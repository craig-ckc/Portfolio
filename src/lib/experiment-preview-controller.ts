/** Optional video enhancement: the supplied cover remains the default and the
 * fallback for slow networks, blocked playback, and unsupported video files. */
export function setupExperimentPreview(card: HTMLAnchorElement) {
  const media = card.querySelector<HTMLVideoElement>('[data-experiment-video]')
  if (!media) return
  const video = media
  const lifecycle = new AbortController()
  const { signal } = lifecycle
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const hoverCapable = matchMedia('(any-hover: hover)')
  let hovering = false
  let focused = false
  let visible = true
  let wanted = false
  let attempt = 0

  function stop() {
    wanted = false
    attempt++
    delete card.dataset.previewPlaying
    video.pause()
    if (video.readyState > 0) video.currentTime = 0
  }

  function sync() {
    if (!(hovering || focused) || !visible || document.hidden || reducedMotion.matches) {
      stop()
      return
    }
    if (wanted) return
    wanted = true
    const currentAttempt = ++attempt
    video.muted = true
    if (!video.getAttribute('src')) video.src = video.dataset.src!
    void video.play().catch(() => {
      if (currentAttempt === attempt) stop()
    })
  }

  video.addEventListener('playing', () => {
    if (wanted) card.dataset.previewPlaying = 'true'
    else stop()
  }, { signal })
  video.addEventListener('error', stop, { signal })
  card.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'touch' || !hoverCapable.matches) return
    hovering = true
    sync()
  }, { signal })
  card.addEventListener('pointerleave', () => { hovering = false; sync() }, { signal })
  card.addEventListener('focus', () => { focused = card.matches(':focus-visible'); sync() }, { signal })
  card.addEventListener('blur', () => { focused = false; sync() }, { signal })
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { hovering = focused = false; stop() }
  }, { signal })
  reducedMotion.addEventListener('change', sync, { signal })
  document.addEventListener('visibilitychange', sync, { signal })
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
  observer.observe(card)
  window.addEventListener('pagehide', (event) => {
    stop()
    if (!event.persisted) { lifecycle.abort(); observer.disconnect() }
  }, { signal })
  return () => { stop(); lifecycle.abort(); observer.disconnect() }
}
