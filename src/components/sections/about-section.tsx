import { Container } from '../layout/container'
import { Section } from '../layout/section'
import { PlaceholderImage } from '../ui/placeholder'
import { Tag } from '../ui/tag'

export function AboutSection() {
  return (
    <Section className="bg-surface text-content" aria-labelledby="about-title">
      <Container className="py-20">
        <div className="grid min-h-[580px] grid-cols-4 grid-rows-2 gap-1 compact:min-h-0 compact:grid-cols-2 compact:grid-rows-none portrait:grid-cols-1">
          <div className="col-span-2 row-span-2 flex min-h-[580px] flex-col justify-between bg-surface-raised p-4 compact:min-h-[420px] portrait:col-span-1 portrait:min-h-[520px]">
            <div className="max-w-[620px]">
              <h2 id="about-title" className="sr-only">
                About
              </h2>
              <p className="m-0 text-section-title leading-normal text-content">
                I&apos;m a product designer and developer working across product strategy, websites, and applications.
              </p>
              <p className="m-0 mt-11 text-section-title leading-normal text-content">
                I help businesses explore ideas, define the right solution, and build digital products that solve real problems.
              </p>
              <p className="m-0 mt-11 text-section-title leading-normal text-content">
                Working end-to-end, I stay involved from discovery to delivery, reducing unnecessary handoffs and ensuring every
                decision moves the product forward.
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-2.5">
              <Tag href="mailto:hello@craigchihururu.com?subject=Project%20enquiry" tone="primary">
                Book a call
              </Tag>
              <Tag href="mailto:hello@craigchihururu.com">hello@craigchihururu.com</Tag>
            </div>
          </div>
          <PlaceholderImage className="aspect-square min-h-[288px] compact:min-h-[220px]" />
          <PlaceholderImage className="aspect-square compact:min-h-[220px]" />
          <PlaceholderImage className="col-span-2 aspect-2/1" />
        </div>
      </Container>
    </Section>
  )
}
