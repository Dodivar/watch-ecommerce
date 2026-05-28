<script setup>
import { computed } from 'vue'

import { getSiteConfig } from '@/site/getSiteConfig.js'
import navitimerImg from '@site/assets/hero section img/navitimer-b01-chronograph-43.png'
import parallaxImg1 from '@site/assets/hero section img/montre-tag-heuer-monaco-calibre-11.png'
import parallaxImg2 from '@site/assets/hero section img/Rolex.png'
import parallaxImg3 from '@site/assets/hero section img/cartier-santos.png'
import parallaxImg4 from '@site/assets/hero section img/image-Photoroom (2).png'
import ParallaxImage from '../ParallaxImage.vue'
import HomeHeroCompactSection from './HomeHeroCompactSection.vue'

const site = getSiteConfig()
const features = site.features
const useCompactHero = computed(() => site.home?.hero?.variant === 'compact')
</script>

<template>
  <HomeHeroCompactSection v-if="useCompactHero" />
  <section v-else id="accueil" class="gradient-bg py-12 lg:py-20 h-screen">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center relative z-10">
        <h1 class="text-4xl lg:text-6xl font-bold text-text-main mb-4 leading-tight">
          Découvrez nos <span class="text-primary">montres disponibles</span> dès maintenant
          <!-- <svg class="inline-block w-10 h-10 text-primary align-middle" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="2" fill="none"/>
            <rect x="9.5" y="1.5" width="5" height="3" rx="1" stroke="currentColor" stroke-width="2" fill="none"/>
            <rect x="9.5" y="19.5" width="5" height="3" rx="1" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M12 8v4l2.5 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg> -->
        </h1>
        <p class="text-xl text-gray-600 mb-6 leading-relaxed">
          Consultez notre sélection de montres en stock garanties 1 an.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <RouterLink
            v-if="features.collection"
            to="/collection"
            class="inline-flex items-center bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-hover transition-all shadow-lg"
          >
            Voir les montres en stock
          </RouterLink>
          <RouterLink
            v-if="features.recherche"
            to="/recherche"
            class="inline-flex items-center px-8 py-4 rounded-lg text-lg font-semibold border-2 border-primary text-primary hover:bg-green-50 transition-all shadow"
          >
            Recherche personnalisée
          </RouterLink>
        </div>
      </div>
    </div>
    <div class="fixed top-0 h-full w-full overflow-hidden">
      <ParallaxImage
        :src="navitimerImg"
        alt="Breitling Navitimer"
        initial-x="0%"
        initial-y="45%"
        mobile-initial-x="-10%"
        mobile-initial-y="58%"
        size="large"
        :scroll-speed="0.4"
        :float-speed="0.4"
        :float-amplitude="12"
        :vertical-speed="0.7"
        :vertical-amplitude="15"
        :rotation-speed="1"
        :rotation-amplitude="2"
        :scale-value="0.85"
      />
      <ParallaxImage
        :src="parallaxImg4"
        alt="Montre de luxe"
        initial-x="20%"
        initial-y="40%"
        mobile-initial-x="15%"
        mobile-initial-y="60%"
        :scroll-speed="0.3"
        :float-speed="0.55"
        :float-amplitude="20"
        :vertical-speed="0.4"
        :vertical-amplitude="15"
        :rotation-speed="0.3"
        :rotation-amplitude="5"
        :scale-value="0.7"
      />
      <ParallaxImage
        :src="parallaxImg1"
        alt="Montre de luxe"
        initial-x="40%"
        initial-y="50%"
        mobile-initial-x="30%"
        mobile-initial-y="65%"
        size="large"
        :scroll-speed="0.2"
        :float-speed="0.6"
        :float-amplitude="18"
        :vertical-speed="0.35"
        :vertical-amplitude="12"
        :rotation-speed="0.25"
        :rotation-amplitude="4"
        :scale-value="0.75"
      />
      <ParallaxImage
        :src="parallaxImg2"
        alt="Montre de luxe"
        initial-x="60%"
        initial-y="50%"
        mobile-initial-x="50%"
        mobile-initial-y="62%"
        size="large"
        :scroll-speed="0.3"
        :float-speed="0.45"
        :float-amplitude="15"
        :vertical-speed="0.3"
        :vertical-amplitude="10"
        :rotation-speed="0.2"
        :rotation-amplitude="3"
        :scale-value="0.8"
      />
      <ParallaxImage
        :src="parallaxImg3"
        alt="Montre de luxe"
        initial-x="80%"
        initial-y="40%"
        mobile-initial-x="70%"
        mobile-initial-y="60%"
        size="large"
        :initial-rotation="300"
        :scroll-speed="0.50"
        :float-speed="0.45"
        :float-amplitude="20"
        :vertical-speed="0.4"
        :vertical-amplitude="15"
        :rotation-speed="0.3"
        :rotation-amplitude="5"
        :scale-value="0.7"
      />
    </div>
  </section>
</template>
