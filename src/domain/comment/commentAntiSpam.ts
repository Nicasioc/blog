// Honeypot + minimum fill time. Both signals are client-supplied, so this only stops naive bots.
export const MIN_FILL_TIME_MS = 3000

export type BotReason = 'honeypot' | 'too_fast'

type AntiSpamSignals = {
  website?: string
  renderedAt: number
}

export const detectBotReason = (signals: AntiSpamSignals, now: number): BotReason | null => {
  if (signals.website && signals.website.trim() !== '') return 'honeypot'

  const elapsedMs = now - signals.renderedAt
  // A negative value means the client clock is ahead of the server's. Real visitors can have
  // skewed clocks, and a bot can send any timestamp anyway, so only drop clearly fast posts.
  if (elapsedMs >= 0 && elapsedMs < MIN_FILL_TIME_MS) return 'too_fast'

  return null
}
