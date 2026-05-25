<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOrdersForAdmin } from '@/services/admin/adminOrderService'
import AdminShell from './AdminShell.vue'

const router = useRouter()
const orders = ref([])
const total = ref(0)
const isLoading = ref(true)
const error = ref(null)
const statusFilter = ref('paid')
const searchQuery = ref('')

const statusLabels = {
  draft: 'Brouillon',
  pending_payment: 'Paiement en cours',
  paid: 'Payée',
}

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

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR')
}

async function loadOrders() {
  try {
    isLoading.value = true
    error.value = null
    const result = await getOrdersForAdmin({
      status: statusFilter.value || undefined,
      search: searchQuery.value,
    })
    orders.value = result.orders
    total.value = result.total
  } catch (err) {
    error.value = err.message || 'Erreur de chargement'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadOrders)
</script>

<template>
  <AdminShell title="Commandes">
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{{ error }}</div>
      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <select v-model="statusFilter" class="px-4 py-2 border border-gray-300 rounded-lg bg-white" @change="loadOrders">
          <option value="">Tous les statuts</option>
          <option value="paid">Payées</option>
          <option value="pending_payment">Paiement en cours</option>
          <option value="draft">Brouillons</option>
        </select>
        <input v-model="searchQuery" type="search" placeholder="Email ou téléphone…" class="flex-1 px-4 py-2 border rounded-lg" @keyup.enter="loadOrders" />
        <button type="button" class="px-4 py-2 bg-primary text-white rounded-lg" @click="loadOrders">Filtrer</button>
      </div>
      <div v-if="isLoading" class="text-center py-12 text-gray-500">Chargement…</div>
      <div v-else-if="orders.length === 0" class="bg-white rounded-lg shadow p-8 text-center text-gray-500">Aucune commande.</div>
      <div v-else class="bg-white rounded-lg shadow overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-cream">
            <tr>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Date</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Client</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Total</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Statut</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Préparation</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="order in orders" :key="order.id" class="hover:bg-cream/50 cursor-pointer" @click="router.push(`/admin/orders/${order.id}`)">
              <td class="px-4 py-3 text-sm">{{ formatDate(order.paidAt || order.createdAt) }}</td>
              <td class="px-4 py-3 text-sm">{{ order.customerEmail || '—' }}</td>
              <td class="px-4 py-3 text-sm font-medium">{{ formatPrice(order.totalCents) }}</td>
              <td class="px-4 py-3 text-sm">{{ statusLabels[order.status] || order.status }}</td>
              <td class="px-4 py-3 text-sm">{{ fulfillmentLabels[order.fulfillmentStatus] || order.fulfillmentStatus }}</td>
            </tr>
          </tbody>
        </table>
        <div class="px-4 py-3 text-sm text-gray-500 border-t">{{ total }} commande(s)</div>
      </div>
  </AdminShell>
</template>
