import type { ConsentStatus } from './consent.model'

export type AdPersonalization = 'personalized' | 'non-personalized'

/*
 * The single consent -> ads personalization decision for the whole
 * project — AdSense (src/components/ads/providers/AdSenseProvider.tsx) and
 * GPT (BLO-146) both derive their personalization flag from this helper;
 * do not create a second one.
 *
 * Decided 2026-09-19 (project owner): only an explicit accept earns
 * personalized ads. An unanswered banner (status is null) and an explicit
 * reject both get non-personalized ads — never zero ads. See BLO-193.
 */
export const getAdPersonalization = (status: ConsentStatus | null): AdPersonalization =>
  status === 'accepted' ? 'personalized' : 'non-personalized'
