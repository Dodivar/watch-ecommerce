import MaintenancePage from '@/components/MaintenancePage.vue'
import HomeView from '@/components/HomePage.vue'
import Merci from '@/components/Merci.vue'
import Recherche from '@/components/Recherche.vue'
import WatchesCollection from '@/components/watch/WatchesCollection.vue'
import WatchSearchResultsPage from '@/components/watch/WatchSearchResultsPage.vue'
import BrandsIndexPage from '@/components/watch/BrandsIndexPage.vue'
import WatchDetail from '@/components/watch/WatchDetail.vue'
import EstimationPage from '@/components/EstimationPage.vue'
import AdminLogin from '@/components/admin/AdminLogin.vue'
import AdminDashboard from '@/components/admin/AdminDashboard.vue'
import AdminWatchesList from '@/components/admin/AdminWatchesList.vue'
import AdminWatchForm from '@/components/admin/AdminWatchForm.vue'
import AdminWatchStats from '@/components/admin/AdminWatchStats.vue'
import AdminArticleList from '@/components/admin/AdminArticleList.vue'
import AdminArticleForm from '@/components/admin/AdminArticleForm.vue'
import AdminArticleGenerator from '@/components/admin/AdminArticleGenerator.vue'
import AdminOrdersList from '@/components/admin/AdminOrdersList.vue'
import AdminOrderDetail from '@/components/admin/AdminOrderDetail.vue'
import AdminLeadsList from '@/components/admin/AdminLeadsList.vue'
import AdminLeadDetail from '@/components/admin/AdminLeadDetail.vue'
import AdminPromoList from '@/components/admin/AdminPromoList.vue'
import AdminPromoForm from '@/components/admin/AdminPromoForm.vue'
import AdminHomeFeatured from '@/components/admin/AdminHomeFeatured.vue'
import AdminUsersList from '@/components/admin/AdminUsersList.vue'
import BlogList from '@/components/BlogList.vue'
import BlogDetail from '@/components/BlogDetail.vue'
import EstimationProcess from '@/components/EstimationProcess.vue'
import APropos from '@/components/APropos.vue'
import PolitiqueConfidentialite from '@/components/PolitiqueConfidentialite.vue'
import MentionsLegales from '@/components/MentionsLegales.vue'
import ConditionsGeneralesUtilisation from '@/components/ConditionsGeneralesUtilisation.vue'
import ContactPage from '@/components/ContactPage.vue'
import FaqPage from '@/components/FaqPage.vue'
import ServicesPage from '@/components/ServicesPage.vue'
import GuidePage from '@/components/GuidePage.vue'
import NotFound from '@/components/NotFound.vue'
import CheckoutPage from '@/components/checkout/CheckoutPage.vue'
import OrderSuccess from '@/components/checkout/OrderSuccess.vue'
import OrderCancel from '@/components/checkout/OrderCancel.vue'

import { APP_ROUTE_META, getActiveRoutePaths } from './appRouteMeta.js'
import { isRouteActiveForFeatures } from './routeFeatures.js'

export { APP_ROUTE_META as ROUTE_DEFINITIONS, getActiveRoutePaths } from './appRouteMeta.js'

const COMPONENTS_BY_PATH = {
  '/maintenance': MaintenancePage,
  '/': HomeView,
  '/merci': Merci,
  '/recherche': Recherche,
  '/estimation': EstimationPage,
  '/estimation/processus': EstimationProcess,
  '/collection/recherche': WatchSearchResultsPage,
  '/collection/marques': BrandsIndexPage,
  '/collection/:brandSlug': WatchesCollection,
  '/collection': WatchesCollection,
  '/montre/:slug': WatchDetail,
  '/watch/:id': WatchDetail,
  '/blog': BlogList,
  '/blog/:id': BlogDetail,
  '/a-propos': APropos,
  '/services': ServicesPage,
  '/guide-horloger': GuidePage,
  '/contact': ContactPage,
  '/faq': FaqPage,
  '/politique-confidentialite': PolitiqueConfidentialite,
  '/mentions-legales': MentionsLegales,
  '/conditions-generales-utilisation': ConditionsGeneralesUtilisation,
  '/checkout': CheckoutPage,
  '/commande/succes': OrderSuccess,
  '/commande/annulee': OrderCancel,
  '/admin/login': AdminLogin,
  '/admin': AdminDashboard,
  '/admin/watches': AdminWatchesList,
  '/admin/watches/new': AdminWatchForm,
  '/admin/watches/:id/edit': AdminWatchForm,
  '/admin/stats': AdminWatchStats,
  '/admin/watches/stats': AdminWatchStats,
  '/admin/articles': AdminArticleList,
  '/admin/articles/new': AdminArticleForm,
  '/admin/articles/generate': AdminArticleGenerator,
  '/admin/articles/:id/edit': AdminArticleForm,
  '/admin/orders': AdminOrdersList,
  '/admin/orders/:id': AdminOrderDetail,
  '/admin/leads': AdminLeadsList,
  '/admin/leads/:id': AdminLeadDetail,
  '/admin/promo': AdminPromoList,
  '/admin/promo/new': AdminPromoForm,
  '/admin/promo/:id/edit': AdminPromoForm,
  '/admin/home-featured': AdminHomeFeatured,
  '/admin/users': AdminUsersList,
  '/:pathMatch(.*)*': NotFound,
}

const REDIRECTS_BY_PATH = {
  '/paiement-succes': '/commande/succes',
  '/paiement-annule': { path: '/commande/annulee' },
  '/admin/watches/stats': '/admin/stats',
}

/**
 * Routes Vue Router actives pour le jeu de features donné.
 * @param {Record<string, boolean>} features
 */
export function buildAppRoutes(features) {
  return APP_ROUTE_META.filter((def) => isRouteActiveForFeatures(def, features)).map((def) => {
    const redirect = REDIRECTS_BY_PATH[def.path]
    if (redirect) {
      return { path: def.path, redirect }
    }
    return {
      path: def.path,
      component: COMPONENTS_BY_PATH[def.path],
    }
  })
}
