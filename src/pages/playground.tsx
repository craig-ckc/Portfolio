import { useInfiniteLoader } from 'masonic'
import { useEffect, useState } from 'react'
import { playgroundItems } from '../content/playground'
import { Container } from '../components/layout/container'
import { PageShell } from '../components/layout/page-shell'
import { Section } from '../components/layout/section'
import { PlaygroundGrid } from '../components/ui/playground-grid'
import { Tag } from '../components/ui/tag'

export default function PlaygroundPage() {
  const [items, setItems] = useState(() => playgroundItems.slice())

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const maybeLoadMore = useInfiniteLoader(
    () => setItems((current) => [...current, ...playgroundItems]),
    {
      isItemLoaded: (index, loaded) => index < loaded.length,
      minimumBatchSize: playgroundItems.length,
      threshold: 8,
    },
  )

  return (
    <PageShell>
      <Section className="bg-surface pt-28 text-content" aria-labelledby="playground-page-title">
        <Container className="pb-20">
          <div className="mb-8 flex items-end justify-between gap-6 tablet:flex-col tablet:items-start">
            <div>
              <Tag href="/" tone="surface">
                Back home
              </Tag>
              <h1 id="playground-page-title" className="m-0 mt-4 text-section-title font-normal leading-normal">
                Playground
              </h1>
            </div>
          </div>
          <PlaygroundGrid getHref={(item) => `/playground/${item.slug}`} items={items} onRender={maybeLoadMore} />
        </Container>
      </Section>
    </PageShell>
  )
}
