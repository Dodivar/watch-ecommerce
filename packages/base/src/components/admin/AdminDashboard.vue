<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Filler,
  Tooltip,
} from 'chart.js'
import {
  ShoppingBag,
  Euro,
  MessageSquare,
  Package,
  Watch,
  Plus,
  ChartColumn,
  Globe,
  CalendarDays,
  CreditCard,
  RotateCcw,
  ArrowRight,
} from '@lucide/vue'
import { getWatchInventoryStats } from '@/services/admin/adminWatchService'
import {
  getOrderKpisForAdmin,
  getOrderActionCountsForAdmin,
  getOrdersForAdmin,
  getSalesStatsByDay,
} from '@/services/admin/adminOrderService'
import {
  getUnreadLeadsCount,
  getLeadsForAdmin,
  getAppointmentsByDate,
} from '@/services/admin/adminLeadService'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import {
  LEAD_TYPE_LABELS,
  getLeadSummary,
  formatLeadDateTime,
} from '@/utils/leadDisplay'
import AdminShell from './AdminShell.vue'
import AdminKpiCard from './AdminKpiCard.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, LineController, Filler, Tooltip)

const router = useRouter()
const site = getSiteConfig()

const inventoryStats = ref(null)
const orderKpis = ref({
  todayCount: 0,
  todayRevenueCents: 0,
  weekRevenueCents: 0,
  previousWeekRevenueCents: 0,
})
const orderActions = ref({ pendingFulfillmentCount: 0, pendingPaymentCount: 0, openReturnCount: 0 })
const unreadLeadsCount = ref(0)
const recentOrders = ref([])
const recentLeads = ref([])
const salesStats = ref({ daily: [] })
const todayAppointmentsCount = ref(0)

const loadingKpis = ref(true)
const loadingInventory = ref(true)
const loadingSales = ref(true)
const loadingOrders = ref(true)
const loadingLeads = ref(true)
const kpisError = ref(null)
const inventoryError = ref(null)
const salesError = ref(null)
const ordersError = ref(null)
const leadsError = ref(null)

const showAppointments = computed(() => {
  const { features } = site
  const isRetail = site.watchCatalog?.isRetail ?? site.watchCatalog?.mode !== 'resale'
  return (site.watchCatalog?.appointmentEnabled ?? isRetail) && features.collection
})

const dashboardSubtitle = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const weekRevenueTrend = computed(() => {
  const current = orderKpis.value.weekRevenueCents
  const previous = orderKpis.value.previousWeekRevenueCents
  if (previous === 0) {
    return current > 0 ? '+100 % vs sem. précédente' : 'Stable vs sem. précédente'
  }
  const delta = ((current - previous) / previous) * 100
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${Math.round(delta)} % vs sem. précédente`
})

const alerts = computed(() => {
  const items = []
  if (unreadLeadsCount.value > 0) {
    items.push({
      key: 'leads',
      message: `${unreadLeadsCount.value} message${unreadLeadsCount.value > 1 ? 's' : ''} non lu${unreadLeadsCount.value > 1 ? 's' : ''}`,
      to: '/admin/leads',
      icon: MessageSquare,
    })
  }
  if (orderActions.value.pendingFulfillmentCount > 0) {
    const n = orderActions.value.pendingFulfillmentCount
    items.push({
      key: 'fulfillment',
      message: `${n} commande${n > 1 ? 's' : ''} à préparer`,
      to: '/admin/orders',
      icon: Package,
    })
  }
  if (orderActions.value.pendingPaymentCount > 0) {
    const n = orderActions.value.pendingPaymentCount
    items.push({
      key: 'payment',
      message: `${n} paiement${n > 1 ? 's' : ''} en cours`,
      to: '/admin/orders',
      icon: CreditCard,
    })
  }
  if (orderActions.value.openReturnCount > 0) {
    const n = orderActions.value.openReturnCount
    items.push({
      key: 'returns',
      message: `${n} retour${n > 1 ? 's' : ''} à rembourser`,
      to: '/admin/orders?retours=open',
      icon: RotateCcw,
    })
  }
  if (showAppointments.value && todayAppointmentsCount.value > 0) {
    const n = todayAppointmentsCount.value
    items.push({
      key: 'appointments',
      message: `${n} RDV aujourd'hui`,
      to: '/admin/leads',
      icon: CalendarDays,
    })
  }
  return items
})

const sparklineData = computed(() => {
  const dailyMap = new Map((salesStats.value.daily || []).map((d) => [d.date, d.revenueCents / 100]))
  const labels = []
  const data = []
  const now = new Date()

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const key = date.toISOString().split('T')[0]
    labels.push(
      date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
    )
    data.push(dailyMap.get(key) ?? 0)
  }

  return {
    labels,
    datasets: [
      {
        label: 'CA (€)',
        data,
        borderColor: 'rgb(15, 42, 29)',
        backgroundColor: 'rgba(15, 42, 29, 0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: 'rgb(15, 42, 29)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  }
})

const sparklineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) =>
          ` ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(ctx.parsed.y)}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, color: '#6b7280' },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: {
        font: { size: 11 },
        color: '#6b7280',
        callback: (v) =>
          new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(v),
      },
    },
  },
}

const inventorySummary = computed(() => {
  const s = inventoryStats.value
  if (!s) return null
  const sellThrough = Math.round(s.sellThroughRate || 0)
  return {
    stockValue: s.stockValue,
    stockCount: s.stockCount,
    soldCount: s.soldCount,
    totalCount: s.totalCount,
    sellThrough,
  }
})

function formatPrice(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0)
}

function formatPriceFromCents(cents) {
  return formatPrice((cents || 0) / 100)
}

function formatOrderDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function countTodayAppointments(byDate) {
  const todayKey = new Date().toISOString().split('T')[0]
  return (byDate[todayKey] || []).length
}

async function loadKpis() {
  loadingKpis.value = true
  kpisError.value = null
  try {
    const [kpis, actions, unread] = await Promise.all([
      getOrderKpisForAdmin(),
      getOrderActionCountsForAdmin(),
      getUnreadLeadsCount(),
    ])
    orderKpis.value = kpis
    orderActions.value = actions
    unreadLeadsCount.value = unread
  } catch (err) {
    kpisError.value = err.message || 'Impossible de charger les indicateurs'
  } finally {
    loadingKpis.value = false
  }
}

async function loadInventory() {
  loadingInventory.value = true
  inventoryError.value = null
  try {
    inventoryStats.value = await getWatchInventoryStats()
  } catch (err) {
    inventoryError.value = err.message || 'Impossible de charger l\'inventaire'
  } finally {
    loadingInventory.value = false
  }
}

async function loadSales() {
  loadingSales.value = true
  salesError.value = null
  try {
    salesStats.value = await getSalesStatsByDay({ days: 7 })
  } catch (err) {
    salesError.value = err.message || 'Impossible de charger le CA'
  } finally {
    loadingSales.value = false
  }
}

async function loadRecentOrders() {
  loadingOrders.value = true
  ordersError.value = null
  try {
    const { orders } = await getOrdersForAdmin({ status: 'paid', limit: 5 })
    recentOrders.value = orders
  } catch (err) {
    ordersError.value = err.message || 'Impossible de charger les commandes'
  } finally {
    loadingOrders.value = false
  }
}

async function loadRecentLeads() {
  loadingLeads.value = true
  leadsError.value = null
  try {
    const requests = [getLeadsForAdmin({ status: 'new', limit: 5 })]
    if (showAppointments.value) {
      requests.push(getAppointmentsByDate())
    }
    const results = await Promise.all(requests)
    recentLeads.value = results[0].leads
    if (showAppointments.value && results[1]) {
      todayAppointmentsCount.value = countTodayAppointments(results[1])
    }
  } catch (err) {
    leadsError.value = err.message || 'Impossible de charger les messages'
  } finally {
    loadingLeads.value = false
  }
}

onMounted(() => {
  loadKpis()
  loadInventory()
  loadSales()
  loadRecentOrders()
  loadRecentLeads()
})
</script>

<template>
  <AdminShell title="Tableau de bord" :subtitle="dashboardSubtitle">
    <template #actions>
      <RouterLink
        to="/admin/watches/new"
        class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
      >
        <Plus class="h-4 w-4" :stroke-width="2" />
        <span class="hidden sm:inline">Ajouter une montre</span>
        <span class="sm:hidden">Ajouter</span>
      </RouterLink>
      <RouterLink
        to="/admin/stats"
        class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-cream transition-colors"
      >
        <ChartColumn class="h-4 w-4" :stroke-width="1.75" />
        <span class="hidden sm:inline">Statistiques</span>
      </RouterLink>
      <RouterLink
        to="/"
        class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-cream transition-colors"
      >
        <Globe class="h-4 w-4" :stroke-width="1.75" />
        <span class="hidden sm:inline">Site public</span>
      </RouterLink>
    </template>

    <template #below-header>
      <div
        v-if="alerts.length > 0"
        class="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
        role="status"
        aria-live="polite"
      >
        <RouterLink
          v-for="alert in alerts"
          :key="alert.key"
          :to="alert.to"
          class="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900 hover:bg-amber-100 transition-colors"
        >
          <component :is="alert.icon" class="h-4 w-4 shrink-0" :stroke-width="1.75" />
          {{ alert.message }}
          <ArrowRight class="h-3.5 w-3.5 opacity-60" :stroke-width="2" />
        </RouterLink>
      </div>
    </template>

    <p v-if="kpisError" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ kpisError }}
    </p>

    <!-- KPI row -->
    <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AdminKpiCard
        variant="ops"
        label="Commandes du jour"
        :value="orderKpis.todayCount"
        :subtext="`${formatPriceFromCents(orderKpis.todayRevenueCents)} aujourd'hui`"
        to="/admin/orders"
        link-text="Voir les commandes →"
        :icon="ShoppingBag"
        :loading="loadingKpis"
      />
      <AdminKpiCard
        variant="ops"
        label="CA semaine"
        :value="formatPriceFromCents(orderKpis.weekRevenueCents)"
        :subtext="weekRevenueTrend"
        to="/admin/orders"
        link-text="Voir les commandes →"
        :icon="Euro"
        :loading="loadingKpis"
      />
      <AdminKpiCard
        variant="ops"
        label="Messages non lus"
        :value="unreadLeadsCount"
        subtext="Demandes contact, RDV, estimation…"
        to="/admin/leads"
        link-text="Voir les messages →"
        :icon="MessageSquare"
        :alert="unreadLeadsCount > 0"
        :loading="loadingKpis"
      />
      <AdminKpiCard
        variant="ops"
        label="À préparer"
        :value="orderActions.pendingFulfillmentCount"
        :subtext="
          orderActions.pendingPaymentCount > 0
            ? `${orderActions.pendingPaymentCount} paiement(s) en cours`
            : 'Commandes payées en attente'
        "
        to="/admin/orders"
        link-text="Gérer les commandes →"
        :icon="Package"
        :alert="orderActions.pendingFulfillmentCount > 0"
        :loading="loadingKpis"
      />
    </div>

    <!-- Chart + inventory -->
    <div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-text-main">CA des 7 derniers jours</h2>
            <p class="text-xs text-gray-500">Commandes payées</p>
          </div>
          <RouterLink to="/admin/stats" class="text-xs font-medium text-primary hover:underline">
            Détail →
          </RouterLink>
        </div>
        <div v-if="loadingSales" class="h-48 animate-pulse rounded-lg bg-gray-100" />
        <p v-else-if="salesError" class="text-sm text-red-600">{{ salesError }}</p>
        <div v-else class="h-48">
          <Line :data="sparklineData" :options="sparklineOptions" />
        </div>
      </div>

      <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-text-main">Inventaire</h2>
            <p class="text-xs text-gray-500">Catalogue actuel</p>
          </div>
          <RouterLink to="/admin/stats" class="text-xs font-medium text-primary hover:underline">
            Détail →
          </RouterLink>
        </div>
        <div v-if="loadingInventory" class="space-y-3 animate-pulse">
          <div class="h-8 rounded bg-gray-100" />
          <div class="h-4 rounded bg-gray-100" />
          <div class="h-4 rounded bg-gray-100" />
        </div>
        <p v-else-if="inventoryError" class="text-sm text-red-600">{{ inventoryError }}</p>
        <div v-else-if="inventorySummary" class="space-y-4">
          <div>
            <p class="text-2xl font-bold text-text-main">{{ formatPrice(inventorySummary.stockValue) }}</p>
            <p class="text-sm text-gray-500">Valeur en stock · {{ inventorySummary.stockCount }} montre(s)</p>
          </div>
          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-lg bg-cream/60 px-3 py-2">
              <dt class="text-gray-500">Total catalogue</dt>
              <dd class="font-semibold text-text-main">{{ inventorySummary.totalCount }}</dd>
            </div>
            <div class="rounded-lg bg-cream/60 px-3 py-2">
              <dt class="text-gray-500">Vendues</dt>
              <dd class="font-semibold text-text-main">{{ inventorySummary.soldCount }}</dd>
            </div>
          </dl>
          <div>
            <div class="mb-1 flex justify-between text-xs text-gray-500">
              <span>Taux d'écoulement</span>
              <span>{{ inventorySummary.sellThrough }} %</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                class="h-full rounded-full bg-primary transition-all"
                :style="{ width: `${Math.min(inventorySummary.sellThrough, 100)}%` }"
              />
            </div>
          </div>
          <RouterLink
            to="/admin/watches"
            class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Watch class="h-3.5 w-3.5" :stroke-width="1.75" />
            Gérer le catalogue →
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Activity feeds -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Recent orders -->
      <section class="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 class="text-base font-semibold text-text-main">Dernières commandes</h2>
          <RouterLink to="/admin/orders" class="text-xs font-medium text-primary hover:underline">
            Tout voir →
          </RouterLink>
        </div>
        <div v-if="loadingOrders" class="divide-y divide-gray-100">
          <div v-for="i in 3" :key="i" class="animate-pulse px-5 py-4 space-y-2">
            <div class="h-4 w-3/4 rounded bg-gray-100" />
            <div class="h-3 w-1/2 rounded bg-gray-100" />
          </div>
        </div>
        <p v-else-if="ordersError" class="px-5 py-6 text-sm text-red-600">{{ ordersError }}</p>
        <p v-else-if="recentOrders.length === 0" class="px-5 py-8 text-center text-sm text-gray-500">
          Aucune commande payée pour le moment.
        </p>
        <ul v-else class="divide-y divide-gray-100">
          <li
            v-for="order in recentOrders"
            :key="order.id"
            class="cursor-pointer px-5 py-3.5 hover:bg-cream/50 transition-colors"
            @click="router.push(`/admin/orders/${order.id}`)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-text-main">
                  {{ order.customerEmail || 'Client sans email' }}
                </p>
                <p class="text-xs text-gray-500">{{ formatOrderDate(order.paidAt || order.createdAt) }}</p>
              </div>
              <p class="shrink-0 text-sm font-semibold text-text-main">
                {{ formatPriceFromCents(order.totalCents) }}
              </p>
            </div>
          </li>
        </ul>
      </section>

      <!-- Recent messages -->
      <section class="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 class="text-base font-semibold text-text-main">Messages récents</h2>
          <RouterLink to="/admin/leads" class="text-xs font-medium text-primary hover:underline">
            Tout voir →
          </RouterLink>
        </div>
        <div v-if="loadingLeads" class="divide-y divide-gray-100">
          <div v-for="i in 3" :key="i" class="animate-pulse px-5 py-4 space-y-2">
            <div class="h-4 w-3/4 rounded bg-gray-100" />
            <div class="h-3 w-1/2 rounded bg-gray-100" />
          </div>
        </div>
        <p v-else-if="leadsError" class="px-5 py-6 text-sm text-red-600">{{ leadsError }}</p>
        <p v-else-if="recentLeads.length === 0" class="px-5 py-8 text-center text-sm text-gray-500">
          Aucun message non lu.
        </p>
        <ul v-else class="divide-y divide-gray-100">
          <li
            v-for="lead in recentLeads"
            :key="lead.id"
            class="cursor-pointer px-5 py-3.5 hover:bg-cream/50 transition-colors"
            @click="router.push(`/admin/leads/${lead.id}`)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-text-main">
                  {{ lead.customerName || lead.customerEmail || 'Sans nom' }}
                </p>
                <p class="truncate text-xs text-gray-500">{{ getLeadSummary(lead) }}</p>
              </div>
              <div class="shrink-0 text-right">
                <span
                  class="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
                >
                  {{ LEAD_TYPE_LABELS[lead.type] || lead.type }}
                </span>
                <p class="mt-1 text-[11px] text-gray-400">{{ formatLeadDateTime(lead.createdAt) }}</p>
              </div>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </AdminShell>
</template>
