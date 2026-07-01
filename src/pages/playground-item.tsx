import type { ReactNode } from 'react'
import type { PlaygroundItem } from '../content/playground'
import { Container } from '../components/layout/container'
import { Section } from '../components/layout/section'

type PlaygroundItemPageProps = {
  item: PlaygroundItem
  children?: ReactNode
}

function StagePlaceholder() {
  return (
    <div className="grid aspect-square w-[clamp(8rem,18vw,16rem)] place-items-center rounded-[2rem] border border-primary bg-surface shadow-[0_30px_80px_rgb(15_19_26_/_8%)]">
      <span className="block aspect-square w-[28%] rounded-full bg-accent" />
    </div>
  )
}

export default function PlaygroundItemPage({ item, children }: PlaygroundItemPageProps) {
  return (
    <Section className="bg-surface text-content" aria-labelledby="playground-item-title">
      <Container className="flex min-h-screen flex-col p-2">
        <div aria-label={`${item.title} canvas`} className="relative flex flex-1 flex-col overflow-hidden rounded-md border border-primary bg-surface-raised bg-[radial-gradient(circle,rgb(15_19_26_/_12%)_1px,transparent_1.5px)] bg-[length:22px_22px]" >
          <a
            className="absolute left-4 top-4 z-20 inline-flex size-9 items-center justify-center rounded-full border border-primary bg-surface text-content no-underline transition duration-150 hover:-translate-y-px hover:shadow-[0_12px_32px_rgb(15_19_26_/_10%)]"
            href="/"
            aria-label="Home"
          >
            <span className="logo-mark-mask block size-5 bg-content" aria-hidden="true" />
          </a>
          <a
            className="absolute left-1/2 top-4 z-10 inline-flex h-9 max-w-[min(50%,360px)] -translate-x-1/2 items-center gap-1.5 rounded-full border border-primary bg-surface px-4 text-caption font-medium text-muted no-underline portrait:bottom-6 portrait:top-auto portrait:max-w-[calc(100%_-_3rem)]"
            href="/playground"
            aria-label="Back to playground"
          >
            <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1 id="playground-item-title" className="min-w-0 truncate leading-none">
              {item.title}
            </h1>
          </a>
          <div className="grid flex-1 place-items-center px-8 pb-8 pt-24 portrait:px-4 portrait:py-20">
            {children ?? <StagePlaceholder />}
          </div>
        </div>
      </Container>
    </Section>
  )
}
