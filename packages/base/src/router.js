import { createWebHistory, createRouter } from 'vue-router'
import { isAuthenticated } from './services/maintenanceService'
import { isAdminAuthenticated, getCurrentAdminRole } from './services/admin/adminAuthService'
import { canAccessPath } from './services/admin/adminPermissions'
import { verifyOrder } from './services/orderService'
import { getBrowsePath } from './site/siteFeatures.js'
import { getSiteConfig } from './site/getSiteConfig.js'
import { buildAppRoutes } from './site/buildAppRoutes.js'
import { resolveSeoRouteRedirect } from './site/seoRouteGuards.js'
import { getActiveLocale, getI18nConfig } from './i18n/activeLocale.js'
import { isExcludedPath, localeHistoryBase } from './i18n/localePaths.js'

const { features } = getSiteConfig()
const browseFallback = getBrowsePath(features)

const routes = buildAppRoutes(features)

const i18n = getI18nConfig()

/**
 * La langue est portée par la base de l'historique, pas par la table de routes :
 * vue-router retire `/en` des URLs entrantes et le remet sur chaque lien résolu.
 * Les routes et les `RouterLink` existants fonctionnent donc à l'identique dans les
 * trois langues (contrat vérifié par `i18n/routerLocaleBase.test.js`).
 */
const router = createRouter({
  history: createWebHistory(localeHistoryBase(getActiveLocale(), i18n, import.meta.env.BASE_URL)),
  routes,
  // eslint-disable-next-line no-unused-vars
  async scrollBehavior(to, from, savedPosition) {
    // Si on a une ancre dans l'URL sur la page d'accueil, laisser HomePage gérer le scroll
    if (to.hash && to.path === '/') {
      // Ne pas scroller immédiatement, HomePage s'en chargera après le chargement
      return false
    }

    // Pour les autres pages avec ancre, attendre que le contenu soit chargé
    if (to.hash) {
      const element = document.querySelector(to.hash)
      if (element) {
        return {
          el: to.hash,
          behavior: to.path === from.path ? 'smooth' : 'instant',
        }
      }
    }
    // Navigation qui ne change pas de page (entrée d'historique d'une visionneuse,
    // paramètres de requête) : conserver la position de lecture.
    if (to.path === from.path) {
      return false
    }

    // always scroll to top
    return {
      top: 0,
      behavior: 'instant',
    }
  },
})

// Guard de maintenance - bloque toutes les routes sauf /maintenance si non authentifié
router.beforeEach(async (to, from, next) => {
  // Le back-office reste en français : une URL `/en/admin/...` est ramenée sur `/admin/...`.
  // Navigation dure, car la base d'historique est figée à la création du routeur.
  if (getActiveLocale() !== i18n.defaultLocale && isExcludedPath(to.path, i18n)) {
    window.location.assign(`${import.meta.env.BASE_URL.replace(/\/$/, '')}${to.fullPath}`)
    return
  }

  const seoRedirect = resolveSeoRouteRedirect(to)
  if (seoRedirect) {
    next(seoRedirect)
    return
  }

  // Stocker la route précédente pour EstimationProcess
  if (to.path === '/estimation/processus' && from.path) {
    sessionStorage.setItem('estimationProcessPreviousRoute', from.path)
  }

  // Routes admin - vérifier l'authentification admin (désactivé si `features.admin` est false)
  if (features.admin && to.path.startsWith('/admin')) {
    // Si on va vers la page de login admin, autoriser l'accès
    if (to.path === '/admin/login') {
      // Si déjà authentifié, rediriger vers /admin
      const authenticated = await isAdminAuthenticated()
      if (authenticated) {
        next('/admin')
        return
      }
      next()
      return
    }

    // Demande de réinitialisation de mot de passe : accessible sans authentification.
    if (to.path === '/admin/forgot-password') {
      next()
      return
    }

    // Page de définition du mot de passe (lien d'invitation ou de
    // réinitialisation) : la session Supabase du lien existe mais pas le flag
    // admin_authenticated.
    if (to.path === '/admin/set-password') {
      next()
      return
    }

    // Pour toutes les autres routes admin, vérifier l'authentification
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      next('/admin/login')
      return
    }

    // Vérifier le rôle (accès URL directe compris) ; repli sur le tableau
    // de bord, accessible à tous les rôles.
    const role = await getCurrentAdminRole()
    if (to.path !== '/admin' && !canAccessPath(role, to.path)) {
      next('/admin')
      return
    }

    next()
    return
  }

  // Si on va vers la page de maintenance, autoriser l'accès
  if (to.path === '/maintenance') {
    next()
    return
  }

  // Pages de retour commande (désactivé si `features.paymentReturn` est false)
  if (features.paymentReturn && to.path === '/commande/succes') {
    const isAdmin = await isAdminAuthenticated()
    if (isAdmin) {
      next()
      return
    }

    const orderId = to.query.order || null
    const token = to.query.token || null
    if (!orderId || !token) {
      console.warn('⚠️  Accès /commande/succes sans order ou token')
      next(browseFallback)
      return
    }

    const verification = await verifyOrder(String(orderId), String(token))
    if (!verification.valid) {
      console.warn(
        `⚠️  Accès /commande/succes refusé: ${verification.reason || 'Commande invalide'}`,
      )
      next(browseFallback)
      return
    }
    next()
    return
  }

  if (features.paymentReturn && to.path === '/commande/annulee') {
    next()
    return
  }

  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de maintenance
  if (!isAuthenticated()) {
    next('/maintenance')
    return
  }

  // Sinon, autoriser l'accès
  next()
})

export default router
