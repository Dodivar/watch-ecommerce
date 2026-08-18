<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useHead } from '@vueuse/head'

import WatchCard from './WatchCard.vue'
import WatchCardSkeleton from './WatchCardSkeleton.vue'
import { CANONICAL_BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { getSoldWatchesForListing } from '@/services/watchService'
import { navigateToWatch } from '@/utils/watchSlug.js'
import { WATCH_CARD_GRID_PROPS } from '@/constants/watchCardDefaults.js'

defineOptions({ name: 'SoldWatchesArchivePage' })

const router = useRouter()
const siteConfig = getSiteConfig()
const rechercheEnabled = siteConfig.features.recherche === true

const seoSoldArchive = computed(() => siteConfig.seo?.soldArchive ?? {})

const watches = ref([])
const isLoading = ref(true)
const error = ref(null)

const heading = computed(() => seoSoldArchive.value.h1 || 'Nos dernières ventes')

const defaultTitle = computed(() => {
  const site = siteConfig.brand?.displayName || 'Montres'
  return `Montres vendues | ${site}`
})
const pageTitle = computed(() => seoSoldArchive.value.title || defaultTitle.value)
const metaDescription = computed(
  () =>
    seoSoldArchive.value.metaDescription ||
    'Les montres qui ont trouvé preneur. Un modèle vous intéresse ? Nous pouvons trouver le même pour vous.',
)

useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: metaDescription },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: metaDescription },
    { property: 'og:url', content: `${CANONICAL_BASE_URL}/ventes` },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ],
  link: [{ rel: 'canonical', href: `${CANONICAL_BASE_URL}/ventes` }],
})

const handleViewDetails = (watch) => {
  navigateToWatch(router, watch)
}

onMounted(async () => {
  try {
    watches.value = await getSoldWatchesForListing()
  } catch (e) {
    console.error('Erreur lors du chargement des montres vendues:', e)
    error.value = 'Impossible de charger les montres vendues pour le moment.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <section class="min-h-screen bg-cream py-10 px-4 sm:py-12">
    <div class="max-w-7xl mx-auto">
      <header class="mb-8 max-w-3xl">
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{{ heading }}</h1>
        <p class="text-gray-600 text-base sm:text-lg">
          Ces montres ont trouvé preneur. Chaque fiche reste consultable à titre
          d'archive — et si un modèle vous fait de l'œil, nous pouvons rechercher le
          même pour vous.
        </p>
        <router-link
          v-if="rechercheEnabled"
          to="/recherche"
          class="mt-5 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-normal rounded-lg text-white bg-primary hover:bg-primary-hover transition-colors duration-200"
        >
          Lancer une recherche personnalisée
        </router-link>
      </header>

      <p v-if="error" class="text-sm text-red-600 mb-6" role="alert">{{ error }}</p>

      <div
        v-if="isLoading"
        class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6"
        aria-busy="true"
        aria-label="Chargement des montres vendues"
      >
        <WatchCardSkeleton v-for="n in 8" :key="n" />
      </div>

      <p v-else-if="!error && watches.length === 0" class="text-gray-600">
        Aucune vente à afficher pour le moment.
      </p>

      <div
        v-else
        class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6"
      >
        <WatchCard
          v-for="(watch, index) in watches"
          :key="watch.id"
          v-bind="WATCH_CARD_GRID_PROPS"
          :watch="watch"
          :image-loading="index < 4 ? 'eager' : 'lazy'"
          class="animate-fade-in"
          @viewDetails="handleViewDetails"
        />
      </div>
    </div>
  </section>
</template>
