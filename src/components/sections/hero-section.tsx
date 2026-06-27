import { Container } from '../layout/container'
import { ThemeScope } from '../layout/theme-scope'
import { HeroTitle } from '../ui/hero-title'
import { PlaceholderImage } from '../ui/placeholder'
import { Tag } from '../ui/button'

export function HeroSection() {
  return (
    <ThemeScope
      as="section"
      className="bg-surface pt-hero-top text-muted portrait:pt-12"
      theme="dark"
      aria-labelledby="hero-title"
    >
      <Container className="flex min-h-hero-min flex-col justify-between overflow-hidden py-4 tablet:min-h-hero-min-tablet landscape:!min-h-hero-min-landscape portrait:!min-h-hero-min-portrait">
        <HeroTitle />
        <div className="flex w-full items-end justify-between gap-6 tablet:flex-col-reverse tablet:items-start">
          <div className="flex flex-wrap items-start gap-2.5">
            <Tag tone="primary" interactive>
              Book a call
            </Tag>
            <Tag tone="dark">hello@craigchihururu.com</Tag>
          </div>
          <PlaceholderImage className="h-hero-image-h w-hero-image-w flex-none tablet:aspect-hero-image tablet:h-auto tablet:w-full tablet:max-w-hero-image-w" />
        </div>
      </Container>
    </ThemeScope>
  )
}
