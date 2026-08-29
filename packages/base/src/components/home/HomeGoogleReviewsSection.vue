<script setup>
import { t } from '@/i18n'
import { useGoogleReviews } from '@/composables/useGoogleReviews.js'
import GoogleReviewsBlock from '@/components/reviews/GoogleReviewsBlock.vue'

/**
 * L'état est un singleton de module : lire `status` ici ne déclenche pas d'appel supplémentaire,
 * c'est `GoogleReviewsBlock` qui charge au montage. Sans ce garde-fou, un backend qui répond 503
 * (clé serveur absente) laissait le titre « Ce que disent nos clients » seul au milieu de la page,
 * le bloc s'étant masqué de son côté.
 */
const { status } = useGoogleReviews()
</script>

<template>
  <section v-if="status !== 'empty'" id="avis" class="py-12 bg-cream">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-10">
        <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">
          {{ t('reviews.title') }}
        </h2>
        <p class="text-xl text-gray-600">
          {{ t('reviews.subtitle') }}
        </p>
      </div>

      <GoogleReviewsBlock />
    </div>
  </section>
</template>
