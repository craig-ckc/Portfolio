import { Masonry } from 'masonic'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PlaygroundItem } from '../../content/playground'
import { PlaceholderImage } from './placeholder'

type PlaygroundGridProps = {
  getHref?: (item: PlaygroundItem) => string
  items: PlaygroundItem[]
  onRender?: (startIndex: number, stopIndex: number, items: PlaygroundItem[]) => void
}

function pickColumnCount(width: number) {
  if (width < 600) {
    return 2
  }

  if (width < 900) {
    return 4
  }

  if (width < 1280) {
    return 6
  }

  return 8
}

function useColumnCount() {
  const [count, setCount] = useState(() => (typeof window === 'undefined' ? 4 : pickColumnCount(window.innerWidth)))

  useEffect(() => {
    const update = () => setCount(pickColumnCount(window.innerWidth))

    update()
    window.addEventListener('resize', update)

    return () => window.removeEventListener('resize', update)
  }, [])

  return count
}

export function PlaygroundGrid({ getHref, items, onRender }: PlaygroundGridProps) {
  const columnCount = useColumnCount()
  const getHrefRef = useRef(getHref)
  getHrefRef.current = getHref

  // Stable render component: masonic remounts cells when `render` identity changes,
  // so we read the latest getHref through a ref instead of closing over it.
  const renderCard = useMemo(
    () =>
      function PlaygroundCard({ data }: { index: number; data: PlaygroundItem; width: number }) {
        const href = getHrefRef.current?.(data)
        const visual = (
          <div className="w-full overflow-hidden" style={{ aspectRatio: data.layout.aspectRatio }}>
            <PlaceholderImage className="size-full" />
          </div>
        )

        if (!href) {
          return visual
        }

        return (
          <a
            aria-label={data.title}
            className="block focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
            href={href}
          >
            {visual}
          </a>
        )
      },
    [],
  )

  return (
    <Masonry
      columnCount={columnCount}
      columnGutter={8}
      items={items}
      itemKey={(_data, index) => index}
      onRender={onRender}
      render={renderCard}
      rowGutter={8}
    />
  )
}
