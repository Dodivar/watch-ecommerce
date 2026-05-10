import { createWebHistory, createRouter } from 'vue-router'
import { isAuthenticated } from './services/maintenanceService'
import { isAdminAuthenticated } from './services/admin/adminAuthService'
import { verifyPaymentSession } from './services/stripeService'
import { getBrowsePath } from './site/siteFeatures.js'
import { getSiteConfig } from './site/getSiteConfig.js'

import HomeView from './components/HomePage.vue'
import Merci from './components/Merci.vue'
import Recherche from './components/Recherche.vue'
import WatchesCollection from './components/watch/WatchesCollection.vue'
import BrandsIndexPage from './components/watch/BrandsIndexPage.vue'
import WatchDetail from './components/watch/WatchDetail.vue'
import MaintenancePage from './components/MaintenancePage.vue'
import EstimationPage from './components/EstimationPage.vue'
import AdminLogin from './components/admin/AdminLogin.vue'
import AdminDashboard from './components/admin/AdminDashboard.vue'
import AdminWatchForm from './components/admin/AdminWatchForm.vue'
import AdminWatchStats from './components/admin/AdminWatchStats.vue'
import AdminArticleList from './components/admin/AdminArticleList.vue'
import AdminArticleForm from './components/admin/AdminArticleForm.vue'
import AdminArticleGenerator from './components/admin/AdminArticleGenerator.vue'
import BlogList from './components/BlogList.vue'
import BlogDetail from './components/BlogDetail.vue'
import EstimationProcess from './components/EstimationProcess.vue'
import APropos from './components/APropos.vue'
import PolitiqueConfidentialite from './components/PolitiqueConfidentialite.vue'
import MentionsLegales from './components/MentionsLegales.vue'
import ConditionsGeneralesUtilisation from './components/ConditionsGeneralesUtilisation.vue'
import NotFound from './components/NotFound.vue'
import PaymentSuccess from './components/payment/PaymentSuccess.vue'
import PaymentCancel from './components/payment/PaymentCancel.vue'

const { features } = getSiteConfig()
const browseFallback = getBrowsePath(features)

const routeDefinitions = [
  { path: '/maintenance', component: MaintenancePage },
  { path: '/', component: HomeView },
  { path: '/merci', component: Merci, feature: 'merci' },
  { path: '/recherche', component: Recherche, feature: 'recherche' },
  { path: '/estimation', component: EstimationPage, feature: 'estimation' },
  { path: '/estimation/processus', component: EstimationProcess, feature: 'estimationProcess' },
  { path: '/collection', component: WatchesCollection, feature: 'collection' },
  { path: '/collection/marques', component: BrandsIndexPage, feature: 'collection' },
  { path: '/watch/:id', component: WatchDetail, feature: 'collection' },
  { path: '/blog', component: BlogList, feature: 'blog' },
  { path: '/blog/:id', component: BlogDetail, feature: 'blog' },
  { path: '/a-propos', component: APropos, feature: 'about' },
  { path: '/politique-confidentialite', component: PolitiqueConfidentialite, feature: 'legal' },
  { path: '/mentions-legales', component: MentionsLegales, feature: 'legal' },
  { path: '/conditions-generales-utilisation', component: ConditionsGeneralesUtilisation, feature: 'legal' },
  { path: '/paiement-succes', component: PaymentSuccess, feature: 'paymentReturn' },
  { path: '/paiement-annule', component: PaymentCancel, feature: 'paymentReturn' },
  { path: '/admin/login', component: AdminLogin, feature: 'admin' },
  { path: '/admin', component: AdminDashboard, feature: 'admin' },
  { path: '/admin/watches/new', component: AdminWatchForm, feature: 'admin' },
  { path: '/admin/watches/:id/edit', component: AdminWatchForm, feature: 'admin' },
  { path: '/admin/watches/stats', component: AdminWatchStats, feature: 'admin' },
  { path: '/admin/articles', component: AdminArticleList, feature: 'admin' },
  { path: '/admin/articles/new', component: AdminArticleForm, feature: 'admin' },
  { path: '/admin/articles/generate', component: AdminArticleGenerator, feature: 'admin' },
  { path: '/admin/articles/:id/edit', component: AdminArticleForm, feature: 'admin' },
  { path: '/:pathMatch(.*)*', component: NotFound },
]

const routes = routeDefinitions
  .filter((def) => !def.feature || features[def.feature])
  .map((def) => {
    const route = { ...def }
    delete route.feature
    return route
  })

const router = createRouter({
  history: createWebHistory(), //createWebHashHistory(),
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
    // always scroll to top
    return {
      top: 0,
      behavior: 'instant',
    }
  },
})

// Guard de maintenance - bloque toutes les routes sauf /maintenance si non authentifié
router.beforeEach(async (to, from, next) => {
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

    // Pour toutes les autres routes admin, vérifier l'authentification
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) {
      next('/admin/login')
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

  // Vérifier l'accès aux pages de paiement (désactivé si `features.paymentReturn` est false)
  if (
    features.paymentReturn &&
    (to.path === '/paiement-succes' || to.path === '/paiement-annule')
  ) {
    // Vérifier si l'utilisateur est admin - les admins peuvent accéder sans vérification
    const isAdmin = await isAdminAuthenticated()
    if (isAdmin) {
      // Admin authentifié, autoriser l'accès directement
      next()
      return
    }

    // Pour les non-admins, vérifier les paramètres requis
    const sessionId = to.query.session_id || null
    const watchId = to.query.watch_id || null
    const token = to.query.token || null

    // Pour PaymentSuccess, session_id et watch_id sont requis
    if (to.path === '/paiement-succes') {
      if (!sessionId || !watchId) {
        console.warn('⚠️  Tentative d\'accès non autorisée à /paiement-succes sans session_id ou watch_id')
        next(browseFallback)
        return
      }

      // Vérifier la session avec le backend
      const verification = await verifyPaymentSession(sessionId, watchId, null)
      
      if (!verification.valid) {
        console.warn(`⚠️  Tentative d'accès non autorisée à /paiement-succes: ${verification.reason || 'Session invalide'}`)
        next(browseFallback)
        return
      }

      // Session valide, autoriser l'accès
      next()
      return
    }

    // Pour PaymentCancel, watch_id et token sont requis
    if (to.path === '/paiement-annule') {
      if (!watchId || !token) {
        console.warn('⚠️  Tentative d\'accès non autorisée à /paiement-annule sans watch_id ou token')
        next(browseFallback)
        return
      }

      // Vérifier le token avec le backend
      const verification = await verifyPaymentSession(null, watchId, token)
      
      if (!verification.valid) {
        console.warn(`⚠️  Tentative d'accès non autorisée à /paiement-annule: ${verification.reason || 'Token invalide'}`)
        next(browseFallback)
        return
      }

      // Token valide, autoriser l'accès
      next()
      return
    }
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
