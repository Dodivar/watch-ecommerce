<script setup>
import { t } from '@/i18n'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { getSiteConfig } from '@/site/getSiteConfig.js'

const site = getSiteConfig()
const aboutPreview = computed(() => site.home?.aboutPreview ?? {})
const imageFailed = ref(false)

const hasContent = computed(() =>
  Boolean(aboutPreview.value.title && aboutPreview.value.description),
)
</script>

<template>
  <section v-if="hasContent" class="py-12 bg-cream">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <article class="grid gap-8 lg:grid-cols-2 lg:items-center bg-white shadow-lg">
        <div class="order-2 lg:order-1 p-6 sm:p-8 lg:p-10">
          <p
            v-if="aboutPreview.eyebrow"
            class="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-3"
          >
            {{ aboutPreview.eyebrow }}
          </p>
          <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-4">
            {{ aboutPreview.title }}
          </h2>
          <p class="text-lg text-gray-600 leading-relaxed mb-6">
            {{ aboutPreview.description }}
          </p>
          <RouterLink
            :to="aboutPreview.to || '/a-propos'"
            class="inline-flex items-center bg-primary text-white px-6 py-3 font-semibold hover:bg-primary-hover transition-colors"
          >
            {{ aboutPreview.ctaLabel || t('home.discoverOurStory') }}
          </RouterLink>
        </div>

        <div class="order-1 lg:order-2 min-h-[280px] bg-cream-200">
          <img
            v-if="aboutPreview.image && !imageFailed"
            :src="aboutPreview.image"
            :alt="aboutPreview.imageAlt || aboutPreview.title"
            class="h-full min-h-[280px] w-full object-cover"
            loading="lazy"
            decoding="async"
            @error="imageFailed = true"
          />
          <div
            v-else
            class="h-full min-h-[280px] flex items-center justify-center text-gray-400 text-lg font-medium tracking-wide"
            aria-hidden="true"
          >
            {{ aboutPreview.imageFallback || 'Place des Montres' }}
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
