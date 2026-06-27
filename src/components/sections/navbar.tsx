import { Container } from '../layout/container'
import { BrandMark } from '../ui/brand-mark'
import { ContactLink } from '../ui/contact-link'

export function Navbar() {
  return (
    <Container
      as="header"
      className="absolute inset-x-0 top-0 z-20 flex items-center justify-between py-4"
    >
      <BrandMark />
      <ContactLink />
    </Container>
  )
}
