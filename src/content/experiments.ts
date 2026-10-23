export type Experiment = {
  slug: string
  title: string
  description: string
  /** Supplied cover artwork. Public files use paths such as /img/experiments/field.webp. */
  cover?: { src: string; alt?: string }
  /** Optional silent, looping preview, loaded only on hover or keyboard focus. */
  previewVideo?: string
}

export function experimentPath(slug: string): string {
  return `/experiments/${slug}`
}

export const experiments: Experiment[] = [
  {
    slug: 'infinite-field',
    title: 'Infinite Field',
    description: 'A draggable WebGL project gallery with layered fades, edge blur, and live controls.',
    cover: { src: '', alt: '' },
    previewVideo: '',
  },
  {
    slug: 'experiment-one',
    title: 'Experiment 01',
    description: 'Placeholder for a future interaction experiment.',
  },
  {
    slug: 'experiment-two',
    title: 'Experiment 02',
    description: 'Placeholder for a future interaction experiment.',
  },
]
