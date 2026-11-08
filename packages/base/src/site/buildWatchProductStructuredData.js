/**
 * Schéma `Product` d'une fiche montre.
 *
 * Extrait de `WatchDetail.vue` pour rejoindre les autres constructeurs JSON-LD du dossier
 * (`buildGlobalStructuredData`, `buildFaqStructuredData`, `buildBreadcrumbStructuredData`…) :
 * ce sont des fonctions pures, donc testables sans monter le composant.
 *
 * Aucun import en `@/` : `api/render-page.js` charge ce module dans Node. L'état est donc reçu
 * déjà traduit (`resolveConditionSchemaValue`, `i18n/watchSpecs.js`), dont la chaîne d'imports
 * passe par les alias Vite.
 */

/**
 * @param {object} input
 * @param {Record<string, any>} input.watch Fiche montre normalisée.
 * @param {number} input.price Prix effectif (promotion incluse) ; `0` ou négatif = pas de prix.
 * @param {string} input.canonicalUrl URL canonique de la fiche.
 * @param {string} input.baseUrl Origine du site, pour le vendeur.
 * @param {string} input.sellerName `seo.watchDetail.structuredDataSellerName` du manifest.
 * @param {string} input.unknownBrandLabel Libellé de repli pour une montre sans marque.
 * @param {import('./watchCatalogDisplay.js').WatchSaleState} [input.saleState] État de vente
 *   (`resolveWatchSaleState`). Seul `available` vaut `InStock` : une montre en arrivage ou en
 *   rupture n'est pas commandable, et l'annoncer en stock à Google serait faux. À défaut, repli
 *   sur `isAvailable && !isSold`.
 * @param {'new' | 'used' | null} [input.conditionSchema] État en vocabulaire schema.org,
 *   tel que rendu par `resolveConditionSchemaValue(watch.condition)`.
 * @returns {Record<string, any> | null}
 */
export function buildWatchProductStructuredData({
  watch,
  price,
  canonicalUrl,
  baseUrl,
  sellerName,
  unknownBrandLabel,
  saleState,
  conditionSchema = null,
}) {
  if (!watch) return null

  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: watch.name,
    description: watch.description || `${watch.brand ?? ''} ${watch.reference ?? ''}`.trim(),
    image: watch.images || [],
    brand: {
      '@type': 'Brand',
      name: watch.brand || unknownBrandLabel,
    },
    sku: watch.reference || watch.id,
    // Page canonique du produit : ce que Google rattache à la fiche.
    url: canonicalUrl,
  }

  // La référence horlogère est la référence constructeur ; `sku` et `mpn` coïncident donc
  // quand elle est renseignée, mais Google lit les deux.
  if (watch.reference) product.mpn = watch.reference

  /**
   * Offre omise plutôt que chiffrée à zéro : `getEffectiveWatchPrice` rend `0` pour une montre
   * sans prix (pièce sur demande), et déclarer « 0 € » à Google est faux. Un `Product` sans
   * `offers` reste valide — il perd l'enrichissement prix, ce qui est exactement le cas ici.
   */
  if (Number.isFinite(price) && price > 0) {
    product.offers = {
      '@type': 'Offer',
      price,
      priceCurrency: 'EUR',
      availability: (saleState ? saleState === 'available' : watch.isAvailable && !watch.isSold)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
      seller: {
        '@type': 'Organization',
        name: sellerName,
        url: baseUrl,
      },
    }
  }

  // État : passé par le vocabulaire en amont, pour que « neuf » ou « Comme neuf » ne soient pas
  // silencieusement rangés en occasion par une comparaison de chaîne exacte.
  if (conditionSchema) {
    product.itemCondition =
      conditionSchema === 'new'
        ? 'https://schema.org/NewCondition'
        : 'https://schema.org/UsedCondition'
  }

  return product
}
