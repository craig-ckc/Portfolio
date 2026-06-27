import { workItems } from '../../content/home'
import { Container } from '../layout/container'
import { Section } from '../layout/section'
import { ProjectRow } from '../ui/project-row'

export function ProjectShowcase() {
  return (
    <Section className="bg-surface text-content" aria-label="Featured projects">
      <Container className="flex flex-col py-20">
        {workItems.map((project, index) => (
          <ProjectRow key={`${project.client}-${index}`} project={project} />
        ))}
      </Container>
    </Section>
  )
}
