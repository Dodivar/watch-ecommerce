import { getSiteConfig } from '@/site/getSiteConfig.js'
import { ensureGtagStub, pushGtag } from '@/services/analytics/gtag.js'

function initFlagName() {
  return getSiteConfig().integrations.gaInitFlag
}

function pendingWaitersKey() {
  return getSiteConfig().integrations.gaPendingWaitersKey
}

function pagePath() {
  return `${window.location.pathname}${window.location.search}`
}

/**
 * Charge gtag.js et envoie une config pour la page courante.
 *
 * Le même script sert GA4 (`G-…`) et Google Ads (`AW-…`) : deux `config`, un seul chargement.
 * L’un ou l’autre suffit à justifier l’injection — un marchand peut n’avoir qu’Ads.
 *
 * Idempotent : un seul script ; appels concurrents avant onload n’envoient qu’une page vue.
 *
 * @param {string | undefined} measurementId — ex. G-XXXXXXXX
 * @param {string | undefined} [adsId] — ex. AW-123456789
 */
export function ensureGoogleAnalytics(measurementId, adsId) {
  if (!measurementId && !adsId) {
    if (import.meta.env.DEV) {
      console.info(
        `${getSiteConfig().integrations.gaDevLogPrefix} Google Analytics : VITE_GA_ID absent, chargement ignoré.`,
      )
    }
    return
  }

  ensureGtagStub()

  const applyConfig = () => {
    if (measurementId) {
      pushGtag('config', measurementId, {
        page_path: pagePath(),
        send_page_view: true,
      })
    }
    if (adsId) {
      pushGtag('config', adsId)
    }
  }

  const INIT_FLAG = initFlagName()
  if (window[INIT_FLAG]) {
    applyConfig()
    return
  }

  const pendingKey = pendingWaitersKey()
  const pending = (window[pendingKey] = window[pendingKey] || [])
  pending.push(1)

  if (pending.length > 1) {
    return
  }

  // L’URL du script accepte n’importe lequel des deux identifiants : les `config` qui suivent
  // décident réellement des destinations servies.
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId || adsId)}`
  script.onload = () => {
    window[INIT_FLAG] = true
    pushGtag('js', new Date())
    window[pendingKey] = []
    applyConfig()
  }
  document.head.appendChild(script)
}
