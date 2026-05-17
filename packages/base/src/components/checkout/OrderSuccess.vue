<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { verifyOrder } from '@/services/orderService.js'
import { getWatchById } from '@/services/watchService'
import { useCart } from '@/composables/useCart.js'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { getBrowsePath } from '@/site/siteFeatures.js'

const route = useRoute()
const site = getSiteConfig()
const browsePath = getBrowsePath(site.features)

const orderId = ref('')
const totalCents = ref(0)
const customerEmail = ref('')
const lines = ref([])
const watches = ref([])
const loading = ref(true)
const error = ref('')

function formatPrice(cents) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    (cents || 0) / 100,
  )
}

function clearCheckoutSession() {
  const key = `watch_checkout:${site.siteId || site.id || 'default'}`
  sessionStorage.removeItem(key)
}

onMounted(async () => {
  orderId.value = String(route.query.order || '')
  const token = String(route.query.token || '')

  if (!orderId.value || !token) {
    error.value = 'Lien de confirmation invalide'
    loading.value = false
    return
  }

  try {
    const result = await verifyOrder(orderId.value, token)
    if (!result.valid) {
      error.value = result.reason || 'Paiement non confirmé'
      return
    }
    totalCents.value = result.order?.totalCents || 0
    customerEmail.value = result.order?.customerEmail || ''
    lines.value = result.lines || []

    const { clear: clearCart } = useCart()
    clearCart()
    clearCheckoutSession()

    const loaded = []
    for (const line of lines.value) {
      try {
        const w = await getWatchById(line.watch_id, true)
        loaded.push(w)
      } catch {
        /* ignore */
      }
    }
    watches.value = loaded
  } catch (e) {
    error.value = e.message || 'Erreur de vérification'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="min-h-screen flex items-center justify-center py-12 px-4">
    <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
      <p v-if="loading" class="text-gray-600">Vérification du paiement…</p>

      <template v-else-if="error">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Confirmation indisponible</h1>
        <p class="text-gray-600 mb-6">{{ error }}</p>
        <router-link :to="browsePath" class="text-primary underline">Retour à la boutique</router-link>
      </template>

      <template v-else>
        <div class="mb-6">
          <div class="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Paiement réussi</h1>
        <p class="text-lg text-gray-600 mb-2">Merci pour votre commande.</p>
        <p v-if="customerEmail" class="text-sm text-gray-500 mb-6">
          Un email de confirmation a été envoyé à {{ customerEmail }}.
        </p>
        <p class="text-xl font-semibold text-primary mb-6">{{ formatPrice(totalCents) }}</p>

        <ul v-if="lines.length" class="text-left mb-8 space-y-2 text-sm">
          <li v-for="line in lines" :key="line.id" class="flex justify-between border-b pb-2">
            <span>{{ line.name }} × {{ line.quantity }}</span>
            <span>{{ formatPrice(line.unit_price_cents * line.quantity) }}</span>
          </li>
        </ul>

        <p class="text-gray-600 text-sm mb-8">
          Notre équipe prépare votre commande. Vous serez contacté pour la livraison ou le retrait.
        </p>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <router-link
            v-if="watches.length === 1"
            :to="`/watch/${watches[0].id}`"
            class="px-6 py-3 bg-primary text-white rounded-lg font-medium"
          >
            Voir la montre
          </router-link>
          <router-link
            :to="browsePath"
            class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium"
          >
            Continuer vos achats
          </router-link>
        </div>
      </template>
    </div>
  </section>
</template>
