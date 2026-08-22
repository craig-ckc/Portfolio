import socialLinksContent from './social-links.json'

export type SocialLink = {
  label: string
  href: string
}

/* Only consumer left is the playground's footer CTA. The work/services/list
   exports here belonged to the retired homepage and went with it. */
export const socialLinks = socialLinksContent satisfies SocialLink[]
