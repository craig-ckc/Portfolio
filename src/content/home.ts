import servicesContent from './services.json'
import socialLinksContent from './social-links.json'
import workItemsContent from './work-items.json'
import workListContent from './work-list.json'

export type ProjectImage = {
  src: string
  alt: string
}

export type WorkItem = {
  client: string
  industry: string
  description: string
  images: ProjectImage[]
}

export type SocialLink = {
  label: string
  href: string
}

export const workItems = workItemsContent satisfies WorkItem[]
export const workList = workListContent satisfies string[]
export const services = servicesContent satisfies string[]
export const socialLinks = socialLinksContent satisfies SocialLink[]
