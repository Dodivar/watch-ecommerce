<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { getSiteConfig } from '@/site/getSiteConfig.js'

const site = getSiteConfig()
const hero = computed(() => site.home?.hero ?? {})
const features = computed(() => site.features ?? {})

const showPrimaryCta = computed(() =>
  Boolean(
    hero.value.primaryCta?.label
      && hero.value.primaryCta?.to
      && (hero.value.primaryCta.to !== '/collection' || features.value.collection),
  ),
)

const showSecondaryCta = computed(() =>
  Boolean(
    hero.value.secondaryCta?.label
      && hero.value.secondaryCta?.to
      && (hero.value.secondaryCta.to !== '/contact' || features.value.contact !== false),
  ),
)
</script>

<template>
  <section id="accueil" class="bg-cream border-b border-cream-200 py-10 lg:py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto text-center">
        <p
          v-if="hero.eyebrow"
          class="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3"
        >
          {{ hero.eyebrow }}
        </p>
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-main leading-tight mb-3">
          {{ hero.title }}
        </h1>
        <p
          v-if="hero.subtitle"
          class="text-base sm:text-lg text-muted leading-relaxed mb-6"
        >
          {{ hero.subtitle }}
        </p>
        <div
          v-if="showPrimaryCta || showSecondaryCta"
          class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <RouterLink
            v-if="showPrimaryCta"
            :to="hero.primaryCta.to"
            class="inline-flex items-center bg-primary text-white px-6 py-3 text-base font-semibold hover:bg-primary-hover transition-colors shadow-md"
          >
            {{ hero.primaryCta.label }}
          </RouterLink>
          <RouterLink
            v-if="showSecondaryCta"
            :to="hero.secondaryCta.to"
            class="inline-flex items-center px-6 py-3 text-base font-semibold border-2 border-primary text-primary hover:bg-cream-100 transition-colors"
          >
            {{ hero.secondaryCta.label }}
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>
