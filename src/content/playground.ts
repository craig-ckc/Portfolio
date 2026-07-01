export type PlaygroundItem = {
  layout: {
    aspectRatio: number
    width: 'base' | 'wide' | 'feature'
  }
  slug: string
  title: string
}

export const playgroundItems = [
  { slug: 'interface-motion-study', title: 'Interface motion study', layout: { width: 'base', aspectRatio: 16 / 9 } },
  { slug: 'generative-surface-control', title: 'Generative surface control', layout: { width: 'base', aspectRatio: 1 } },
  { slug: 'interactive-product-card', title: 'Interactive product card', layout: { width: 'feature', aspectRatio: 16 / 9 } },
  { slug: 'typography-transition', title: 'Typography transition', layout: { width: 'base', aspectRatio: 16 / 9 } },
  { slug: 'data-interaction-prototype', title: 'Data interaction prototype', layout: { width: 'base', aspectRatio: 2 / 3 } },
  { slug: 'spatial-navigation-sketch', title: 'Spatial navigation sketch', layout: { width: 'base', aspectRatio: 16 / 9 } },
  { slug: 'product-surface-prototype', title: 'Product surface prototype', layout: { width: 'wide', aspectRatio: 16 / 9 } },
  { slug: 'motion-system-sketch', title: 'Motion system sketch', layout: { width: 'base', aspectRatio: 1 } },
  { slug: 'layout-engine-study', title: 'Layout engine study', layout: { width: 'base', aspectRatio: 10 / 16 } },
  { slug: 'visual-language-exploration', title: 'Visual language exploration', layout: { width: 'wide', aspectRatio: 16 / 9 } },
  { slug: 'control-panel-prototype', title: 'Control panel prototype', layout: { width: 'base', aspectRatio: 16 / 9 } },
  { slug: 'web-interaction-study', title: 'Web interaction study', layout: { width: 'base', aspectRatio: 1 } },
  { slug: 'shader-card-system', title: 'Shader card system', layout: { width: 'wide', aspectRatio: 16 / 9 } },
  { slug: 'generative-poster-tool', title: 'Generative poster tool', layout: { width: 'wide', aspectRatio: 16 / 9 } },
  { slug: 'navigation-physics-sketch', title: 'Navigation physics sketch', layout: { width: 'base', aspectRatio: 2 / 3 } },
  { slug: 'microinteraction-kit', title: 'Microinteraction kit', layout: { width: 'base', aspectRatio: 16 / 9 } },
  { slug: 'realtime-filter-prototype', title: 'Realtime filter prototype', layout: { width: 'base', aspectRatio: 1 } },
  { slug: 'editorial-layout-study', title: 'Editorial layout study', layout: { width: 'wide', aspectRatio: 1 } },
  { slug: 'component-state-lab', title: 'Component state lab', layout: { width: 'base', aspectRatio: 16 / 9 } },
  { slug: 'canvas-drawing-surface', title: 'Canvas drawing surface', layout: { width: 'base', aspectRatio: 1 } },
  { slug: 'interactive-pricing-model', title: 'Interactive pricing model', layout: { width: 'wide', aspectRatio: 16 / 9 } },
  { slug: 'gesture-control-demo', title: 'Gesture control demo', layout: { width: 'base', aspectRatio: 2 / 3 } },
  { slug: 'portfolio-transition-test', title: 'Portfolio transition test', layout: { width: 'base', aspectRatio: 16 / 9 } },
  { slug: 'ai-interface-concept', title: 'AI interface concept', layout: { width: 'wide', aspectRatio: 4 / 3 } },
  { slug: 'webgl-product-moment', title: 'WebGL product moment', layout: { width: 'base', aspectRatio: 1 } },
] satisfies PlaygroundItem[]

export function getPlaygroundItem(slug: string) {
  return playgroundItems.find((item) => item.slug === slug)
}
