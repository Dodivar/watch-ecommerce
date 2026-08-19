<script setup>
import { Calculator, Search, Watch } from '@lucide/vue'

import { getSiteConfig } from '@/site/getSiteConfig.js'
import { t } from '@/i18n'

const features = getSiteConfig().features
</script>

<template>
  <section
    v-if="features.recherche || features.collection || features.estimation"
    id="services"
    class="py-12 bg-white"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-10">
        <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">{{ t('home.servicesTitle') }}</h2>
        <p class="text-xl text-gray-600">
          {{ t('home.servicesSubtitle') }}
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div
          v-if="features.recherche"
          class="bg-white rounded-md p-6 text-center hover:shadow-lg transition-all shadow-lg"
        >
          <div class="text-primary text-4xl mb-3 flex justify-center">
            <Search class="h-10 w-10 text-primary mx-auto" :stroke-width="2" />
          </div>
          <h3 class="text-xl font-semibold mb-2">{{ t('home.sourcingTitle') }}</h3>
          <p class="text-gray-600 mb-3">
            {{ t('home.sourcingText') }}
          </p>

          <RouterLink to="/recherche" class="text-primary font-semibold hover:underline">
            {{ t('home.sourcingCta') }}</RouterLink
          >
        </div>

        <div
          v-if="features.collection"
          class="bg-white rounded-md p-6 text-center hover:shadow-lg transition-all shadow-lg"
        >
          <div class="text-primary text-4xl mb-3 flex justify-center">
            <Watch class="h-10 w-10 text-primary mx-auto" :stroke-width="2" />
          </div>
          <h3 class="text-xl font-semibold mb-2">{{ t('home.collectionTitle') }}</h3>
          <p class="text-gray-600 mb-3">
            {{ t('home.collectionText') }}
          </p>
          <!-- RouterLink et non <a> : le préfixe de langue est porté par la base d'historique,
               qu'une ancre brute contournerait (retour silencieux au français). -->
          <RouterLink to="/collection" class="text-primary font-semibold hover:underline">
            {{ t('home.collectionCta') }}
          </RouterLink>
        </div>

        <div
          v-if="features.estimation"
          class="bg-white rounded-md p-6 text-center hover:shadow-lg transition-all shadow-lg"
        >
          <div class="text-primary text-4xl mb-3 flex justify-center">
            <Calculator class="h-10 w-10 text-primary mx-auto" :stroke-width="2" />
          </div>
          <h3 class="text-xl font-semibold mb-2">{{ t('home.valuationTitle') }}</h3>
          <p class="text-gray-600 mb-3">
            {{ t('home.valuationText') }}
          </p>
          <RouterLink to="/estimation" class="text-primary font-semibold hover:underline">
            {{ t('home.valuationCta') }}
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>
