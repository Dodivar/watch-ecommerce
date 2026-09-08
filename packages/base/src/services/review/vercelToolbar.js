/**
 * Barre Vercel (commentaires de relecture) sur le site en production.
 *
 * Vercel affiche sa barre d'outils d'office sur les *previews* ; en production, c'est au
 * site de l'injecter. On le fait sous double condition :
 *
 * 1. le projet Vercel est identifié — `VITE_VERCEL_TOOLBAR_OWNER_ID` et
 *    `VITE_VERCEL_TOOLBAR_PROJECT_ID`, renseignés par déploiement (un projet Vercel par
 *    client) ; sans eux, rien n'est chargé ;
 * 2. le visiteur a explicitement demandé le mode relecture — `?relecture=1`, mémorisé
 *    ensuite pour ce navigateur, et annulé par `?relecture=0`.
 *
 * Le script porte `data-explicit-opt-in` : même chargé, il ne s'affiche que pour un compte
 * Vercel ayant accès au projet. Un visiteur qui tomberait sur le paramètre ne voit donc
 * rien et n'est jamais invité à se connecter.
 *
 * Aucun cookie de mesure n'est posé : ce chargement ne relève pas du bandeau de
 * consentement, contrairement à `googleAnalytics.js` ou `metaPixel.js`.
 *
 * Marche à suivre côté client et limites du plan Vercel :
 * documentation/relecture-client.md
 */

import { VERCEL_TOOLBAR_BRANCH, VERCEL_TOOLBAR_OWNER_ID, VERCEL_TOOLBAR_PROJECT_ID } from '@/config'

/** Paramètre d'URL qui ouvre (ou ferme) le mode relecture. */
export const REVIEW_MODE_PARAM = 'relecture'

/** Clé de mémorisation du choix, pour que le mode survive à la navigation. */
export const REVIEW_MODE_STORAGE_KEY = 'vercel_toolbar_relecture'

const TOOLBAR_SCRIPT_SRC = 'https://vercel.live/_next-live/feedback/feedback.js'

const ENABLING_VALUES = new Set(['1', 'true', 'on', 'oui'])
const DISABLING_VALUES = new Set(['0', 'false', 'off', 'non'])

/**
 * `localStorage` peut lever (Safari en navigation privée, cookies bloqués) : le mode
 * relecture ne doit jamais casser la page pour autant.
 */
function defaultStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function readStored(storage) {
  try {
    return storage?.getItem(REVIEW_MODE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeStored(storage, enabled) {
  try {
    if (enabled) storage?.setItem(REVIEW_MODE_STORAGE_KEY, '1')
    else storage?.removeItem(REVIEW_MODE_STORAGE_KEY)
  } catch {
    // Stockage indisponible : le mode vaudra pour la page en cours seulement.
  }
}

/**
 * Détermine si le mode relecture est actif.
 *
 * Le paramètre d'URL fait autorité et devient le choix mémorisé ; une valeur non reconnue
 * est ignorée, comme s'il n'y avait pas de paramètre.
 *
 * @param {{ search?: string, storage?: Storage | null }} [params]
 * @returns {boolean}
 */
export function resolveReviewMode({ search = '', storage = defaultStorage() } = {}) {
  const raw = new URLSearchParams(search).get(REVIEW_MODE_PARAM)
  if (raw === null) return readStored(storage)

  const value = raw.trim().toLowerCase()
  if (DISABLING_VALUES.has(value) || value === '') {
    writeStored(storage, false)
    return false
  }
  if (ENABLING_VALUES.has(value)) {
    writeStored(storage, true)
    return true
  }
  return readStored(storage)
}

/**
 * Injecte la barre Vercel si le mode relecture est actif et le projet identifié.
 *
 * Idempotent : un seul script, quels que soient les appels répétés.
 *
 * `container` n'existe que pour les tests, qui injectent dans un nœud détaché : en
 * production, la barre appartient au `<head>`.
 *
 * @param {{
 *   ownerId?: string,
 *   projectId?: string,
 *   branch?: string,
 *   search?: string,
 *   storage?: Storage | null,
 *   container?: ParentNode,
 * }} [params]
 * @returns {boolean} `true` si le script vient d'être injecté.
 */
export function ensureReviewToolbar({
  ownerId = VERCEL_TOOLBAR_OWNER_ID,
  projectId = VERCEL_TOOLBAR_PROJECT_ID,
  branch = VERCEL_TOOLBAR_BRANCH,
  search = typeof window === 'undefined' ? '' : window.location.search,
  storage = defaultStorage(),
  container = typeof document === 'undefined' ? null : document.head,
} = {}) {
  if (typeof document === 'undefined') return false
  if (!resolveReviewMode({ search, storage })) return false

  if (!ownerId || !projectId) {
    if (import.meta.env.DEV) {
      console.info(
        '[relecture] Mode relecture demandé, mais VITE_VERCEL_TOOLBAR_OWNER_ID / VITE_VERCEL_TOOLBAR_PROJECT_ID sont absents : barre Vercel non chargée.',
      )
    }
    return false
  }

  if (!container) return false
  if (container.querySelector(`script[src="${TOOLBAR_SCRIPT_SRC}"]`)) return false

  const script = document.createElement('script')
  script.src = TOOLBAR_SCRIPT_SRC
  // Sans cet attribut, le script inviterait tout visiteur à se connecter à Vercel.
  script.setAttribute('data-explicit-opt-in', 'true')
  script.setAttribute('data-owner-id', ownerId)
  script.setAttribute('data-project-id', projectId)
  // La branche range les fils de commentaires : à laisser vide plutôt qu'à deviner.
  if (branch) script.setAttribute('data-branch', branch)
  container.appendChild(script)
  return true
}
