<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getOrderByIdForAdmin,
  updateOrderFulfillmentStatus,
  FULFILLMENT_STATUSES,
} from '@/services/admin/adminOrderService'
import AdminShell from './AdminShell.vue'

const route = useRoute()
const router = useRouter()
const orderId = computed(() => route.params.id)

const detail = ref(null)
const isLoading = ref(true)
const error = ref(null)
const success = ref(null)
const selectedFulfillment = ref('pending')

const fulfillmentLabels = {
  pending: 'En attente',
  preparing: 'En préparation',
  shipped: 'Expédiée',
  ready_for_pickup: 'Prête au retrait',
  completed: 'Terminée',
}

const discountTypeLabels = {
  percent: 'Pourcentage',
  fixed: 'Montant fixe',
  free_shipping: 'Livraison offerte',
}

function formatPrice(cents) {
  if (cents == null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

const hasDiscount = computed(
  () => !!detail.value?.discount || (detail.value?.order?.discountCents || 0) > 0,
)

const discountAmountCents = computed(
  () => detail.value?.discount?.discountCents ?? detail.value?.order?.discountCents ?? 0,
)

const shippingAddress = computed(() => detail.value?.order?.shippingAddress || null)

const recipientName = computed(() => {
  const addr = shippingAddress.value
  if (!addr) return ''
  return [addr.firstName, addr.lastName].filter(Boolean).join(' ').trim()
})

async function load() {
  try {
    isLoading.value = true
    error.value = null
    detail.value = await getOrderByIdForAdmin(orderId.value)
    if (!detail.value) {
      error.value = 'Commande introuvable'
      return
    }
    selectedFulfillment.value = detail.value.order.fulfillmentStatus
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

async function saveFulfillment() {
  try {
    error.value = null
    success.value = null
    await updateOrderFulfillmentStatus(orderId.value, selectedFulfillment.value)
    success.value = 'Statut mis à jour'
    await load()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(load)
</script>

<template>
  <AdminShell
    title="Détail commande"
    show-back-button
    back-button-text="Commandes"
    back-button-route="/admin/orders"
    content-class="max-w-4xl"
  >
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
        {{ error }}
      </div>
      <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
        {{ success }}
      </div>

      <div v-if="isLoading" class="text-center py-12">Chargement…</div>

      <template v-else-if="detail">
        <div class="bg-white rounded-lg shadow p-6 mb-6 space-y-3">
          <p><strong>ID :</strong> {{ detail.order.id }}</p>
          <p><strong>Client :</strong> {{ detail.order.customerEmail || '—' }}</p>
          <p v-if="detail.order.customerPhone"><strong>Téléphone :</strong> {{ detail.order.customerPhone }}</p>

          <div class="border-t pt-3 space-y-1 text-sm">
            <p class="flex justify-between">
              <span>Sous-total</span>
              <span>{{ formatPrice(detail.order.subtotalCents) }}</span>
            </p>
            <p class="flex justify-between">
              <span>Livraison</span>
              <span>{{ formatPrice(detail.order.shippingCents) }}</span>
            </p>
            <p v-if="hasDiscount" class="flex justify-between text-green-700">
              <span>Réduction</span>
              <span>-{{ formatPrice(discountAmountCents) }}</span>
            </p>
            <p class="flex justify-between font-semibold text-base border-t pt-2">
              <span>Total</span>
              <span>{{ formatPrice(detail.order.totalCents) }}</span>
            </p>
          </div>
        </div>

        <div v-if="detail.shipping || shippingAddress" class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Livraison</h2>
          <div class="space-y-2">
            <p v-if="detail.shipping">
              <strong>Méthode :</strong>
              {{ detail.shipping.methodLabel || detail.shipping.methodType }}
            </p>
            <div v-if="shippingAddress">
              <p class="font-medium mb-1">Adresse de livraison</p>
              <address class="not-italic text-gray-700 leading-relaxed">
                <span v-if="recipientName">{{ recipientName }}<br /></span>
                <span v-if="shippingAddress.line1">{{ shippingAddress.line1 }}<br /></span>
                <span v-if="shippingAddress.line2">{{ shippingAddress.line2 }}<br /></span>
                <span v-if="shippingAddress.postalCode || shippingAddress.city">
                  {{ [shippingAddress.postalCode, shippingAddress.city].filter(Boolean).join(' ') }}<br />
                </span>
                <span v-if="shippingAddress.country">{{ shippingAddress.country }}</span>
              </address>
            </div>
          </div>
        </div>

        <div v-if="hasDiscount" class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Réduction appliquée</h2>
          <div class="space-y-2">
            <p v-if="detail.discount?.code">
              <strong>Code promo :</strong> {{ detail.discount.code }}
            </p>
            <p v-if="detail.discount?.discountType">
              <strong>Type :</strong>
              {{ discountTypeLabels[detail.discount.discountType] || detail.discount.discountType }}
            </p>
            <p>
              <strong>Montant économisé :</strong>
              <span class="text-green-700">-{{ formatPrice(discountAmountCents) }}</span>
            </p>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Lignes</h2>
          <ul class="space-y-3">
            <li v-for="line in detail.lines" :key="line.id" class="flex justify-between border-b pb-2">
              <span>
                <RouterLink
                  v-if="line.watchId"
                  :to="`/admin/watches/${line.watchId}/edit`"
                  class="text-primary underline"
                >
                  {{ line.name }}
                </RouterLink>
                <span v-else>{{ line.name }}</span>
                × {{ line.quantity }}
              </span>
              <span>{{ formatPrice(line.unitPriceCents * line.quantity) }}</span>
            </li>
          </ul>
        </div>

        <div v-if="detail.order.status === 'paid'" class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">Suivi préparation</h2>
          <div class="flex flex-col sm:flex-row gap-3">
            <select v-model="selectedFulfillment" class="flex-1 px-4 py-2 border rounded-lg">
              <option v-for="s in FULFILLMENT_STATUSES" :key="s" :value="s">
                {{ fulfillmentLabels[s] }}
              </option>
            </select>
            <button type="button" class="px-4 py-2 bg-primary text-white rounded-lg" @click="saveFulfillment">
              Enregistrer
            </button>
          </div>
        </div>
      </template>
  </AdminShell>
</template>
