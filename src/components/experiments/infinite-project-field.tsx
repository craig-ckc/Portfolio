import { useEffect, useRef, useState } from 'react'
import type { FieldImage } from '../../lib/project-field-layout'
import { createProjectField, type ProjectFieldController } from '../../lib/project-field-renderer'
import { DEFAULT_FIELD_SETTINGS, type ProjectFieldSettings } from '../../lib/project-field-settings'

/** Owns only the field: no hero copy, project content imports, or page layout.
 * The renderer loads with the island so it can start without a second JS fetch. */
export function InfiniteProjectField({ images, settings = DEFAULT_FIELD_SETTINGS }: { images: readonly FieldImage[]; settings?: Readonly<ProjectFieldSettings> }) {
  const root = useRef<HTMLDivElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const link = useRef<HTMLAnchorElement>(null)
  const controller = useRef<ProjectFieldController | null>(null)
  const latestSettings = useRef(settings)
  latestSettings.current = settings
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading')
  useEffect(() => {
    if (!images.length) return
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
    <div className="project-field" data-renderer={status} aria-busy={status === 'loading'} ref={root} tabIndex={status === 'ready' ? 0 : -1} role="group" aria-label="Selected projects. Drag to explore, or use arrow keys. Tab to a project to open its case study.">
      <div className="project-field__surface" ref={surface}>
        <a className="project-field__pointer" ref={link} tabIndex={-1} aria-hidden="true" draggable={false} />
      </div>
      <div className="project-field__links" aria-label="Project case studies">
        {images.map((image, index) => (
          <a key={image.href + image.src} href={image.href} tabIndex={status === 'loading' ? -1 : undefined} onFocus={() => controller.current?.focus(index)}>
            <img src={image.src} width={image.width} height={image.height} alt="" draggable={false} />
            <span>{image.title}<span aria-hidden="true"> ↗</span></span>
          </a>
        ))}
      </div>
    </div>
  )
}
