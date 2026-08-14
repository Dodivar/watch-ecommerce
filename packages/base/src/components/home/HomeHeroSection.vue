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
  <!--
    Ancre verte de l'identité : le héros porte le vert de marque en pleine
    hauteur. Les appels à l'action s'inversent (beige plein / contour clair)
    pour rester lisibles et hiérarchisés sur ce fond.
  -->
  <section
    v-else
    id="accueil"
    class="surface-forest surface-forest-glow relative min-h-[92vh] lg:min-h-screen overflow-hidden"
  >
    <HomeHeroVisual />

    <div class="relative z-10 flex min-h-[inherit] items-center py-14 sm:py-16 lg:py-20">
      <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
          <p
            class="mb-5 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary-sage"
          >
            <span class="hidden h-px w-8 bg-white/35 sm:inline-block" aria-hidden="true" />
            Horlogerie d'exception
          </p>
          <h1 class="mb-5 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Découvrez nos
            <span class="hero-accent">montres disponibles</span>
            dès maintenant
          </h1>
          <p class="mb-9 text-lg leading-relaxed text-white/75 sm:text-xl">
            Consultez notre sélection de montres en stock garanties 1 an.
          </p>
          <div class="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
            <RouterLink
              v-if="features.collection"
              to="/collection"
              class="hero-cta-primary inline-flex cursor-pointer items-center justify-center rounded-lg px-8 py-4 text-lg font-semibold text-primary"
            >
              Voir les montres en stock
            </RouterLink>
            <RouterLink
              v-if="features.recherche"
              to="/recherche"
              class="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/35 px-8 py-4 text-lg font-semibold text-white transition-colors duration-200 hover:border-white/70 hover:bg-white/10"
            >
              Recherche personnalisée
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Accent du titre : dégradé beige → blanc, le pendant clair du fond vert. */
.hero-accent {
  background-image: linear-gradient(
    100deg,
    var(--color-cream) 0%,
    #ffffff 45%,
    var(--color-cream-200) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* CTA principal : masse beige pleine, la seule de la page — hiérarchie nette. */
.hero-cta-primary {
  background-image: linear-gradient(140deg, #ffffff 0%, var(--color-cream) 100%);
  box-shadow: 0 18px 40px -20px rgba(0, 0, 0, 0.55);
  transition:
    transform 200ms ease,
    box-shadow 200ms ease,
    background-image 200ms ease;
}

.hero-cta-primary:hover {
  background-image: linear-gradient(140deg, #ffffff 0%, var(--color-cream-100) 100%);
  transform: translateY(-1px);
  box-shadow: 0 22px 48px -20px rgba(0, 0, 0, 0.6);
}

@media (prefers-reduced-motion: reduce) {
  .hero-cta-primary,
  .hero-cta-primary:hover {
    transform: none;
  }
}
</style>
