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
