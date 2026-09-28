/**
 * The work: one record per project, read both by the homepage row in
 * src/components/home/work.tsx and by the project's own page at
 * /work/<slug> (src/pages/work/[slug].astro).
 *
 * One record and not two. The row and the page make the same claims about the
 * same job, and splitting them across two files is how a portfolio ends up
 * describing a project one way on the way in and another way once you arrive —
 * the same reason the JSON-LD in src/lib/structured-data.ts derives every
 * value instead of restating it.
 *
 * Every field below `tiles` belongs to the project page alone. Most are
 * optional: a project that has only its homepage line still renders a page,
 * just a shorter one, so a new entry can go in the moment the work exists and
 * be filled out afterwards.
 *
 * NOTE(craig): the page copy here is DRAFTED, not verified. The three
 * one-line descriptions were cut down from ones already in the project;
 * everything under them — summaries and section copy — is written out from
 * those sentences to give the template real prose to hold, and to read the way
 * the rest of the site reads. None of it has been checked against the actual
 * engagements. Read this file through before the pages go live.
 */

/** A tile in the homepage row. Falls back to a flat --neutral-600 fill. */
export type WorkTile = {
  src?: string
  alt?: string
}

/** An image on the project page. Same fallback as a tile when `src` is absent. */
export type WorkMedia = {
  src?: string
  alt?: string
  /** Printed under the frame, small. Leave it off and nothing is printed. */
  caption?: string
}

/**
 * One beat of the project page.
 *
 * The heading sits alongside the prose rather than above it, so a reader
 * skimming the left column gets the shape of the project without reading a
 * word of the right one. `body` is one paragraph per string.
 */
export type WorkSection = {
  heading: string
  body: string[]
  /** One image runs wide; two sit side by side. */
  media?: WorkMedia[]
}

/** Someone else's words about the work, and whose they are. */
export type WorkQuote = {
  body: string
  name: string
  role: string
}

export type WorkEntry = {
  slug: string
  title: string
  /**
   * The homepage row's line, and the page's meta description. One short
   * sentence — what the thing is, not how it was made; the page says how.
   */
  description: string
  tiles: [WorkTile, WorkTile]

  /* ---- The project's own page ---- */

  /** The lead under the title. Longer than `description`, and not a repeat of it. */
  summary?: string
  /** The wide image under the masthead. */
  cover?: WorkMedia
  sections?: WorkSection[]
  quote?: WorkQuote
  /** The work itself, where it is still up. Opens in its own tab. */
  live?: { label: string; href: string }
}

/**
 * Where a project lives.
 *
 * The one place a slug becomes a URL: the homepage row links through this, the
 * sitemap builds its entries from it, and src/pages/work/[slug].astro is the
 * route it resolves to. A project cannot be linked one way and indexed another.
 */
export function workPath(slug: string): string {
  return `/work/${slug}`
}

export const work: WorkEntry[] = [
  {
    slug: 'designing-minds',
    title: 'Designing Minds',
    description: 'A brand and website for an education consultancy.',
    tiles: [{}, {}],
    summary:
      'An education consultancy with good work and no way to show it. The brief was a name and a set of services; what it needed first was a way of looking at itself, and then somewhere to put it that would open anywhere.',
    cover: {},
    sections: [
      {
        heading: 'Where it started',
        body: [
          'The consultancy had been running on a logo made in a hurry and a slide deck that got rewritten for every meeting. Nothing was wrong with any single piece of it. The problem was that no two pieces agreed, so every new thing had to be argued from scratch.',
          'We started with the one idea everybody in the room already believed: that the work is about curiosity rather than instruction. That gave the identity something to be about, and gave me a test to hold every later decision against.',
        ],
        media: [{}, {}],
      },
      {
        heading: 'A system of marks',
        body: [
          'The identity is built from a small set of marks that combine rather than one logo that gets placed. Each one stands for a way of asking a question, and they sit together differently depending on what the piece is for, so a worksheet and a conference banner come out of the same kit without either looking borrowed from the other.',
          'Type is kept deliberately plain underneath it. The marks are the voice; anything else competing at that level would have made the system louder every time it was used, which is the opposite of what a consultancy wants after the third year of using it.',
        ],
        media: [{}],
      },
      {
        heading: 'Built to open anywhere',
        body: [
          'A good share of the audience reads on a phone, on a connection that is doing them no favours. So the site ships as static pages with the type and the marks inlined, no framework hydrating on arrival, and images sized for the slot they land in rather than scaled down by the browser after the fact.',
          'The result is a site that is legible before it is finished loading, and finished loading before most sites have decided what to render.',
        ],
        media: [{}, {}],
      },
    ],
    /* NOTE(craig): no `quote` here on purpose. A testimonial has to be
       something somebody actually said, and putting an invented one under a
       real client's name is the one thing on this page that could not be
       quietly corrected later. Send me a real line and I'll set it. */
  },
  {
    slug: 'preflight',
    title: 'Preflight',
    description: 'A sign-off tool for creative teams.',
    tiles: [{}, {}],
    summary:
      'Creative teams were approving work in three places at once and losing track of which approval counted. Preflight is one place where a piece of work is looked at, marked up and signed off, and where the sign-off is the thing that moves it on.',
    cover: {},
    sections: [
      {
        heading: 'The thing that was actually broken',
        body: [
          'Everyone described the problem as feedback being messy. Watching a few rounds of it, the mess was a symptom. The real trouble was that approval had no single home: a comment in one tool, a thumbs up in another and a reply to an email all felt like sign-off to whoever gave them, and none of them were.',
          'So the model came first, before any screen. One piece of work, one open round, one decision that ends it. Everything the interface does afterwards is in service of keeping that sentence true.',
        ],
        media: [{}, {}],
      },
      {
        heading: 'Designing the sign-off',
        body: [
          'A decision that ends a round has to feel heavier than a comment, and it has to be obvious who is allowed to make it. The reviewer list is visible from the first frame, the round shows what it is waiting on, and approving is a deliberate act with a confirmation rather than a button you brush past on the way to the next thing.',
          'The states got the same attention. A round can be open, waiting, changes requested or closed, and each one had to read at a glance from across an open-plan office, because that is genuinely how these boards get checked.',
        ],
        media: [{}],
      },
      {
        heading: 'Designed and built by the same hands',
        body: [
          'I built the front end as well as designing it, which is the part I would keep if I could keep one thing. There was no handover document, no set of redlines, and no negotiation about which parts of the interaction survived the build. Where something did not work once it was real, it got changed in the design and in the code in the same afternoon.',
          'What that bought the product is small things that usually get dropped: the markup layer stays put under a zoom, the keyboard path through a review round works end to end, and a round with two hundred comments scrolls at the same rate as an empty one.',
        ],
        media: [{}, {}],
      },
    ],
  },
  {
    slug: 'richard-james',
    title: 'Richard James',
    description: 'A fast portfolio for a film photographer.',
    tiles: [{}, {}],
    summary:
      'Film scans are big, slow files and the whole point of them is the detail. The site had to show them at a size worth looking at, on a page that does not ask to be noticed, and still arrive quickly enough that nobody leaves before the first frame lands.',
    cover: {},
    sections: [
      {
        heading: 'Get out of the way',
        body: [
          'The brief for the design was mostly a list of things not to do. No captions competing with the frames, no hover effects on the images, no typography with an opinion of its own. What is left is a small type scale, a lot of white, and generous space around every photograph so two frames are never asking for the same attention.',
          'The grid varies the size of a frame but never the space around it, which is what lets a landscape and a portrait sit in the same row without the row looking rearranged.',
        ],
        media: [{}, {}],
      },
      {
        heading: 'Making large scans feel immediate',
        body: [
          'Every frame is served at the size the slot actually renders it, in a modern format, with the dimensions declared so the page never reflows once a scan lands. Below the fold, images load as the gallery approaches them rather than all at once on arrival.',
          'The first frame gets special treatment: it is preloaded, and a tiny blurred version of it is inlined into the page so there is something of the photograph on screen from the first paint instead of an empty box. On a slow connection that is the difference between a site that is loading and a site that is broken.',
        ],
        media: [{}],
      },
    ],
  },
]
