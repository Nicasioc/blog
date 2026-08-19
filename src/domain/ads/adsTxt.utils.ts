const GOOGLE_CERTIFICATION_AUTHORITY_ID = 'f08c47fec0942fa0'

export const buildAdsTxtContent = (adSensePublisherId: string | undefined): string | null => {
  if (!adSensePublisherId) return null

  const pubId = adSensePublisherId.replace(/^ca-/, '')
  return `google.com, ${pubId}, DIRECT, ${GOOGLE_CERTIFICATION_AUTHORITY_ID}\n`
}
