import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { folderCards } from '../../content/home-page'
import { StampSticker, ToriiSticker } from './icons'

/**
 * The hero object: a folder with a stack of photo cards tucked behind its front
 * panel. The flat PNG in the design frame is rebuilt here out of real elements
 * so it can respond to the pointer.
 *
 *   idle   cards sit low and narrow behind the front panel
 *   hover  they fan wider and lift; the front leans back; the whole object
 *          tilts a few degrees toward the pointer
 *   click  they arc clear of the folder and stay there until clicked again
 *
 * All transform values live in home-page.css so the states stay editable
 * alongside the rest of the design; this component only supplies the pointer
 * position and the open flag.
 */
export function PhotoFolder({ caption }: { caption: string }) {
  const [open, setOpen] = useState(false)
  const stageRef = useRef<HTMLSpanElement>(null)

  const trackPointer = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const stage = stageRef.current
    if (!stage) return

    const box = event.currentTarget.getBoundingClientRect()
    // -1 .. 1 from the centre of the object on each axis.
    const px = ((event.clientX - box.left) / box.width) * 2 - 1
    const py = ((event.clientY - box.top) / box.height) * 2 - 1

    stage.style.setProperty('--px', px.toFixed(3))
    stage.style.setProperty('--py', py.toFixed(3))
  }, [])

  const releasePointer = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return

    stage.style.setProperty('--px', '0')
    stage.style.setProperty('--py', '0')
  }, [])

  return (
    <button
      className={`hp-folder${open ? ' is-open' : ''}`}
      type="button"
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
      onPointerMove={trackPointer}
      onPointerLeave={releasePointer}
      onBlur={releasePointer}
    >
      <span className="hp-folder__scene">
        <span className="hp-folder__stage" ref={stageRef}>
          <span className="hp-folder__shadow" aria-hidden="true" />
          <span className="hp-folder__back" aria-hidden="true" />

          <span className="hp-folder__cards" aria-hidden="true">
            {folderCards.map((card) => (
              <span
                className={`hp-folder__card${card.src ? '' : ' hp-folder__card--placeholder'}`}
                key={card.id}
              >
                {card.src ? <img src={card.src} alt={card.alt ?? ''} /> : null}
              </span>
            ))}
          </span>

          <span className="hp-folder__front" aria-hidden="true">
            <span className="hp-folder__rules">
              <span />
              <span />
            </span>
          </span>

          <span className="hp-folder__sticker hp-folder__sticker--stamp" aria-hidden="true">
            <StampSticker />
          </span>
          <span className="hp-folder__sticker hp-folder__sticker--torii" aria-hidden="true">
            <ToriiSticker />
          </span>
        </span>
      </span>

      <span className="hp-sr-only">
        {open ? `Close the ${caption} stack` : `Open the ${caption} stack`}
      </span>
    </button>
  )
}
