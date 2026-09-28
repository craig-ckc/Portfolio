/* Copy for the homepage. Text is taken from the Paper page frame.

   The work list is not here. A project says the same thing in the homepage row
   and on its own page at /work/<slug>, so one record covers both and it lives
   in src/content/work.ts alongside the rest of what that page renders. */

import { inquiryMailto } from '../lib/booking-inquiry'

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

/**
 * A phone, as a cutout on a transparent card. `src` is the plain back; `lit`
 * is the same render with its lights on, framed identically so the face can
 * cross-fade between the two.
 */
export type PhoneItem = FolderItemBase & { kind: 'phone'; src: string; lit: string; alt: string }

export type FolderItem =
  | PhotoItem
  | LogoItem
  | NoteItem
  | SwatchItem
  | DockItem
  | PolaroidsItem
  | DiscItem
  | LanyardItem
  | PhoneItem

/* Placeholder photography for the hero folder, matching the night-street mood of
   the design's object. Served from the Unsplash CDN, which is built for this —
   swap in self-hosted files under public/img before launch.

   Cropped to the ratio the card is drawn at, so a landscape card is not a
   portrait file letterboxed by object-fit. */
const unsplash = (id: string, ratio: 'portrait' | 'landscape' | 'square' = 'portrait') => {
  const box = ratio === 'landscape' ? 'w=600&h=450' : ratio === 'square' ? 'w=520&h=520' : 'w=450&h=600'
  return `https://images.unsplash.com/photo-${id}?${box}&fit=crop&q=80&auto=format`
}

/* Single source for the contact address, so no call site can drift from it.
 *
 * NOTE(craig): you dictated "craigchihururuu@gmail.com" with a doubled u. This
 * uses the single-u spelling, which matches your surname and the address listed
 * on craigchihururu.netlify.app. Say the word if the doubled one is right. */
export const email = 'craigchihururu@gmail.com'

const mailto = (subject: string) => `mailto:${email}?subject=${encodeURIComponent(subject)}`

/* Where a project starts: the two project-shaped CTAs — the hero button and
   the closing invitation — open the booking dialog in
   src/components/booking/booking-dialog.tsx, which is this site's own and
   holds Cal's calendar inside it. The "say hello" link in the siteline keeps
   its plain mailto, which is the right shape for a question that isn't a
   project yet.
 *
 * `href` is the booking page Cal would show anyway, so the CTAs stay real
 * links for a visitor whose JavaScript never arrives. The dialog cancels that
 * navigation once it is live, and leaves a modified click alone, so
 * cmd-clicking still opens Cal in its own tab. */
export const booking = {
  link: 'craig-chihururu/30min',
  namespace: '30min',
  origin: 'https://app.cal.com',
  href: 'https://cal.com/craig-chihururu/30min',
  /** Both read off the event type above ("30 min meeting", on Google Meet), so
      no line of copy can claim a length or a place Cal will not actually book.
      Change the event in Cal and these two change with it. */
  minutes: 30,
  place: 'Google Meet',
} as const

/* Spread onto whichever element should open the dialog. One attribute, found
   by a single listener on the document rather than wired up per element: the
   triggers are spread across a hydrated hero, a static closing section and
   every page's copy of it, none of which share a React tree with the dialog. */
export const bookingTrigger = { 'data-booking': '' } as const

/* The draft behind every "email me instead". Same three things a short inquiry
   form would ask for, written into the body as prompts — see
   src/lib/booking-inquiry.ts for why it is prompts and not an empty message. */
const projectInquiry = inquiryMailto(email, {
  subject: 'Starting a project',
  greeting: 'Hi Craig,',
  prompts: ['My name', 'What I’m building', 'When I’d want it live'],
})

export const hero = {
  /* The plain-text twin of the <h1> in src/components/home/hero.tsx, which
     renders the same sentence with three words wrapped in <span> for emphasis
     and so cannot read this string directly. Nothing rendered reads it; the
     JSON-LD service summary does. Reword the heading and reword this with it. */
  title: 'I help brands build websites worth visiting and apps worth using.',
  standfirst:
    'Independent designer and front-end developer. Usually taking what’s already there, turning it into an interface, then staying with it until it ships.',
  cta: { label: 'Start your project', href: booking.href },
  /* Under the button, and the answer to what the button leads to — how long,
     what gets talked about, that there is nothing to bring — said before it is
     clicked rather than on somebody else's site afterwards. It ends on the
     second way in, for anybody who would rather not put a time in a diary at
     all. */
  ctaNote: {
    lead: `${booking.minutes} minutes to talk through the idea, the budget and the timing. Nothing to prepare. If you’d rather write first,`,
    link: { label: 'email me instead', href: projectInquiry },
  },
  objectCaption: 'Work, and everything around it',
} as const

/* The booking dialog.
 *
 * Written to answer the thing a bare calendar leaves hanging: what am I
 * agreeing to. It says the length, what gets covered and that there is nothing
 * to prepare, and it says plainly that booking one commits nobody to anything
 * — because the visitor most likely to back out of a scheduler is the one who
 * is curious rather than ready, and a calendar on its own reads as a decision
 * they have not made yet. */
export const bookingDialog = {
  /* Where it happens as well as how long it takes, because Cal's own line
     saying so is the one `hideEventTypeDetails` turns off. */
  eyebrow: `${booking.minutes} minutes, on ${booking.place}`,
  title: 'Start with a conversation',
  lead: 'Nothing has to come of it. Bring a brief, a rough idea, or just the question of whether we’d work well together. We talk it through, and you decide from there.',
  coversLead: 'Usually we cover',
  covers: [
    'What you’re building, and what it actually has to do',
    'Roughly what it costs, and what that gets you',
    'When you want it live, and whether that’s realistic',
  ],
  prep: 'Nothing to prepare. Pick a time that suits and the invite arrives straight away.',
  /* Beside the calendar rather than after it, so it is a choice being offered
     and not a consolation for having failed at the first one. */
  fallbackLead: 'Rather write first?',
  fallbackLink: { label: 'Email me', href: projectInquiry },
  fallbackTrail: 'and I’ll come back to you, usually within a day.',
  /* Shown in the calendar's place when Cal's script never arrives, which is
     most often an extension blocking third parties. It carries both ways round
     itself rather than pointing back at the fallback beside it, because on a
     phone that fallback has scrolled off the top by the time this appears. */
  loading: 'Bringing up the calendar.',
  unavailable: 'The calendar isn’t loading, which is usually something in the browser blocking it.',
  unavailableLinks: [
    { label: 'Email me instead', href: projectInquiry, external: false },
    { label: 'Open the booking page', href: booking.href, external: true },
  ],
  close: 'Close',
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
   tools open on the desk, the camera that comes out at weekends and the phone
   it is, whatever is playing, the badge, and a note off a project.

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
    id: 'phone',
    kind: 'phone',
    label: 'Phone (3a) Pro',
    note: 'What the weekend photos are shot on',
    ratio: 'portrait',
    /* Nothing's own renders, cropped to the phone and encoded as WebP with
       alpha. The two are framed identically; only the Glyph lights differ. */
    src: '/img/phone/phone-3a-pro-black.webp',
    lit: '/img/phone/phone-3a-pro-black-lit.webp',
    alt: 'The back of a black Nothing Phone (3a) Pro',
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

export const cta = {
  title: "Design and code\nshouldn't be two separate jobs",
  invitationLead: 'If that sounds interesting to you,',
  /* Brackets are part of the label in the frame, not decoration added in CSS. */
  invitationLink: { label: "[ let's start your project ]", href: booking.href },
  /* The same second way in as the hero's, in the same bracketed shape as the
     invitation above it. This section closes every page on the site, so it is
     the last thing anybody sees — and the last chance to catch somebody who is
     interested but not ready to open a calendar. */
  fallbackLead: 'Or, if you’d rather not book a call yet,',
  fallbackLink: { label: '[ send me an email ]', href: projectInquiry },
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
  copyright: '© Craig Chihururu',
} as const
