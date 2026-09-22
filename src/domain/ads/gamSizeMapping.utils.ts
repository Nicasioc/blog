export type GamSizeMappingEntry = [[number, number], Array<[number, number]>]

const GUTTER_PX = 32

// Mirrors this repo's Tailwind breakpoints (`md` = 768, `lg` = 1024, see
// Header/Footer/PostBody) and their shared `container ... px-4` gutter
// (16px each side = 32px). The [0, 0] (mobile) bucket's *eligibility* width
// is 368, not 0 or 320: 336 (the narrowest configured rectangle size,
// 336x280) plus the 32px gutter is exactly 368 — the viewport width a real
// device needs for that size to fit under the same "width fits available
// space" rule used for the other two buckets. A smaller floor would exclude
// 336x280 from mobile even though it's a legitimate mobile-safe width; 368
// keeps the rule consistent across all three buckets instead of carving out
// a special case for the smallest one. See BLO-138's audit note.
const BREAKPOINTS: ReadonlyArray<{ viewport: number; eligibilityWidth: number }> = [
  { viewport: 0, eligibilityWidth: 368 },
  { viewport: 768, eligibilityWidth: 768 },
  { viewport: 1024, eligibilityWidth: 1024 },
]

export const buildGamSizeMapping = (sizes: Array<[number, number]>): GamSizeMappingEntry[] =>
  BREAKPOINTS.map(({ viewport, eligibilityWidth }) => [
    [viewport, 0],
    sizes.filter(([width]) => width <= eligibilityWidth - GUTTER_PX),
  ])
