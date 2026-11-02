import { useEffect, useRef, useState } from 'react'
import type { FieldImage } from '../lib/project-field-layout'
import { createProjectField, type ProjectFieldController } from '../lib/project-field-renderer'
import { DEFAULT_FIELD_SETTINGS, type ProjectFieldSettings } from '../lib/project-field-settings'

type Props = {
  images: readonly FieldImage[]
  settings?: Readonly<ProjectFieldSettings>
  label?: string
  imagesLabel?: string
}

/** Rendering and interaction only. Each consumer owns its images, preset and persistence. */
export function InfiniteField({ images, settings = DEFAULT_FIELD_SETTINGS, label = 'Image field. Drag to explore, or use arrow keys.', imagesLabel = 'Images' }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const link = useRef<HTMLAnchorElement>(null)
  const controller = useRef<ProjectFieldController | null>(null)
  const latestSettings = useRef(settings)
  latestSettings.current = settings
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>(images.length ? 'loading' : 'fallback')
  useEffect(() => {
    if (!images.length) { setStatus('fallback'); return }
    setStatus('loading')
    const abort = new AbortController()
    async function start() {
      try {
        if (abort.signal.aborted) return
        const instance = await createProjectField(root.current!, surface.current!, link.current!, images, latestSettings.current, abort.signal, () => {
          controller.current = null
          setStatus('fallback')
        })
        if (abort.signal.aborted) { instance.dispose(); return }
        controller.current = instance
        instance.setSettings(latestSettings.current)
        setStatus('ready')
      } catch {
        if (!abort.signal.aborted) setStatus('fallback')
      }
    }
    void start()
    return () => {
      abort.abort()
      controller.current?.dispose()
      controller.current = null
    }
  }, [images])
  useEffect(() => { controller.current?.setSettings(settings) }, [settings])
  return (
    <div className="project-field" data-renderer={status} aria-busy={status === 'loading'} ref={root} tabIndex={status === 'ready' ? 0 : -1} role="group" aria-label={label}>
      <div className="project-field__surface" ref={surface}>
        <a className="project-field__pointer" ref={link} tabIndex={-1} aria-hidden="true" draggable={false} />
      </div>
      <div className="project-field__links" aria-label={imagesLabel}>
        {!images.length && <p>No images to display.</p>}
        {images.map((image, index) => {
          const content = <>
            {image.src ? (
              <img src={image.src} width={image.width} height={image.height} alt="" draggable={false} />
            ) : (
              <span className="project-field__placeholder" style={{ aspectRatio: `${image.width} / ${image.height}` }} aria-hidden="true" />
            )}
            <span>{image.title}{image.href && <span aria-hidden="true"> ↗</span>}</span>
          </>
          return image.href ? (
            <a className="project-field__item" key={image.href} href={image.href} tabIndex={status === 'loading' ? -1 : undefined} onFocus={() => controller.current?.focus(index)}>{content}</a>
          ) : (
            <div className="project-field__item" key={image.src ?? image.title}>{content}</div>
          )
        })}
      </div>
    </div>
  )
}
