/**
 * Pages prestation `/services/:slug` — une page par métier de l'atelier (réparation, pile,
 * étanchéité, bracelets…), déclarées par le client dans `servicesPage.landings`.
 *
 * Pourquoi des pages séparées plutôt que des ancres sur `/services` : une requête locale
 * (« changement pile montre Strasbourg ») a besoin d'une page qui ne parle que de ça — titre,
 * tarifs, délai et FAQ compris. Une ancre partage l'URL, le title et la meta description de la
 * page mère, donc ne se positionne sur rien.
 *
 * Le socle ne connaît aucune prestation : tout vient du manifest, ce module se contente de
 * normaliser (slugs valides, doublons écartés, tableaux garantis).
 */

/** Slug d'URL : minuscules, chiffres et tirets simples. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** @param {unknown} value */
function cleanString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

/** @param {unknown} value */
function cleanArray(value) {
  return Array.isArray(value) ? value.filter((entry) => entry && typeof entry === 'object') : []
}

/** @param {Record<string, unknown>} raw */
function normalizeLanding(raw) {
  const slug = cleanString(raw.slug)
  const hero = raw.hero && typeof raw.hero === 'object' ? raw.hero : {}
  const title = cleanString(hero.title)
  if (!SLUG_PATTERN.test(slug) || !title) return null

  const pricing = raw.pricing && typeof raw.pricing === 'object' ? raw.pricing : null

  return {
    slug,
    path: `/services/${slug}`,
    sectionId: cleanString(raw.sectionId),
    icon: cleanString(raw.icon) || cleanString(raw.sectionId),
    navLabel: cleanString(raw.navLabel) || title,
    navDescription: cleanString(raw.navDescription),
    /** Valeur pré-sélectionnée dans le formulaire de prise en charge. */
    repairService: cleanString(raw.repairService),
    hero: {
      eyebrow: cleanString(hero.eyebrow),
      title,
      lead: cleanString(hero.lead),
    },
    highlights: cleanArray(raw.highlights).map((entry) => ({
      label: cleanString(entry.label),
      value: cleanString(entry.value),
      detail: cleanString(entry.detail),
    })),
    body: cleanArray(raw.body).map((entry) => ({
      title: cleanString(entry.title),
      text: cleanString(entry.text),
    })),
    pricing: pricing
      ? {
          title: cleanString(pricing.title),
          note: cleanString(pricing.note),
          items: cleanArray(pricing.items).map((entry) => ({
            label: cleanString(entry.label),
            price: cleanString(entry.price),
            detail: cleanString(entry.detail),
          })),
        }
      : null,
    faq: cleanArray(raw.faq)
      .map((entry) => ({
        question: cleanString(entry.question),
        answer: cleanString(entry.answer),
      }))
      .filter((entry) => entry.question && entry.answer),
    seo: raw.seo && typeof raw.seo === 'object' ? raw.seo : null,
  }
}

/**
 * Pages prestation valides du manifest, dans l'ordre déclaré.
 * @param {Record<string, any>} siteConfig
 * @returns {ReturnType<typeof normalizeLanding>[]}
 */
export function resolveServiceLandings(siteConfig) {
  const raw = siteConfig?.servicesPage?.landings
  if (!Array.isArray(raw)) return []

  const seen = new Set()
  const landings = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const landing = normalizeLanding(entry)
    // Deux pages sur le même slug : la seconde serait inatteignable, autant l'ignorer tout de suite.
    if (!landing || seen.has(landing.slug)) continue
    seen.add(landing.slug)
    landings.push(landing)
  }
  return landings
}

/**
 * @param {ReturnType<typeof resolveServiceLandings>} landings
 * @param {string | undefined} slug
 */
export function findServiceLanding(landings, slug) {
  const wanted = cleanString(slug)
  if (!wanted) return null
  return landings.find((landing) => landing.slug === wanted) || null
}

/**
 * Pages prestation autres que celle affichée — maillage interne en pied de page prestation.
 * @param {ReturnType<typeof resolveServiceLandings>} landings
 * @param {string} currentSlug
 */
export function listRelatedServiceLandings(landings, currentSlug) {
  return landings.filter((landing) => landing.slug !== currentSlug)
}
