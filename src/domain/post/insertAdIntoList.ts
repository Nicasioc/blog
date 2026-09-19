export type AdMarker = { readonly kind: 'ad' }

export const AD_MARKER: AdMarker = { kind: 'ad' }

export const isAdMarker = (item: unknown): item is AdMarker =>
  typeof item === 'object' && item !== null && (item as { kind?: unknown }).kind === 'ad'

// Inserts a single AD_MARKER right after items[afterIndex] (0-based), e.g.
// afterIndex=2 inserts after the 3rd item. No-op (returns a copy of the
// input) when there aren't enough items to insert after.
export const insertAdMarker = <T>(items: T[], afterIndex: number): Array<T | AdMarker> => {
  if (items.length <= afterIndex) return [...items]
  return [...items.slice(0, afterIndex + 1), AD_MARKER, ...items.slice(afterIndex + 1)]
}
