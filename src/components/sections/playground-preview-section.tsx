import { playgroundItems } from '../../content/playground'
import { Container } from '../layout/container'
import { Section } from '../layout/section'
import { PlaygroundGrid } from '../ui/playground-grid'
import { Tag } from '../ui/tag'

const previewItems = playgroundItems.slice(0, 16)

export function PlaygroundPreviewSection() {
  return (
    <Section className="bg-surface text-content" aria-labelledby="playground-title">
      <Container className="py-20">
        <div className="mb-8 flex items-end justify-between gap-6 tablet:flex-col tablet:items-start">
          <div className="max-w-[420px]">
            <h2 id="playground-title" className="m-0 text-section-title font-normal leading-normal">
              Playground
            </h2>
            <p className="m-0 mt-2 text-caption leading-copy text-muted">
              A space for experiments, prototypes, and interface studies — ideas explored in motion.
            </p>
          </div>
          <Tag href="/playground" tone="dark">
            Enter playground
          </Tag>
        </div>
        <PlaygroundGrid getHref={(item) => `/playground/${item.slug}`} items={previewItems} />
      </Container>
    </Section>
  )
}
