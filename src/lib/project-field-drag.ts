type Point = { x: number; y: number; time: number }
type Sample = { x: number; y: number; time: number }

/** Track a short stretch of the gesture, rather than trusting its last event.
 * Pointer timestamps keep the throw independent of render/main-thread delays. */
export class FieldDrag {
  readonly id: number
  moved = false
  private start: Point
  private previous: Point
  private samples: Sample[]
  private x = 0
  private y = 0

  constructor(id: number, point: Point) {
    this.id = id
    this.start = this.previous = point
    this.samples = [{ x: 0, y: 0, time: point.time }]
  }

  move(point: Point, speed: number) {
    const dx = (point.x - this.previous.x) * speed
    const dy = (this.previous.y - point.y) * speed
    this.previous = point
    this.x += dx
    this.y += dy
    if (dx || dy) {
      this.samples.push({ x: this.x, y: this.y, time: point.time })
      while (this.samples.length > 2 && this.samples[1].time < point.time - 80) this.samples.shift()
    }
    const wasMoving = this.moved
    this.moved ||= Math.hypot(point.x - this.start.x, point.y - this.start.y) > 7
    if (!this.moved) return { x: 0, y: 0 }
    return wasMoving ? { x: dx, y: dy } : { x: this.x, y: this.y }
  }

  velocity(time: number) {
    if (!this.moved || this.samples.length < 2) return { x: 0, y: 0 }
    const last = this.samples[this.samples.length - 1]
    const first = this.samples[0]
    const next = this.samples[1]
    const start = Math.max(first.time, last.time - 80)
    const fraction = next.time > first.time ? Math.min(1, (start - first.time) / (next.time - first.time)) : 0
    const duration = Math.max(8, last.time - start)
    // A brief pause eases the throw away instead of hitting a 100 ms cutoff.
    const fade = Math.exp(-Math.max(0, time - last.time - 16) / 45)
    const x = (last.x - first.x - (next.x - first.x) * fraction) / duration * fade
    const y = (last.y - first.y - (next.y - first.y) * fraction) / duration * fade
    const limit = Math.min(1, 3 / Math.max(Math.hypot(x, y), .00001))
    return { x: x * limit, y: y * limit }
  }
}
