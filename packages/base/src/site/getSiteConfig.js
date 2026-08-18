import siteConfig from '@site-config'

import { getActiveLocale } from '@/i18n/activeLocale.js'
import { resolveSiteConfig } from './resolveSiteConfig.js'

export { resolveSiteConfig } from './resolveSiteConfig.js'

/** Un manifest résolu par langue : une page ne parle qu’une langue, mais les tests en croisent plusieurs. */
const cache = new Map()

/**
 * Returns the active site manifest. Resolved at build time from `sites/<SITE_ID>/site.config.js`.
 * `features.faq` est dérivé de `faq.enabled` et de la présence d’au moins une entrée (`faq.items`).
 * `home.sections` est la liste validée depuis `site.config` ; vide si `home` absent ou sans sections.
 *
 * Les textes déclarés via `t({ fr, en, de })` sont déjà aplatis dans la langue active : les
 * composants lisent des chaînes ordinaires et n’ont pas à connaître l’i18n.
 *
 * C’est ici — et non dans `main.js` — que la langue est résolue : `packages/base/src/config.js`
 * appelle `getSiteConfig()` au chargement du module, donc avant toute instruction de `main.js`.
 *
 * @param {string} [locale] Force une langue (tests, pré-rendu). Par défaut : la langue active.
 */
export function getSiteConfig(locale) {
  const active = locale || getActiveLocale()
  if (!cache.has(active)) {
    cache.set(active, resolveSiteConfig(siteConfig, active))
  }
  return cache.get(active)
}
