<script setup>
import { getSiteConfig } from '@/site/getSiteConfig.js'

defineOptions({ name: 'ServiceAreaNote' })

/**
 * Zone d'intervention (`site.serviceArea`) : texte de référencement local, volontairement
 * discret. Absent de l'accueil ; vitrine sans bloc `serviceArea` = rien d'affiché.
 */
const serviceArea = getSiteConfig().serviceArea
const title = serviceArea?.title || ''
const text = serviceArea?.text || ''
</script>

<template>
  <div v-if="text" class="mt-8 text-center text-sm text-gray-500">
    <h2 v-if="title" class="font-semibold text-gray-600 mb-1">{{ title }}</h2>
    <p class="max-w-3xl mx-auto leading-relaxed">{{ text }}</p>
  </div>
</template>
