import { PageShell } from '../components/layout/page-shell'
import { SectionSpacer } from '../components/layout/section-spacer'
import { FooterCta } from '../components/sections/footer-cta'
import { HeroSection } from '../components/sections/hero-section'
import { ListsSection } from '../components/sections/list-section'
import { Navbar } from '../components/sections/navbar'
import { ProjectShowcase } from '../components/sections/project-showcase'

export default function FigmaHomePage() {
  return (
    <PageShell>
      <Navbar />
      <main>
        <HeroSection />
        <ProjectShowcase />
        <SectionSpacer />
        <ListsSection />
      </main>
      <FooterCta />
    </PageShell>
  )
}
