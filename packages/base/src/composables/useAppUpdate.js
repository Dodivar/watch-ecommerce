/**
 * Détection d'un déploiement survenu pendant que la page était ouverte.
 *
 * L'état est un singleton de module : plusieurs composants peuvent l'observer sans
 * multiplier les appels réseau, et le drapeau survit à une navigation interne.
 *
 * Quand vérifier — le retour sur l'onglet, pas une horloge. Le cas visé est celui d'un
 * onglet laissé ouvert des jours durant : personne ne regarde pendant ce temps, et
 * réveiller la page toutes les cinq minutes pour rien ne ferait que consommer de la
 * batterie. Un relevé périodique reste, très espacé, pour l'onglet réellement resté sous
 * les yeux.
 */
import { getCurrentInstance, onMounted, onUnmounted, readonly, ref } from 'vue'

import { APP_VERSION, fetchDeployedVersion } from '@/services/appVersion.js'

/** Intervalle minimum entre deux vérifications déclenchées par un événement. */
export const CHECK_THROTTLE_MS = 5 * 60 * 1000

/** Relevé périodique d'un onglet resté au premier plan. */
export const POLL_INTERVAL_MS = 30 * 60 * 1000

const updateAvailable = ref(false)
const dismissed = ref(false)

/** Lecture seule de l'état partagé — utilisable hors composant (tests, services). */
export const isUpdateAvailable = readonly(updateAvailable)
export const isDismissed = readonly(dismissed)

let lastCheckedAt = 0
let pendingCheck = null
let pollTimer = null
let subscribers = 0

/** Réinitialise l'état du module — réservé aux tests. */
export function resetAppUpdateState() {
  updateAvailable.value = false
  dismissed.value = false
  lastCheckedAt = 0
  pendingCheck = null
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
  subscribers = 0
}

/**
 * La vérification n'a de sens que sur un bundle issu d'un build (donc versionné) et dans
 * un navigateur. En développement et sous vitest, elle ne s'arme pas.
 *
 * @returns {boolean}
 */
export function isVersionCheckSupported() {
  return Boolean(APP_VERSION) && typeof window !== 'undefined'
}

/**
 * Compare la version déployée à celle du bundle chargé.
 *
 * @param {{ force?: boolean }} [options] `force` ignore l'intervalle minimum.
 * @returns {Promise<void>}
 */
export async function checkForUpdate(options = {}) {
  // Une fois la mise à jour vue, rien ne la dé-verra : inutile de continuer à interroger.
  if (!isVersionCheckSupported() || updateAvailable.value) return
  if (pendingCheck) return pendingCheck

  const now = Date.now()
  if (!options.force && lastCheckedAt !== 0 && now - lastCheckedAt < CHECK_THROTTLE_MS) return
  lastCheckedAt = now

  pendingCheck = fetchDeployedVersion()
    .then((deployed) => {
      // `null` = version illisible (hors ligne, 404 sur un déploiement d'avant ce
      // dispositif) : surtout ne rien annoncer sur cette base.
      if (deployed && deployed !== APP_VERSION) {
        updateAvailable.value = true
      }
    })
    .finally(() => {
      pendingCheck = null
    })

  return pendingCheck
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') checkForUpdate()
}

function startWatching() {
  if (!isVersionCheckSupported()) return
  subscribers += 1
  if (subscribers > 1) return

  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('focus', onVisibilityChange)
  pollTimer = setInterval(() => checkForUpdate(), POLL_INTERVAL_MS)
}

function stopWatching() {
  if (!isVersionCheckSupported()) return
  subscribers = Math.max(0, subscribers - 1)
  if (subscribers > 0) return

  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('focus', onVisibilityChange)
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
}

/**
 * @returns {{
 *   isUpdateAvailable: import('vue').Ref<boolean>,
 *   isDismissed: import('vue').Ref<boolean>,
 *   dismiss: () => void,
 *   reload: () => void,
 *   check: (options?: { force?: boolean }) => Promise<void>,
 * }}
 */
export function useAppUpdate() {
  // Appelable hors composant (tests, code de service) : sans instance courante, il n'y a
  // pas de cycle de vie auquel accrocher la surveillance, seulement l'état à lire.
  if (getCurrentInstance()) {
    onMounted(() => {
      startWatching()
      // Premier relevé au montage : une page ouverte depuis un cache navigateur périmé est
      // déjà en retard à la seconde où elle s'affiche.
      checkForUpdate({ force: true })
    })

    onUnmounted(stopWatching)
  }

  return {
    isUpdateAvailable,
    isDismissed,
    dismiss: () => {
      dismissed.value = true
    },
    /** Recharge depuis le serveur — l'HTML est servi `must-revalidate`, le bundle suivra. */
    reload: () => window.location.reload(),
    check: checkForUpdate,
  }
}
