/**
 * The card a shared link renders as, on social platforms and in chat apps.
 *
 * One image for the whole site rather than one per page: the pages share a
 * voice, and a per-page card is only worth its upkeep once the pages have
 * distinct things to show. src/share-card.html is what produces the PNG, and
 * carries the instructions for regenerating it.
 *
 * Width and height are declared to the scraper as well as being true of the
 * file — share-image.test.ts reads the PNG header to keep the two honest,
 * because nothing else would notice a regenerated card that came out a
 * different size.
 */
export const SHARE_IMAGE = {
  src: '/img/share.png',
  /* 1200x630 is the size every major scraper crops to. Anything smaller than
     600x315 gets demoted to a thumbnail. */
  width: 1200,
  height: 630,
  alt: 'Craig Chihururu — I help brands build websites worth visiting and apps worth using.',
} as const
