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

/**
 * One thing tucked in the hero folder.
 *
 * `kind` decides how the face is drawn, so the folder can hold a photograph, a
 * client mark, a note off a project and a palette side by side — which is what
 * a real working folder holds. Fields not used by a kind are simply left off.
 */
export type FolderItem = {
  id: string
  kind: 'photo' | 'logo' | 'note' | 'swatch'
  /** Read out by the overlay caption and by assistive tech. Keep it short. */
  label: string
  /** A second line in the overlay caption. What the thing actually is. */
  note?: string
  /** photo */
  src?: string
  alt?: string
  /** logo — a monogram, plus the name underneath it. */
  mark?: string
  /** note — the line of text on the card. */
  body?: string
  /** swatch — chips down the card, in order. */
  colors?: string[]
  /** Mixed stock reads as a real folder. Defaults to portrait. */
  ratio?: 'portrait' | 'landscape' | 'square'
}

/* Placeholder photography for the hero folder, matching the night-street mood of
   the design's object. Served from the Unsplash CDN, which is built for this —
   swap in self-hosted files under public/img before launch.

   Cropped to the ratio the card is drawn at, so a landscape card is not a
   portrait file letterboxed by object-fit. */
const unsplash = (id: string, ratio: 'portrait' | 'landscape' | 'square' = 'portrait') => {
  const box = ratio === 'landscape' ? 'w=600&h=450' : ratio === 'square' ? 'w=520&h=520' : 'w=450&h=600'
  return `https://images.unsplash.com/photo-${id}?${box}&fit=crop&q=80&auto=format`
}

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
    'Independent designer and front-end developer. Usually taking what’s already there, turning it into an interface, then staying with it until it ships.',
  cta: { label: 'Start a project', href: mailto('New project') },
  objectCaption: 'Work, and everything around it',
} as const

/* The order here is the order they sit in the folder, left to right, and the
   order they take their places on screen when it opens. Six is what the fan and
   the scatter are tuned for; add a seventh and both need a new slot in
   home-page.css.

   Deliberately mixed: two photographs, two client marks, a note and a palette.
   TODO(craig): the photographs and the note are placeholders. Swap in real
   process shots and a real client line before launch. */
export const folderItems: FolderItem[] = [
  {
    id: 'alley',
    kind: 'photo',
    label: 'Kagurazaka, 02:10',
    note: 'Reference shot',
    ratio: 'portrait',
    src: unsplash('1564284369929-026ba231f89b'),
    alt: 'A narrow lantern-lit alley at night',
  },
  {
    id: 'designing-minds',
    kind: 'logo',
    label: 'Designing Minds',
    note: 'Identity, 2025',
    ratio: 'square',
    mark: 'DM',
  },
  {
    id: 'neon',
    kind: 'photo',
    label: 'Shinjuku, after rain',
    note: 'Reference shot',
    ratio: 'landscape',
    src: unsplash('1528360983277-13d401cdc186', 'landscape'),
    alt: 'A neon-lit street after dark',
  },
  {
    id: 'note',
    kind: 'note',
    label: 'From the Preflight kickoff',
    note: 'Project note',
    ratio: 'square',
    body: 'Design it and build it in the same week, or it is two projects.',
  },
  {
    id: 'palette',
    kind: 'swatch',
    label: 'Neutral ramp',
    note: 'Design tokens',
    ratio: 'portrait',
    colors: ['#090a0a', '#434242', '#b8b8b8', '#f1f1f1'],
  },
  {
    id: 'preflight',
    kind: 'logo',
    label: 'Preflight',
    note: 'Product, 2024',
    ratio: 'square',
    mark: 'PF',
  },
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
    "I tend to stay with an idea longer than my job title requires. I’ll work out the interface and keep going until it’s running in the browser, then spend probably too long making the details feel right. That overlap between design and engineering is where I do my best work, and AI is one of the things I’m testing there, seeing how much more of the original intent I can keep intact from design through implementation.",
} as const

export const footer = {
  copyright: '© Craig Chihururu 2019-2026',
} as const
