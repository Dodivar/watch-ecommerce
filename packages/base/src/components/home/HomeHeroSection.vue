<script setup>
import { computed } from 'vue'

import { getSiteConfig } from '@/site/getSiteConfig.js'
import HomeHeroCompactSection from './HomeHeroCompactSection.vue'
import HomeHeroVisual from './HomeHeroVisual.vue'

const site = getSiteConfig()
const features = site.features
const useCompactHero = computed(() => site.home?.hero?.variant === 'compact')
</script>

<template>
  <HomeHeroCompactSection v-if="useCompactHero" />
  <section
    v-else
    id="accueil"
    class="relative min-h-[92vh] lg:min-h-screen overflow-hidden bg-cream border-b border-cream-200"
  >
    <HomeHeroVisual />

    <div class="relative z-10 flex min-h-[inherit] items-center py-14 sm:py-16 lg:py-20">
      <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
          <p class="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
            Horlogerie d'exception
          </p>
          <h1 class="mb-4 text-4xl font-bold leading-tight text-text-main sm:text-5xl lg:text-6xl">
            Découvrez nos
            <span class="text-primary">montres disponibles</span>
            dès maintenant
          </h1>
          <p class="mb-8 text-lg leading-relaxed text-gray-600 sm:text-xl">
            Consultez notre sélection de montres en stock garanties 1 an.
          </p>
          <div class="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
            <RouterLink
              v-if="features.collection"
              to="/collection"
              class="inline-flex cursor-pointer items-center bg-primary px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-primary-hover"
            >
              Voir les montres en stock
            </RouterLink>
            <RouterLink
              v-if="features.recherche"
              to="/recherche"
              class="inline-flex cursor-pointer items-center border-2 border-primary px-8 py-4 text-lg font-semibold text-primary shadow transition-colors duration-200 hover:bg-cream-100"
            >
              Recherche personnalisée
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
