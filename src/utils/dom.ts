// True when the element generates at least one layout box — false when it or
// any ancestor is `display: none` (e.g. a Tailwind `md:hidden` wrapper).
export const isElementRendered = (element: Element): boolean => element.getClientRects().length > 0
