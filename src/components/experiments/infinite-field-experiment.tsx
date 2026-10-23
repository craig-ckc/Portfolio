import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { projectPreviews } from '../../content/project-previews'
import { InfiniteProjectField } from './infinite-project-field'
import { DEFAULT_FIELD_SETTINGS, FIELD_SETTINGS_KEY, normalizeFieldSettings, parseFieldSettings, serializeFieldSettings, type ProjectFieldSettings } from '../../lib/project-field-settings'
const ProjectFieldControls = lazy(() => import('./project-field-controls').then((module) => ({ default: module.ProjectFieldControls })))

/** Full viewport canvas workspace with persistent Toolcraft controls. */
export function InfiniteFieldExperiment() {
  const [settings, setSettings] = useState<ProjectFieldSettings>(() => ({ ...DEFAULT_FIELD_SETTINGS }))
  const [ready, setReady] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const latestSettings = useRef(settings)
  latestSettings.current = settings
  useEffect(() => {
    const flush = () => { try { localStorage.setItem(FIELD_SETTINGS_KEY, serializeFieldSettings(latestSettings.current)) } catch { /* Storage can be disabled by the browser. */ } }
    window.addEventListener('pagehide', flush)
    return () => { window.removeEventListener('pagehide', flush); flush() }
  }, [])
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FIELD_SETTINGS_KEY)
      if (saved) {
        const restored = parseFieldSettings(saved)
        latestSettings.current = restored
        setSettings(restored)
      }
    } catch { /* A blocked store or an obsolete preset still leaves a usable preview. */ }
    if (matchMedia('(max-width: 599px)').matches) setControlsVisible(false)
    setReady(true)
  }, [])
  useEffect(() => {
    if (!ready) return
    const timeout = window.setTimeout(() => {
      try { localStorage.setItem(FIELD_SETTINGS_KEY, serializeFieldSettings(settings)) }
      catch { /* The field remains usable when storage is unavailable. */ }
    }, 250)
    return () => clearTimeout(timeout)
  }, [settings, ready])
  return (
    <>
    <div className="field-experiment"><InfiniteProjectField images={projectPreviews} settings={settings} /></div>
    {ready && (controlsVisible ? <Suspense fallback={null}><ProjectFieldControls settings={settings} onChange={(next) => setSettings(normalizeFieldSettings(next))} onClose={() => setControlsVisible(false)} /></Suspense> :
      <button type="button" className="tc-launcher" onClick={() => setControlsVisible(true)}>
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12" fill="none" stroke="currentColor" /><path d="M5 2v4M11 6v4M6 10v4" fill="none" stroke="currentColor" strokeWidth="3" /></svg>Tune field
      </button>)}
    </>
  )
}
