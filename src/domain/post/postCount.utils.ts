/** "1 artículo" / "12 artículos" / "0 artículos" — a real count line for archives. */
export const formatPostCount = (count: number): string => {
  const safe = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0
  const noun = safe === 1 ? 'artículo' : 'artículos'
  return `${safe} ${noun}`
}
