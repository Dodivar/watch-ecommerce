<script setup>
/**
 * Hero « éditorial » — proposition sans animation : composition centrée,
 * très typographique, suivie d'une planche de pièces alignées sur une même
 * ligne de base et d'un bandeau de réassurance.
 * Tout le contenu vient de `home.hero` (voir `site/homeHero.js`).
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { getSiteConfig } from '@/site/getSiteConfig.js'
import { isHomeHeroCtaVisible } from '@/site/homeHero.js'

/** Trois pièces : la centrale porte la composition, les deux autres l'encadrent. */
const MAX_PIECES = 3
const FEATURED_INDEX = 1

const site = getSiteConfig()
const hero = computed(() => site.home?.hero ?? {})
const features = computed(() => site.features ?? {})

const pieces = computed(() => (hero.value.pieces ?? []).slice(0, MAX_PIECES))
const highlights = computed(() => (hero.value.highlights ?? []).slice(0, 4))

function pieceAlt(piece) {
  if (piece.alt) return piece.alt
  return [piece.brand, piece.model].filter(Boolean).join(' ')
}

const showPrimaryCta = computed(() =>
  isHomeHeroCtaVisible(hero.value.primaryCta, features.value),
)
const showSecondaryCta = computed(() =>
  isHomeHeroCtaVisible(hero.value.secondaryCta, features.value),
)
</script>

<template>
  <section id="accueil" class="bg-cream border-b border-cream-200">
    <div class="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8 lg:pt-20">
      <div class="mx-auto max-w-3xl text-center">
        <p
          v-if="hero.eyebrow"
          class="flex items-center justify-center gap-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary"
        >
          <span class="block w-10 border-t border-gray-300" aria-hidden="true" />
          {{ hero.eyebrow }}
          <span class="block w-10 border-t border-gray-300" aria-hidden="true" />
        </p>

        <h1
          class="mt-7 text-4xl font-bold leading-[1.08] text-text-main sm:text-5xl lg:text-6xl"
        >
          {{ hero.title }}
        </h1>

        <p
          v-if="hero.subtitle"
          class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600"
        >
          {{ hero.subtitle }}
        </p>

        <div
          v-if="showPrimaryCta || showSecondaryCta"
          class="mt-9 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8"
        >
          <RouterLink
            v-if="showPrimaryCta"
            :to="hero.primaryCta.to"
            class="inline-flex items-center justify-center bg-primary px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {{ hero.primaryCta.label }}
          </RouterLink>
          <RouterLink
            v-if="showSecondaryCta"
            :to="hero.secondaryCta.to"
            class="text-base font-semibold text-primary underline underline-offset-8 transition-opacity hover:opacity-70"
          >
            {{ hero.secondaryCta.label }}
          </RouterLink>
        </div>
      </div>

      <ul
        v-if="pieces.length"
        class="mt-14 flex items-end justify-center gap-10 sm:gap-14 lg:mt-20 lg:gap-24"
      >
        <li
          v-for="(piece, index) in pieces"
          :key="piece.image"
          class="flex-col items-center text-center"
          :class="index === FEATURED_INDEX ? 'flex' : 'hidden sm:flex'"
        >
          <div class="flex h-40 items-end justify-center sm:h-52 lg:h-[19rem]">
            <img
              :src="piece.image"
              :alt="pieceAlt(piece)"
              class="w-auto max-w-full object-contain"
              :class="index === FEATURED_INDEX ? 'max-h-full' : 'max-h-[72%]'"
              decoding="async"
            />
          </div>
          <p
            v-if="piece.brand"
            class="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500"
          >
            {{ piece.brand }}
          </p>
          <p v-if="piece.model" class="mt-1.5 text-sm text-gray-600">
            {{ piece.model }}
          </p>
        </li>
      </ul>
    </div>

    <div v-if="highlights.length" class="mt-14 border-t border-gray-200 lg:mt-20">
      <ul class="mx-auto grid max-w-7xl lg:grid-cols-4">
        <li
          v-for="highlight in highlights"
          :key="highlight"
          class="border-b border-gray-200 px-4 py-5 text-center text-sm text-gray-600 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
        >
          {{ highlight }}
        </li>
      </ul>
    </div>
  </section>
</template>
