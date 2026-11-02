/** Adapted from Pixel Point's Toolcraft panel, slider-control, slider-value, and
 * switch components (MIT). See NOTICE.md and LICENSE.md in this directory.
 * Uses the same Base UI primitives, with styles scoped to this portfolio. */
import { useId, useRef, useState, type ReactNode } from 'react'
import { Slider } from '@base-ui/react/slider'
import { Switch } from '@base-ui/react/switch'

function clampSliderValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function formatSliderValue(value: number, step: number): string {
  const decimals = String(step).split('.')[1]?.length ?? 0
  return String(Number(value.toFixed(decimals)))
}

export function ToolcraftPanel({ children, title, onClose, footer }: {
  children: ReactNode; title: string; onClose: () => void; footer: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const id = useId()
  return (
    <aside className="tc-panel" aria-labelledby={id} data-toolcraft-panel data-collapsed={collapsed ? '' : undefined}>
      <header className="tc-panel__header">
        <div><h2 id={id}>{title}</h2></div>
        <button type="button" className="tc-icon-button" aria-label={collapsed ? 'Expand field controls' : 'Collapse field controls'} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" style={{ transform: collapsed ? 'rotate(180deg)' : undefined }}><path d="m4 10 4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
        </button>
        <button type="button" className="tc-icon-button" aria-label="Hide field controls" onClick={onClose}>
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
        </button>
      </header>
      {!collapsed && <><div className="tc-panel__content">{children}</div><footer className="tc-panel__footer">{footer}</footer></>}
    </aside>
  )
}

export function PanelSection({ children, title, defaultOpen = false }: { children: ReactNode; title: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <details className="tc-section" open={open} onToggle={(event) => { if (event.target === event.currentTarget) setOpen(event.currentTarget.open) }}>
      <summary>{title}<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="m4 2 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg></summary>
      <div className="tc-section__body">{children}</div>
    </details>
  )
}

export function SliderControl({ name, value, min, max, step, unit, baseValue, disabled = false, onValueChange }: {
  name: string; value: number; min: number; max: number; step: number; unit?: string; baseValue: number
  disabled?: boolean; onValueChange: (value: number) => void
}) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const cancelEdit = useRef(false)
  function commit() {
    if (!cancelEdit.current && draft !== null && draft.trim() && Number.isFinite(Number(draft))) onValueChange(clampSliderValue(Number(draft), min, max))
    cancelEdit.current = false
    setDraft(null)
  }
  return (
    <div className="tc-control" data-disabled={disabled || undefined}>
      <div className="tc-control__label-row">
        <label id={id} htmlFor={id + '-value'}>{name}</label>
        <div className="tc-control__number">
          <input id={id + '-value'} type="number" aria-label={name + ' value'} min={min} max={max} step={step} disabled={disabled}
            value={draft ?? formatSliderValue(value, step)} onChange={(event) => setDraft(event.target.value)} onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
              if (event.key === 'Escape') { cancelEdit.current = true; event.currentTarget.blur() }
            }} />
          {unit && <span aria-hidden="true">{unit}</span>}
        </div>
      </div>
      <Slider.Root value={value} min={min} max={max} step={step} disabled={disabled} className="tc-slider"
        onValueChange={(next) => onValueChange(clampSliderValue(next, min, max))}>
        <Slider.Control className="tc-slider__control">
          <Slider.Track className="tc-slider__track">
            <Slider.Indicator className="tc-slider__fill" />
            <Slider.Thumb className="tc-slider__thumb" aria-labelledby={id} onDoubleClick={() => onValueChange(baseValue)} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </div>
  )
}

export function SwitchControl({ name, checked, onCheckedChange }: { name: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  const id = useId()
  return (
    <div className="tc-switch-control">
      <label htmlFor={id}>{name}</label>
      <Switch.Root id={id} checked={checked} onCheckedChange={onCheckedChange} className="tc-switch"><Switch.Thumb className="tc-switch__thumb" /></Switch.Root>
    </div>
  )
}
