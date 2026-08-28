<script setup>
import { computed, ref } from 'vue'
import { t } from '@/i18n'
import GoogleReviewStars from '@/components/reviews/GoogleReviewStars.vue'

const props = defineProps({
  review: { type: Object, required: true },
})

/** Au-delà, l'avis est replié : les cartes de la grille doivent garder la même hauteur. */
const COLLAPSE_THRESHOLD = 260

const expanded = ref(false)

const isLong = computed(() => (props.review.text || '').length > COLLAPSE_THRESHOLD)
const initial = computed(() => (props.review.authorName || '?').trim().charAt(0).toUpperCase())
</script>

<template>
  <article
    class="flex h-full flex-col rounded-md border border-cream-300 bg-white p-6 shadow-lg transition-colors"
  >
    <header class="flex items-start gap-3">
      <img
        v-if="review.authorPhotoUrl"
        :src="review.authorPhotoUrl"
        :alt="review.authorName"
        width="40"
        height="40"
        loading="lazy"
        decoding="async"
        referrerpolicy="no-referrer"
        class="h-10 w-10 shrink-0 rounded-full object-cover"
      />
      <span
        v-else
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
        aria-hidden="true"
        >{{ initial }}</span
      >
      <div class="min-w-0 flex-1">
        <p class="truncate font-semibold text-text-main">{{ review.authorName }}</p>
        <p v-if="review.relativeTime" class="text-sm text-gray-500">{{ review.relativeTime }}</p>
      </div>
    </header>

    <GoogleReviewStars :rating="review.rating" class="mt-3" />

    <p
      v-if="review.text"
      class="mt-3 flex-1 whitespace-pre-line text-gray-600"
      :class="{ 'line-clamp-6': isLong && !expanded }"
    >
      {{ review.text }}
    </p>

    <button
      v-if="isLong && !expanded"
      type="button"
      class="mt-2 self-start text-sm font-semibold text-primary underline underline-offset-2 hover:text-primary-hover"
      @click="expanded = true"
    >
      {{ t('reviews.readMore') }}
    </button>
  </article>
</template>
