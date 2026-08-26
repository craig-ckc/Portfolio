import type { LanyardItem } from '../../../content/home-page'

/**
 * Bar widths for the badge's barcode, in cqw. A fixed pattern rather than one
 * rolled at render time: Math.random() in render would mismatch between the
 * server markup and the client's first paint, and a prop this decorative does
 * not need a real barcode algorithm behind it — just something that reads as
 * one. 40 bars, the number the brief calls for.
 */
const BARCODE_WIDTHS = [
  2, 1, 3, 1, 2, 4, 1, 1, 3, 2, 1, 4, 2, 1, 1, 3, 2, 1, 4, 1, 2, 3, 1, 1, 4, 2, 1, 3, 1, 2, 1, 4, 1, 1, 2, 3, 1, 1, 4,
  2,
]
const BARCODE_GAP = 1.2
const BARCODE_HEIGHT = 24

/** First and, where there is one, second initial — the .face__mark treatment,
    read off whatever name the badge actually carries. */
function initials(name: string) {
  const letters = name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
  return letters.slice(0, 2).join('').toUpperCase()
}

/** The strap's running text: the name, repeated with the tagline until there
    is enough of it to fill --strap-h at the strap's own type size. The strap
    is short and cut off now, so most of this repetition never renders — kept
    long anyway so the visible run never looks like it was sized to fit. */
function strapText(name: string) {
  const unit = `${name.toUpperCase()} · DESIGN + CODE · `
  return unit.repeat(6)
}

function Barcode() {
  let x = 0
  const bars = BARCODE_WIDTHS.map((width, index) => {
    const bar = <rect key={index} x={x} y={0} width={width} height={BARCODE_HEIGHT} />
    x += width + BARCODE_GAP
    return bar
  })
  const total = x - BARCODE_GAP

  return (
    <svg
      className="lanyard__barcode"
      viewBox={`0 0 ${total} ${BARCODE_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {bars}
    </svg>
  )
}

/**
 * The conference badge. It used to swing from its strap; it does not anymore
 * — the strap is cut short and taped down instead, so there is nothing left
 * to move. A still object reads more like a real lanyard pinned to a board
 * than a badge that sways on its own.
 *
 * The strap still has to sit above the badge as one piece with it, which is
 * why the whole face is one element rather than the card's own box: the card
 * frame cannot itself carry the strap above it and still clip to the badge's
 * rounded corners. .card[data-kind='lanyard'] hands that frame back — see
 * lanyard.css — and this component draws the whole thing, badge and strap and
 * tape, inside it.
 */
export function LanyardFace({ item }: { item: LanyardItem }) {
  const { badge } = item

  return (
    <span className="lanyard">
      <span className="lanyard__strap" aria-hidden="true">
        <span className="lanyard__strap-text">{strapText(badge.name)}</span>
      </span>

      <span className="lanyard__tape" aria-hidden="true" />

      <span className="lanyard__clip" aria-hidden="true" />

      <span className="lanyard__badge">
        <span className="lanyard__slot" aria-hidden="true" />

        <span className="lanyard__header">
          <span>{badge.org}</span>
          <span>{badge.since}</span>
        </span>

        <span className="lanyard__portrait" aria-hidden="true">
          {initials(badge.name)}
        </span>

        <span className="lanyard__name">{badge.name}</span>
        <span className="lanyard__role">{badge.role}</span>

        <span className="lanyard__footer">
          <Barcode />
          <span className="lanyard__no">NO. 0019</span>
        </span>
      </span>
    </span>
  )
}
