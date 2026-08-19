<script setup>
import { t } from '@/i18n'
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { loadCollectionHighlightWatches } from '@/services/collectionHighlightService'
import WatchCard from '@/components/watch/WatchCard.vue'
import WatchCardSkeleton from '@/components/watch/WatchCardSkeleton.vue'
import { WATCH_CARD_CATALOG_PROPS } from '@/constants/watchCardDefaults.js'
import { navigateToWatch } from '@/utils/watchSlug.js'

const DEFAULT_CTA = { label: 'Voir toute la collection', to: '/collection' }

const router = useRouter()
const config = computed(() => getSiteConfig().home?.collectionHighlight ?? {})
const cta = computed(() => ({ ...DEFAULT_CTA, ...(config.value.cta ?? {}) }))

const watches = ref([])
const isLoading = ref(true)

/** Première montre = vedette (grand format), les suivantes en grille. */
const featuredWatch = computed(() => watches.value[0] ?? null)
const secondaryWatches = computed(() => watches.value.slice(1))

onMounted(async () => {
  try {
    isLoading.value = true
    watches.value = await loadCollectionHighlightWatches()
  } catch (error) {
    console.error('Erreur lors du chargement de la mise en avant collection:', error)
    watches.value = []
  } finally {
    isLoading.value = false
  }
})

function handleViewDetails(watch) {
  navigateToWatch(router, watch)
}
</script>

<template>
  <section
    v-if="isLoading || watches.length > 0"
    class="py-12 bg-cream"
    aria-labelledby="collection-highlight-title"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h2
          id="collection-highlight-title"
          class="text-3xl lg:text-4xl font-bold text-text-main mb-3"
        >
          {{ config.title || t('home.collectionGlimpse') }}
        </h2>
        <p v-if="config.subtitle" class="text-xl text-gray-600">
          {{ config.subtitle }}
        </p>
      </div>

      <!-- Chargement -->
      <div v-if="isLoading" class="grid gap-6 lg:grid-cols-2">
        <WatchCardSkeleton v-bind="WATCH_CARD_CATALOG_PROPS" />
        <div class="grid grid-cols-2 gap-4 sm:gap-6">
          <WatchCardSkeleton
            v-for="n in 4"
            :key="`collection-skeleton-${n}`"
            v-bind="WATCH_CARD_CATALOG_PROPS"
          />
        </div>
      </div>

      <!-- Mise en avant éditoriale : 1 vedette + grille -->
      <div v-else class="grid gap-6 lg:grid-cols-2">
        <div v-if="featuredWatch" class="lg:self-start">
          <WatchCard
            v-bind="WATCH_CARD_CATALOG_PROPS"
            :watch="featuredWatch"
            image-loading="eager"
            image-fetch-priority="high"
            @viewDetails="handleViewDetails"
          />
        </div>

        <div
          v-if="secondaryWatches.length > 0"
          class="grid grid-cols-2 gap-4 sm:gap-6 self-start"
        >
          <WatchCard
            v-for="(watch, i) in secondaryWatches"
            :key="watch.id || `${i}-${watch.name}`"
            v-bind="WATCH_CARD_CATALOG_PROPS"
            :watch="watch"
            :image-loading="i < 1 ? 'eager' : 'lazy'"
            @viewDetails="handleViewDetails"
          />
        </div>
      </div>

      <!-- CTA -->
      <div class="mt-10 text-center">
        <RouterLink
          :to="cta.to"
          class="inline-flex items-center justify-center bg-primary text-white font-semibold px-8 py-3 transition-colors hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {{ cta.label }}
        </RouterLink>
      </div>
    </div>
  </section>
</template>
