<script setup>
import { Calculator, Search, Watch } from '@lucide/vue'

import { getSiteConfig } from '@/site/getSiteConfig.js'

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
        <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">Nos services exclusifs</h2>
        <p class="text-xl text-gray-600">
          Une expertise complète pour répondre à tous vos besoins horlogers
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div
          v-if="features.recherche"
          class="bg-cream rounded-md p-6 text-center border border-cream-200 hover:shadow-lg transition-all"
        >
          <div class="text-primary text-4xl mb-3 flex justify-center">
            <Search class="h-10 w-10 text-primary mx-auto" :stroke-width="2" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Recherche personnalisée</h3>
          <p class="text-gray-600 mb-3">
            Dites-nous ce que vous cherchez, nous le trouvons pour vous. Rareté, budget, état : on
            s'occupe de tout.
          </p>

          <RouterLink to="/recherche" class="text-primary font-semibold hover:underline">
            Demander une recherche</RouterLink
          >
        </div>

        <div
          v-if="features.collection"
          class="bg-cream rounded-md p-6 text-center border border-cream-200 hover:shadow-lg transition-all"
        >
          <div class="text-primary text-4xl mb-3 flex justify-center">
            <Watch class="h-10 w-10 text-primary mx-auto" :stroke-width="2" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Collection de montres</h3>
          <p class="text-gray-600 mb-3">
            Découvrez notre sélection de montres disponibles en stock.
          </p>
          <a href="/collection" class="text-primary font-semibold hover:underline">
            Voir nos montres en stock
          </a>
        </div>

        <div
          v-if="features.estimation"
          class="bg-cream rounded-md p-6 text-center border border-cream-200 hover:shadow-lg transition-all"
        >
          <div class="text-primary text-4xl mb-3 flex justify-center">
            <Calculator class="h-10 w-10 text-primary mx-auto" :stroke-width="2" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Estimation gratuite</h3>
          <p class="text-gray-600 mb-3">
            Obtenez une évaluation fiable de votre montre en moins de 24h, sans engagement.
          </p>
          <RouterLink to="/estimation" class="text-primary font-semibold hover:underline">
            Faire estimer ma montre
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>
