import { folderItems, type DiscItem, type DockItem } from '../../content/home-page'
import type { ExperimentKind } from '../../content/experiments'
import { DiscFace } from '../home/faces/disc'
import { DockFace } from '../home/faces/dock'

const dock = folderItems.find((item): item is DockItem => item.kind === 'dock')
const disc = folderItems.find((item): item is DiscItem => item.kind === 'disc')

export function ExperimentDemo({ kind }: { kind: ExperimentKind }) {
  if (kind === 'dock' && dock) {
    return (
      <div className="folder is-open flex w-full justify-center">
        <div className="folder__item is-focused w-full max-w-[900px]">
          <div className="card relative @container aspect-[24/5] w-full overflow-visible" data-kind="dock">
            <DockFace item={dock} />
          </div>
        </div>
      </div>
    )
  }

  if (disc) {
    return (
      <div className="folder is-open flex w-full justify-center">
        <div className="folder__item is-focused w-[min(58vw,460px)] min-w-[250px] max-w-[460px]">
          <div className="card relative @container aspect-square w-full overflow-visible rounded-lg" data-kind="disc">
            <DiscFace item={disc} presented standalone />
          </div>
        </div>
      </div>
    )
  }

  return null
}
