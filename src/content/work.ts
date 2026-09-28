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
    description: 'An online shop for CAPS-aligned learning resources for Grades 3 to 7.',
    tiles: [{}, {}],
    summary:
      'Designing Minds turns teacher-made tests, summaries and assessment material into a clear online catalogue that parents can browse, buy and download. I designed and built the shop, customer account, checkout and publishing tools as one connected product.',
    cover: {},
    sections: [
      {
        heading: 'Making the catalogue easy to understand',
        body: [
          'Parents usually arrive with a practical question: what can I use to help a child in a particular grade, subject or term? The catalogue is organised around that question. Resources can be explored by grade, subject, term and format, with plain descriptions that explain what is included before anyone reaches checkout.',
          'CAPS is written out as South Africa’s Curriculum and Assessment Policy Statement wherever the meaning matters. That small choice helps parents who know the school system but not the acronym, and it gives search and answer engines a clearer account of what each resource is for.',
        ],
        media: [{}, {}],
      },
      {
        heading: 'Buying once, finding it again',
        body: [
          'The product supports single resources, discounted bundles and access plans without turning the buying journey into a subscription puzzle. A customer can see what a package contains, pay once and return to the order whenever the files are needed again.',
          'Downloads live with the order that unlocked them. That keeps receipts, purchases and files in one place, and avoids creating a separate downloads area that customers have to learn and remember.',
        ],
        media: [{}],
      },
      {
        heading: 'A store the team can run',
        body: [
          'The public shop is only half of the work. The administration side gives the team a structured way to publish products, set prices, group resources into bundles and manage the information customers rely on. Orders, payments and customer records stay visible without being treated as editable website content.',
          'That separation matters. It gives the team control over the catalogue while protecting the operational records that should only ever be created by the system.',
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
    description: 'A marketing product that turns evidence into prioritised, verifiable actions.',
    tiles: [{}, {}],
    summary:
      'Preflight helps teams decide what to change across websites and connected marketing systems, why it matters and how they will know it worked. I have been shaping the product, interface and implementation around one loop: scan, prioritise, act and track.',
    cover: {},
    sections: [
      {
        heading: 'From more data to a better decision',
        body: [
          'Marketing teams rarely struggle because they have too little information. The harder problem is knowing which signal deserves attention, which change is worth making and which result can actually be trusted. A dashboard can display the evidence without helping anyone make that decision.',
          'Preflight turns material findings into actions that carry their reasoning with them. Each action explains what changed, why it matters, what evidence supports it and what remains uncertain, so a person can make a decision without reconstructing the investigation first.',
        ],
        media: [{}, {}],
      },
      {
        heading: 'Keeping the proof attached',
        body: [
          'An approved action is not the end of the story. It needs a clear handoff, a way to check the live result and a record of what was learned. Preflight keeps the evidence, decision, implementation state and verification receipt connected instead of scattering them across a report, task manager and chat thread.',
          'The product is deliberately careful about confidence. It can show that a page changed and that a check passed. It should not pretend that one correlated metric proves business impact when the evidence does not support that claim.',
        ],
        media: [{}],
      },
      {
        heading: 'A product built around trust',
        body: [
          'The interface has to make authority visible. People can inspect evidence, discuss a recommendation and approve bounded work, but the system does not quietly turn a suggestion into an external change. Access, approval and verification are treated as product design questions rather than settings added at the end.',
          'Designing while building lets those rules stay intact from the data model to the screen. When the product says an action is verified, the interface, workflow and underlying record all have to mean the same thing.',
        ],
        media: [{}, {}],
      },
    ],
  },
  {
    slug: 'richard-james',
    title: 'Richard James',
    description: 'An artist portfolio and editorial system for Richard James.',
    tiles: [{}, {}],
    summary:
      'Richard James is a South African and British artist whose work draws on sculpture, Zen practice, counselling and affect theory. I designed and built a portfolio that gives decades of work room to be seen, while giving Richard a private system for managing it himself.',
    cover: {},
    sections: [
      {
        heading: 'A body of work, not a feed',
        body: [
          'The archive spans work made across many years, with recurring materials and ideas that are easier to understand together than as isolated posts. The home experience lets visitors move through the work by year, while individual pages hold the title, medium, text and full image sequence for each project.',
          'The interface stays quiet, but it is not neutral. Scale, pacing and transitions are used to give each work a clear moment without turning the site itself into the performance.',
        ],
        media: [{}, {}],
      },
      {
        heading: 'The thinking belongs beside the work',
        body: [
          'Richard’s practice is informed by Buddhist thought, affect theory and his experience as a counsellor. The About page and his essay, The Unborn Rags of the Mind, are part of the portfolio rather than background material hidden away from it. They give visitors a direct way to understand the questions running through the work.',
          'Project pages remain visually led, while longer writing uses a calmer reading layout. The two modes share one identity without asking the artwork and the essay to behave like the same kind of content.',
        ],
        media: [{}],
      },
      {
        heading: 'Simple to visit, practical to maintain',
        body: [
          'The public site is built as fast static pages, with images prepared for the places they appear. Behind it is a private editorial system where Richard can add projects, arrange galleries, edit page copy and control search and social descriptions without touching the code.',
          'Publishing creates a fresh version of the public site. Visitors get a focused portfolio with no editing software attached to the experience, while Richard keeps the control needed for the archive to continue growing.',
        ],
        media: [{}, {}],
      },
    ],
  },
]
