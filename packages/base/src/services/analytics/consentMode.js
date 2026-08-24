/**
 * Consent Mode v2 (Google), implémentation « basic ».
 *
 * « Basic » : `gtag.js` n’est chargé qu’après un consentement — on conserve donc le
 * comportement de blocage historique du site. Le mode « advanced » chargerait le script pour
 * tout le monde afin d’envoyer des pings sans cookie ; ce n’est pas retenu ici, cela revient à
 * exécuter un script Google avant tout consentement.
 *
 * Les signaux `default` sont poussés dans `dataLayer` avant toute autre commande, puis mis à
 * jour au choix de l’utilisateur. Sans eux, Google Ads ne peut plus diffuser dans l’EEE.
 */

import { ensureGtagStub, pushGtag } from './gtag.js'

/** Finalités publicitaires, pilotées par la case « marketing » du bandeau. */
const AD_SIGNALS = ['ad_storage', 'ad_user_data', 'ad_personalization']

/** Finalité mesure d’audience, pilotée par la case « mesure d’audience ». */
const ANALYTICS_SIGNALS = ['analytics_storage']

/**
 * État par défaut : tout refusé. À pousser le plus tôt possible, avant tout `config`.
 */
export function pushConsentDefault() {
  ensureGtagStub()
  const denied = {}
  for (const key of [...AD_SIGNALS, ...ANALYTICS_SIGNALS]) {
    denied[key] = 'denied'
  }
  pushGtag('consent', 'default', {
    ...denied,
    // Laisse au choix mémorisé le temps d’être appliqué avant le premier envoi.
    wait_for_update: 500,
  })
}

/**
 * Applique le choix de l’utilisateur.
 * @param {{ analytics: boolean, marketing: boolean }} params
 */
export function pushConsentUpdate({ analytics, marketing }) {
  ensureGtagStub()
  const signals = {}
  for (const key of ANALYTICS_SIGNALS) {
    signals[key] = analytics ? 'granted' : 'denied'
  }
  for (const key of AD_SIGNALS) {
    signals[key] = marketing ? 'granted' : 'denied'
  }
  pushGtag('consent', 'update', signals)
}
