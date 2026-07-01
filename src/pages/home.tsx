import { PageShell } from '../components/layout/page-shell'
import { AboutSection } from '../components/sections/about-section'
import { HeroSection } from '../components/sections/hero-section'
import { ListsSection } from '../components/sections/list-section'
import { PlaygroundPreviewSection } from '../components/sections/playground-preview-section'
import { ProjectShowcase } from '../components/sections/project-showcase'

export default function FigmaHomePage() {
  return (
    <PageShell>
      <HeroSection />
      <ProjectShowcase />
      <AboutSection />
      <PlaygroundPreviewSection />
      {/* <SectionSpacer /> */}
      <ListsSection />
    </PageShell>
  )
}
