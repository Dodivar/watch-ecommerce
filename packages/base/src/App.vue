<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Head } from '@vueuse/head'
import { WHATSAPP_NUMBER, EMAIL_CONTACT, PURCHASE_ENABLED } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { resolveMainNavigation, resolveFooterNavigation } from '@/site/mainNavigation.js'
import MainNavDesktop from '@/components/layout/MainNavDesktop.vue'
import MainNavMobile from '@/components/layout/MainNavMobile.vue'
import HeaderQuickSearch from '@/components/layout/HeaderQuickSearch.vue'
import logoMobileMenuVerticalWhite from '@site/assets/logos/Logos RVB (web)/Logos RVB vertical/Logo SW blanc vertical RVB.png'
import logoHeaderIconGreen from '@site/assets/logos/Logos RVB (web)/Icône RVB/Icône SW verte RVB.png'
import logoFooterHorizontalWhite from '@site/assets/logos/Logos RVB (web)/Logos RVB horizontal/Logo SW blanc horizontal RVB.png'
import { isAdminAuthenticated } from '@/services/admin/adminAuthService'
import CookieBanner from '@/components/CookieBanner.vue'
import CartDrawer from '@/components/cart/CartDrawer.vue'
import { openCookiePreferences } from '@/services/cookiePreferencesUi'
import { useCart } from '@/composables/useCart.js'

const site = getSiteConfig()
const features = site.features
const mainNavItems = resolveMainNavigation(site)
const footerNavItems = resolveFooterNavigation(site)

const mobileMenuOpen = ref(false)
const catalogSearchOpen = ref(false)
const route = useRoute()

const { badgeLabel, toggleDrawer, closeDrawer: closeCartDrawer } = useCart()

// Vérifier si on est sur la page de maintenance
const isMaintenancePage = computed(() => route.path === '/maintenance')

// Vérifier si un admin est connecté
const isAdmin = ref(false)

const checkAdminStatus = async () => {
  isAdmin.value = await isAdminAuthenticated()
}

onMounted(() => {
  checkAdminStatus()
})

// Re-vérifier quand la route change (au cas où l'admin se connecte/déconnecte) ; fermer le menu mobile
watch(() => route.path, () => {
  checkAdminStatus()
  mobileMenuOpen.value = false
  catalogSearchOpen.value = false
  closeCartDrawer()
})

function displayMobileMenu() {
  mobileMenuOpen.value = true
}
</script>

<template>
  <Head />
  <MainNavMobile
    v-if="!isMaintenancePage"
    v-model:open="mobileMenuOpen"
    :features="features"
    :is-admin="isAdmin"
    :nav-items="mainNavItems"
    :logo-src="logoMobileMenuVerticalWhite"
    :logo-alt="site.brand.logoAlt"
    :purchase-enabled="PURCHASE_ENABLED"
  />

  <!-- Menu desktop -->
  <header
    v-if="!isMaintenancePage"
    id="header"
    class="relative shadow-sm backdrop-blur-sm sticky top-0 z-20"
  >
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16 gap-2">
        <div class="flex items-center shrink-0">
          <RouterLink to="/">
            <img width="50px" height="50px" :src="logoHeaderIconGreen" alt="" />
          </RouterLink>
        </div>
        <MainNavDesktop
          :features="features"
          :is-admin="isAdmin"
          :nav-items="mainNavItems"
        />
        <div class="flex items-center gap-1 shrink-0">
          <HeaderQuickSearch
            v-if="features.collection"
            v-model:open="catalogSearchOpen"
            variant="header-trigger"
          />
          <button
            v-if="PURCHASE_ENABLED"
            type="button"
            class="relative p-2 rounded-lg text-text-main hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Ouvrir le panier"
            @click="toggleDrawer"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <span
              v-if="badgeLabel"
              class="absolute -top-0.5 -right-0.5 min-h-[1.125rem] min-w-[1.125rem] px-1 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white leading-none"
            >
              {{ badgeLabel }}
            </span>
          </button>
          <button type="button" class="md:hidden p-2" @click="displayMobileMenu" aria-label="Ouvrir le menu">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="black">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
    <HeaderQuickSearch
      v-if="features.collection"
      v-model:open="catalogSearchOpen"
      variant="header-panel"
    />
  </header>

  <main>
    <RouterView />
  </main>

  <!-- Footer -->
  <footer v-if="!isMaintenancePage" id="contact" class="bg-primary text-white py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div :class="isAdmin ? 'grid md:grid-cols-5 gap-8' : 'grid md:grid-cols-4 gap-8'">
        <div class="sm:col-span-2">
          <div class="mb-4">
            <img
              :src="logoFooterHorizontalWhite"
              :alt="site.brand.logoAlt"
              class="h-12 w-auto"
            />
          </div>
          <p class="text-white/90 mb-6 leading-relaxed">
            {{ site.copy.footerTagline }}
          </p>
          <div class="flex space-x-4">
            <a
              :href="site.social.footerTiktokUrl"
              class="text-white/90 hover:text-white transition-colors"
            >
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
                />
              </svg>
            </a>
            <a href="#" class="text-white/90 hover:text-white transition-colors">
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.254-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                />
              </svg>
            </a>
            <a
              :href="'https://wa.me/' + WHATSAPP_NUMBER"
              class="text-white/90 hover:text-white transition-colors"
            >
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"
                />
              </svg>
            </a>
          </div>
        </div>
        <div>
          <h3 class="text-lg font-semibold mb-4">Navigation</h3>
          <ul class="space-y-2">
            <li v-for="(nav, fi) in footerNavItems" :key="'foot-nav-' + fi + '-' + nav.to">
              <RouterLink
                :to="nav.to"
                class="text-white/90 hover:text-white transition-colors"
                >{{ nav.label }}</RouterLink
              >
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-lg font-semibold mb-4">Contact</h3>
          <div class="space-y-2 text-white/90">
            <a class="flex items-center"
              :href="'https://wa.me/' + WHATSAPP_NUMBER">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              {{ WHATSAPP_NUMBER }}
            </a>
            <a :href="'mailto:' + EMAIL_CONTACT"
             class="flex items-center">
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {{ EMAIL_CONTACT }}
            </a>
            <p class="flex items-start">
              <svg class="h-5 w-5 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span v-html="site.contact.footerAddressHtml"></span>
            </p>
          </div>
        </div>
        <!-- Admin Debug Links -->
        <div v-if="isAdmin && features.admin" class="border-l border-white/20 pl-4">
          <h3 class="text-lg font-semibold mb-4 text-white">🔧 Debug Admin</h3>
          <ul class="space-y-2 text-sm">
            <li>
              <RouterLink to="/" class="text-white/90 hover:text-white transition-colors"
                >Accueil</RouterLink
              >
            </li>
            <li>
              <RouterLink to="/maintenance" class="text-white/90 hover:text-white transition-colors"
                >Maintenance</RouterLink
              >
            </li>
            <li v-if="features.merci">
              <RouterLink to="/merci" class="text-white/90 hover:text-white transition-colors"
                >Merci</RouterLink
              >
            </li>
            <li v-if="features.recherche">
              <RouterLink to="/recherche" class="text-white/90 hover:text-white transition-colors"
                >Recherche</RouterLink
              >
            </li>
            <li v-if="features.estimation">
              <RouterLink to="/estimation" class="text-white/90 hover:text-white transition-colors"
                >Estimation</RouterLink
              >
            </li>
            <li v-if="features.estimationProcess">
              <RouterLink to="/estimation/processus" class="text-white/90 hover:text-white transition-colors"
                >Estimation Processus</RouterLink
              >
            </li>
            <li v-if="features.about">
              <RouterLink to="/a-propos" class="text-white/90 hover:text-white transition-colors"
                >À propos</RouterLink
              >
            </li>
            <li v-if="features.contact">
              <RouterLink to="/contact" class="text-white/90 hover:text-white transition-colors"
                >Contact</RouterLink
              >
            </li>
            <li v-if="features.paymentReturn">
              <RouterLink to="/paiement-succes" class="text-white/90 hover:text-white transition-colors"
                >Paiement Succès</RouterLink
              >
            </li>
            <li v-if="features.paymentReturn">
              <RouterLink to="/paiement-annule" class="text-white/90 hover:text-white transition-colors"
                >Paiement Annulé</RouterLink
              >
            </li>
            <li class="pt-2 border-t border-white/20">
              <RouterLink to="/admin" class="text-white hover:text-white/80 transition-colors font-medium"
                >Admin Dashboard</RouterLink
              >
            </li>
            <li>
              <RouterLink to="/admin/login" class="text-white/90 hover:text-white transition-colors"
                >Admin Login</RouterLink
              >
            </li>
            <li>
              <RouterLink to="/admin/watches/new" class="text-white/90 hover:text-white transition-colors"
                >Nouvelle Montre</RouterLink
              >
            </li>
            <li>
              <RouterLink to="/admin/watches/stats" class="text-white/90 hover:text-white transition-colors"
                >Stats Montres</RouterLink
              >
            </li>
            <li v-if="features.blog">
              <RouterLink to="/admin/articles" class="text-white/90 hover:text-white transition-colors"
                >Liste Articles</RouterLink
              >
            </li>
            <li v-if="features.blog">
              <RouterLink to="/admin/articles/new" class="text-white/90 hover:text-white transition-colors"
                >Nouvel Article</RouterLink
              >
            </li>
            <li v-if="features.blog">
              <RouterLink to="/admin/articles/generate" class="text-white/90 hover:text-white transition-colors"
                >Générer Article</RouterLink
              >
            </li>
          </ul>
        </div>
      </div>
      <div class="border-t border-white/20 mt-12 pt-8">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <p class="text-white/90 text-sm">{{ site.copy.copyrightLine }}</p>
          <div class="flex flex-wrap gap-x-6 gap-y-2 mt-4 md:mt-0">
            <RouterLink
              v-if="features.legal"
              to="/mentions-legales"
              class="text-white/90 hover:text-white text-sm transition-colors"
              >Mentions légales</RouterLink
            >
            <RouterLink
              v-if="features.legal"
              to="/politique-confidentialite"
              class="text-white/90 hover:text-white text-sm transition-colors"
              >Politique de confidentialité</RouterLink
            >
            <RouterLink
              v-if="features.legal"
              to="/conditions-generales-utilisation"
              class="text-white/90 hover:text-white text-sm transition-colors"
              >CGU</RouterLink
            >
            <button
              type="button"
              class="text-white/90 hover:text-white text-sm transition-colors bg-transparent border-0 cursor-pointer p-0 font-inherit text-left md:text-center"
              @click="openCookiePreferences"
            >
              Préférences cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  </footer>

  <CartDrawer v-if="PURCHASE_ENABLED && !isMaintenancePage" />
  <CookieBanner />
</template>

<style scoped></style>
