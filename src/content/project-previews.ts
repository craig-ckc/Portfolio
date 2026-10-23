import { work, workPath } from './work'

/** The existing exploration artwork, exported without changing its 640 × 420 framing.
 * Replace these sources with project photography when it is available. */
export const projectPreviews = work.map((project) => ({
  src: `/img/project-previews/${project.slug}.svg`,
  width: 640,
  height: 420,
  title: project.title,
  href: workPath(project.slug),
}))
