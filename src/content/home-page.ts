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
 * note off a project and a palette side by side with the richer objects — a
 * dock of the tools in daily use, a stack of polaroids, a record, a lanyard —
 * which is what a real working folder holds. Each kind carries only the fields
 * its face reads, so a card can be added or taken away by editing the list
 * below and nothing else.
 */
type FolderItemBase = {
  id: string
  /** Read out by the overlay caption and by assistive tech. Keep it short. */
  label: string
  /** A second line in the overlay caption. What the thing actually is. */
  note?: string
  /** Mixed stock reads as a real folder. Defaults to portrait. `bar` is the
      one wide, shallow shape, cut for the dock. */
  ratio?: 'portrait' | 'landscape' | 'square' | 'bar'
}

export type PhotoItem = FolderItemBase & { kind: 'photo'; src: string; alt?: string }
/** A monogram, plus the name underneath it. */
export type LogoItem = FolderItemBase & { kind: 'logo'; mark: string }
/** The line of text on the card. */
export type NoteItem = FolderItemBase & { kind: 'note'; body: string }
/** Chips down the card, in order. */
export type SwatchItem = FolderItemBase & { kind: 'swatch'; colors: string[] }

/** One application in the dock. `icon` is a macOS-style tile under public/img/dock. */
export type DockApp = {
  id: string
  name: string
  /** The line under the name in the tooltip: what it is for, in a few words. */
  note: string
  icon: string
}
export type DockItem = FolderItemBase & { kind: 'dock'; apps: DockApp[] }

export type Polaroid = { src: string; alt: string; caption?: string }
export type PolaroidsItem = FolderItemBase & { kind: 'polaroids'; photos: Polaroid[] }

/** One record in the stack. `art` is a square cover under public/img/music. */
export type Track = {
  title: string
  artist: string
  album: string
  art: string
  durationMs: number
}
export type DiscItem = FolderItemBase & { kind: 'disc'; tracks: Track[] }

export type Badge = {
  name: string
  role: string
  org?: string
  /** Printed small on the strap and the card. */
  since?: string
}
export type LanyardItem = FolderItemBase & { kind: 'lanyard'; badge: Badge }

export type FolderItem =
  | PhotoItem
  | LogoItem
  | NoteItem
  | SwatchItem
  | DockItem
  | PolaroidsItem
  | DiscItem
  | LanyardItem

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
   home-page.css. The slots are also shaped: 1 and 5 are portrait, 2 and 4
   square, 3 the one wide slot (the dock bar), 6 the big square that lands on
   the folder. The
   record wants slot 4 in particular: it is the low one, so the popover that
   rises off its top edge has the screen to rise into, and the platter that
   slides out of its right side has nothing in the way.

   What is in it: the things around the work rather than the work itself. The
   tools open on the desk, the camera that comes out at weekends, whatever is
   playing, the badge, and a note and a palette off a project.

   TODO(craig): the polaroids are placeholders. Swap in your own frames. */
export const folderItems: FolderItem[] = [
  {
    id: 'polaroids',
    kind: 'polaroids',
    label: 'Weekends, on film',
    note: 'Weekend photographer',
    ratio: 'portrait',
    photos: [
      {
        src: unsplash('1564284369929-026ba231f89b', 'square'),
        alt: 'A narrow lantern-lit alley at night',
        caption: 'Kagurazaka',
      },
      {
        src: unsplash('1528360983277-13d401cdc186', 'square'),
        alt: 'A neon-lit street after dark',
        caption: 'Shinjuku',
      },
      {
        src: unsplash('1493246507139-91e8fad9978e', 'square'),
        alt: 'Hills under low cloud',
        caption: 'Somewhere north',
      },
    ],
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
    id: 'dock',
    kind: 'dock',
    label: 'The desk',
    note: 'Open most days',
    ratio: 'bar',
    /* Left to right, the way they sit in the real dock. Add one here and the
       dock makes room for it. */
    apps: [
      { id: 'figma', name: 'Figma', note: 'Where the interface is worked out', icon: '/img/dock/figma.svg' },
      { id: 'vscode', name: 'VS Code', note: 'Where it gets built', icon: '/img/dock/vscode.webp' },
      { id: 'codex', name: 'Codex', note: 'A second pair of hands on the code', icon: '/img/dock/codex.webp' },
      { id: 'claude-code', name: 'Claude Code', note: 'The other pair', icon: '/img/dock/claude.webp' },
      { id: 'paper', name: 'Paper', note: 'Design, kept in step with the code', icon: '/img/dock/paper.webp' },
    ],
  },
  {
    id: 'disc',
    kind: 'disc',
    label: 'On repeat',
    note: 'On while the work gets done',
    ratio: 'square',
    /* Covers and running times are from the iTunes Search API. The cover files
       are served from public/img/music at 600px. */
    tracks: [
      {
        title: 'Happy Tears',
        artist: 'Quail P',
        album: 'Happy Tears',
        art: '/img/music/happy-tears.jpg',
        durationMs: 220893,
      },
      {
        title: 'The Hard Way',
        artist: 'Cameron Whitcomb',
        album: 'The Hard Way',
        art: '/img/music/the-hard-way.jpg',
        durationMs: 162962,
      },
      {
        title: 'WHO I WAS',
        artist: 'NF & mgk',
        album: 'FEAR',
        art: '/img/music/who-i-was.jpg',
        durationMs: 180953,
      },
    ],
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
    id: 'lanyard',
    kind: 'lanyard',
    label: 'Craig Chihururu',
    note: 'Independent since 2019',
    ratio: 'portrait',
    badge: {
      name: 'Craig Chihururu',
      role: 'Product designer + developer',
      org: 'Independent',
      since: '2019',
    },
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
  { label: 'X', href: 'https://x.com/chihururu_craig', icon: 'x', verified: false },
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
