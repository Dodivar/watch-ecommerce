<template>
  <!-- Main Section: Grid 2 columns -->
  <div class="grid lg:grid-cols-2 gap-4 mb-8">
    <!-- Images Section (Left Column) -->
    <div class="space-y-4 lg:space-y-4 -mx-4 lg:mx-0">
      <!-- Main Image Skeleton -->
      <div class="bg-white lg:rounded-md lg:shadow-lg overflow-hidden">
        <div class="relative h-96 lg:h-[500px] bg-cream-300 shimmer-bg"></div>
      </div>

      <!-- Thumbnail Gallery Skeleton (Desktop only) -->
      <div class="hidden lg:flex gap-2">
        <div
          v-for="n in 4"
          :key="n"
          class="h-20 w-20 shrink-0 rounded-lg bg-cream-300 shimmer-bg"
        ></div>
      </div>
    </div>

    <!-- Watch Info Section (Right Column) -->
    <div class="space-y-6">
      <!-- Header Skeleton -->
      <div>
        <div class="flex items-start justify-between mb-2">
          <!-- Title Skeleton -->
          <div
            class="h-9 lg:h-10 bg-cream-300 rounded flex-1 pr-4 shimmer-bg"
            style="max-width: 75%;"
          ></div>
          <!-- Badge Skeleton (optional) -->
          <div class="h-6 w-20 bg-cream-200 rounded-full flex-shrink-0 shimmer-bg"></div>
        </div>
        <!-- Reference Skeleton -->
        <div class="h-5 bg-cream-200 rounded mb-3 w-1/2 shimmer-bg"></div>
        <!-- Price Skeleton -->
        <div class="h-9 bg-cream-300 rounded mb-4 w-32 shimmer-bg"></div>
      </div>

      <!-- Key Features Skeleton (resale only) -->
      <div v-if="isResaleCatalog">
        <h3 class="text-lg lg:text-xl font-semibold text-text-main mb-3">
          Caractéristiques principales
        </h3>
        <div class="space-y-3">
          <div v-for="n in 4" :key="n" class="flex gap-4 py-2 border-b border-border-subtle">
            <span class="h-5 bg-cream-200 rounded w-[140px] flex-shrink-0 shimmer-bg"></span>
            <span class="h-5 bg-cream-300 rounded flex-1 shimmer-bg"></span>
          </div>
        </div>
      </div>

      <!-- Buy Now Button Skeleton -->
      <div>
        <div class="w-full h-12 bg-primary rounded-lg shimmer-bg"></div>
      </div>

      <!-- Appointment Button Skeleton -->
      <div v-if="appointmentEnabled" class="mt-3">
        <div class="w-full h-12 rounded-lg border border-border-subtle bg-cream-100 shimmer-bg"></div>
      </div>

      <!-- Payment Icons Skeleton (resale only) -->
      <div v-if="isResaleCatalog" class="flex items-center justify-center gap-2 mt-3">
        <div class="w-14 h-9 bg-cream-200 rounded border border-border-strong shimmer-bg"></div>
        <div class="w-14 h-9 bg-cream-200 rounded border border-border-strong shimmer-bg"></div>
        <div class="w-14 h-9 bg-cream-200 rounded border border-border-strong shimmer-bg"></div>
      </div>

      <!-- Trust highlights Skeleton (retail only) -->
      <div
        v-if="showRetailTrustCard"
        class="bg-white rounded-md shadow-lg border border-border-subtle p-3 lg:p-4 mt-3 lg:mt-4"
      >
        <ul class="flex flex-col gap-2">
          <li
            v-for="n in retailTrustSkeletonCount"
            :key="n"
            class="flex items-center gap-2 min-w-0"
          >
            <div class="h-12 w-12 shrink-0 rounded-full bg-cream-200 shimmer-bg"></div>
            <div class="h-4 flex-1 bg-cream-300 rounded shimmer-bg"></div>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <!-- En savoir plus sur l'annonce - Tabs Section Skeleton -->
  <div class="bg-white rounded-md shadow-lg p-8 mb-8">
    <div class="h-8 bg-cream-300 rounded mb-6 w-64 shimmer-bg"></div>

    <!-- Tabs Skeleton -->
    <div class="border-b border-border-subtle mb-6">
      <div class="flex space-x-4 lg:space-x-8">
        <div class="h-12 w-24 bg-cream-200 rounded-t shimmer-bg"></div>
        <div
          v-if="showGuaranteesTab"
          class="h-12 w-28 bg-cream-200 rounded-t shimmer-bg"
        ></div>
      </div>
    </div>

    <!-- Tab Content Skeleton -->
    <div class="grid lg:grid-cols-2 gap-8">
      <!-- Left Column: Données de base -->
      <div>
        <div class="h-6 bg-cream-300 rounded mb-4 w-40 shimmer-bg"></div>
        <div class="space-y-0">
          <div v-for="n in 8" :key="n" class="flex gap-4 py-3 border-b border-border-subtle">
            <span class="h-4 bg-cream-200 rounded min-w-[160px] flex-shrink-0 shimmer-bg"></span>
            <span class="h-4 bg-cream-300 rounded flex-1 shimmer-bg"></span>
          </div>
        </div>
      </div>

      <!-- Right Column: Spécifications techniques -->
      <div>
        <div class="h-6 bg-cream-300 rounded mb-4 w-48 shimmer-bg"></div>
        <div class="space-y-3">
          <div v-for="n in 8" :key="n" class="flex gap-4 py-2 border-b border-border-subtle">
            <span class="h-4 bg-cream-200 rounded min-w-[140px] flex-shrink-0 shimmer-bg"></span>
            <span class="h-4 bg-cream-300 rounded flex-1 shimmer-bg"></span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Delivery Content Skeleton (resale only) -->
  <div v-if="showDeliveryContent" class="grid lg:grid-cols-2 gap-8 mb-12">
    <div class="bg-white rounded-md shadow-lg p-6">
      <div class="h-6 bg-cream-300 rounded mb-4 w-56 shimmer-bg"></div>
      <div class="space-y-3">
        <div v-for="n in 5" :key="n" class="flex items-center space-x-3">
          <div class="w-5 h-5 bg-cream-200 rounded shimmer-bg"></div>
          <div class="h-4 bg-cream-300 rounded flex-1 shimmer-bg"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Related Articles Skeleton -->
  <div class="bg-white rounded-md shadow-lg p-8 mb-12">
    <div class="h-8 bg-cream-300 rounded mb-6 w-48 shimmer-bg"></div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="n in 3"
        :key="n"
        class="bg-white rounded-lg p-6 shadow-sm"
      >
        <div class="h-6 bg-cream-300 rounded mb-3 shimmer-bg"></div>
        <div class="h-4 bg-cream-200 rounded mb-2 shimmer-bg"></div>
        <div class="h-4 bg-cream-200 rounded mb-4 w-4/5 shimmer-bg"></div>
        <div class="flex gap-2 mb-4">
          <div class="h-5 w-16 bg-cream-200 rounded-full shimmer-bg"></div>
          <div class="h-5 w-20 bg-cream-200 rounded-full shimmer-bg"></div>
        </div>
        <div class="flex items-center justify-between">
          <div class="h-4 w-24 bg-cream-200 rounded shimmer-bg"></div>
          <div class="h-4 w-32 bg-cream-300 rounded shimmer-bg"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Description Section Skeleton -->
  <div class="bg-white rounded-md shadow-lg mb-8 overflow-hidden p-8">
    <div class="h-6 lg:h-7 w-40 mb-4 bg-cream-300 rounded shimmer-bg"></div>
    <div class="space-y-2">
      <div
        v-for="n in 4"
        :key="n"
        class="h-4 bg-cream-200 rounded shimmer-bg"
        :class="n === 4 ? 'w-2/3' : 'w-full'"
      ></div>
    </div>
    <div class="h-4 w-24 mt-3 bg-cream-300 rounded shimmer-bg"></div>
  </div>

  <!-- Contact Reminder Skeleton -->
  <div class="bg-white rounded-md shadow-lg p-8">
    <div class="text-center mb-6">
      <div class="h-8 lg:h-9 bg-cream-300 rounded mb-3 mx-auto w-3/4 shimmer-bg"></div>
      <div class="h-5 bg-cream-200 rounded mx-auto w-2/3 shimmer-bg"></div>
    </div>
    <div class="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
      <div class="flex-1 h-14 bg-cream-300 rounded-lg shimmer-bg"></div>
      <div class="flex-1 h-14 bg-cream-300 rounded-lg shimmer-bg"></div>
    </div>
  </div>
</template>

<script setup>
import { getSiteConfig } from '@/site/getSiteConfig.js'
import {
  resolveWatchCatalogConfig,
  resolveRetailTrustHighlights,
  resolveWatchGuarantees,
} from '@/site/watchCatalogDisplay.js'

const site = getSiteConfig()
const catalog = resolveWatchCatalogConfig(site)

const isResaleCatalog = catalog.isResale
const appointmentEnabled = catalog.appointmentEnabled
const showDeliveryContent = catalog.display.showDeliveryContent

const retailTrustHighlights = resolveRetailTrustHighlights(site, null)
const showRetailTrustCard = !isResaleCatalog && retailTrustHighlights.length > 0
const retailTrustSkeletonCount = Math.min(retailTrustHighlights.length, 4)

const watchGuarantees = resolveWatchGuarantees(site, null)
const showGuaranteesTab = watchGuarantees.items.length > 0
</script>

<style scoped>

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.shimmer-bg {
  background: linear-gradient(
    90deg,
    #e5e7eb 0%,
    #f3f4f6 20%,
    #e5e7eb 40%,
    #e5e7eb 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
</style>
