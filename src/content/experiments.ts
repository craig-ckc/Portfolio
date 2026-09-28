export type ExperimentKind = 'dock' | 'disc'

export type Experiment = {
  slug: string
  title: string
  description: string
  kind: ExperimentKind
}

export function experimentPath(slug: string): string {
  return `/experiments/${slug}`
}

export const experiments: Experiment[] = [
  {
    slug: 'magnetic-dock',
    title: 'Magnetic dock',
    description: 'A dock that makes room for the icon under the pointer instead of simply scaling over its neighbours.',
    kind: 'dock',
  },
  {
    slug: 'now-playing',
    title: 'Now playing',
    description: 'An album cover that reveals the record, track details and simple playback controls when it comes into focus.',
    kind: 'disc',
  },
]
