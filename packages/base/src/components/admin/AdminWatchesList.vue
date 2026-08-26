<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch as vueWatch } from 'vue'
import { useRouter } from 'vue-router'
import {
  listWatchesForAdmin,
  getAdminWatchStatusCounts,
  getAdminWatchBrands,
  deleteWatch,
  toggleWatchAvailability,
  markWatchAsSold,
  reorderWatches,
  moveWatchToCatalogEdge,
} from '@/services/admin/adminWatchService'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { useAdminPermissions } from '@/services/admin/useAdminPermissions'
import AdminShell from './AdminShell.vue'

const router = useRouter()
const { canWrite } = useAdminPermissions()

// Catalogue retail (gestion de stock) : statut base sur le stock ("Hors stock"),
// pas sur "Vendue" (reserve au mode resale / pieces uniques).
const isRetailCatalog = computed(() => getSiteConfig().watchCatalog?.mode !== 'resale')

// State
// `watches` ne contient que la page affichée : filtres, tri et pagination sont résolus par
// la base. Charger le catalogue entier pour en découper 25 lignes tronquait silencieusement
// la liste au-delà de `max_rows` et rendait la page inutilisable sur un catalogue de
// plusieurs milliers de références.
const watches = ref([])
const totalCount = ref(0)
const statusCounts = ref({ available: 0, unavailable: 0, sold: 0, all: 0 })
const brandOptions = ref([])
const isLoading = ref(true)
const isReordering = ref(false)
const error = ref(null)
const success = ref(null)
const searchQuery = ref('')
const debouncedSearch = ref('')
const selectedBrand = ref('')
const showDeleteConfirm = ref(false)
const watchToDelete = ref(null)
const activeTab = ref('available') // 'available', 'unavailable', 'sold', ou 'all'

// Pagination state (résolue côté serveur)
const currentPage = ref(1)
const pageSize = ref(25)

// Sorting state
const sortColumn = ref(null) // 'order', 'price', 'date', 'brand', 'model'
const sortDirection = ref('asc') // 'asc' or 'desc'

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const pageOffset = computed(() => (currentPage.value - 1) * pageSize.value)

const paginationStart = computed(() => (totalCount.value === 0 ? 0 : pageOffset.value + 1))
const paginationEnd = computed(() =>
  Math.min(pageOffset.value + watches.value.length, totalCount.value),
)

// Le classement ne veut rien dire quand le tableau est trié par prix, marque ou date : la
// ligne voisine à l'écran n'est alors pas la voisine dans l'ordre du catalogue. Le
// glisser-déposer et les flèches ne sont donc proposés que sur l'ordre du catalogue.
const isCatalogOrder = computed(() => sortColumn.value === null || sortColumn.value === 'order')
const canReorder = computed(
  () => canWrite.value && activeTab.value !== 'sold' && isCatalogOrder.value,
)

const showSuccess = (message) => {
  success.value = message
  setTimeout(() => {
    success.value = null
  }, 3000)
}

// Methods
// Jeton de requête : une frappe rapide dans la recherche peut faire revenir une réponse
// périmée après une plus récente ; on ignore alors la plus ancienne.
let listRequestId = 0

const loadWatches = async ({ silent = false } = {}) => {
  const requestId = ++listRequestId
  if (!silent) isLoading.value = true
  try {
    const result = await listWatchesForAdmin({
      status: activeTab.value,
      search: debouncedSearch.value,
      brand: selectedBrand.value,
      sortColumn: sortColumn.value,
      sortDirection: sortDirection.value,
      page: currentPage.value,
      pageSize: pageSize.value,
    })
    if (requestId !== listRequestId) return

    watches.value = result.watches
    totalCount.value = result.total
    error.value = null

    // Une suppression ou un changement de filtre peut vider la page courante : revenir sur
    // la dernière page utile plutôt que d'afficher un tableau vide.
    if (result.watches.length === 0 && result.total > 0 && currentPage.value > 1) {
      currentPage.value = Math.max(1, Math.ceil(result.total / pageSize.value))
    }
  } catch (err) {
    if (requestId !== listRequestId) return
    console.error('Erreur lors du chargement des montres:', err)
    error.value = err.message || 'Une erreur est survenue lors du chargement des montres'
  } finally {
    if (requestId === listRequestId) isLoading.value = false
  }
}

const loadStatusCounts = async () => {
  try {
    statusCounts.value = await getAdminWatchStatusCounts()
  } catch (err) {
    console.error('Erreur lors du comptage des montres:', err)
  }
}

const loadBrands = async () => {
  try {
    brandOptions.value = await getAdminWatchBrands()
  } catch (err) {
    console.error('Erreur lors du chargement des marques:', err)
    brandOptions.value = []
  }
}

// Recharge la page et les compteurs après une écriture (statut, suppression, vente).
const refreshAfterMutation = async () => {
  await Promise.all([loadWatches({ silent: true }), loadStatusCounts()])
}

const goToFirstPage = () => {
  // Remettre `currentPage` à 1 déclenche déjà un rechargement via son watcher : ne relancer
  // manuellement que si on y était déjà.
  if (currentPage.value === 1) loadWatches()
  else currentPage.value = 1
}

let searchDebounce = null
vueWatch(searchQuery, (value) => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    debouncedSearch.value = value
  }, 300)
})

vueWatch([activeTab, debouncedSearch, selectedBrand, sortColumn, sortDirection, pageSize], () => {
  goToFirstPage()
})

vueWatch(currentPage, () => {
  loadWatches()
})

onBeforeUnmount(() => {
  clearTimeout(searchDebounce)
})

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const handleEdit = (watchId) => {
  router.push(`/admin/watches/${watchId}/edit`)
}

const handleDelete = (watch) => {
  watchToDelete.value = watch
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!watchToDelete.value) return

  try {
    const result = await deleteWatch(watchToDelete.value.id)
    if (result.success) {
      await refreshAfterMutation()
      showDeleteConfirm.value = false
      watchToDelete.value = null
    } else {
      error.value = result.error || 'Erreur lors de la suppression'
    }
  } catch (err) {
    error.value = 'Une erreur est survenue lors de la suppression'
    console.error(err)
  }
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  watchToDelete.value = null
}

const handleToggleAvailability = async (watch) => {
  try {
    const result = await toggleWatchAvailability(watch.id)
    if (result.success) {
      // La montre peut sortir de l'onglet courant : recharger la page et les compteurs.
      await refreshAfterMutation()
    } else {
      error.value = result.error || 'Erreur lors du changement de statut'
    }
  } catch (err) {
    error.value = 'Une erreur est survenue lors du changement de statut'
    console.error(err)
  }
}

const handleMarkAsSold = async (watch) => {
  try {
    const result = await markWatchAsSold(watch.id)
    if (result.success) {
      await refreshAfterMutation()
    } else {
      error.value = result.error || 'Erreur lors du marquage comme vendue'
    }
  } catch (err) {
    error.value = 'Une erreur est survenue lors du marquage comme vendue'
    console.error(err)
  }
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Sorting functions
const handleSort = (column) => {
  if (sortColumn.value === column) {
    // Toggle direction if same column
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // New column, default to ascending
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

const isColumnSorted = (column) => {
  return sortColumn.value === column
}

const getSortDirection = (column) => {
  if (sortColumn.value !== column) return null
  return sortDirection.value
}

// ---------------------------------------------------------------------------
// Réordonnancement
//
// Deux gestes complémentaires, parce qu'aucun ne suffit seul sur un gros catalogue :
//   * glisser-déposer et flèches : réglage fin entre lignes voisines. Ils permutent les
//     `display_order` déjà détenus par ces lignes — des positions absolues. Le reste du
//     catalogue n'est jamais touché, et au plus `pageSize` lignes changent.
//   * « en tête » / « en fin » : positions absolues, indépendantes de l'affichage. C'est le
//     seul geste qui traverse les pages, et il ne modifie qu'une ligne.
// ---------------------------------------------------------------------------

// Lignes de la page qui participent au classement (les vendues gardent display_order null).
const orderableRows = computed(() => watches.value.filter((w) => w.is_sold !== true))

const applyOrders = async (updates, { reload = true } = {}) => {
  if (updates.length === 0) return
  isReordering.value = true
  try {
    const result = await reorderWatches(updates)
    if (result.success) {
      if (reload) await loadWatches({ silent: true })
      showSuccess('Ordre mis à jour avec succès')
    } else {
      error.value = result.error || "Erreur lors de la mise à jour de l'ordre"
    }
  } catch (err) {
    error.value = "Une erreur est survenue lors de la mise à jour de l'ordre"
    console.error(err)
  } finally {
    isReordering.value = false
  }
}

// Récupère la montre située juste avant (ou juste après) la page affichée, pour que les
// flèches fonctionnent aussi sur la première et la dernière ligne d'une page.
const fetchNeighbourAcrossPage = async (globalIndex) => {
  if (globalIndex < 0 || globalIndex >= totalCount.value) return null
  const result = await listWatchesForAdmin({
    status: activeTab.value,
    search: debouncedSearch.value,
    brand: selectedBrand.value,
    sortColumn: sortColumn.value,
    sortDirection: sortDirection.value,
    page: globalIndex + 1,
    pageSize: 1,
  })
  return result.watches[0] || null
}

const swapWithNeighbour = async (watchId, direction) => {
  if (!canReorder.value || isReordering.value) return

  const rows = orderableRows.value
  const index = rows.findIndex((w) => w.id === watchId)
  if (index === -1) return

  const current = rows[index]
  if (current.display_order == null) {
    error.value = "Cette montre n'a pas encore de position : utilisez « en tête » ou « en fin »."
    return
  }

  const step = direction === 'up' ? -1 : 1
  let neighbour = rows[index + step]
  let crossesPage = false

  if (!neighbour) {
    // Bord de page : la voisine est sur la page adjacente. Un index global suffit à
    // l'atteindre, sans jamais recharger le catalogue.
    const globalIndex = pageOffset.value + watches.value.indexOf(current) + step
    neighbour = await fetchNeighbourAcrossPage(globalIndex)
    crossesPage = true
  }

  if (!neighbour || neighbour.is_sold === true || neighbour.display_order == null) return

  // Suivre la montre déplacée si elle a changé de page : le changement de page recharge
  // déjà la liste, inutile de la recharger deux fois.
  const target = crossesPage
    ? direction === 'up'
      ? currentPage.value - 1
      : currentPage.value + 1
    : null
  const followsPage = target !== null && target >= 1 && target <= totalPages.value

  await applyOrders(
    [
      { id: current.id, display_order: neighbour.display_order },
      { id: neighbour.id, display_order: current.display_order },
    ],
    { reload: !followsPage },
  )

  if (followsPage) currentPage.value = target
}

const moveWatchUp = (watchId) => swapWithNeighbour(watchId, 'up')
const moveWatchDown = (watchId) => swapWithNeighbour(watchId, 'down')

const moveWatchToEdge = async (watchId, edge) => {
  if (!canWrite.value || isReordering.value) return
  isReordering.value = true
  try {
    const result = await moveWatchToCatalogEdge(watchId, edge)
    if (result.success) {
      await loadWatches({ silent: true })
      showSuccess(
        edge === 'top' ? 'Montre placée en tête du catalogue' : 'Montre placée en fin de catalogue',
      )
    } else {
      error.value = result.error || 'Erreur lors du repositionnement de la montre'
    }
  } catch (err) {
    error.value = 'Une erreur est survenue lors du repositionnement de la montre'
    console.error(err)
  } finally {
    isReordering.value = false
  }
}

const isFirstOfCatalog = (watch) => pageOffset.value === 0 && watches.value.indexOf(watch) === 0

const isLastOfCatalog = (watch) =>
  pageOffset.value + watches.value.indexOf(watch) === totalCount.value - 1

// Drag & Drop state
const draggedWatch = ref(null)
const draggedOverIndex = ref(null)

const handleDragStart = (event, watch) => {
  if (!canReorder.value || watch.is_sold === true) return
  draggedWatch.value = watch
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', watch.id)
  if (event.target && event.target.style) {
    event.target.style.opacity = '0.5'
  }
}

const handleDragOver = (event, index) => {
  if (!canReorder.value) return
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  draggedOverIndex.value = index
}

const handleDragLeave = () => {
  if (!canReorder.value) return
  draggedOverIndex.value = null
}

const handleDrop = async (event, dropIndex) => {
  if (!canReorder.value) return
  event.preventDefault()
  draggedOverIndex.value = null

  const dragged = draggedWatch.value
  draggedWatch.value = null
  if (event.target && event.target.style) {
    event.target.style.opacity = '1'
  }
  if (!dragged || dragged.is_sold === true) return

  const rows = orderableRows.value
  const from = rows.findIndex((w) => w.id === dragged.id)
  if (from === -1) return

  // Index de dépôt exprimé dans la liste réordonnable (les vendues, affichées dans l'onglet
  // « Toutes », ne comptent pas comme position).
  const to = watches.value.slice(0, dropIndex).filter((w) => w.is_sold !== true).length
  if (from === to) return

  // Les positions détenues par les lignes de la page, dans l'ordre affiché. On les
  // redistribue selon le nouvel ordre : c'est une permutation, donc rien ne bouge en dehors
  // de la page et aucune position n'est inventée.
  const slots = rows.map((w) => w.display_order)
  if (slots.some((slot) => slot == null)) {
    error.value = "Certaines montres n'ont pas de position : utilisez « en tête » ou « en fin »."
    return
  }

  const reordered = [...rows]
  const [moved] = reordered.splice(from, 1)
  reordered.splice(to, 0, moved)

  const updates = reordered
    .map((watch, index) => ({
      id: watch.id,
      display_order: slots[index],
      previous: watch.display_order,
    }))
    .filter((entry) => entry.previous !== entry.display_order)
    .map(({ id, display_order }) => ({ id, display_order }))

  await applyOrders(updates)
}

const handleDragEnd = (event) => {
  if (event.target && event.target.style) {
    event.target.style.opacity = '1'
  }
  // Reset opacity for all rows
  const rows = document.querySelectorAll('tbody tr')
  rows.forEach((row) => {
    if (row.style) {
      row.style.opacity = '1'
    }
  })
  draggedWatch.value = null
  draggedOverIndex.value = null
}

onMounted(async () => {
  await Promise.all([loadWatches(), loadStatusCounts(), loadBrands()])
})
</script>

<template>
  <AdminShell title="Montres">
      <!-- Tabs -->
      <div class="bg-white rounded-lg shadow mb-6">
        <div class="border-b border-gray-200 overflow-x-auto hide-scrollbar">
          <nav class="flex -mb-px min-w-max">
            <button
              @click="activeTab = 'available'"
              :class="[
                activeTab === 'available'
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm',
              ]"
            >
              Montres en stock
              <span class="ml-2 text-xs bg-primary text-white px-2 py-1 rounded-full">
                {{ statusCounts.available }}
              </span>
            </button>
            <button
              @click="activeTab = 'unavailable'"
              :class="[
                activeTab === 'unavailable'
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm',
              ]"
            >
              Montres hors stock
              <span class="ml-2 text-xs bg-primary text-white px-2 py-1 rounded-full">
                {{ statusCounts.unavailable }}
              </span>
            </button>
            <button
              @click="activeTab = 'sold'"
              :class="[
                activeTab === 'sold'
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm',
              ]"
            >
              Montres vendues
              <span class="ml-2 text-xs bg-primary text-white px-2 py-1 rounded-full">
                {{ statusCounts.sold }}
              </span>
            </button>
            <button
              @click="activeTab = 'all'"
              :class="[
                activeTab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm',
              ]"
            >
              Toutes les montres
              <span class="ml-2 text-xs bg-primary text-white px-2 py-1 rounded-full">
                {{ statusCounts.all }}
              </span>
            </button>
          </nav>
        </div>
      </div>

      <!-- Actions Bar -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex flex-col sm:flex-row gap-4 flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher (nom, marque, modèle, référence, code)..."
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <select
              v-model="selectedBrand"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Toutes les marques</option>
              <option v-for="brand in brandOptions" :key="brand" :value="brand">
                {{ brand }}
              </option>
            </select>
          </div>
          <div v-if="canWrite" class="flex flex-col w-full gap-3 sm:w-auto sm:flex-row">
            <button
              @click="router.push('/admin/watches/new')"
              class="w-full px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-colors whitespace-nowrap sm:w-auto"
            >
              + Ajouter une montre
            </button>
          </div>
        </div>
      </div>

      <!-- Reclassement indisponible sous un tri autre que l'ordre du catalogue -->
      <div
        v-if="canWrite && activeTab !== 'sold' && !isCatalogOrder"
        class="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm"
      >
        Le tableau est trié par une autre colonne : le glisser-déposer et les flèches sont
        désactivés, car la ligne voisine à l'écran n'est pas la voisine dans l'ordre du catalogue.
        « Placer en tête » et « placer en fin » restent disponibles.
        <button @click="sortColumn = null" class="ml-2 underline hover:no-underline">
          Revenir à l'ordre du catalogue
        </button>
      </div>

      <!-- Error State -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
        {{ error }}
        <button @click="error = null" class="ml-4 text-red-500 hover:text-red-700">×</button>
      </div>

      <!-- Success State -->
      <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
        {{ success }}
        <button @click="success = null" class="ml-4 text-green-500 hover:text-green-700">×</button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-16">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p class="text-gray-600">Chargement des montres...</p>
      </div>

      <!-- Watches Table -->
      <div v-else-if="watches.length > 0" class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="">
              <tr>
                <th 
                  v-if="activeTab !== 'sold'"
                  class="w-0 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-cream-100 transition-colors"
                  @click="handleSort('order')"
                >
                  <div class="flex items-center gap-1">
                    <span>Ordre</span>
                    <div class="flex flex-col">
                      <svg 
                        v-if="!isColumnSorted('order') || getSortDirection('order') === 'desc'"
                        class="w-3 h-3 -mb-1"
                        :class="isColumnSorted('order') ? 'text-primary' : 'text-gray-300'"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                      </svg>
                      <svg 
                        v-if="!isColumnSorted('order') || getSortDirection('order') === 'asc'"
                        class="w-3 h-3"
                        :class="isColumnSorted('order') ? 'text-primary' : 'text-gray-300'"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-cream-100 transition-colors"
                  @click="handleSort('brand')"
                >
                  <div class="flex items-center gap-2">
                    <span>Marque</span>
                    <div class="flex flex-col">
                      <svg 
                        v-if="!isColumnSorted('brand') || getSortDirection('brand') === 'desc'"
                        class="w-3 h-3 -mb-1"
                        :class="isColumnSorted('brand') ? 'text-primary' : 'text-gray-300'"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                      </svg>
                      <svg 
                        v-if="!isColumnSorted('brand') || getSortDirection('brand') === 'asc'"
                        class="w-3 h-3"
                        :class="isColumnSorted('brand') ? 'text-primary' : 'text-gray-300'"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </th>
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-cream-100 transition-colors"
                  @click="handleSort('model')"
                >
                  <div class="flex items-center gap-2">
                    <span>Modèle</span>
                    <div class="flex flex-col">
                      <svg 
                        v-if="!isColumnSorted('model') || getSortDirection('model') === 'desc'"
                        class="w-3 h-3 -mb-1"
                        :class="isColumnSorted('model') ? 'text-primary' : 'text-gray-300'"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                      </svg>
                      <svg 
                        v-if="!isColumnSorted('model') || getSortDirection('model') === 'asc'"
                        class="w-3 h-3"
                        :class="isColumnSorted('model') ? 'text-primary' : 'text-gray-300'"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </th>
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-cream-100 transition-colors"
                  @click="handleSort('price')"
                >
                  <div class="flex items-center gap-2">
                    <span>Prix</span>
                    <div class="flex flex-col">
                      <svg 
                        v-if="!isColumnSorted('price') || getSortDirection('price') === 'desc'"
                        class="w-3 h-3 -mb-1"
                        :class="isColumnSorted('price') ? 'text-primary' : 'text-gray-300'"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                      </svg>
                      <svg 
                        v-if="!isColumnSorted('price') || getSortDirection('price') === 'asc'"
                        class="w-3 h-3"
                        :class="isColumnSorted('price') ? 'text-primary' : 'text-gray-300'"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </th>
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-cream-100 transition-colors"
                  @click="handleSort('date')"
                >
                  <div class="flex items-center gap-2">
                    <span>Date</span>
                    <div class="flex flex-col">
                      <svg 
                        v-if="!isColumnSorted('date') || getSortDirection('date') === 'desc'"
                        class="w-3 h-3 -mb-1"
                        :class="isColumnSorted('date') ? 'text-primary' : 'text-gray-300'"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                      </svg>
                      <svg 
                        v-if="!isColumnSorted('date') || getSortDirection('date') === 'asc'"
                        class="w-3 h-3"
                        :class="isColumnSorted('date') ? 'text-primary' : 'text-gray-300'"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <!-- <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut vente
                </th> -->
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="(watch, index) in watches"
                :key="watch.id"
                :class="[
                  'hover:bg-cream transition-colors',
                  canReorder ? 'cursor-move' : 'cursor-default',
                  draggedOverIndex === index ? 'bg-blue-50 border-2 border-blue-300' : '',
                ]"
                :draggable="canReorder && watch.is_sold !== true"
                @dragstart="handleDragStart($event, watch)"
                @dragover.prevent="handleDragOver($event, index)"
                @dragleave="handleDragLeave"
                @drop="handleDrop($event, index)"
                @dragend="handleDragEnd"
              >
                <td v-if="activeTab !== 'sold'" class="w-0 px-2 py-4 whitespace-nowrap">
                  <div class="flex flex-col items-center gap-0.5">
                    <div class="text-xs text-gray-500 font-semibold">
                      #{{ watch.display_order != null ? watch.display_order : '—' }}
                    </div>
                    <div v-if="canWrite" class="flex flex-col">
                      <button
                        @click.stop="moveWatchToEdge(watch.id, 'top')"
                        :disabled="isReordering || watch.is_sold === true"
                        :class="[
                          'p-0.5 rounded hover:bg-cream-200 transition-colors',
                          isReordering || watch.is_sold === true
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer',
                        ]"
                        title="Placer en tête du catalogue"
                      >
                        <svg class="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        @click.stop="moveWatchUp(watch.id)"
                        :disabled="!canReorder || isReordering || watch.is_sold === true || isFirstOfCatalog(watch)"
                        :class="[
                          'p-0.5 rounded hover:bg-cream-200 transition-colors',
                          !canReorder || isReordering || watch.is_sold === true || isFirstOfCatalog(watch)
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer',
                        ]"
                        :title="canReorder ? 'Déplacer vers le haut' : 'Revenez au tri « Ordre » pour reclasser'"
                      >
                        <svg class="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        @click.stop="moveWatchDown(watch.id)"
                        :disabled="!canReorder || isReordering || watch.is_sold === true || isLastOfCatalog(watch)"
                        :class="[
                          'p-0.5 rounded hover:bg-cream-200 transition-colors',
                          !canReorder || isReordering || watch.is_sold === true || isLastOfCatalog(watch)
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer',
                        ]"
                        :title="canReorder ? 'Déplacer vers le bas' : 'Revenez au tri « Ordre » pour reclasser'"
                      >
                        <svg class="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        @click.stop="moveWatchToEdge(watch.id, 'bottom')"
                        :disabled="isReordering || watch.is_sold === true"
                        :class="[
                          'p-0.5 rounded hover:bg-cream-200 transition-colors',
                          isReordering || watch.is_sold === true
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer',
                        ]"
                        title="Placer en fin de catalogue"
                      >
                        <svg class="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 13l-7 7-7-7M19 5l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="h-24 w-24 bg-cream-200 rounded overflow-hidden">
                    <img
                      v-if="watch.images && watch.images.length > 0"
                      :src="watch.images[0]"
                      :alt="watch.name"
                      loading="lazy"
                      decoding="async"
                      width="96"
                      height="96"
                      class="h-full w-full object-cover"
                    />
                    <div v-else class="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                      Pas d'image
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 max-w-40">
                  <div class="truncate" :title="watch.name">
                    {{ watch.name }}
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 max-w-40">
                  <div class="truncate" :title="watch.brand">
                    {{ watch.brand }}
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 max-w-40">
                  <div class="truncate" :title="watch.model">
                    {{ watch.model }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {{ formatPrice(watch.price) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="text-gray-500">
                    {{ formatDate(watch.created_at) }}
                  </div>
                </td>
               <!--  <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      watch.is_available !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-cream-100 text-gray-800',
                      'px-2 py-1 text-xs font-semibold rounded-full',
                    ]"
                  >
                    {{ watch.is_available !== false ? 'En stock' : 'Hors stock' }}
                  </span>
                </td> -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    v-if="isRetailCatalog"
                    :class="[
                      Number(watch.stock_quantity) <= 0
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800',
                      'px-2 py-1 text-xs font-semibold rounded-full',
                    ]"
                  >
                    {{ Number(watch.stock_quantity) <= 0 ? 'Hors stock' : 'En vente' }}
                  </span>
                  <span
                    v-else
                    :class="[
                      watch.is_sold === true
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800',
                      'px-2 py-1 text-xs font-semibold rounded-full',
                    ]"
                  >
                  {{ watch.is_sold === true ? 'Vendue' : 'En vente' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <button
                      @click="router.push(`/watch/${watch.id}`)"
                      class="text-blue-600 hover:text-blue-900"
                      title="Voir"
                    >
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="canWrite"
                      @click="handleEdit(watch.id)"
                      class="text-green-600 hover:text-green-900"
                      title="Modifier"
                    >
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="canWrite && watch.is_sold !== true"
                      @click="handleToggleAvailability(watch)"
                      :class="[
                        watch.is_available !== false
                          ? 'text-orange-600 hover:text-orange-900'
                          : 'text-green-600 hover:text-green-900',
                      ]"
                      :title="watch.is_available !== false ? 'Marquer comme hors stock' : 'Marquer comme en stock'"
                    >
                      <svg
                        v-if="watch.is_available !== false"
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                      </svg>
                      <svg
                        v-else
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="canWrite && watch.is_sold !== true"
                      @click="handleMarkAsSold(watch)"
                      class="text-purple-600 hover:text-purple-900"
                      title="Marquer comme vendue"
                    >
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="canWrite && watch.is_available === false"
                      @click="handleDelete(watch)"
                      class="text-red-600 hover:text-red-900"
                      title="Supprimer"
                    >
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 max-w-40">
                  <div class="truncate" :title="watch.ad_code">
                    {{ watch.ad_code }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="flex items-center gap-4">
            <p class="text-sm text-gray-500 italic">
              {{ paginationStart }}-{{ paginationEnd }} sur {{ totalCount }} montre{{ totalCount > 1 ? 's' : '' }}
            </p>
            <label class="text-sm text-gray-500 flex items-center gap-2">
              Par page
              <select
                v-model.number="pageSize"
                class="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </label>
          </div>
          <div v-if="totalPages > 1" class="flex items-center gap-2">
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              :class="[
                'px-3 py-1 rounded-md text-sm border transition-colors',
                currentPage === 1
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-cream-100 cursor-pointer',
              ]"
            >
              Précédent
            </button>
            <span class="text-sm text-gray-600">Page {{ currentPage }} / {{ totalPages }}</span>
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              :class="[
                'px-3 py-1 rounded-md text-sm border transition-colors',
                currentPage === totalPages
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-cream-100 cursor-pointer',
              ]"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="bg-white rounded-lg shadow p-16 text-center">
        <div class="text-gray-400 mb-4">
          <svg class="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 class="text-xl text-gray-600 mb-2">Aucune montre trouvée</h3>
        <p class="text-gray-500 mb-6">
          {{ searchQuery || selectedBrand ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter une montre' }}
        </p>
        <button
          v-if="canWrite && !searchQuery && !selectedBrand"
          @click="router.push('/admin/watches/new')"
          class="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-colors"
        >
          + Ajouter une montre
        </button>
      </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="cancelDelete"
    >
      <div
        class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
        @click.stop
      >
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Confirmer la suppression</h3>
        <p class="text-gray-600 mb-6">
          Êtes-vous sûr de vouloir supprimer la montre <strong>{{ watchToDelete?.name }}</strong> ? Cette action est irréversible.
        </p>
        <div class="flex justify-end space-x-4">
          <button
            @click="cancelDelete"
            class="px-4 py-2 text-gray-700 bg-cream-100 rounded-lg hover:bg-cream-200 transition-colors"
          >
            Annuler
          </button>
          <button
            @click="confirmDelete"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  </AdminShell>
</template>

