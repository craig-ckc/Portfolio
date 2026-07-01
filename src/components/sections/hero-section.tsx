import { Container } from '../layout/container'
import { Section } from '../layout/section'
import { HeroTitle } from '../ui/hero-title'
import { PlaceholderImage } from '../ui/placeholder'
import { Tag } from '../ui/tag'

export function HeroSection() {
  return (
    <Section className="bg-surface text-muted" theme="dark" aria-labelledby="hero-title" data-section="hero" >
      <Container className="flex min-h-hero-min flex-col justify-between overflow-hidden pb-4 pt-hero-top portrait:pt-12">
        <HeroTitle />
        <div className="flex w-full items-end justify-between gap-6 tablet:flex-col-reverse tablet:items-start">
          <div className="flex flex-wrap items-start gap-2.5">
            <Tag href="mailto:hello@craigchihururu.com?subject=Project%20enquiry" tone="primary">
              Book a call
            </Tag>
            <Tag href="mailto:hello@craigchihururu.com" tone="dark">
              hello@craigchihururu.com
            </Tag>
          </div>
          <PlaceholderImage className="h-hero-image-h w-hero-image-w flex-none tablet:aspect-hero-image tablet:h-auto tablet:w-full tablet:max-w-hero-image-w" />
        </div>
      </Container>
    </Section>
  )
}
