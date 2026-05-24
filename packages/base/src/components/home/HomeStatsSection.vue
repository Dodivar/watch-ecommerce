<script setup>
import { computed } from 'vue'

import AppIcon from '@/components/ui/AppIcon.vue'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const site = getSiteConfig()

const statsConfig = computed(() => site.home?.stats ?? {})

function normalizeCard(entry, fallbackIcon = 'shield') {
  if (typeof entry === 'string') {
    const label = entry.trim()
    return label ? { icon: fallbackIcon, label } : null
  }

  if (!entry?.label) return null

  return {
    icon: entry.icon || fallbackIcon,
    value: entry.value,
    label: entry.label,
    detail: entry.detail,
  }
}

const cards = computed(() => {
  const items = Array.isArray(statsConfig.value.items) ? statsConfig.value.items : []
  const highlights = Array.isArray(statsConfig.value.highlights)
    ? statsConfig.value.highlights
    : []

  return [
    ...items.map((item) => normalizeCard(item)).filter(Boolean),
    ...highlights.map((item) => normalizeCard(item)).filter(Boolean),
  ]
})
</script>

<template>
  <section v-if="cards.length" class="py-8 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <article
          v-for="card in cards"
          :key="`${card.label}-${card.value ?? ''}`"
          class="bg-cream p-5 text-center shadow-sm"
        >
          <div
            class="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3"
          >
            <AppIcon :name="card.icon" class="h-6 w-6 text-white" />
          </div>

          <p v-if="card.value" class="text-2xl lg:text-3xl font-bold text-primary mb-1">
            {{ card.value }}
          </p>

          <h3 class="text-sm font-semibold text-text-main leading-snug">
            {{ card.label }}
          </h3>

          <p v-if="card.detail" class="text-xs text-gray-600 mt-1 leading-relaxed">
            {{ card.detail }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
