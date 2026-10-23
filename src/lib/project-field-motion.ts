import type { FieldPan } from './project-field-layout'

export type MovingFieldPan = FieldPan & { vx: number; vy: number }

/** Integrate the fling toward a small drift in the same direction. No target
 * project or scale state participates in this motion, so emphasis can't steer it. */
export function advanceFieldPan(pan: MovingFieldPan, dt: number, inertia: number, drift: FieldPan, grabbing = false) {
  const friction = grabbing ? 1 / 28 : -Math.log(inertia) / 16.667
  const decay = Number.isFinite(friction) ? Math.exp(-friction * dt) : 0
  const travel = friction === 0 ? dt : (1 - decay) / friction
  pan.x += drift.x * dt + (pan.vx - drift.x) * travel
  pan.y += drift.y * dt + (pan.vy - drift.y) * travel
  pan.vx = drift.x + (pan.vx - drift.x) * decay
  pan.vy = drift.y + (pan.vy - drift.y) * decay
}
