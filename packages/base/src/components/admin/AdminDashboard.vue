<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAllWatchesForAdmin } from '@/services/admin/adminWatchService'
import { getOrderKpisForAdmin } from '@/services/admin/adminOrderService'
import { getUnreadLeadsCount } from '@/services/admin/adminLeadService'
import AdminShell from './AdminShell.vue'

const watches = ref([])
const orderKpis = ref({ todayCount: 0, weekRevenueCents: 0 })
const unreadLeadsCount = ref(0)

const totalWatches = computed(() => watches.value.length)

const soldWatchesCount = computed(() => {
  return watches.value.filter((watch) => watch.is_sold === true).length
})

const availableWatchesValue = computed(() => {
  return watches.value
    .filter((watch) => watch.is_available !== false)
    .reduce((sum, watch) => sum + (parseFloat(watch.price) || 0), 0)
})

const unavailableWatchesValue = computed(() => {
  return watches.value
    .filter((watch) => watch.is_available === false)
    .reduce((sum, watch) => sum + (parseFloat(watch.price) || 0), 0)
})

const soldWatchesValue = computed(() => {
  return watches.value
    .filter((watch) => watch.is_sold === true)
    .reduce((sum, watch) => sum + (parseFloat(watch.price) || 0), 0)
})

const soldWatchesValueLastMonth = computed(() => {
  const now = new Date()
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

  return watches.value
    .filter((watch) => {
      if (watch.is_sold !== true || !watch.sale_date) return false
      const saleDate = new Date(watch.sale_date)
      return saleDate >= oneMonthAgo && saleDate <= now
    })
    .reduce((sum, watch) => sum + (parseFloat(watch.price) || 0), 0)
})

const loadWatches = async () => {
  try {
    const data = await getAllWatchesForAdmin()
    watches.value = data
  } catch (err) {
    console.error('Erreur lors du chargement des montres:', err)
  }
}

const loadDashboardKpis = async () => {
  try {
    const [kpis, unread] = await Promise.all([getOrderKpisForAdmin(), getUnreadLeadsCount()])
    orderKpis.value = kpis
    unreadLeadsCount.value = unread
  } catch (err) {
    console.error('Erreur lors du chargement des KPI:', err)
  }
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

onMounted(async () => {
  await Promise.all([loadWatches(), loadDashboardKpis()])
})
</script>

<template>
  <AdminShell title="Tableau de bord">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <RouterLink to="/admin/orders" class="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
        <div class="text-sm text-gray-600 mb-1">Commandes du jour</div>
        <div class="text-3xl font-bold text-text-main">{{ orderKpis.todayCount }}</div>
        <div class="text-xs text-primary mt-2">Voir les commandes →</div>
      </RouterLink>
      <RouterLink to="/admin/orders" class="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
        <div class="text-sm text-gray-600 mb-1">CA semaine</div>
        <div class="text-3xl font-bold text-text-main">{{ formatPrice(orderKpis.weekRevenueCents / 100) }}</div>
        <div class="text-xs text-primary mt-2">Voir les commandes →</div>
      </RouterLink>
      <RouterLink to="/admin/leads" class="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
        <div class="text-sm text-gray-600 mb-1">Messages non lus</div>
        <div class="text-3xl font-bold text-text-main">{{ unreadLeadsCount }}</div>
        <div class="text-xs text-primary mt-2">Voir les messages →</div>
      </RouterLink>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-1">Valeur totale en stock</div>
        <div class="text-3xl font-bold text-text-main">{{ formatPrice(availableWatchesValue) }}</div>
        <div class="text-xs text-gray-500 mt-2">Hors stock : {{ formatPrice(unavailableWatchesValue) }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-1">Valeur totale vendues</div>
        <div class="text-3xl font-bold text-text-main">{{ formatPrice(soldWatchesValue) }}</div>
        <div class="text-xs text-gray-500 mt-2">Dernier mois : {{ formatPrice(soldWatchesValueLastMonth) }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-sm text-gray-600 mb-1">Total montres</div>
        <div class="text-3xl font-bold text-text-main">{{ totalWatches }}</div>
        <div class="text-xs text-gray-500 mt-2">Vendues : {{ soldWatchesCount }}</div>
      </div>
    </div>
  </AdminShell>
</template>
