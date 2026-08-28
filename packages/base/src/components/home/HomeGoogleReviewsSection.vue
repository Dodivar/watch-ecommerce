<script setup>
import { t } from '@/i18n'
import GoogleReviewsBlock from '@/components/reviews/GoogleReviewsBlock.vue'
</script>

<template>
  <section id="avis" class="py-12 bg-cream">
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
