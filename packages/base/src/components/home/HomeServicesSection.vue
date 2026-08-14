<script setup>
import { Calculator, Search, Watch } from '@lucide/vue'

import { getSiteConfig } from '@/site/getSiteConfig.js'

const features = getSiteConfig().features
</script>

<template>
  <section
    v-if="features.recherche || features.collection || features.estimation"
    id="services"
    class="surface-canvas py-16"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <p class="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          Notre savoir-faire
        </p>
        <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-4">Nos services exclusifs</h2>
        <p class="text-lg text-muted">
          Une expertise complète pour répondre à tous vos besoins horlogers
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div
          v-if="features.recherche"
          class="card-elevated rounded-md p-7 text-center"
        >
          <div class="mb-4 flex justify-center">
            <span
              class="icon-badge-forest inline-flex h-14 w-14 items-center justify-center rounded-full"
            >
              <Search class="h-7 w-7" :stroke-width="2" />
            </span>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-text-main">Recherche personnalisée</h3>
          <p class="text-muted mb-4">
            Dites-nous ce que vous cherchez, nous le trouvons pour vous. Rareté, budget, état : on
            s'occupe de tout.
          </p>

          <RouterLink to="/recherche" class="link-forest">Demander une recherche</RouterLink>
        </div>

        <div
          v-if="features.collection"
          class="card-elevated rounded-md p-7 text-center"
        >
          <div class="mb-4 flex justify-center">
            <span
              class="icon-badge-forest inline-flex h-14 w-14 items-center justify-center rounded-full"
            >
              <Watch class="h-7 w-7" :stroke-width="2" />
            </span>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-text-main">Collection de montres</h3>
          <p class="text-muted mb-4">
            Découvrez notre sélection de montres disponibles en stock.
          </p>
          <a href="/collection" class="link-forest"> Voir nos montres en stock </a>
        </div>

        <div
          v-if="features.estimation"
          class="card-elevated rounded-md p-7 text-center"
        >
          <div class="mb-4 flex justify-center">
            <span
              class="icon-badge-forest inline-flex h-14 w-14 items-center justify-center rounded-full"
            >
              <Calculator class="h-7 w-7" :stroke-width="2" />
            </span>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-text-main">Estimation gratuite</h3>
          <p class="text-muted mb-4">
            Obtenez une évaluation fiable de votre montre en moins de 24h, sans engagement.
          </p>
          <RouterLink to="/estimation" class="link-forest"> Faire estimer ma montre </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>
