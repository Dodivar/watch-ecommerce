<script setup>
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
          class="bg-white rounded-md p-6 text-center hover:shadow-lg transition-all shadow-lg"
        >
          <div class="text-primary text-4xl mb-3 flex justify-center">
            <svg class="h-10 w-10 text-primary mx-auto" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
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
          class="bg-white rounded-md p-6 text-center hover:shadow-lg transition-all shadow-lg"
        >
          <div class="text-primary text-4xl mb-3 flex justify-center">
            <svg class="h-10 w-10 text-primary mx-auto" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="2" fill="none"/>
              <rect x="9.5" y="1.5" width="5" height="3" rx="1" stroke="currentColor" stroke-width="2" fill="none"/>
              <rect x="9.5" y="19.5" width="5" height="3" rx="1" stroke="currentColor" stroke-width="2" fill="none"/>
              <path d="M12 8v4l2.5 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
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
          class="bg-white rounded-md p-6 text-center hover:shadow-lg transition-all shadow-lg"
        >
          <div class="text-primary text-4xl mb-3 flex justify-center">
            <svg class="h-10 w-10 text-primary mx-auto" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
              <rect x="8" y="7" width="8" height="2" rx="1" fill="currentColor" class="opacity-30"/>
              <circle cx="8" cy="13" r="1" fill="currentColor"/>
              <circle cx="12" cy="13" r="1" fill="currentColor"/>
              <circle cx="16" cy="13" r="1" fill="currentColor"/>
              <circle cx="8" cy="17" r="1" fill="currentColor"/>
              <circle cx="12" cy="17" r="1" fill="currentColor"/>
              <circle cx="16" cy="17" r="1" fill="currentColor"/>
            </svg>
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
