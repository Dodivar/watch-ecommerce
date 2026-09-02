/**
 * Textes de l'alerte « coup de foudre » : l'e-mail de nouveauté et les pages de désinscription.
 *
 * Le backend est monolingue par défaut (il travaille sur la langue du site), mais une alerte
 * n'est pas un e-mail transactionnel : elle part dans la langue où le visiteur a laissé son
 * adresse, stockée sur la ligne `watch_match_alerts.locale`. Ce module est donc le seul endroit
 * où le backend choisit une langue — en s'appuyant sur les mêmes catalogues que la vitrine,
 * plutôt que sur des chaînes recopiées dans un template.
 *
 * **Sans alias**, comme `utils/watchMatchCore.js` et pour la même raison : il est chargé par
 * `import()` dynamique depuis le backend CommonJS. `@/i18n` ne conviendrait pas de toute façon,
 * son singleton étant figé sur la langue de la page courante — ici, chaque envoi a la sienne.
 *
 * Les clés sont écrites en toutes lettres : `messages/messageUsage.test.js` ne voit que les
 * littéraux entre apostrophes simples, et une clé qu'il ne voit pas passe pour orpheline.
 */

import { MESSAGE_CATALOGS } from './messages/index.js'
import { createTranslator } from './translator.js'

/**
 * Langues admises pour une alerte — l'exacte contrainte CHECK de `watch_match_alerts.locale`.
 * Une valeur hors liste ferait échouer l'insertion en base, pas la validation : on la ramène
 * ici, au bord, plutôt que de laisser une requête publique provoquer un 500.
 */
export const MATCH_ALERT_LOCALES = ['fr', 'en', 'de']

/** Langue de repli : celle du catalogue de référence. */
export const MATCH_ALERT_FALLBACK_LOCALE = 'fr'

/**
 * @param {unknown} raw
 * @returns {string} Une langue de `MATCH_ALERT_LOCALES`, toujours.
 */
export function normalizeAlertLocale(raw) {
  const code = String(raw ?? '')
    .trim()
    .toLowerCase()
    .slice(0, 2)
  return MATCH_ALERT_LOCALES.includes(code) ? code : MATCH_ALERT_FALLBACK_LOCALE
}

/**
 * @param {unknown} locale
 * @returns {{ t: Function, tc: Function, locale: string }}
 */
function translatorFor(locale) {
  return createTranslator({
    locale: normalizeAlertLocale(locale),
    fallbackLocale: MATCH_ALERT_FALLBACK_LOCALE,
    catalogs: MESSAGE_CATALOGS,
  })
}

/**
 * Textes de l'e-mail de nouveauté, accordés au nombre de montres annoncées.
 *
 * @param {unknown} locale
 * @param {{ count: number, hiddenCount?: number, brandName?: string }} params
 *   `hiddenCount` : montres correspondantes non détaillées dans l'e-mail (voir le template).
 * @returns {{ lang: string, subject: string, title: string, intro: string, seeWatch: string,
 *   more: string, browse: string, reason: string, unsubscribe: string }}
 */
export function buildMatchAlertEmailCopy(locale, { count, hiddenCount = 0, brandName = '' } = {}) {
  const { t, tc, locale: lang } = translatorFor(locale)
  const total = Number.isFinite(count) && count > 0 ? count : 1
  return {
    lang,
    subject: tc('matchmaking.alertEmail.subject', total, { brand: brandName }),
    title: tc('matchmaking.alertEmail.title', total),
    intro: t('matchmaking.alertEmail.intro'),
    seeWatch: t('matchmaking.alertEmail.seeWatch'),
    more: hiddenCount > 0 ? tc('matchmaking.alertEmail.more', hiddenCount) : '',
    browse: t('matchmaking.alertEmail.browse'),
    reason: t('matchmaking.alertEmail.reason'),
    unsubscribe: t('matchmaking.alertEmail.unsubscribe'),
  }
}

/**
 * Textes des pages de désinscription, servies par le backend en HTML brut.
 *
 * Chaque état de la page est nommé pour que l'appelant n'ait pas à composer des clés : une clé
 * calculée serait invisible pour `messageUsage.test.js`.
 *
 * @param {unknown} locale
 * @returns {Record<'confirm' | 'done' | 'already' | 'invalid' | 'unknown' | 'error' | 'unavailable',
 *   { title: string, text: string }> & { lang: string, confirmButton: string }}
 */
export function buildMatchAlertUnsubscribeCopy(locale) {
  const { t, locale: lang } = translatorFor(locale)
  return {
    lang,
    confirmButton: t('matchmaking.alertUnsubscribe.confirmButton'),
    confirm: {
      title: t('matchmaking.alertUnsubscribe.confirmTitle'),
      text: t('matchmaking.alertUnsubscribe.confirmText'),
    },
    done: {
      title: t('matchmaking.alertUnsubscribe.doneTitle'),
      text: t('matchmaking.alertUnsubscribe.doneText'),
    },
    already: {
      title: t('matchmaking.alertUnsubscribe.alreadyTitle'),
      text: t('matchmaking.alertUnsubscribe.alreadyText'),
    },
    invalid: {
      title: t('matchmaking.alertUnsubscribe.invalidTitle'),
      text: t('matchmaking.alertUnsubscribe.invalidText'),
    },
    unknown: {
      title: t('matchmaking.alertUnsubscribe.unknownTitle'),
      text: t('matchmaking.alertUnsubscribe.unknownText'),
    },
    error: {
      title: t('matchmaking.alertUnsubscribe.errorTitle'),
      text: t('matchmaking.alertUnsubscribe.errorText'),
    },
    unavailable: {
      title: t('matchmaking.alertUnsubscribe.unavailableTitle'),
      text: t('matchmaking.alertUnsubscribe.unavailableText'),
    },
  }
}
