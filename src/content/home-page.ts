/* Copy for the homepage. Text is taken from the Paper page frame; where the
   frame repeated one placeholder row four times, the extra rows are filled with
   this portfolio's real client names so the section reads as a real list. */

export type WorkTile = {
  /** Optional. Tiles fall back to a flat --neutral-600 fill, as in the frame. */
  src?: string
  alt?: string
}

export type WorkEntry = {
  slug: string
  title: string
  description: string
  href: string
  tiles: [WorkTile, WorkTile]
}

export type FolderCard = {
  id: string
  /** Optional. Without a src the card renders its CSS stand-in artwork. */
  src?: string
  alt?: string
}

/* Placeholder photography for the hero folder, matching the night-street mood of
   the design's object. Served from the Unsplash CDN, which is built for this —
   swap in self-hosted files under public/img before launch. */
const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=440&h=620&fit=crop&q=80&auto=format`

/* Single source for the contact address, so the four call sites cannot drift.
 *
 * NOTE(craig): you dictated "craigchihururuu@gmail.com" with a doubled u. This
 * uses the single-u spelling, which matches your surname and the address listed
 * on craigchihururu.netlify.app. Say the word if the doubled one is right. */
export const email = 'craigchihururu@gmail.com'

const mailto = (subject: string) => `mailto:${email}?subject=${encodeURIComponent(subject)}`

export const hero = {
  title: 'I help brands build websites that convert and apps people enjoy.',
  standfirst:
    'Independent designer and front-end developer. Brand, interface, and the code that ships it — usually all three.',
  cta: { label: 'Start a project', href: mailto('New project') },
  objectCaption: 'Work, and everything around it',
} as const

export const folderCards: FolderCard[] = [
  { id: 'alley', src: unsplash('1564284369929-026ba231f89b'), alt: 'A narrow lantern-lit alley at night' },
  { id: 'lanterns', src: unsplash('1573455494060-c5595004fb6c'), alt: 'Red paper lanterns on a dark wall' },
  { id: 'neon', src: unsplash('1528360983277-13d401cdc186'), alt: 'A neon-lit street after dark' },
  { id: 'festival', src: unsplash('1617870314635-fc819547ec11'), alt: 'Festival lanterns strung overhead' },
]

export const work: WorkEntry[] = [
  {
    slug: 'designing-minds',
    title: 'Designing Minds',
    description:
      'A brand platform and website for an education consultancy. The identity turns curiosity into a system of marks, and the site ships as static pages that load fast on slow connections.',
    href: '/work/designing-minds',
    tiles: [{}, {}],
  },
  {
    slug: 'preflight',
    title: 'Preflight',
    description:
      'A review workflow for creative teams. I designed the sign-off model and built the front end, so the handover between design and development never left the product.',
    href: '/work/preflight',
    tiles: [{}, {}],
  },
  {
    slug: 'richard-james',
    title: 'Richard James',
    description:
      'A portfolio for a photographer who shoots on film. Type is kept quiet, the grid gives every frame room, and image loading is tuned so a gallery of large scans still feels immediate.',
    href: '/work/richard-james',
    tiles: [{}, {}],
  },
]

export const cta = {
  title: "Design and code\nshouldn't be two separate jobs",
  invitationLead: 'If that sounds interesting to you,',
  /* Brackets are part of the label in the frame, not decoration added in CSS. */
  invitationLink: { label: "[ let's start your project ]", href: mailto('New project') },
} as const

export const siteNav = [
  { label: 'Writing', href: '/writing' },
  { label: 'Experiments', href: '/experiments' },
] as const

/* The frame draws X and LinkedIn here, so that is what this renders.
   LinkedIn is verified from craigchihururu.netlify.app.

   TODO(craig): the X URL below is a GUESS and has not been verified — your own
   site lists Instagram, Dribbble, LinkedIn and Behance, but no X/Twitter. Give
   me the real handle, or say the word and I'll put Dribbble
   (dribbble.com/craigkc, verified) in this slot instead. Verified alternatives:
   instagram.com/ckc.designes, behance.net/craigchihururu */
export const socials = [
  { label: 'X', href: 'https://x.com/craigchihururu', icon: 'x', verified: false },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/craig-chihururu/', icon: 'linkedin', verified: true },
] as const

/* Replaces the newsletter field the frame dropped. Sits collapsed at the width
   of the hand icon alone, and widens to reveal the label on hover or focus. */
export const contact = {
  label: 'Say hello',
  href: mailto('Hello'),
} as const

/* Sits between the hero and the work list.
 *
 * Written to do three things: lead with the design-plus-code background rather
 * than restating the job title from the hero, name design engineering as the
 * direction of travel, and place the AI work as a means to that rather than as
 * a badge. No dashes anywhere, per Craig.
 *
 * Grounded in his own sources: the practice framing on
 * craigchihururu.netlify.app, and product/mobile/web work on dribbble.com/craigkc
 * (Qwirkers, Recast). Deliberately NOT claiming the computer science degree that
 * data-broker sites list, since nothing he publishes himself corroborates it.
 */
export const statement = {
  body:
    "I've spent my career in brand and product design, and I learned to build what I draw. Doing both changed how I design. Now I'm moving further into design engineering, using AI to take an idea from a file to something running without it changing hands.",
} as const

export const footer = {
  copyright: '© Craig Chihururu 2019-2026',
} as const
