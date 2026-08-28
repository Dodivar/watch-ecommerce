<script setup>
import { computed, onMounted } from 'vue'
import { t, tc } from '@/i18n'
import { useGoogleReviews } from '@/composables/useGoogleReviews.js'
import { formatRating } from '@/utils/formatters.js'
import GoogleReviewCard from '@/components/reviews/GoogleReviewCard.vue'
import GoogleReviewStars from '@/components/reviews/GoogleReviewStars.vue'

const props = defineProps({
  /**
   * `section` : grille pleine largeur (page d'accueil).
   * `compact` : colonne unique, sous la carte de la page Contact.
   */
  variant: { type: String, default: 'section' },
})

const { status, rating, userRatingCount, reviews, profileUrl, load } = useGoogleReviews()

onMounted(() => {
  void load()
})

const isCompact = computed(() => props.variant === 'compact')

const gridClass = computed(() =>
  isCompact.value ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
)

/** Nombre de squelettes pendant le chargement — même gabarit que la grille finale. */
const skeletonCount = computed(() => (isCompact.value ? 2 : 3))

const formattedRating = computed(() => formatRating(rating.value))

const reviewCountLabel = computed(() => tc('reviews.reviewCount', userRatingCount.value))
</script>

<template>
  <!-- `empty` couvre aussi bien « pas d'avis » qu'un backend injoignable : le bloc disparaît. -->
  <div v-if="status !== 'empty'" class="google-reviews">
    <div v-if="status === 'loading' || status === 'idle'" :class="gridClass" aria-hidden="true">
      <div
        v-for="index in skeletonCount"
        :key="index"
        class="h-44 animate-pulse rounded-md border border-cream-300 bg-white/60"
      />
      <p class="sr-only">{{ t('reviews.loading') }}</p>
    </div>

    <template v-else>
      <div
        class="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-md border border-cream-300 bg-white px-5 py-4 shadow-lg"
      >
        <div class="flex items-center gap-3">
          <GoogleReviewStars :rating="rating" size="md" />
          <p class="text-text-main">
            <span class="text-lg font-semibold">{{ formattedRating }}</span>
            <span class="text-gray-600"> · {{ reviewCountLabel }}</span>
          </p>
        </div>

        <a
          v-if="profileUrl"
          :href="profileUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          {{ t('reviews.seeAllOnGoogle') }}
        </a>
      </div>

      <div :class="gridClass">
        <GoogleReviewCard
          v-for="review in reviews"
          :key="review.id || review.authorName"
          :review="review"
        />
      </div>

      <!-- Attribution exigée par les conditions d'utilisation de Google Maps Platform. -->
      <p class="mt-4 text-sm text-gray-500">{{ t('reviews.poweredByGoogle') }}</p>
    </template>
  </div>
</template>
