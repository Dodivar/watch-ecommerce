<template>
  <article
    class="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
    :aria-label="cardLabel"
  >
    <!-- Plaque blanche : les visuels montres gardent leur fond clair quel que soit le thème. -->
    <div class="relative min-h-0 flex-1 bg-white">
      <span
        v-if="watch.isOnPromotion"
        class="absolute left-3 top-3 z-10 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
      >
        -{{ watch.displayDiscountPercent }} %
      </span>
      <span
        v-if="watch.year"
        class="absolute right-3 top-3 z-10 rounded border border-gray-200 bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-800 shadow-sm backdrop-blur-sm"
      >
        {{ watch.year }}
      </span>

      <img
        v-if="imageSrc"
        :key="imageSrc"
        :src="imageSrc"
        :srcset="imageSrcSet"
        :sizes="imageSrcSet ? IMAGE_SIZES : undefined"
        :alt="watch.name || ''"
        :loading="imageLoading"
        :fetchpriority="fetchPriority"
        decoding="async"
        draggable="false"
        class="pointer-events-none h-full w-full select-none object-cover object-center"
      />
      <div v-else class="flex h-full w-full items-center justify-center">
        <span class="text-gray-400">{{ t('watch.imageUnavailable') }}</span>
      </div>
    </div>

    <!-- Bandeau d'identité au plus juste sur petit écran : ce qu'il ne prend pas, la photo
         l'a (la carte est bornée par la hauteur d'écran dans le deck). -->
    <div class="shrink-0 border-t border-gray-100 px-4 py-3 sm:px-5 sm:py-4">
      <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
        {{ watch.brand }}
      </p>
      <h3
        class="mt-0.5 truncate text-base font-semibold leading-tight text-gray-900 sm:text-lg"
        :title="watch.name"
      >
        {{ watch.model || watch.name }}
      </h3>
      <div class="mt-1.5 flex items-baseline gap-2 sm:mt-2">
        <span v-if="watch.isOnPromotion" class="text-sm text-gray-400 line-through">
          {{ formatPrice(watch.price) }}
        </span>
        <span class="text-lg font-bold text-primary sm:text-xl">
          {{ formatPrice(effectivePrice) }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

import { t } from '@/i18n'
import { formatPrice } from '@/utils/formatters.js'
import { buildWatchCardSrcSet, watchCardImageUrl } from '@/utils/watchImageUrl.js'

const IMAGE_SIZES = '(max-width: 640px) 100vw, 480px'

const props = defineProps({
  watch: { type: Object, required: true },
  imageLoading: {
    type: String,
    default: 'eager',
    validator: (v) => ['eager', 'lazy'].includes(v),
  },
  fetchPriority: {
    type: String,
    default: 'auto',
    validator: (v) => ['high', 'low', 'auto'].includes(v),
  },
})

const firstImage = computed(() => props.watch?.images?.[0] || null)
const imageSrc = computed(() => watchCardImageUrl(firstImage.value, { width: 640 }))
const imageSrcSet = computed(() => buildWatchCardSrcSet(firstImage.value))

const effectivePrice = computed(() => props.watch?.effectivePrice ?? props.watch?.price)

const cardLabel = computed(() =>
  t('matchmaking.deck.cardLabel', {
    brand: props.watch?.brand ?? '',
    name: props.watch?.model || props.watch?.name || '',
    price: formatPrice(effectivePrice.value),
  }),
)
</script>
