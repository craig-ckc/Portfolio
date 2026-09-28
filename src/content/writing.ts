import type { WorkMedia, WorkSection } from './work'

export type Article = {
  slug: string
  title: string
  description: string
  card: WorkMedia
  published: string
  readingMinutes: number
  topics: string[]
  featured?: boolean
  summary: string
  cover?: WorkMedia
  sections: WorkSection[]
}

export function writingPath(slug: string): string {
  return `/writing/${slug}`
}

export function formatPublished(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export const articles: Article[] = [
  {
    slug: 'design-and-development-stay-together',
    title: 'What changes when design and development stay together',
    description: 'Keeping design and development connected makes ideas easier to test, refine and ship without losing their intent.',
    card: {},
    published: '2026-09-28',
    readingMinutes: 5,
    topics: ['Product design', 'Front-end development', 'Design engineering'],
    featured: true,
    summary:
      'Design and development are often treated as separate stages of a project. Keeping them connected changes the work: ideas reach the browser sooner, weak assumptions surface earlier, and fewer decisions disappear between the design and the thing people actually use.',
    cover: {},
    sections: [
      {
        heading: 'Why keep design and development connected?',
        body: [
          'It helps an idea move from a rough flow to a working interface without first turning every decision into instructions for somebody else. Once the idea is in the browser, the questions become more useful. Does the content fit? Does the interaction feel natural? Does the layout still make sense when the screen, data or connection changes?',
          'The design and the build become one conversation. If the implementation exposes a weak assumption, the model, interface and code can change together while the reason is still clear. Progress is measured by what has been learned, not by how closely the browser copies a static screen.',
        ],
      },
      {
        heading: 'The browser reveals what a design file cannot',
        body: [
          'Real interfaces are made from changing content, uncertain network conditions and people who do not follow the expected path. A title is longer than the example. A request fails. A list has two hundred items instead of eight. Someone zooms the page, uses a keyboard or opens it on a phone in bright sunlight.',
          'These are not development details that arrive after the design. They are part of the material the design is made from. Working in the browser early makes those conditions visible while the important decisions are still cheap enough to change.',
        ],
      },
      {
        heading: 'Fewer handoffs lead to better decisions',
        body: [
          'A handoff has to compress hours of reasoning into screens, notes and acceptance criteria. Good documentation helps, but it cannot carry every reason behind every choice. The easiest details to lose are often the ones that make a product feel considered: a useful empty state, a complete keyboard path, or the point where an animation should get out of the way.',
          'Keeping design intent close to implementation reduces that loss. A decision can be judged against the working product instead of defended as a line in a specification. What improves the experience stays. What adds effort without adding value can be simplified before it becomes expensive.',
        ],
      },
      {
        heading: 'When does this approach work best?',
        body: [
          'It works especially well when a product is still finding its shape, when interaction and performance matter, or when a small team needs to move without losing the original idea. Larger products still need specialist depth and more perspectives. The point is not that one person should do every job.',
          'The useful principle is simpler: design decisions should stay close to the people making them real. The shorter that distance is, the easier it becomes to test the right thing, respond to what the product reveals and ship an interface that still carries its original intent.',
        ],
      },
    ],
  },
  {
    slug: 'a-website-should-answer-before-it-impresses',
    title: 'A website should answer before it impresses',
    description: 'Clear answers make a website more useful to people, search engines and AI tools.',
    card: {},
    published: '2026-09-14',
    readingMinutes: 5,
    topics: ['Web design', 'Content design', 'SEO', 'AEO'],
    summary:
      'A good website can have a strong point of view and still answer basic questions quickly. Visitors should not have to decode the design to learn what the business does, who it helps or what they can do next.',
    cover: {},
    sections: [
      {
        heading: 'Start with the visitor’s questions',
        body: [
          'Most people arrive with a small set of questions. What is this? Is it for me? Can I trust it? What happens next? The exact order changes with the product, but the need for a direct answer does not. A beautiful opening that avoids those questions creates attention without direction.',
          'Clear does not mean generic. The strongest answer is specific enough to exclude the wrong interpretation. “Design services” says very little. “Websites and digital products, designed and built from the first interface to the shipped front end” gives a visitor something they can recognise and repeat.',
        ],
      },
      {
        heading: 'SEO and AEO need the same foundation',
        body: [
          'Search engine optimisation helps a page become findable. Answer engine optimisation helps systems understand the page well enough to use it in a direct response. Both begin with the same useful work: name the subject clearly, define unfamiliar terms, answer real questions and keep claims consistent across the page.',
          'SEO is not a bag of phrases added after the design. The page title, introduction, headings, internal links and structured data should all describe the same thing in compatible language. Repetition is not the goal. Agreement is.',
        ],
      },
      {
        heading: 'Clear structure helps people and machines',
        body: [
          'A useful heading tells the reader what the next section will resolve. A direct first sentence gives them the answer before the detail. Examples and evidence then make the answer believable. This is good editorial structure, and it also helps a search engine or AI tool identify a passage without guessing what it means.',
          'Turning every heading into a keyword makes an article easier to parse and harder to enjoy. A better balance is to make the important questions explicit, answer them plainly and let the rest of the writing sound like a person with something worth saying.',
        ],
      },
      {
        heading: 'Visual design should carry the answer',
        body: [
          'Type, spacing, imagery and motion set the pace and emphasis of an answer. They can make the important part easier to find, or bury it under atmosphere. The goal is not to remove personality. It is to make personality carry the meaning instead of competing with it.',
          'Impressing a visitor earns attention. Answering their questions gives that attention somewhere to go. The strongest websites manage to do both without making people choose between understanding the page and enjoying it.',
        ],
      },
    ],
  },
  {
    slug: 'start-with-the-problem-then-explore-widely',
    title: 'Start with the problem, then explore widely',
    description: 'Start with a real problem, test a broad idea and refine whatever proves useful.',
    card: {},
    published: '2026-09-07',
    readingMinutes: 5,
    topics: ['AI', 'Creative work', 'Problem solving'],
    summary:
      'The useful question is not where AI can be added. It is where a normal task feels slow, repetitive or difficult to begin. Start there, give the tool enough room to surprise you, then shape the result with the context and judgment it does not have.',
    cover: {},
    sections: [
      {
        heading: 'Start with the problem, not the tool',
        body: [
          'AI is easier to use when it is attached to a real point of friction. That might be a blank page, a pile of information that needs sorting, several directions that need comparing, or a repetitive task that keeps interrupting more valuable work. The problem gives the experiment a reason and a way to judge whether it helped.',
          'Starting with the tool usually produces a search for somewhere to put it. Starting with the problem keeps the work grounded in an ordinary need. If the AI does not make that task clearer, faster or more open to exploration, it has not earned a place in the process.',
        ],
      },
      {
        heading: 'Take a bigger first swing',
        body: [
          'Early prompts do not need to be careful miniature versions of the final answer. A broad request can expose directions that would be hard to reach by moving one safe step at a time. Ask for several approaches. Push one idea further than feels sensible. Let the first result create better questions for the second.',
          'This is closer to sketching than delegating. Most sketches are not meant to survive. Their value is that they make an idea visible enough to react to. AI can produce that raw material quickly, which leaves more time for comparison, correction and combination.',
        ],
      },
      {
        heading: 'Treat the output as material, not an answer',
        body: [
          'A confident response can still be shallow, incorrect or wrong for the situation. The output becomes useful when it is questioned. What assumption did it make? What context is missing? Which part is genuinely new, and which part only sounds complete?',
          'Refinement is where the work becomes specific. Add the constraint the tool could not see. Replace the generic phrase. Check the factual claim. Keep the unexpected connection if it opens a better direction. The first response creates material. Judgment turns that material into something worth using.',
        ],
      },
      {
        heading: 'Keep the useful parts of the experiment',
        body: [
          'Not every experiment needs to become a system. A prompt that helps once can remain a prompt. A rough prototype can answer the question it was built for and stop there. The point is to notice which parts repeatedly remove friction and which only make the process feel more advanced.',
          'Over time, the useful patterns become easier to recognise. AI fits into everyday work when it supports thinking without demanding that every task be rebuilt around it. The tool can change. The habit of starting with a problem, exploring widely and refining carefully remains useful.',
        ],
      },
    ],
  },
  {
    slug: 'judgment-matters-more-when-making-gets-easier',
    title: 'Judgment matters more when making gets easier',
    description: 'When making becomes easier, choosing what deserves to be made matters more.',
    card: {},
    published: '2026-08-31',
    readingMinutes: 5,
    topics: ['AI', 'Judgment', 'Product thinking'],
    summary:
      'AI lowers the cost of producing an answer, a design or a working prototype. That does not remove the need for skill. It moves more of the value into choosing the right problem, recognising a strong direction and knowing when the result is ready to matter.',
    cover: {},
    sections: [
      {
        heading: 'Faster output changes where the work is',
        body: [
          'When a first draft takes minutes instead of hours, producing something is no longer the main limit. The harder questions move forward. Is this the right thing to make? Does it solve the problem that matters? Is the result clear, trustworthy and worth someone’s attention?',
          'Speed creates room for more attempts, but it also creates more noise. Ten plausible directions are only useful when there is a way to compare them. The work shifts from protecting the first idea to testing several ideas without losing sight of the reason for making anything at all.',
        ],
      },
      {
        heading: 'Taste is the ability to choose',
        body: [
          'Taste is often mistaken for a visual style or a collection of references. In practice, it is the ability to notice what is working, explain why it works and reject what does not belong. That ability becomes more important when a tool can produce endless variations that all look roughly finished.',
          'A polished result can still be ordinary. A surprising result can still be wrong. Choosing well requires context: the audience, the constraint, the history of the idea and the standard the work needs to meet. AI can offer options, but it cannot decide what this particular piece of work should stand for.',
        ],
      },
      {
        heading: 'More options need stronger direction',
        body: [
          'A vague brief used to produce a slow, vague result. With AI it can produce fifty of them before lunch. The answer is not a longer prompt filled with every possible instruction. It is a clearer point of view about the problem, the outcome and the qualities that matter.',
          'Strong direction gives experimentation boundaries without making it timid. It says what must remain true while leaving room for the route to change. That makes it possible to explore quickly, recognise a useful surprise and return to the purpose whenever the options start to drift.',
        ],
      },
      {
        heading: 'The lasting advantage is judgment',
        body: [
          'Tools will continue to make execution faster and more accessible. Any advantage based only on knowing the current interface will shrink as the interface improves. The more durable advantage is knowing how to frame a problem, guide an exploration, evaluate the result and take responsibility for the final choice.',
          'AI can expand what one person is able to attempt. Judgment decides whether those attempts become useful work or simply more output. As making gets easier, that distinction becomes harder to ignore and more valuable to practise.',
        ],
      },
    ],
  },
]
