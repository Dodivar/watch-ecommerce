<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getConsentState, shouldShowBanner, saveConsent } from '@/services/cookieConsent'
import { cookiePreferencesTick } from '@/services/cookiePreferencesUi'
import { ensureGoogleAnalytics } from '@/services/googleAnalytics'
import { t } from '@/i18n'

const route = useRoute()
const GA_ID = import.meta.env.VITE_GA_ID

const dismissed = ref(!shouldShowBanner())
const showCustomize = ref(false)
const analyticsChoice = ref(false)

const isMaintenance = computed(() => route.path === '/maintenance')

const open = computed(() => !dismissed.value && !isMaintenance.value)

watch(cookiePreferencesTick, () => {
  if (cookiePreferencesTick.value < 1) return
  const state = getConsentState()
  analyticsChoice.value = Boolean(state && !state.expired && state.analytics)
  showCustomize.value = false
  dismissed.value = false
})

function applyChoice(analytics) {
  saveConsent({ analytics })
  if (analytics) {
    ensureGoogleAnalytics(GA_ID)
  }
  dismissed.value = true
  showCustomize.value = false
}

function onAccept() {
  applyChoice(true)
}

function onRefuse() {
  applyChoice(false)
}

function onOpenCustomize() {
  showCustomize.value = true
  analyticsChoice.value = false
}

function onSaveCustomize() {
  applyChoice(analyticsChoice.value)
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 md:items-end md:justify-end md:p-4 md:pointer-events-none"
  >
    <div class="absolute inset-0 bg-black/55 md:hidden" aria-hidden="true" />
    <div
      class="relative w-full max-w-lg min-h-[280px] max-h-[min(90vh,640px)] overflow-y-auto rounded-xl border border-gray-100 bg-white p-6 shadow-2xl md:max-w-md md:pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
    >
      <h2 id="cookie-banner-title" class="font-heading text-lg font-bold text-primary">
        {{ t('cookies.title') }}
      </h2>
      <p class="mt-3 text-sm leading-relaxed text-text-main">
        {{ t('cookies.body') }}
        <RouterLink
          to="/politique-confidentialite"
          class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >{{ t('cookies.privacyLink') }}</RouterLink
        >.
      </p>

      <div v-if="!showCustomize" class="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        <button
          type="button"
          class="order-3 w-full rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:order-1 sm:w-auto sm:px-5"
          @click="onAccept"
        >
          {{ t('cookies.accept') }}
        </button>
        <button
          type="button"
          class="order-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-text-main transition-colors hover:bg-gray-50 sm:w-auto sm:px-5"
          @click="onRefuse"
        >
          {{ t('cookies.reject') }}
        </button>
        <button
          type="button"
          class="order-1 w-full rounded-lg px-4 py-3 text-center text-sm font-semibold text-primary underline-offset-4 hover:underline sm:order-2 sm:w-auto"
          @click="onOpenCustomize"
        >
          {{ t('cookies.customize') }}
        </button>
      </div>

      <div v-else class="mt-6 space-y-4 border-t border-gray-100 pt-6">
        <p class="text-sm font-medium text-text-main">{{ t('cookies.preferences') }}</p>
        <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-4">
          <input
            v-model="analyticsChoice"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span class="text-sm leading-snug text-text-main">
            <span class="font-semibold text-primary">{{ t('cookies.analyticsTitle') }}</span>
            {{ t('cookies.analyticsBody') }}
          </span>
        </label>
        <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:w-auto sm:px-5"
            @click="onSaveCustomize"
          >
            {{ t('cookies.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
