<template>
  <section class="py-3 lg:py-10 min-h-screen">
    <div class="max-w-7xl mx-auto px-4">
      <div class="text-center mb-6 lg:mb-10">
        <h1 class="text-2xl font-bold text-text-main">
          {{ heading }}
        </h1>
      </div>

      <div v-if="listing.isLoading" class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div
          v-for="n in 8"
          :key="'sk-' + n"
          class="aspect-[4/3] rounded-lg bg-cream-100 animate-pulse"
        />
      </div>

      <div
        v-else-if="listing.error"
        class="text-center py-16 text-gray-600"
      >
        {{ listing.error }}
      </div>

      <div
        v-else-if="listing.availableBrands.length === 0"
        class="text-center py-16 text-gray-600"
      >
        Aucune marque disponible pour le moment.
      </div>

      <div
        v-else
        class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
      >
        <RouterLink
          v-for="brandName in listing.availableBrands"
          :key="brandName"
          :to="buildBrandCollectionPath(brandName)"
          class="group block rounded-lg border border-cream-200 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          :aria-label="`Collection ${brandName}`"
        >
          <div class="relative aspect-[4/3] bg-white flex items-center justify-center p-4 md:p-6">
            <img
              v-if="tileSrc(brandName)"
              :src="tileSrc(brandName)"
              :alt="tileAlt(brandName)"
              class="relative z-0 h-14 w-auto max-h-[5.5rem] max-w-[min(100%,12rem)] object-contain object-center md:h-[4.75rem]"
            />
            <div
              v-else
              class="relative z-0 hidden h-full w-full items-center justify-center px-2 text-center text-sm font-semibold uppercase tracking-wide text-gray-500 md:flex"
            >
              {{ brandName }}
            </div>

            <!-- Desktop : assombrissement + nom au-dessus du visuel au survol -->
            <div
              class="pointer-events-none absolute inset-0 z-10 hidden md:flex flex-col items-center justify-center bg-black/0 px-3 text-center transition-colors duration-200 group-hover:bg-black/50"
            >
              <span
                class="max-w-full text-base md:text-lg font-semibold uppercase tracking-wide leading-tight text-white opacity-0 transition-opacity duration-200 drop-shadow-xl [text-shadow:0_2px_10px_rgba(0,0,0,0.85),0_1px_3px_rgba(0,0,0,0.9)] group-hover:opacity-100 line-clamp-3"
              >
                {{ brandName }}
              </span>
            </div>
          </div>

          <!-- Mobile : nom sous le logo -->
          <p
            class="border-t border-cream-200 bg-white px-2 py-3 text-center text-sm font-medium uppercase tracking-wide text-text-main md:hidden"
          >
            {{ brandName }}
          </p>
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useHead } from '@vueuse/head'

import { BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { buildBrandCollectionPath } from '@/utils/collectionRoutes.js'
import {
  resolveBrandTileImage,
  resolveBrandTileAlt,
} from '@/utils/brandSlug.js'
import { useWatchListing } from '@/composables/useWatchListing.js'

const listing = useWatchListing()
const siteConfig = getSiteConfig()

const seoBrands = computed(() => siteConfig.seo?.brandsIndex ?? {})

const heading = computed(
  () => seoBrands.value.h1 || 'Toutes les marques',
)

function tileSrc(brandName) {
  return resolveBrandTileImage(siteConfig, brandName)
}

function tileAlt(brandName) {
  return resolveBrandTileAlt(siteConfig, brandName)
}

const defaultTitle = computed(() => {
  const site = siteConfig.brand?.displayName || 'Montres'
  return `Marques | ${site}`
})

const pageTitle = computed(() => seoBrands.value.title || defaultTitle.value)
const metaDescription = computed(
  () =>
    seoBrands.value.metaDescription ||
    'Découvrez les marques disponibles et accédez à chaque collection.',
)
const ogTitle = computed(() => seoBrands.value.ogTitle || pageTitle.value)
const ogDescription = computed(
  () => seoBrands.value.ogDescription || metaDescription.value,
)
const twitterTitle = computed(() => seoBrands.value.twitterTitle || ogTitle.value)
const twitterDescription = computed(
  () => seoBrands.value.twitterDescription || ogDescription.value,
)

useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: metaDescription },
    { property: 'og:title', content: ogTitle },
    { property: 'og:description', content: ogDescription },
    {
      property: 'og:url',
      content: `${BASE_URL}/collection/marques`,
    },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: twitterTitle },
    { name: 'twitter:description', content: twitterDescription },
  ],
  link: [
    {
      rel: 'canonical',
      href: `${BASE_URL}/collection/marques`,
    },
  ],
})

onMounted(() => {
  listing.loadWatches()
})
</script>
