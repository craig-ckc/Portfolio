import { services, workList } from '../../content/home'
import { Container } from '../layout/container'
import { Section } from '../layout/section'
import { ListColumn } from '../ui/list-column'

export function ListsSection() {
  return (
    <Section className="bg-surface text-content" aria-label="Work and services">
      <Container className="grid grid-cols-2 gap-0 pb-40 desktop:grid-cols-2 tablet:grid-cols-1 tablet:gap-16">
        <ListColumn title="Work" items={workList} />
        <ListColumn title="Services" items={services} />
      </Container>
    </Section>
  )
}
