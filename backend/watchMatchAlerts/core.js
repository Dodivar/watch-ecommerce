/**
 * Pont vers le noyau de correspondance du socle, en ESM.
 *
 * « Cette montre correspond-elle à ces critères ? » a **une** réponse, écrite une fois dans
 * `packages/base/src/utils/watchMatchCore.js` et partagée avec le parcours front. La
 * réimplémenter ici serait le moyen le plus sûr d'envoyer un jour des e-mails que la vitrine
 * n'aurait jamais proposés : les deux dériveraient sans qu'aucun test ne s'en aperçoive.
 *
 * Le socle est en ESM, ce module en CommonJS : on passe donc par un `import()` dynamique,
 * mémoïsé, exactement comme `sites/registry.js` charge les helpers i18n du socle. C'est ce qui
 * impose au noyau de n'utiliser que des imports relatifs — Node ne sait pas résoudre les alias
 * `@/` de Vite. `packages/base/src/utils/watchMatchCore.test.js` monte la garde là-dessus.
 */

const path = require('path')
const { pathToFileURL } = require('url')

const BASE_SRC = path.join(__dirname, '..', '..', 'packages', 'base', 'src')

/** @type {Promise<object> | null} */
let modulesPromise = null

/**
 * Charge (une seule fois) le noyau de correspondance et les textes localisés de l'alerte.
 *
 * @returns {Promise<{
 *   sanitizePreferences: Function,
 *   hasAnyPreference: Function,
 *   matchesPreferences: Function,
 *   measureAffinity: Function,
 *   buildMatchWatchFromRow: Function,
 *   normalizeAlertLocale: Function,
 *   buildMatchAlertEmailCopy: Function,
 *   buildMatchAlertUnsubscribeCopy: Function,
 *   MATCH_ALERT_LOCALES: string[],
 * }>}
 */
function loadMatchCore() {
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import(pathToFileURL(path.join(BASE_SRC, 'utils', 'watchMatchCore.js')).href),
      import(pathToFileURL(path.join(BASE_SRC, 'i18n', 'watchMatchAlertEmail.js')).href),
    ]).then(([core, copy]) => ({
      sanitizePreferences: core.sanitizePreferences,
      hasAnyPreference: core.hasAnyPreference,
      matchesPreferences: core.matchesPreferences,
      measureAffinity: core.measureAffinity,
      buildMatchWatchFromRow: core.buildMatchWatchFromRow,
      normalizeAlertLocale: copy.normalizeAlertLocale,
      buildMatchAlertEmailCopy: copy.buildMatchAlertEmailCopy,
      buildMatchAlertUnsubscribeCopy: copy.buildMatchAlertUnsubscribeCopy,
      MATCH_ALERT_LOCALES: copy.MATCH_ALERT_LOCALES,
    }))
  }
  return modulesPromise
}

/**
 * L'alerte est-elle active pour ce site ? Les drapeaux vivent dans le manifest brut :
 * `normalizeSiteConfig` ne remonte pas `features`, le backend n'en avait pas besoin jusqu'ici.
 *
 * `watchMatchmaking` est exige en plus, comme le fait `mergeSiteFeatures` cote socle : sans le
 * parcours, personne ne peut s'etre inscrit, et une alerte allumee seule n'est qu'une faute de
 * configuration.
 *
 * @param {object} site
 * @returns {boolean}
 */
function isMatchAlertsEnabled(site) {
  const features = site?.config?.raw?.features || {}
  return features.watchMatchAlerts === true && features.watchMatchmaking === true
}

module.exports = { loadMatchCore, isMatchAlertsEnabled, BASE_SRC }
