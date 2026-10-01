<script setup>
import { t } from '@/i18n'
import LegalBlocks from './LegalBlocks.vue'

/**
 * Page juridique rendue depuis un document du manifest (`legalDocuments.<clé>`).
 * Forme du document et syntaxe des textes : voir `sites/sauvage-watches/legal.config.js`.
 */
defineProps({
  doc: { type: Object, required: true },
})
</script>

<template>
  <div class="min-h-screen bg-white">
    <section class="py-12 border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">{{ doc.title }}</h1>
        <p class="text-gray-600 text-sm">{{ t('legal.lastUpdated', { date: doc.updated }) }}</p>
        <div v-if="doc.intro?.length" class="mt-6 space-y-3 text-gray-700 leading-relaxed">
          <LegalBlocks :blocks="doc.intro" />
        </div>
      </div>
    </section>

    <div
      class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-gray-700 leading-relaxed [&_strong]:text-text-main"
    >
      <section v-for="section in doc.sections" :key="section.title">
        <h2 class="text-xl font-bold text-text-main mb-4">{{ section.title }}</h2>
        <div class="space-y-3">
          <LegalBlocks :blocks="section.blocks" />
        </div>
      </section>
    </div>
  </div>
</template>
