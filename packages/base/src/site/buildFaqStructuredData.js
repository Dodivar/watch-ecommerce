/**
 * Schéma FAQPage (schema.org) pour la page /faq.
 * @param {Record<string, unknown>} siteConfig
 * @param {string} baseUrl
 */
export function buildFaqStructuredData(siteConfig, baseUrl) {
  const faq = siteConfig?.faq ?? {}
  const items = Array.isArray(faq.items) ? faq.items : []
  if (!items.length) return null

  const brand = siteConfig?.brand ?? {}
  const siteName = brand.displayName || brand.legalName || 'Boutique'

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: faq.heading || 'Questions fréquentes',
    url: `${baseUrl}/faq`,
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: baseUrl,
    },
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: stripHtml(item.question),
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripHtml(item.answer),
      },
    })),
  }
}

function stripHtml(value) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
