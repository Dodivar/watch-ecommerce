<script setup>
import { ref, computed, onMounted, onUnmounted, watch as vueWatch } from 'vue'
import { Chart, Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  LineController,
  BarController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import {
  getWatchStatsByDay,
  getWatchInventoryStats,
  getStorageStats,
  getTableSizes,
} from '@/services/admin/adminWatchService'
import { getSalesStatsByDay } from '@/services/admin/adminOrderService'
import { getArticleStatsByDay } from '@/services/admin/adminArticleService'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import AdminShell from './AdminShell.vue'

const isBlogEnabled = computed(() => !!getSiteConfig().features?.blog)

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  LineController,
  BarController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Formatage monétaire (euros, sans décimales)
const formatEuro = (value) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0)

// Sélecteur de période (filtre les séries temporelles + le CA des commandes)
const PERIOD_OPTIONS = [
  { value: 7, label: '7 jours' },
  { value: 30, label: '30 jours' },
  { value: 90, label: '90 jours' },
  { value: 365, label: '12 mois' },
  { value: null, label: 'Tout' },
]
const selectedPeriod = ref(null)

const periodCutoff = computed(() => {
  if (!selectedPeriod.value) return null
  return new Date(Date.now() - selectedPeriod.value * 24 * 60 * 60 * 1000)
})

const filterByPeriod = (items) => {
  const cutoff = periodCutoff.value
  if (!cutoff) return items
  return items.filter((item) => new Date(item.date) >= cutoff)
}

// State
const stats = ref([])
const articleStats = ref([])
const isLoading = ref(true)
const error = ref(null)
const isMobile = ref(false)

// Inventaire & répartitions (snapshot courant + distributions toutes périodes)
const inventoryStats = ref(null)
const isLoadingInventory = ref(false)

// Ventes réelles (commandes payées) sur la période sélectionnée
const salesStats = ref({ daily: [], totalRevenueCents: 0, orderCount: 0, avgOrderValueCents: 0 })
const isLoadingSales = ref(false)

// Séries temporelles filtrées par période
const filteredStats = computed(() => filterByPeriod(stats.value))
const filteredArticleStats = computed(() => filterByPeriod(articleStats.value))

// Storage stats
const storageStats = ref(null)
const isLoadingStorage = ref(false)

// Table sizes stats
const tableSizes = ref([])
const isLoadingTableSizes = ref(false)
const totalTableSizeMB = computed(() => {
  return tableSizes.value.reduce((sum, table) => sum + (table.size_mb || 0), 0)
})

const tableSizeLimitMB = 500 // Limite de 500 Mo pour les tables
const tableSizeUsagePercent = computed(() => {
  if (tableSizeLimitMB === 0) return 0
  return (totalTableSizeMB.value / tableSizeLimitMB) * 100
})

// Détection de la taille d'écran
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// Computed
const chartData = computed(() => {
  const series = filteredStats.value
  if (!series || series.length === 0) {
    return {
      labels: [],
      datasets: [], 
    }
  }

  return {
    labels: series.map((item) => {
      // Formater la date pour l'affichage (format plus court sur mobile)
      const date = new Date(item.date)
      if (isMobile.value) {
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
        })
      }
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }),
    datasets: [
      {
        type: 'line',
        label: 'Montres vendues',
        data: series.map((item) => item.sold),
        borderColor: 'rgb(239, 68, 68)', // red-500
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'y',
      },
      {
        type: 'bar',
        label: 'Valeur totale vendue (€)',
        data: series.map((item) => item.totalValue || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500 with higher opacity
        borderColor: 'rgb(59, 130, 246)', // blue-500
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  }
})

const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: isMobile.value ? 10 : 20,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: isMobile.value ? 10 : 12,
          padding: isMobile.value ? 8 : 15,
          font: {
            size: isMobile.value ? 10 : 12,
          },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        padding: isMobile.value ? 8 : 12,
        titleFont: {
          size: isMobile.value ? 11 : 13,
        },
        bodyFont: {
          size: isMobile.value ? 10 : 12,
        },
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.dataset.type === 'bar') {
              // Formater la valeur en euros pour les barres
              label += new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(context.parsed.y)
            } else {
              label += context.parsed.y
            }
            return label
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: isMobile.value ? 45 : 0,
          minRotation: isMobile.value ? 45 : 0,
          font: {
            size: isMobile.value ? 9 : 11,
          },
          padding: isMobile.value ? 5 : 10,
        },
        grid: {
          display: !isMobile.value,
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0,
          font: {
            size: isMobile.value ? 9 : 11,
          },
          padding: isMobile.value ? 5 : 10,
        },
        title: {
          display: !isMobile.value,
          text: 'Nombre de montres',
          font: {
            size: isMobile.value ? 10 : 12,
          },
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: isMobile.value ? 9 : 11,
          },
          padding: isMobile.value ? 5 : 10,
          callback: function (value) {
            if (isMobile.value && value >= 1000) {
              return (value / 1000).toFixed(1) + 'k€'
            }
            return new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value)
          },
        },
        title: {
          display: !isMobile.value,
          text: 'Valeur (€)',
          font: {
            size: isMobile.value ? 10 : 12,
          },
        },
      },
    },
  }
})

const totalSold = computed(() => {
  return stats.value.reduce((sum, item) => sum + item.sold, 0)
})

const totalValueSold = computed(() => {
  return stats.value.reduce((sum, item) => sum + (item.totalValue || 0), 0)
})

const averageSoldPerDay = computed(() => {
  if (stats.value.length === 0) return 0
  return (totalSold.value / stats.value.length).toFixed(2)
})

const maxSoldDay = computed(() => {
  if (stats.value.length === 0) return null
  const maxItem = stats.value.reduce((max, item) => (item.sold > max.sold ? item : max), stats.value[0])
  if (maxItem.sold === 0) return null
  return {
    date: new Date(maxItem.date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    count: maxItem.sold,
  }
})

const dateRange = computed(() => {
  if (stats.value.length === 0) return null
  const firstDate = new Date(stats.value[0].date)
  const lastDate = new Date(stats.value[stats.value.length - 1].date)
  return {
    start: firstDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    end: lastDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
  }
})

// Computed pour le graphique des articles
const articleChartData = computed(() => {
  const series = filteredArticleStats.value
  if (!series || series.length === 0) {
    return {
      labels: [],
      datasets: [],
    }
  }

  return {
    labels: series.map((item) => {
      // Formater la date pour l'affichage (format plus court sur mobile)
      const date = new Date(item.date)
      if (isMobile.value) {
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
        })
      }
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }),
    datasets: [
      {
        type: 'bar',
        label: 'Articles créés',
        data: series.map((item) => item.created),
        backgroundColor: 'rgba(168, 85, 247, 0.6)', // purple-500
        borderColor: 'rgb(168, 85, 247)', // purple-500
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Articles vus',
        data: series.map((item) => item.views || 0),
        borderColor: 'rgb(251, 146, 60)', // orange-500
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(251, 146, 60)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'y',
      },
    ],
  }
})

const articleChartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: isMobile.value ? 10 : 20,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: isMobile.value ? 10 : 12,
          padding: isMobile.value ? 8 : 15,
          font: {
            size: isMobile.value ? 10 : 12,
          },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        padding: isMobile.value ? 8 : 12,
        titleFont: {
          size: isMobile.value ? 11 : 13,
        },
        bodyFont: {
          size: isMobile.value ? 10 : 12,
        },
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            label += context.parsed.y
            return label
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: isMobile.value ? 45 : 0,
          minRotation: isMobile.value ? 45 : 0,
          font: {
            size: isMobile.value ? 9 : 11,
          },
          padding: isMobile.value ? 5 : 10,
        },
        grid: {
          display: !isMobile.value,
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0,
          font: {
            size: isMobile.value ? 9 : 11,
          },
          padding: isMobile.value ? 5 : 10,
        },
        title: {
          display: !isMobile.value,
          text: 'Nombre',
          font: {
            size: isMobile.value ? 10 : 12,
          },
        },
      },
    },
  }
})


// Palette commune pour les graphiques de répartition
const DISTRIBUTION_COLORS = [
  'rgb(59, 130, 246)', // blue-500
  'rgb(34, 197, 94)', // green-500
  'rgb(168, 85, 247)', // purple-500
  'rgb(251, 146, 60)', // orange-500
  'rgb(239, 68, 68)', // red-500
  'rgb(14, 165, 233)', // sky-500
  'rgb(234, 179, 8)', // yellow-500
  'rgb(99, 102, 241)', // indigo-500
]

// Options communes des graphiques en anneau (doughnut)
const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: isMobile.value ? 'bottom' : 'right',
      labels: {
        boxWidth: isMobile.value ? 10 : 12,
        padding: isMobile.value ? 8 : 12,
        font: { size: isMobile.value ? 10 : 12 },
      },
    },
  },
}))

// Options communes des graphiques en barres horizontales
const horizontalBarOptions = computed(() => ({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: { precision: 0, font: { size: isMobile.value ? 9 : 11 } },
    },
    y: {
      ticks: { font: { size: isMobile.value ? 9 : 11 } },
    },
  },
}))

// Répartition par statut de stock (anneau)
const statusChartData = computed(() => {
  const items = inventoryStats.value?.byStatus || []
  return {
    labels: items.map((i) => i.label),
    datasets: [
      {
        data: items.map((i) => i.count),
        backgroundColor: DISTRIBUTION_COLORS,
        borderWidth: 0,
      },
    ],
  }
})

// Répartition par audience (anneau)
const audienceChartData = computed(() => {
  const items = inventoryStats.value?.byAudience || []
  return {
    labels: items.map((i) => i.label),
    datasets: [
      {
        data: items.map((i) => i.count),
        backgroundColor: DISTRIBUTION_COLORS,
        borderWidth: 0,
      },
    ],
  }
})

// Top marques (barres horizontales)
const brandChartData = computed(() => {
  const items = inventoryStats.value?.byBrand || []
  return {
    labels: items.map((i) => i.label),
    datasets: [
      {
        label: 'Montres',
        data: items.map((i) => i.count),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  }
})

// Répartition par tranche de prix (barres horizontales)
const priceRangeChartData = computed(() => {
  const items = inventoryStats.value?.byPriceRange || []
  return {
    labels: items.map((i) => i.label),
    datasets: [
      {
        label: 'Montres',
        data: items.map((i) => i.count),
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 1,
      },
    ],
  }
})

const hasInventoryData = computed(() => (inventoryStats.value?.totalCount || 0) > 0)

// Chiffre d'affaires réel (commandes payées) sur la période
const revenueChartData = computed(() => {
  const daily = salesStats.value?.daily || []
  return {
    labels: daily.map((item) => {
      const date = new Date(item.date)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: isMobile.value ? undefined : 'numeric',
      })
    }),
    datasets: [
      {
        type: 'bar',
        label: 'Chiffre d\'affaires (€)',
        data: daily.map((item) => (item.revenueCents || 0) / 100),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Commandes',
        data: daily.map((item) => item.orderCount || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3,
        yAxisID: 'y1',
      },
    ],
  }
})

const revenueChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { font: { size: isMobile.value ? 10 : 12 } },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || ''
          if (label) label += ': '
          if (context.dataset.type === 'bar') {
            label += formatEuro(context.parsed.y)
          } else {
            label += context.parsed.y
          }
          return label
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        maxRotation: isMobile.value ? 45 : 0,
        minRotation: isMobile.value ? 45 : 0,
        font: { size: isMobile.value ? 9 : 11 },
      },
    },
    y: {
      type: 'linear',
      position: 'left',
      beginAtZero: true,
      title: { display: !isMobile.value, text: 'CA (€)' },
      ticks: {
        font: { size: isMobile.value ? 9 : 11 },
        callback: function (value) {
          if (isMobile.value && value >= 1000) return (value / 1000).toFixed(1) + 'k€'
          return formatEuro(value)
        },
      },
    },
    y1: {
      type: 'linear',
      position: 'right',
      beginAtZero: true,
      grid: { drawOnChartArea: false },
      ticks: { stepSize: 1, precision: 0, font: { size: isMobile.value ? 9 : 11 } },
      title: { display: !isMobile.value, text: 'Commandes' },
    },
  },
}))

const totalRevenue = computed(() => (salesStats.value?.totalRevenueCents || 0) / 100)
const avgOrderValue = computed(() => (salesStats.value?.avgOrderValueCents || 0) / 100)

const periodLabel = computed(() => {
  const opt = PERIOD_OPTIONS.find((o) => o.value === selectedPeriod.value)
  return opt ? opt.label : 'Tout'
})

// Methods
const loadStats = async () => {
  try {
    isLoading.value = true
    error.value = null
    const [watchData, articleData] = await Promise.all([
      getWatchStatsByDay(),
      isBlogEnabled.value ? getArticleStatsByDay() : Promise.resolve([]),
    ])
    stats.value = watchData
    articleStats.value = articleData
  } catch (err) {
    console.error('Erreur lors du chargement des statistiques:', err)
    error.value = err.message || 'Une erreur est survenue lors du chargement des statistiques'
  } finally {
    isLoading.value = false
  }
}

// Charger les statistiques d'inventaire et de répartition
const loadInventoryStats = async () => {
  try {
    isLoadingInventory.value = true
    inventoryStats.value = await getWatchInventoryStats()
  } catch (err) {
    console.error('Erreur lors du chargement des statistiques d\'inventaire:', err)
    // Ne pas bloquer l'affichage si l'inventaire échoue
  } finally {
    isLoadingInventory.value = false
  }
}

// Charger le chiffre d'affaires réel (commandes payées) sur la période sélectionnée
const loadSalesStats = async () => {
  try {
    isLoadingSales.value = true
    salesStats.value = await getSalesStatsByDay(
      selectedPeriod.value ? { days: selectedPeriod.value } : {},
    )
  } catch (err) {
    console.error('Erreur lors du chargement des statistiques de ventes:', err)
    // Ne pas bloquer l'affichage si les ventes échouent
  } finally {
    isLoadingSales.value = false
  }
}

// Méthode pour charger les stats de stockage
const loadStorageStats = async () => {
  try {
    isLoadingStorage.value = true
    const currentStats = await getStorageStats()
    storageStats.value = currentStats
  } catch (err) {
    console.error('Erreur lors du chargement des statistiques de stockage:', err)
    // Ne pas bloquer l'affichage si les stats de stockage échouent
  } finally {
    isLoadingStorage.value = false
  }
}

// Méthode pour charger les tailles des tables
const loadTableSizes = async () => {
  try {
    isLoadingTableSizes.value = true
    const sizes = await getTableSizes()
    tableSizes.value = sizes
  } catch (err) {
    console.error('Erreur lors du chargement des tailles des tables:', err)
    // Ne pas bloquer l'affichage si les stats des tables échouent
  } finally {
    isLoadingTableSizes.value = false
  }
}

// Recharger le CA réel quand la période change (filtré côté serveur)
vueWatch(selectedPeriod, () => {
  loadSalesStats()
})

onMounted(async () => {
  await Promise.all([
    loadStats(),
    loadInventoryStats(),
    loadSalesStats(),
    loadStorageStats(),
    loadTableSizes(),
  ])
})
</script>

<template>
  <AdminShell title="Statistiques">
      <!-- Period Selector -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p class="text-sm text-gray-600">
          Période des séries temporelles et du chiffre d'affaires : <span class="font-semibold text-text-main">{{ periodLabel }}</span>
        </p>
        <div class="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <button
            v-for="option in PERIOD_OPTIONS"
            :key="option.label"
            type="button"
            @click="selectedPeriod = option.value"
            :class="[
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              selectedPeriod === option.value
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-cream-100',
            ]"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
        {{ error }}
        <button @click="error = null" class="ml-4 text-red-500 hover:text-red-700">×</button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-16">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p class="text-gray-600">Chargement des statistiques...</p>
      </div>

      <!-- Stats Content -->
      <div v-else>
        <!-- Summary Stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="text-sm text-gray-600 mb-1">Total montres vendues</div>
            <div class="text-3xl font-bold text-red-600">{{ totalSold }}</div>
            <div class="text-xs text-gray-500 mt-2">Toutes périodes confondues</div>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <div class="text-sm text-gray-600 mb-1">Moyenne vendues/jour</div>
            <div class="text-3xl font-bold text-red-600">{{ averageSoldPerDay }}</div>
            <div class="text-xs text-gray-500 mt-2">Sur {{ stats.length }} jour{{ stats.length > 1 ? 's' : '' }}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <div class="text-sm text-gray-600 mb-1">Meilleur jour (ventes)</div>
            <div class="text-3xl font-bold text-red-600" v-if="maxSoldDay">{{ maxSoldDay.count }}</div>
            <div class="text-xs text-gray-500 mt-2" v-if="maxSoldDay">Le {{ maxSoldDay.date }}</div>
            <div v-else class="text-gray-400">Aucune vente</div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="text-sm text-gray-600 mb-1">Valeur totale vendue</div>
            <div class="text-3xl font-bold text-blue-600">
              {{ new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalValueSold) }}
            </div>
            <div class="text-xs text-gray-500 mt-2">Toutes périodes confondues</div>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <div class="text-sm text-gray-600 mb-1">Période</div>
            <div class="text-lg font-semibold text-text-main" v-if="dateRange">
              {{ dateRange.start }}
            </div>
            <div class="text-xs text-gray-500 mt-1" v-if="dateRange">au {{ dateRange.end }}</div>
            <div v-else class="text-gray-400">Aucune donnée</div>
          </div>
        </div>

        <!-- Business KPIs (inventaire + ventes réelles) -->
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Indicateurs clés</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="text-sm text-gray-600 mb-1">Valeur du stock actuel</div>
            <div class="text-3xl font-bold text-text-main">{{ formatEuro(inventoryStats?.stockValue || 0) }}</div>
            <div class="text-xs text-gray-500 mt-2">{{ inventoryStats?.stockCount || 0 }} montre{{ (inventoryStats?.stockCount || 0) > 1 ? 's' : '' }} en stock</div>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <div class="text-sm text-gray-600 mb-1">Taux d'écoulement</div>
            <div class="text-3xl font-bold text-green-600">{{ (inventoryStats?.sellThroughRate || 0).toFixed(1) }}%</div>
            <div class="text-xs text-gray-500 mt-2">Vendues vs total proposé</div>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <div class="text-sm text-gray-600 mb-1">Prix de vente moyen</div>
            <div class="text-3xl font-bold text-blue-600">{{ formatEuro(inventoryStats?.avgSellingPrice || 0) }}</div>
            <div class="text-xs text-gray-500 mt-2">Sur {{ inventoryStats?.soldCount || 0 }} vente{{ (inventoryStats?.soldCount || 0) > 1 ? 's' : '' }}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <div class="text-sm text-gray-600 mb-1">Délai moyen de vente</div>
            <div class="text-3xl font-bold text-text-main" v-if="inventoryStats?.avgTimeToSellDays != null">
              {{ Math.round(inventoryStats.avgTimeToSellDays) }} j
            </div>
            <div v-else class="text-gray-400 text-2xl">N/A</div>
            <div class="text-xs text-gray-500 mt-2">De la création à la vente</div>
          </div>
        </div>

        <!-- Revenue from real orders -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Chiffre d'affaires réel (commandes payées)</h2>
            <div class="flex gap-6">
              <div class="text-right">
                <div class="text-xs text-gray-500">CA ({{ periodLabel }})</div>
                <div class="text-xl font-bold text-green-600">{{ formatEuro(totalRevenue) }}</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-gray-500">Commandes</div>
                <div class="text-xl font-bold text-text-main">{{ salesStats.orderCount }}</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-gray-500">Panier moyen</div>
                <div class="text-xl font-bold text-blue-600">{{ formatEuro(avgOrderValue) }}</div>
              </div>
            </div>
          </div>
          <div v-if="isLoadingSales" class="text-center py-16">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <p class="text-gray-600 text-sm">Chargement du chiffre d'affaires...</p>
          </div>
          <div v-else-if="salesStats.daily.length === 0" class="text-center py-16">
            <h3 class="text-lg text-gray-600 mb-2">Aucune commande payée sur cette période</h3>
            <p class="text-gray-500 text-sm">Les commandes réglées apparaîtront ici.</p>
          </div>
          <div v-else class="h-64 sm:h-80 md:h-96">
            <Chart :data="revenueChartData" :options="revenueChartOptions" />
          </div>
        </div>

        <!-- Distributions -->
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Répartitions du catalogue</h2>
        <div v-if="!hasInventoryData" class="bg-white rounded-lg shadow p-16 text-center mb-6">
          <h3 class="text-lg text-gray-600 mb-2">Aucune donnée de catalogue</h3>
          <p class="text-gray-500 text-sm">Ajoutez des montres pour voir les répartitions.</p>
        </div>
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Par statut de stock</h3>
            <div class="h-64">
              <Doughnut :data="statusChartData" :options="doughnutOptions" />
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Par audience</h3>
            <div class="h-64">
              <Doughnut :data="audienceChartData" :options="doughnutOptions" />
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Top marques</h3>
            <div class="h-64">
              <Bar :data="brandChartData" :options="horizontalBarOptions" />
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Par tranche de prix</h3>
            <div class="h-64">
              <Bar :data="priceRangeChartData" :options="horizontalBarOptions" />
            </div>
          </div>
        </div>

        <!-- Chart -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Évolution des montres vendues</h2>
          <div v-if="stats.length === 0" class="text-center py-16">
            <div class="text-gray-400 mb-4">
              <svg class="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 class="text-xl text-gray-600 mb-2">Aucune donnée disponible</h3>
            <p class="text-gray-500">Aucune vente enregistrée pour le moment.</p>
          </div>
          <div v-else class="h-64 sm:h-80 md:h-96">
            <Chart :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Article Chart -->
        <div v-if="isBlogEnabled" class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Évolution des articles créés et vus</h2>
          <div v-if="articleStats.length === 0" class="text-center py-16">
            <div class="text-gray-400 mb-4">
              <svg class="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 class="text-xl text-gray-600 mb-2">Aucune donnée disponible</h3>
            <p class="text-gray-500">Aucun article n'a encore été créé.</p>
          </div>
          <div v-else class="h-64 sm:h-80 md:h-96">
            <Chart :data="articleChartData" :options="articleChartOptions" />
          </div>
        </div>

        <!-- Storage Stats Section -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Utilisation du stockage Supabase</h2>
          
          <!-- Summary Cards -->
          <div v-if="storageStats" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div class="text-sm text-blue-600 mb-1">Stockage utilisé</div>
              <div class="text-3xl font-bold text-blue-700">
                {{ storageStats.totalSizeGB.toFixed(2) }} GB
              </div>
              <div class="text-xs text-blue-500 mt-2">
                ({{ storageStats.totalSizeMB.toFixed(2) }} MB)
              </div>
            </div>
            <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div class="text-sm text-gray-600 mb-1">Nombre de fichiers</div>
              <div class="text-3xl font-bold text-gray-700">{{ storageStats.fileCount }}</div>
              <div class="text-xs text-gray-500 mt-2">Images stockées</div>
            </div>
            <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div class="text-sm text-purple-600 mb-1">Limite du plan</div>
              <div class="text-3xl font-bold text-purple-700">{{ storageStats.limitGB }} GB</div>
              <div class="text-xs text-purple-500 mt-2">
                {{ storageStats.usagePercent.toFixed(1) }}% utilisé
              </div>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div v-if="storageStats" class="mb-6">
            <div class="flex justify-between text-sm text-gray-600 mb-2">
              <span>Utilisation</span>
              <span>{{ storageStats.usagePercent.toFixed(1) }}%</span>
            </div>
            <div class="w-full bg-cream-200 rounded-full h-4 overflow-hidden">
              <div
                class="h-full transition-all duration-500 rounded-full"
                :class="{
                  'bg-green-500': storageStats.usagePercent < 50,
                  'bg-yellow-500': storageStats.usagePercent >= 50 && storageStats.usagePercent < 80,
                  'bg-red-500': storageStats.usagePercent >= 80,
                }"
                :style="{ width: `${Math.min(storageStats.usagePercent, 100)}%` }"
              ></div>
            </div>
          </div>
          
          <!-- Loading State -->
          <div v-if="isLoadingStorage" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <p class="text-gray-600 text-sm">Chargement des statistiques de stockage...</p>
          </div>
          <div v-else-if="!storageStats" class="text-center py-8">
            <p class="text-gray-500">Impossible de charger les statistiques de stockage.</p>
          </div>
        </div>

        <!-- Database Tables Stats Section -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Utilisation des tables de données</h2>
          
          <!-- Summary Cards -->
          <div v-if="tableSizes.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div class="text-sm text-indigo-600 mb-1">Taille totale utilisée</div>
              <div class="text-3xl font-bold text-indigo-700">
                {{ totalTableSizeMB.toFixed(2) }} MB
              </div>
              <div class="text-xs text-indigo-500 mt-2">
                ({{ (totalTableSizeMB / 1024).toFixed(3) }} GB)
              </div>
            </div>
            <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div class="text-sm text-gray-600 mb-1">Nombre de tables</div>
              <div class="text-3xl font-bold text-gray-700">{{ tableSizes.length }}</div>
              <div class="text-xs text-gray-500 mt-2">Tables dans la base</div>
            </div>
            <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div class="text-sm text-purple-600 mb-1">Limite du plan</div>
              <div class="text-3xl font-bold text-purple-700">{{ tableSizeLimitMB }} MB</div>
              <div class="text-xs text-purple-500 mt-2">
                {{ tableSizeUsagePercent.toFixed(1) }}% utilisé
              </div>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div v-if="tableSizes.length > 0" class="mb-6">
            <div class="flex justify-between text-sm text-gray-600 mb-2">
              <span>Utilisation</span>
              <span>{{ tableSizeUsagePercent.toFixed(1) }}%</span>
            </div>
            <div class="w-full bg-cream-200 rounded-full h-4 overflow-hidden">
              <div
                class="h-full transition-all duration-500 rounded-full"
                :class="{
                  'bg-green-500': tableSizeUsagePercent < 50,
                  'bg-yellow-500': tableSizeUsagePercent >= 50 && tableSizeUsagePercent < 80,
                  'bg-red-500': tableSizeUsagePercent >= 80,
                }"
                :style="{ width: `${Math.min(tableSizeUsagePercent, 100)}%` }"
              ></div>
            </div>
          </div>

          <!-- Table List -->
          <div v-if="tableSizes.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-cream">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taille (MB)
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre de lignes
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pourcentage
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="table in tableSizes" :key="table.table_name" class="hover:bg-cream">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ table.table_name }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ table.size_mb?.toFixed(2) || '0.00' }} MB</div>
                    <div class="text-xs text-gray-500">{{ (table.size_bytes / 1024).toFixed(2) }} KB</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                      {{ table.row_count ? new Intl.NumberFormat('fr-FR').format(table.row_count) : 'N/A' }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-full bg-cream-200 rounded-full h-2 mr-2">
                        <div
                          class="bg-indigo-600 h-2 rounded-full"
                          :style="{ width: `${totalTableSizeMB > 0 ? (table.size_mb / totalTableSizeMB * 100) : 0}%` }"
                        ></div>
                      </div>
                      <span class="text-xs text-gray-600">
                        {{ totalTableSizeMB > 0 ? ((table.size_mb / totalTableSizeMB * 100).toFixed(1)) : 0 }}%
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Loading State -->
          <div v-if="isLoadingTableSizes" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <p class="text-gray-600 text-sm">Chargement des tailles des tables...</p>
          </div>
          <div v-else-if="tableSizes.length === 0 && !isLoadingTableSizes" class="text-center py-8">
            <p class="text-gray-500">Impossible de charger les tailles des tables.</p>
            <p class="text-xs text-gray-400 mt-2">Assurez-vous que la fonction SQL get_table_sizes() est créée dans Supabase.</p>
          </div>
        </div>
      </div>
  </AdminShell>
</template>

