import { workItems } from '../../content/home'
import { Container } from '../layout/container'
import { ProjectRow } from '../ui/project-row'

export function ProjectShowcase() {
  return (
    <Container as="section" className="flex flex-col py-20" aria-label="Featured projects">
      {workItems.map((project, index) => (
        <ProjectRow key={`${project.client}-${index}`} project={project} />
      ))}
    </Container>
  )
}
