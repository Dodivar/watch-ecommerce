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

function formatPrice(cents) {
  if (cents == null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

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
          <p><strong>Total :</strong> {{ formatPrice(detail.order.totalCents) }}</p>
          <p v-if="detail.discount?.code"><strong>Code promo :</strong> {{ detail.discount.code }}</p>
          <p v-if="detail.shipping">
            <strong>Livraison :</strong> {{ detail.shipping.methodLabel || detail.shipping.methodType }}
          </p>
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
