/**
 * Schéma BreadcrumbList (schema.org).
 * @param {string} baseUrl — sans slash final
 * @param {{ name: string, path: string }[]} items — du plus général au plus spécifique
 */
export function buildBreadcrumbStructuredData(baseUrl, items) {
  if (!items?.length) return null

  const origin = baseUrl.replace(/\/$/, '')

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${origin}${item.path.startsWith('/') ? item.path : `/${item.path}`}`,
    })),
  }
}
