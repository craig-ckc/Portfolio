import type { ComponentType } from 'react'

/**
 * Per-slug component registry for playground item pages.
 *
 * Adding an entry like `'my-slug': MyComponent` injects that component into the
 * stage of the playground item page whose slug matches the key. When a slug has
 * no entry here, the page renders its default placeholder fallback instead.
 *
 * Example:
 *   import MyDemo from '../playground/my-demo'
 *   export const playgroundComponents: Record<string, ComponentType> = {
 *     'interface-motion-study': MyDemo,
 *   }
 */
export const playgroundComponents: Record<string, ComponentType> = {}
