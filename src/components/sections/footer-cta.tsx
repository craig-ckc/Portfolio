import { socialLinks } from '../../content/home'
import { Container } from '../layout/container'
import { Section } from '../layout/section'
import { Tag } from '../ui/tag'

export function FooterCta() {
  return (
    <Section className="bg-surface text-content" aria-label="Contact">
      <Container className="grid grid-cols-footer items-end gap-0 pt-4 desktop:grid-cols-footer tablet:grid-cols-1 tablet:gap-16">
        <img
          className="h-auto w-full max-w-footer-logo self-end"
          src="/figma/logo-type.svg"
          alt="Craig"
          data-ui="footer-logo"
        />
        <div className="flex flex-col items-start gap-6 pb-4 tablet:order-first">
          <p className="m-0 w-full text-section-title leading-normal text-content">
            Let&apos;s talk about your project and the next steps
          </p>
          <div className="flex flex-wrap items-start gap-2.5">
            <Tag href="mailto:hello@craigchihururu.com?subject=Project%20enquiry" tone="dark">
              Book a call
            </Tag>
            <Tag href="mailto:hello@craigchihururu.com">hello@craigchihururu.com</Tag>
          </div>
          <nav className="flex gap-8 whitespace-nowrap text-caption font-medium leading-copy" aria-label="Social links">
            {socialLinks.map((link, index) => (
              <a className="text-inherit no-underline" href={link.href} key={`${link.label}-${index}`}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </Container>
    </Section>
  )
}
