<script setup>
import { computed } from 'vue'
import { t } from '@/i18n'
import { formatRating } from '@/utils/formatters.js'

const props = defineProps({
  /** Note sur 5. `null` ne rend rien. */
  rating: { type: Number, default: null },
  /** `sm` pour les cartes d'avis, `md` pour le résumé en tête de bloc. */
  size: { type: String, default: 'sm' },
})

const STAR_COUNT = 5

/**
 * Largeur de la couche dorée : 4,3/5 → 86 %. Une seule couche à découper, pas de demi-étoile.
 * Le pourcentage porte sur la largeur du composant, d'où le `w-fit` du template : sans lui, une
 * carte en `flex flex-col` étire le bloc et les 80 % d'une note de 4 couvriraient les 5 étoiles.
 */
const filledWidth = computed(() => {
  const value = Number(props.rating)
  if (!Number.isFinite(value)) return '0%'
  const clamped = Math.min(Math.max(value, 0), STAR_COUNT)
  return `${(clamped / STAR_COUNT) * 100}%`
})

const sizeClass = computed(() => (props.size === 'md' ? 'text-xl' : 'text-base'))

const label = computed(() =>
  t('reviews.ratingOutOf', { rating: formatRating(props.rating), max: STAR_COUNT }),
)
</script>

<template>
  <span
    v-if="rating != null"
    class="google-review-stars relative inline-block w-fit leading-none whitespace-nowrap"
    :class="sizeClass"
    role="img"
    :aria-label="label"
  >
    <span class="text-gray-300" aria-hidden="true">★★★★★</span>
    <span
      class="absolute inset-y-0 left-0 overflow-hidden text-amber-500"
      :style="{ width: filledWidth }"
      aria-hidden="true"
      >★★★★★</span
    >
  </span>
</template>
