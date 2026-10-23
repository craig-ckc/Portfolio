export type Experiment = {
  slug: string
  title: string
  description: string
}

export function experimentPath(slug: string): string {
  return `/experiments/${slug}`
}

export const experiments: Experiment[] = [
  {
    slug: 'infinite-field',
    title: 'Infinite Field',
    description: 'A draggable WebGL project gallery with layered fades, edge blur, and live controls.',
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
