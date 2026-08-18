<script setup>
import { t } from '@/i18n'
</script>

<template>
  <section
    class="min-h-screen bg-white text-text-main flex flex-col items-center justify-center px-6 py-16"
  >
    <div class="max-w-2xl text-center space-y-8">
      <div class="flex flex-col items-center gap-2">
        <h2 class="text-primary uppercase text-5xl font-bold">
          {{ t('notFound.code') }}
        </h2>
      </div>

      <div class="space-y-3">
        <h1 class="text-3xl font-semibold">
          {{ t('notFound.headline') }}
        </h1>
        <p class="text-lg text-gray-600">
          {{ t('notFound.reassure') }}
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <RouterLink
          to="/"
          class="inline-flex items-center justify-center px-6 py-3 rounded-full text-white bg-primary hover:bg-primary/90 transition"
        >
          {{ t('notFound.backHome') }}
        </RouterLink>
        <button
          type="button"
          class="inline-flex items-center justify-center px-6 py-3 rounded-full border border-primary text-primary hover:bg-primary/5 transition"
          @click="$router.back()"
        >
          {{ t('notFound.goBack') }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>

