<script setup>
import { BadgeCheck, Globe, ShieldCheck, UserRound } from '@lucide/vue'
import { t } from '@/i18n'
</script>

<template>
  <section class="py-12 bg-cream">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-10">
        <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">
          {{ t('home.trustTitle') }}
        </h2>
        <p class="text-xl text-gray-600">
          {{ t('home.trustSubtitle') }}
        </p>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="text-center p-6 rounded-md bg-white shadow-lg transition-colors">
          <div
            class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3"
          >
            <UserRound class="h-8 w-8 text-white" :stroke-width="2" />
          </div>
          <h3 class="text-lg font-semibold mb-2">{{ t('home.trustSupportTitle') }}</h3>
          <p class="text-gray-600">
            {{ t('home.trustSupportText') }}
          </p>
        </div>
        <div class="text-center p-6 rounded-md bg-white shadow-lg transition-colors">
          <div
            class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3"
          >
            <ShieldCheck class="h-8 w-8 text-white" :stroke-width="2" />
          </div>
          <h3 class="text-lg font-semibold mb-2">{{ t('home.trustAuthenticityTitle') }}</h3>
          <p class="text-gray-600">
            {{ t('home.trustAuthenticityText') }}
          </p>
        </div>
        <div class="text-center p-6 rounded-md bg-white shadow-lg transition-colors">
          <div
            class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3"
          >
            <Globe class="h-8 w-8 text-white" :stroke-width="2" />
          </div>
          <h3 class="text-lg font-semibold mb-2">{{ t('home.trustNetworkTitle') }}</h3>
          <p class="text-gray-600">
            {{ t('home.trustNetworkText') }}
          </p>
        </div>
        <div class="text-center p-6 rounded-md bg-white shadow-lg transition-colors">
          <div
            class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3"
          >
            <BadgeCheck class="h-8 w-8 text-white" :stroke-width="2" />
          </div>
          <h3 class="text-lg font-semibold mb-2">{{ t('home.trustTransparencyTitle') }}</h3>
          <p class="text-gray-600">
            {{ t('home.trustTransparencyText') }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
