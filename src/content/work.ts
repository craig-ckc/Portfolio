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
 * The copy is grounded in each project's source repository and current
 * product model. Keep outcomes factual: do not add performance figures,
 * testimonials or client claims unless the project provides them.
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
  /** Gallery placement. Full-width by default; consecutive halves form a pair. */
  layout?: 'full' | 'half'
  /** Printed under the frame, small. Leave it off and nothing is printed. */
  caption?: string
}

/**
 * One beat of the project page.
 *
 * A short heading and paragraph introduce a gallery. Keep copy concise so
 * the images carry the story. `body` is one paragraph per string.
 */
export type WorkSection = {
  heading: string
  body: string[]
  /** Each image sets its own placement, keeping the sequence specific to the project. */
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
    slug: 'preflight',
    title: 'Preflight',
    description: 'A marketing product that turns evidence into clear, verifiable actions.',
    tiles: [{}, {}],
    summary:
      'I’m shaping Preflight’s product, interface and implementation around a simple loop: scan, prioritise, act and track.',
    cover: {},
    sections: [
      {
        heading: 'Turn signals into decisions',
        body: [
          'Findings become prioritised actions with the evidence and reasoning attached. Teams can see what needs attention and why it matters.',
        ],
        media: [{ layout: 'full' }, { layout: 'full' }],
      },
      {
        heading: 'Keep the proof close',
        body: [
          'Each action connects the decision, implementation and live checks. A verification record shows what changed and what still needs checking.',
        ],
        media: [{ layout: 'half' }, { layout: 'half' }, { layout: 'half' }, { layout: 'half' }],
      },
      {
        heading: 'Make trust visible',
        body: [
          'People can inspect evidence, discuss recommendations and approve specific changes. Clear permissions and honest confidence levels guide the work.',
        ],
        media: [{ layout: 'full' }, { layout: 'half' }, { layout: 'half' }],
      },
    ],
  },
  {
    slug: 'designing-minds',
    title: 'Designing Minds',
    description: 'An online shop for CAPS-aligned learning resources for Grades 3 to 7.',
    tiles: [{}, {}],
    summary:
      'I designed and built a shop for teacher-made resources, connecting the catalogue, checkout, customer accounts and publishing tools.',
    cover: {},
    sections: [
      {
        heading: 'Find the right resource',
        body: [
          'Parents browse by grade, subject, term and format. Clear descriptions explain what each resource includes and how it supports South Africa’s school curriculum.',
        ],
        media: [{ layout: 'half' }, { layout: 'half' }, { layout: 'half' }, { layout: 'half' }],
      },
      {
        heading: 'Buy, download, return',
        body: [
          'Single resources, bundles and access plans share one buying journey. Purchased files stay with the order, making them easy to find again.',
        ],
        media: [{ layout: 'full' }, { layout: 'full' }, { layout: 'full' }],
      },
      {
        heading: 'Keep the shop running',
        body: [
          'Publishing tools let the team manage products, prices and bundles. Orders, payments and customer records remain visible alongside the catalogue.',
        ],
        media: [{ layout: 'half' }, { layout: 'half' }],
      },
    ],
  },
  {
    slug: 'richard-james',
    title: 'Richard James',
    description: 'An artist portfolio and editorial system for Richard James.',
    tiles: [{}, {}],
    summary:
      'I designed and built a quiet home for Richard’s artwork and writing, with a private editorial system to keep the archive growing.',
    cover: {},
    sections: [
      {
        heading: 'Give the work room',
        body: [
          'Visitors explore the archive by year. Each project brings together its images, medium and text, with careful pacing that lets the artwork lead.',
        ],
        media: [{ layout: 'half' }, { layout: 'half' }, { layout: 'full' }],
      },
      {
        heading: 'Bring the thinking alongside',
        body: [
          'Essays and biographical writing sit beside the artwork. A calmer reading layout gives Richard’s ideas the same care as his visual practice.',
        ],
        media: [{ layout: 'full' }, { layout: 'full' }],
      },
      {
        heading: 'Make the archive easy to maintain',
        body: [
          'Richard can add projects, arrange galleries and edit copy without touching code. Publishing produces a fresh set of static pages with prepared images.',
        ],
        media: [{ layout: 'half' }, { layout: 'half' }, { layout: 'half' }, { layout: 'half' }],
      },
    ],
  },
  {
    slug: 'three-acts-supply',
    title: 'Three Acts Supply',
    description: 'A library of web interactions to explore, customise and take into your own projects.',
    tiles: [{}, {}],
    summary:
      'Three Acts Supply brings a browsable interaction library and a live coding workspace together, from finding an idea to downloading the source.',
    cover: {},
    sections: [
      {
        heading: 'See the interaction first',
        body: [
          'Motion previews show each resource in action. Search, categories, bookmarks and recent views help people find an idea and return to it later.',
        ],
        media: [{ layout: 'full' }, { layout: 'full' }],
      },
      {
        heading: 'Make it your own',
        body: [
          'Open a full-screen preview, adjust values with dials or edit the HTML, CSS and JavaScript. Device views show how the interaction feels at different sizes.',
        ],
        media: [{ layout: 'half' }, { layout: 'half' }, { layout: 'full' }],
      },
      {
        heading: 'Take the details with you',
        body: [
          'Download the edited source files, copy an SVG icon or try an easing curve. Small tools make it easier to carry an idea into the next build.',
        ],
        media: [{ layout: 'full' }, { layout: 'half' }, { layout: 'half' }, { layout: 'full' }],
      },
    ],
  },
]
