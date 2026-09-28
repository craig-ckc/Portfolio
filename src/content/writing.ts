/**
 * The writing: one record per article, read by the list at /writing
 * (src/pages/writing.astro) and by each article's own page at
 * /writing/<slug> (src/pages/writing/[slug].astro).
 *
 * The list draws each article as a card — one image and its title — in a
 * two-column grid. The article page has a template of its own: a centred
 * header with the title, a subtitle and when it went up, then the cover and
 * the body. The section shape is the work one, imported rather than copied,
 * so the article and project bodies cannot drift apart on what a section
 * holds.
 *
 * NOTE(craig): every article here is DRAFTED, not written by you. Each one
 * grows out of a project in src/content/work.ts and is written in the site's
 * voice to give the template real prose to hold. Dates are placeholders. Read
 * them through, or replace them, before the section goes live.
 */
import type { WorkMedia, WorkSection } from './work'

export type Article = {
  slug: string
  title: string
  /**
   * The subtitle under the title on the article page, and its meta
   * description. One short sentence. The list does not show it: a card there
   * is the image and the title, nothing else.
   */
  description: string
  /** The one image on the article's card in the list. */
  card: WorkMedia
  /** ISO date, YYYY-MM-DD. The list is ordered by it, newest first. */
  published: string
  /** Minutes, rounded. Stated rather than computed so it reads as a promise. */
  readingMinutes: number
  /** What the piece is about, in a word or two each. Shown above the title. */
  topics: string[]
  /** The lead under the title. Longer than `description`, and not a repeat of it. */
  summary: string
  /** The full-bleed image at the top of the page. */
  cover?: WorkMedia
  sections: WorkSection[]
}

/** Where an article lives. The one place a slug becomes a URL. */
export function writingPath(slug: string): string {
  return `/writing/${slug}`
}

/** The date as the page prints it: "12 March 2025". */
export function formatPublished(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/* ---- ARTICLES: filled in below, newest first ---- */
export const articles: Article[] = [
  {
    slug: 'feedback-is-not-the-problem-approval-is',
    title: 'Feedback is not the problem, approval is',
    description: 'Why sign-off needs a single home.',
    card: {},
    published: '2025-09-12',
    readingMinutes: 3,
    topics: ['Product design', 'Process'],
    summary:
      'Most teams that complain about messy feedback do not have a feedback problem. They have an approval problem: the decision that ends a round has no fixed address, so everyone invents their own and calls it sign-off.',
    cover: {},
    sections: [
      {
        heading: 'The wrong diagnosis',
        body: [
          'Every creative team I have watched describe their review process reaches for the same word: messy. Comments scattered across three tools, a thumbs up in one place that meant something different from a thumbs up in another, a version nobody was quite sure was the final one. That word is not wrong, but it describes the surface of the thing rather than what is actually broken underneath it.',
          'Underneath the mess was something more specific. Approval had no fixed address. A comment left in a chat thread felt like sign-off to whoever wrote it. A reply to an email felt like sign-off to whoever sent it. Neither one was, but both behaved as though they were, and nobody in the room had agreed which of them actually counted.',
        ],
        media: [{}, {}],
      },
      {
        heading: 'One place, one decision',
        body: [
          'Once I saw the problem that way, the brief changed shape. It stopped being build a better commenting tool and became give approval a single home: one piece of work, one open round, one decision that closes it. Everything else the interface does, the markup, the threads, the notifications, exists to support that sentence rather than to quietly offer a second way of doing the same job. That sentence became the thing I checked every screen against before it shipped.',
          'This is a smaller idea than it sounds, and a harder one to hold onto once a screen actually needs building. It is tempting to add a second way to approve something because a client asks for it, or to add a status that means almost closed. Every one of those requests is the old mess asking to be let back in through a new door.',
        ],
      },
      {
        heading: 'What a decision needs to feel like',
        body: [
          'A decision that ends a round has to read as heavier than a comment, or people will go on treating it as one. That meant a confirmation step rather than a button brushed past on the way to something else, a visible list of who is actually allowed to approve, and a state, waiting, changes requested or closed, that reads at a glance from across an open-plan office rather than from inside an opened modal. Every one of those choices was tested against people who were not looking closely, because that is how these tools actually get used.',
          'None of that is decoration sitting on top of the model. It is the interface telling the truth about what just happened, so the next person who opens the file does not have to ask anyone what a status means. A team that has to ask has already lost the thing sign-off was meant to buy it, which is the ability to stop thinking about a piece of work.',
        ],
        media: [{}],
      },
      {
        heading: 'The same gap shows up elsewhere',
        body: [
          'This is not particular to creative review. Any process that runs across several tools tends to grow a second, informal approval alongside the official one, simply because the official one is slower or less visible than sending a message. The fix is rarely a stricter policy pinned above someone’s desk. It is giving the real decision a place that is faster to reach and harder to fake than the workaround ever was.',
          'So ask where approval actually lives before asking why the feedback feels messy. Nine times out of ten the mess was never the real problem. It was simply where people went once the proper channel had already let them down, and they needed somewhere to put a decision that mattered. Fix the channel and the mess mostly clears up on its own, without anyone being told to tidy up how they work.',
        ],
      },
    ],
  },
  {
    slug: 'designing-and-building-with-the-same-hands',
    title: 'Designing and building with the same hands',
    description: 'What changes when one person designs and builds.',
    card: {},
    published: '2025-05-20',
    readingMinutes: 3,
    topics: ['Front-end development', 'Process'],
    summary:
      'A handover document is where an interaction goes to be simplified. Designing and building with the same hands removes the document, and with it the moment where the hard parts quietly become someone else’s problem.',
    cover: {},
    sections: [
      {
        heading: 'The handover that never happened',
        body: [
          'Most interaction design dies a small death at handover. Not because the developer on the other end is careless, but because a set of redlines and a prototype cannot carry every decision that went into a screen, so the ones that are hardest to explain are usually the first to be quietly dropped. Nobody decides to drop them. They simply do not survive the translation from one person’s head to another’s.',
          'Building the front end myself removes the translation rather than improving it. There was no document, no set of redlines, and no negotiation about which parts of an interaction were worth the extra afternoon. Where something did not work once it was real, it got changed in the design and in the code within the same sitting, by the same person who had opinions about both.',
        ],
        media: [{}, {}],
      },
      {
        heading: 'What survives contact with the browser',
        body: [
          'Some decisions only reveal their cost once they are running in a real browser on a real machine. A hover state that looks right in a static file can feel wrong the moment it has to compete with a scrollbar, a slow network request, or five hundred rows of real data instead of three placeholder ones. A designer who is not also building the thing finds this out from a bug report, days later, once the feeling that prompted the decision has gone cold, if they find out at all.',
          'Finding it out immediately, with the file still open, is a different kind of practice. The fix is not a ticket raised against someone else’s time. It is a small adjustment made while the reason for the original decision is still in reach, which is usually the difference between a considered change and a compromise nobody is happy with.',
        ],
      },
      {
        heading: 'The small things that only happen this way',
        body: [
          'What this actually buys a product is rarely dramatic. It is the markup layer staying exactly where it was put under a zoom, instead of drifting because nobody who could see the design file was also watching the transform. It is a keyboard path through a whole review that genuinely works end to end, because the person who drew the focus order also wired it up. It is a list of two hundred comments scrolling at the same rate as an empty one.',
          'None of these would survive a request written for someone else to implement, because none of them are the kind of thing you think to write down until you have already watched them fail. They exist because the same attention was in the room for the decision and for the code that carries it out, on the same afternoon, rather than passed between two people with two different definitions of finished.',
        ],
        media: [{}],
      },
      {
        heading: 'Where this does not scale',
        body: [
          'I do not think this is an argument against handover generally, and it is certainly not an argument against teams. A studio with six designers and six developers cannot run this way, and should not try to, because the whole point of a handover document is that it lets more than one person’s judgement into a project at once. What it loses in translation, it gains in scale.',
          'What I would take from it, for a team rather than for one person, is smaller: keep the person who understood the reason for a decision close to the person who has to make it work, for as long into the build as that is practical. The document is not the problem. Losing the reasoning behind it is.',
        ],
      },
    ],
  },
  {
    slug: 'an-identity-should-be-a-kit-not-a-logo',
    title: 'An identity should be a kit, not a logo',
    description: 'Identity built as marks that combine, not one mark.',
    card: {},
    published: '2025-01-15',
    readingMinutes: 3,
    topics: ['Brand identity'],
    summary:
      'A single logo has to be right for every situation it will ever meet, which is an impossible brief. A small kit of marks that combine differently depending on the job asks a fairer question of each one.',
    cover: {},
    sections: [
      {
        heading: 'One mark cannot do this job',
        body: [
          'A logo is usually asked to do something no single mark can do well: sit quietly on a business card, carry a conference banner from thirty feet away, and still mean something reduced to sixteen pixels in a browser tab. Most identities cope with this by picking one of those jobs to optimise for and letting the others suffer, which is why so many marks look slightly wrong wherever they were not designed to be seen first.',
          'The alternative I keep returning to is not to design one mark better. It is to stop asking one mark to do every job, and build a small set of them instead, each one built for a narrower brief than a logo ever gets, and left to combine rather than to be scaled.',
        ],
        media: [{}, {}],
      },
      {
        heading: 'A system of marks',
        body: [
          'For an education consultancy built on the idea that the work is about curiosity rather than instruction, that gave the identity something concrete to be about. Each mark stands for a way of asking a question, and the set sits together differently depending on what the piece is for, so a worksheet and a conference banner come out of the same kit without either looking borrowed from the other, or like the one that got the real attention.',
          'The test for whether the kit was working was never whether any single mark looked good on its own. It was whether a new piece of material, made by someone who had never seen the brand guidelines, could still be assembled from the kit and come out looking like it belonged to the same organisation as everything before it.',
        ],
      },
      {
        heading: 'Keeping the voice in one place',
        body: [
          'Type sits deliberately plain underneath a kit like this, because the marks are already doing the work of having a voice. Anything else competing at that level, a display face, a heavy colour system, an illustration style with its own opinions, makes the whole thing louder every time it gets used, which is the opposite of what an organisation wants three years into using an identity daily.',
          'Restraint in the type is not a lack of ambition for the brand. It is where the ambition actually is: in the marks, and in how they combine, rather than spread thinly across every part of a page that could plausibly carry some personality. A page with one loud idea reads more confidently than a page arguing with itself in three registers at once, and a plain typeface is what keeps that argument from starting.',
        ],
        media: [{}],
      },
      {
        heading: 'What a kit costs you',
        body: [
          'None of this is free. A kit takes longer to specify than a logo, because a rulebook for how pieces combine is a harder document to write than a single lockup with a minimum clear space. It also asks more of whoever applies it later, and it only survives if that person is given the rules rather than just the assets.',
          'What it buys back is an identity that keeps looking considered as the organisation keeps producing material nobody in the original room will ever see. A single mark ages by being reused in situations it was never built for. A kit is built assuming that will happen, and gives the next person something to build with rather than only something to place.',
          'I would still choose a single mark for a business that only ever needs to appear in a handful of fixed places, because a kit built for variety it will never meet is just a rulebook nobody reads. The decision is about how much unplanned reuse the identity will actually face, not a rule that a kit is always the better answer.',
        ],
      },
    ],
  },
  {
    slug: 'building-pages-that-open-on-any-connection',
    title: 'Building pages that open on any connection',
    description: 'Building sites for phones on bad connections.',
    card: {},
    published: '2024-10-08',
    readingMinutes: 3,
    topics: ['Web design', 'Performance'],
    summary:
      'A good share of any audience reads on a phone, on a connection that is doing them no favours. Designing for that reader is not a technical afterthought bolted onto a finished site, it is a constraint that should sit at the start.',
    cover: {},
    sections: [
      {
        heading: 'Who is actually reading this',
        body: [
          'It is easy to design against the machine on the desk, on the office network, because that is the machine in the room while the work is being made. It is a worse guess than it feels like. A good share of any audience is reading on a phone, quite possibly outdoors, quite possibly on a connection that drops the moment a lift door closes, and a site that only performs well for the first reader is failing the second one silently.',
          'The honest response to that is not a mobile version bolted onto a desktop site afterwards, tested last and trusted least. It is treating the phone on the bad connection as the actual target from the first sketch, and letting anything else, the wide screen, the fast office network, be the easy case that mostly takes care of itself once the hard one has actually been solved.',
        ],
        media: [{}, {}],
      },
      {
        heading: 'What static buys you',
        body: [
          'A site that ships as static pages, without a framework hydrating on arrival before it can respond to a tap, gets most of this for free. There is no client-side rebuild of the page happening invisibly after the first paint, no bundle of code that has to be fetched and run before a link works. What the browser receives is close to what the reader sees, which removes an entire category of the waiting that a heavier approach quietly asks for.',
          'This is not a rejection of interactivity, it is a decision about where the cost of it should sit. A page that needs very little to become useful can afford to spend the small amount of interactivity it does need generously, rather than paying a tax on every page for the sake of the handful that need more.',
        ],
      },
      {
        heading: 'Type and images that do not wait',
        body: [
          'Type gets inlined rather than fetched as a separate request, because a page that displays its words in a fallback font for a second and then swaps them is a page announcing that it is still loading, even once the reader has started reading. Images are sized for the slot they actually land in, not shrunk down by the browser after arriving at full size, because the difference between those two is most of the weight of the page.',
          'Neither choice is exotic, and neither needed a new tool to make. Both are simply what happens when the phone on the bad connection is treated as the design brief itself, rather than as an edge case that gets tested against once the real site, meaning the one built for the desk, is already finished and hard to change.',
        ],
        media: [{}],
      },
      {
        heading: 'The discipline this asks for',
        body: [
          'Building this way costs something upstream. It rules out a class of convenient shortcuts, the extra library pulled in for one small feature, the framework reached for out of habit rather than need, because each of those is a cost the reader on the bad connection pays and the person adding it does not. That trade is easy to agree with in principle and easy to forget under a deadline, which is exactly why it needs to be a constraint from the start rather than a review note at the end.',
          'The result, when it holds, is a site that is legible before it has finished loading, and finished loading before a heavier one has decided what to render. That is not a claim about taste, or about one approach being more elegant than another on a slide. It is a claim about who actually gets to read the thing at all, on the connection they happen to have.',
        ],
      },
    ],
  },
  {
    slug: 'get-out-of-the-photographs-way',
    title: "Get out of the photograph's way",
    description: 'Quiet type and a grid that serves the image.',
    card: {},
    published: '2024-06-19',
    readingMinutes: 3,
    topics: ['Art direction', 'Web design'],
    summary:
      'A photographer’s site is not a chance to demonstrate a designer’s range. The best version of it is one a visitor cannot really describe afterwards, because nothing on the page was competing with the pictures for their attention.',
    cover: {},
    sections: [
      {
        heading: 'A brief made of things not to do',
        body: [
          'The design brief for a portfolio of film scans was mostly a list of things to leave out. No captions competing with the frames for the eye’s first stop. No hover effects turning a photograph into an interactive element the moment a cursor gets near it. No typography with an opinion loud enough to be remembered alongside the image it was only meant to label. Most of the early conversations were about what to remove rather than what to add.',
          'What is left, once those are all ruled out, is a small type scale, a lot of white, and generous space around every photograph, so that no two frames on a page are ever competing for the same piece of a visitor’s attention. Restraint here is not an absence of decisions. It is a great many decisions in a row, each one made in the direction of saying less.',
          'It helps that the photographs themselves already do the work most sites ask their design to do. A strong frame does not need a caption to be understood, and it does not need a border or a shadow to be noticed on a page. Once that was accepted, most of the remaining decisions made themselves.',
        ],
        media: [{}, {}],
      },
      {
        heading: 'A grid that varies size, not space',
        body: [
          'The grid varies the size of a frame but never the space around it, which is what lets a landscape and a portrait sit in the same row without the row looking rearranged or apologised for. Keeping the gutter constant while the frame changes shape is a small rule, but it is the one that stops a gallery of mixed formats from ever looking like a compromise between two different layouts. Most of the awkwardness in mixed-format galleries traces back to that one rule being broken somewhere, usually to make a particular image look bigger.',
          'It also means a new set of photographs can be added later without a new grid being designed to fit them. The system was built to hold work it had not yet seen, which is a fair test of whether a layout for a working photographer’s site is actually finished or only finished for the pictures it launched with. A photographer’s work keeps arriving after the site does, and the grid has to keep up without being redesigned every time it does.',
        ],
      },
      {
        heading: 'Where restraint runs out',
        body: [
          'This is not a case for no design at all. Somebody still had to choose the scale the type sits at, the exact width of white around a frame, and the point at which two images are close enough to read as a pair rather than as two unrelated ones. Those choices are just as opinionated as a bolder page would be, they are only quieter about it, and quiet decisions are usually harder to get right precisely because nobody notices them when they work.',
          'The test I keep coming back to is what a visitor remembers a day later. If it is a typeface, or a transition, or a clever piece of layout, the site has taken something that belonged to the photographs. If it is a picture, the page did its job and can stay out of the account entirely, which is the only outcome a photographer’s own site should ever be trying for.',
        ],
      },
    ],
  },
  {
    slug: 'making-big-images-feel-immediate',
    title: 'Making big images feel immediate',
    description: 'Serving huge scans so the first frame lands fast.',
    card: {},
    published: '2024-02-27',
    readingMinutes: 3,
    topics: ['Performance', 'Front-end development'],
    summary:
      'Film scans are big, slow files, and the whole point of them is the detail. Showing them at a size worth looking at and still loading quickly is not a trade-off to accept, it is a set of small, specific decisions.',
    cover: {},
    sections: [
      {
        heading: 'The size the slot actually needs',
        body: [
          'The easiest mistake with large photography online is serving one file everywhere and letting the browser shrink it down to fit whatever slot it landed in. That file has already paid the full cost of its largest possible use, in bytes downloaded, on every page it appears, including the thumbnail-sized ones where almost none of that detail is visible. Every frame here is instead served at the size the slot actually renders it at, in a modern format, which is the single change that does the most to make a gallery of large scans feel light.',
          'This is not a compromise on quality, and nobody looking at the full-width frame would ever notice it happened. The detail a photographer wants visible there is still there in full, at the resolution it deserves. It is only the copies that were never going to be seen at that size, the thumbnail, the row preview, that stop being asked to behave as though they were.',
        ],
        media: [{}, {}],
      },
      {
        heading: 'Declaring the shape before the image arrives',
        body: [
          'Every image on the page has its dimensions declared in the markup before the file itself has loaded, so the browser can reserve the exact space the photograph will occupy and never has to shuffle the rest of the page once it arrives. Without that, a page of large images is a page that keeps moving under the reader’s cursor as each one loads in, which is a small thing until it is the reason someone clicks the wrong link.',
          'It costs nothing to get right and is easy to miss, because the effect of skipping it is only visible on the connection where it matters, which is rarely the one sitting on a designer’s desk while the page is being built and checked. The fix is a single attribute, decided once per image, and it is the sort of detail a project either has a habit of getting right everywhere or gets wrong everywhere without noticing.',
        ],
      },
      {
        heading: 'Something on screen before the real thing',
        body: [
          'Below the fold, images load as the gallery actually approaches them rather than all arriving on first paint, so the browser is never asked to fetch forty large files for the one the reader is currently looking at. The first frame gets different treatment again: it is preloaded ahead of everything else, and a tiny blurred version of it is inlined directly into the page, so there is something of the photograph on screen from the very first paint rather than an empty box waiting to be filled.',
          'On a fast connection this is barely noticeable, which is exactly the point of doing it at all. On a slow one, it is the difference between a page that is visibly loading something real, with a shape and a rough colour already in place, and a page that simply looks broken. A visitor is far more patient with the first of those than with the second, and rarely for a reason they could name.',
        ],
        media: [{}],
      },
      {
        heading: 'What this is worth',
        body: [
          'None of this changes what the photographs look like once they have arrived. It only changes how long the wait feels, and whether the reader stays for it. For work whose entire case for itself is the image, that wait is not a technical detail sitting apart from the design. It is the first impression the design actually makes, before a single frame has fully rendered.',
          'A site can be beautifully art directed and still lose most of its audience in the first four seconds, quietly, without anyone involved ever seeing it happen. Treating loading as part of the design rather than a problem for someone else to solve afterwards is the only way I know to actually close that gap.',
        ],
      },
    ],
  },
]
