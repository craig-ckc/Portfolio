import { useRef, useState } from 'react'
import { FIELD_SETTING_LIMITS, serializeFieldSettings, type NumericFieldSetting, type ProjectFieldSettings } from '../../lib/project-field-settings'
import { PanelSection, SliderControl, SwitchControl, ToolcraftPanel } from '../toolcraft/controls'

type Control = { key: NumericFieldSetting; name: string; step: number; unit?: string; factor?: number }
const sections: { title: string; open?: boolean; controls: Control[] }[] = [
  { title: 'Layout & scale', open: true, controls: [
    { key: 'imageSize', name: 'Image size', step: .5, factor: 100, unit: '%' },
    { key: 'spacing', name: 'Spacing', step: 1, factor: 100, unit: '%' },
    { key: 'centerScale', name: 'Center scale', step: .01, unit: '×' },
    { key: 'edgeScale', name: 'Edge scale', step: .01, unit: '×' },
    { key: 'scaleFalloff', name: 'Scale falloff', step: .05 },
  ] },
  { title: 'Blur', open: true, controls: [
    { key: 'edgeBlur', name: 'Edge blur', step: .5, unit: 'px' },
    { key: 'blurStart', name: 'Blur starts at', step: 1, factor: 100, unit: '%' },
    { key: 'blurFalloff', name: 'Blur falloff', step: .05 },
  ] },
  { title: 'Masks', controls: [
    { key: 'radius', name: 'Field radius', step: 1, factor: 100, unit: '%' },
    { key: 'outerFade', name: 'Outer fade starts at', step: 1, factor: 100, unit: '%' },
    { key: 'middleFade', name: 'Middle fade starts at', step: 1, factor: 100, unit: '%' },
    { key: 'middleStrength', name: 'Middle layer strength', step: 1, factor: 100, unit: '%' },
    { key: 'innerFade', name: 'Inner fade starts at', step: 1, factor: 100, unit: '%' },
    { key: 'innerStrength', name: 'Inner layer strength', step: 1, factor: 100, unit: '%' },
    { key: 'maskOffset', name: 'Layer offset', step: 1, factor: 100, unit: '%' },
  ] },
  { title: 'Motion', controls: [
    { key: 'driftSpeed', name: 'Drift speed', step: .5, unit: 'px/s' },
    { key: 'inertia', name: 'Inertia', step: 1, factor: 100, unit: '%' },
    { key: 'dragSpeed', name: 'Drag sensitivity', step: .05, unit: '×' },
  ] },
]

export function ProjectFieldControls({ settings, defaults, onChange, onClose }: {
  settings: Readonly<ProjectFieldSettings>; defaults: Readonly<ProjectFieldSettings>; onChange: (settings: ProjectFieldSettings) => void; onClose: () => void
}) {
  const [copyFallback, setCopyFallback] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const exportText = useRef<HTMLTextAreaElement>(null)
  async function copy() {
    const value = serializeFieldSettings(settings)
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setCopyFallback(null)
    } catch {
      setCopyFallback(value)
    }
  }
  return (
    <ToolcraftPanel title="Field controls" onClose={onClose} footer={<>
      <div className="tc-actions">
        <button type="button" onClick={() => { onChange({ ...defaults }); setCopied(false); setCopyFallback(null) }}>Reset</button>
        <button type="button" onClick={() => void copy()}>{copied ? 'Copied' : 'Copy settings'}</button>
      </div>
      {copyFallback && <div className="tc-transfer">
        <label htmlFor="field-settings-json">Copy this preset</label>
        <textarea id="field-settings-json" ref={exportText} aria-label="Settings JSON" value={copyFallback} readOnly spellCheck={false} onFocus={() => exportText.current?.select()} />
        <div className="tc-actions"><button type="button" onClick={() => setCopyFallback(null)}>Close</button></div>
      </div>}
    </>}>
      {sections.map((section) => <PanelSection key={section.title} title={section.title} defaultOpen={section.open}>
        {section.title === 'Motion' && <>
          <SwitchControl name="Auto drift" checked={settings.autoDrift} onCheckedChange={(autoDrift) => { onChange({ ...settings, autoDrift }); setCopied(false) }} />
          <p className="tc-control-note">Drift continues in the direction of your last drag.</p>
        </>}
        {section.controls.map((control) => {
          const factor = control.factor ?? 1
          const [min, max] = FIELD_SETTING_LIMITS[control.key]
          return <SliderControl key={control.key} name={control.name} value={settings[control.key] * factor} min={min * factor} max={max * factor} step={control.step} unit={control.unit} baseValue={defaults[control.key] * factor}
            disabled={control.key === 'driftSpeed' && !settings.autoDrift}
            onValueChange={(value) => { onChange({ ...settings, [control.key]: value / factor }); setCopied(false) }} />
        })}
      </PanelSection>)}
    </ToolcraftPanel>
  )
}
