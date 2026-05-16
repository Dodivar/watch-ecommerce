<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { buildCollectionRouteFromFilters } from '@/site/homeSelections.js'

const site = getSiteConfig()

const selections = computed(() => site.home.selections)
const cards = computed(() => selections.value.cards)

const hasCards = computed(() => cards.value.length > 0)

/** Indices de cartes dont l’image configurée n’a pas pu être chargée. */
const brokenImageIndices = ref(new Set())

function cardRoute(card) {
  return buildCollectionRouteFromFilters(card.filters ?? {})
}

function showCardImage(card, index) {
  return Boolean(card.image) && !brokenImageIndices.value.has(index)
}

function onImageError(index) {
  brokenImageIndices.value = new Set([...brokenImageIndices.value, index])
}
</script>

<template>
  <section v-if="hasCards" class="py-12 bg-cream">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-8 text-left">
        {{ selections.title }}
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <RouterLink
          v-for="(card, index) in cards"
          :key="`${card.label}-${index}`"
          :to="cardRoute(card)"
          class="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <article
            class="relative aspect-[4/5] bg-cream-200 overflow-hidden transition-opacity group-hover:opacity-95"
          >
            <img
              v-if="showCardImage(card, index)"
              :src="card.image"
              :alt="card.imageAlt || card.label"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
              decoding="async"
              @error="onImageError(index)"
            />
            <div
              v-if="!showCardImage(card, index)"
              class="absolute inset-0 flex items-center justify-center text-gray-400 text-lg font-medium tracking-wide"
              aria-hidden="true"
            >
              TODO
            </div>

            <span
              class="absolute bottom-3 left-3 bg-white text-text-main text-sm font-medium px-3 py-2"
            >
              {{ card.label }}
            </span>
          </article>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
