<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { cancelOrder } from '@/services/orderService.js'
import { WHATSAPP_NUMBER } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { getBrowsePath } from '@/site/siteFeatures.js'
import { t } from '@/i18n'

const route = useRoute()
const browsePath = getBrowsePath(getSiteConfig().features)
const site = getSiteConfig()

const released = ref(false)
const error = ref('')

const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent('Bonjour, j’ai annulé ma commande en ligne.')}`

function clearCheckoutSession() {
  const key = `watch_checkout:${site.siteId || site.id || 'default'}`
  sessionStorage.removeItem(key)
}

onMounted(async () => {
  const orderId = String(route.query.order || '')
  const token = String(route.query.token || '')
  if (orderId && token) {
    try {
      await cancelOrder(orderId, token)
      released.value = true
    } catch (e) {
      error.value = e.message
    }
  }
  clearCheckoutSession()
})
</script>

<template>
  <section class="min-h-screen flex items-center justify-center py-12 px-4">
    <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
      <div class="mb-6">
        <div class="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
          <svg class="w-12 h-12 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ t('checkout.orderCancelledTitle') }}</h1>
      <p class="text-lg text-gray-600 mb-4">{{ t('checkout.noAmountCharged') }}</p>
      <p v-if="released" class="text-sm text-green-700 mb-4">{{ t('checkout.reservationReleased') }}</p>
      <p v-if="error" class="text-sm text-red-600 mb-4">{{ error }}</p>
      <a
        :href="whatsappUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center px-6 py-3 mb-4 bg-green-600 text-white rounded-lg font-medium"
      >
        {{ t('payment.contactWhatsApp') }}
      </a>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <router-link :to="browsePath" class="px-6 py-3 bg-primary text-white rounded-lg font-medium">
          {{ t('watch.seeCollection') }}
        </router-link>
        <router-link to="/" class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700">
          Accueil
        </router-link>
      </div>
    </div>
  </section>
</template>
