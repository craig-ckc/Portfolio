import { Button } from '@base-ui/react/button'

const thumbnail = '/figma/thumb-placeholder.png'

type TagProps = {
  children: string
  tone?: 'primary' | 'dark' | 'light'
  asButton?: boolean
}

type Project = {
  client: string
  industry: string
  description: string
}

const projects: Project[] = Array.from({ length: 5 }, () => ({
  client: 'Client Name',
  industry: 'Industry',
  description:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien fringilla, mattis ligula consectetur, ultrices mauris. Maecenas vitae mattis tellus.',
}))

const workItems = [
  'Project Title Here',
  'Project Title Here',
  'Project Title Here',
  'Project Title Here',
  'Project Title Here',
]

const services = [
  'Product Design',
  'Design System',
  'User research',
  'Web design',
  'Brand Design',
  'QA Process',
]

function Tag({ children, tone = 'light', asButton = false }: TagProps) {
  const className = `figma-tag figma-tag--${tone}`

  if (asButton) {
    return (
      <Button className={className} type="button">
        {children}
      </Button>
    )
  }

  return <span className={className}>{children}</span>
}

function BrandMark() {
  return (
    <a className="figma-brand" href="#top" aria-label="Craig Chihururu home">
      <img className="figma-brand__mark" src="/figma/logo-mark.svg" alt="" />
      <img className="figma-brand__type" src="/figma/logo-type.svg" alt="Craig." />
    </a>
  )
}

function Navbar() {
  return (
    <header className="figma-navbar">
      <BrandMark />
      <a className="figma-contact-link" href="mailto:hello@craigchihururu.com">
        Contact
      </a>
    </header>
  )
}

function PlaceholderImage({ className = '' }: { className?: string }) {
  return <img className={`figma-placeholder ${className}`} src={thumbnail} alt="" />
}

function HeroTitle() {
  return (
    <h1 className="figma-hero__title" id="hero-title">
      <span>I help </span>
      <strong>brands</strong>
      <span> build </span>
      <strong>apps</strong>
      <br />
      <span>that scale and </span>
      <strong>websites</strong>
      <br />
      <span>that convert</span>
    </h1>
  )
}

function HeroSection() {
  return (
    <section className="figma-hero" aria-labelledby="hero-title">
      <div className="figma-hero__inner">
        <HeroTitle />
        <div className="figma-hero__bottom">
          <div className="figma-tags">
            <Tag tone="primary" asButton>
              Book a call
            </Tag>
            <Tag tone="dark">hello@craigchihururu.com</Tag>
          </div>
          <PlaceholderImage className="figma-hero__image" />
        </div>
      </div>
    </section>
  )
}

function ClientMeta({ client, industry }: Pick<Project, 'client' | 'industry'>) {
  return (
    <div className="figma-client">
      <PlaceholderImage className="figma-client__thumb" />
      <div>
        <p className="figma-client__name">{client}</p>
        <p className="figma-client__industry">{industry}</p>
      </div>
    </div>
  )
}

function ProjectRow({ project }: { project: Project }) {
  return (
    <article className="figma-project">
      <div className="figma-project__meta">
        <ClientMeta client={project.client} industry={project.industry} />
        <p className="figma-project__description">{project.description}</p>
      </div>
      <div className="figma-project__gallery">
        <PlaceholderImage />
        <PlaceholderImage />
        <PlaceholderImage />
      </div>
    </article>
  )
}

function ProjectShowcase() {
  return (
    <section className="figma-projects" aria-label="Featured projects">
      {projects.map((project, index) => (
        <ProjectRow key={`${project.client}-${index}`} project={project} />
      ))}
    </section>
  )
}

function ListItem({ label }: { label: string }) {
  return (
    <li className="figma-list-item">
      <PlaceholderImage className="figma-list-item__icon" />
      <span>{label}</span>
    </li>
  )
}

function ListColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="figma-list-column" aria-labelledby={`${title.toLowerCase()}-title`}>
      <h2 id={`${title.toLowerCase()}-title`}>{title}</h2>
      <ul>
        {items.map((item, index) => (
          <ListItem key={`${item}-${index}`} label={item} />
        ))}
      </ul>
    </section>
  )
}

function ListsSection() {
  return (
    <section className="figma-lists" aria-label="Work and services">
      <ListColumn title="Work" items={workItems} />
      <ListColumn title="Services" items={services} />
    </section>
  )
}

function FooterCta() {
  return (
    <footer className="figma-footer">
      <img className="figma-footer__wordmark" src="/figma/footer-wordmark.svg" alt="Craig" />
      <div className="figma-footer__content">
        <p>Let&apos;s talk about your project and the next steps</p>
        <div className="figma-tags">
          <Tag tone="dark" asButton>
            Book a call
          </Tag>
          <Tag>hello@craigchihururu.com</Tag>
        </div>
        <nav className="figma-footer__socials" aria-label="Social links">
          <a href="https://www.linkedin.com/in/craig-chihururu">LinkedIn</a>
          <a href="https://x.com">Twitter / X</a>
          <a href="https://x.com">Twitter / X</a>
        </nav>
      </div>
    </footer>
  )
}

export default function FigmaHomePage() {
  return (
    <div className="figma-page" id="top">
      <Navbar />
      <main>
        <HeroSection />
        <ProjectShowcase />
        <div className="figma-spacer" aria-hidden="true" />
        <ListsSection />
      </main>
      <FooterCta />
    </div>
  )
}
