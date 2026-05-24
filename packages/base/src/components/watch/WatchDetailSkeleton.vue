<template>
  <section class="lg:py-10 pb-20 lg:pb-10 min-h-screen">
    <div class="max-w-7xl mx-auto px-4">
      <!-- Main Section: Grid 2 columns -->
      <div class="grid lg:grid-cols-2 gap-8 mb-8">
        <!-- Images Section (Left Column) -->
        <div class="space-y-4 lg:space-y-4 -mx-4 lg:mx-0">
          <!-- Main Image Skeleton -->
          <div class="bg-white lg:rounded-md lg:shadow-lg overflow-hidden">
            <div class="relative h-96 lg:h-[500px] bg-cream-300 shimmer-bg"></div>
          </div>

          <!-- Thumbnail Gallery Skeleton (Desktop only) -->
          <div class="hidden lg:grid grid-cols-4 gap-2">
            <div
              v-for="n in 4"
              :key="n"
              class="h-20 bg-cream-300 rounded-lg shimmer-bg"
            ></div>
          </div>
        </div>

        <!-- Watch Info Section (Right Column) -->
        <div class="space-y-6 px-4 lg:px-0">
          <!-- Header Skeleton -->
          <div>
            <div class="flex items-start justify-between mb-2">
              <!-- Title Skeleton -->
              <div class="h-9 lg:h-10 bg-cream-300 rounded flex-1 pr-4 shimmer-bg" style="max-width: 75%;"></div>
              <!-- Badge Skeleton (optional) -->
              <div class="h-6 w-20 bg-cream-200 rounded-full flex-shrink-0 shimmer-bg"></div>
            </div>
            <!-- Reference Skeleton -->
            <div class="h-5 bg-cream-200 rounded mb-3 w-1/2 shimmer-bg"></div>
            <!-- Price Skeleton -->
            <div class="h-9 bg-cream-300 rounded mb-4 w-32 shimmer-bg"></div>
          </div>

          <!-- Key Features Skeleton -->
          <div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Caractéristiques principales</h3>
            <div class="space-y-3">
              <div v-for="n in 4" :key="n" class="flex gap-4 py-2 border-b border-gray-100">
                <span class="h-5 bg-cream-200 rounded w-[140px] flex-shrink-0 shimmer-bg"></span>
                <span class="h-5 bg-cream-300 rounded flex-1 shimmer-bg"></span>
              </div>
            </div>
          </div>

          <!-- Buy Now Button Skeleton (Desktop only) -->
          <div class="hidden lg:block">
            <div class="w-full h-14 bg-primary rounded-lg mb-3 shimmer-bg"></div>
            <!-- Payment Icons Skeleton (resale only) -->
            <div v-if="isResaleCatalog" class="flex items-center justify-center gap-2 mt-2">
              <div class="w-14 h-9 bg-cream-200 rounded border border-gray-300 shimmer-bg"></div>
              <div class="w-14 h-9 bg-cream-200 rounded border border-gray-300 shimmer-bg"></div>
              <div class="w-14 h-9 bg-cream-200 rounded border border-gray-300 shimmer-bg"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- En savoir plus sur l'annonce - Tabs Section Skeleton -->
      <div class="bg-white rounded-md shadow-lg p-8 mb-8">
        <div class="h-8 bg-cream-300 rounded mb-6 w-64 shimmer-bg"></div>
        
        <!-- Tabs Skeleton -->
        <div class="border-b border-gray-200 mb-6">
          <div class="flex space-x-4 lg:space-x-8">
            <div class="h-12 w-24 bg-cream-200 rounded-t shimmer-bg"></div>
            <div class="h-12 w-28 bg-cream-200 rounded-t shimmer-bg"></div>
          </div>
        </div>

        <!-- Tab Content Skeleton -->
        <div class="grid lg:grid-cols-2 gap-8">
          <!-- Left Column: Données de base -->
          <div>
            <div class="h-6 bg-cream-300 rounded mb-4 w-40 shimmer-bg"></div>
            <div class="space-y-0">
              <div v-for="n in 8" :key="n" class="flex gap-4 py-3 border-b border-gray-200">
                <span class="h-4 bg-cream-200 rounded min-w-[160px] flex-shrink-0 shimmer-bg"></span>
                <span class="h-4 bg-cream-300 rounded flex-1 shimmer-bg"></span>
              </div>
            </div>
          </div>

          <!-- Right Column: Spécifications techniques -->
          <div>
            <div class="h-6 bg-cream-300 rounded mb-4 w-48 shimmer-bg"></div>
            <div class="space-y-3">
              <div v-for="n in 8" :key="n" class="flex gap-4 py-2 border-b border-gray-200">
                <span class="h-4 bg-cream-200 rounded min-w-[140px] flex-shrink-0 shimmer-bg"></span>
                <span class="h-4 bg-cream-300 rounded flex-1 shimmer-bg"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Condition & Accessories Skeleton -->
      <div class="grid lg:grid-cols-2 gap-8 mb-12">
        <div class="bg-white rounded-md shadow-lg p-6">
          <div class="h-6 bg-cream-300 rounded mb-4 w-48 shimmer-bg"></div>
          <div class="space-y-3">
            <div v-for="n in 4" :key="n" class="flex gap-4 py-2 border-b border-gray-100">
              <span class="h-4 bg-cream-200 rounded min-w-[140px] flex-shrink-0 shimmer-bg"></span>
              <span class="h-4 bg-cream-300 rounded flex-1 shimmer-bg"></span>
            </div>
          </div>
        </div>

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

      <!-- Description Section (Expandable) Skeleton -->
      <div class="bg-white rounded-md shadow-lg mb-8 overflow-hidden">
        <div class="w-full flex items-center justify-between p-8">
          <div class="h-8 bg-cream-300 rounded w-48 shimmer-bg"></div>
          <div class="w-6 h-6 bg-cream-200 rounded shimmer-bg"></div>
        </div>
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
    </div>
  </section>

  <!-- Sticky Buy Button Mobile Skeleton -->
  <div class="fixed bottom-0 left-0 right-0 lg:hidden z-20 bg-white shadow-lg border-t border-gray-200 px-4 py-3">
    <div class="flex items-center justify-between gap-4 max-w-7xl mx-auto">
      <!-- Watch Info and Price Skeleton -->
      <div class="flex-1 min-w-0">
        <div class="h-4 bg-cream-300 rounded mb-0.5 w-3/4 shimmer-bg"></div>
        <div class="h-7 bg-cream-300 rounded w-24 shimmer-bg"></div>
      </div>
      <!-- Buy Button Skeleton -->
      <div class="flex-shrink-0 h-12 w-24 bg-cream-300 rounded-lg shimmer-bg"></div>
    </div>
  </div>
</template>

<script setup>
import { getSiteConfig } from '@/site/getSiteConfig.js'

const isResaleCatalog = getSiteConfig().watchCatalog.isResale
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

