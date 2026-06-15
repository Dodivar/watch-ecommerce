<script setup>
import { ref, computed, onMounted, watch as vueWatch } from 'vue'
import { useRouter } from 'vue-router'
import { getAllWatchesForAdmin, deleteWatch, toggleWatchAvailability, markWatchAsSold, reorderWatches } from '@/services/admin/adminWatchService'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import AdminShell from './AdminShell.vue'

const router = useRouter()

// Catalogue retail (gestion de stock) : statut base sur le stock ("Hors stock"),
// pas sur "Vendue" (reserve au mode resale / pieces uniques).
const isRetailCatalog = computed(() => getSiteConfig().watchCatalog?.mode !== 'resale')

// State
const watches = ref([])
const isLoading = ref(true)
const error = ref(null)
const success = ref(null)
const searchQuery = ref('')
const selectedBrand = ref('')
const showDeleteConfirm = ref(false)
const watchToDelete = ref(null)
const activeTab = ref('available') // 'available', 'unavailable', 'sold', ou 'all'

// Pagination state (côté client)
const currentPage = ref(1)
const pageSize = ref(25)

// Sorting state
const sortColumn = ref(null) // 'price', 'date', 'brand', 'model'
const sortDirection = ref('asc') // 'asc' or 'desc'

// Computed
const availableBrands = computed(() => {
  const brands = [...new Set(watches.value.map((watch) => watch.brand))]
  return brands.sort()
})

const filteredWatches = computed(() => {
  let filtered = watches.value

  // Filter by tab selection
  if (activeTab.value === 'available') {
    filtered = filtered.filter((watch) => {
      const isAvailable = watch.is_available !== undefined ? watch.is_available : true
      return isAvailable
    })
  } else if (activeTab.value === 'unavailable') {
    filtered = filtered.filter((watch) => watch.is_available === false)
  } else if (activeTab.value === 'sold') {
    filtered = filtered.filter((watch) => watch.is_sold === true)
  }
  // 'all' shows all watches, no filter needed

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (watch) =>
        watch.name?.toLowerCase().includes(query) ||
        watch.brand?.toLowerCase().includes(query) ||
        watch.model?.toLowerCase().includes(query) ||
        watch.reference?.toLowerCase().includes(query) ||
        watch.ad_code?.toLowerCase().includes(query),
    )
  }

  // Filter by brand
  if (selectedBrand.value) {
    filtered = filtered.filter((watch) => watch.brand === selectedBrand.value)
  }

  // Apply sorting
  if (sortColumn.value) {
    filtered = [...filtered].sort((a, b) => {
      let aValue, bValue

      switch (sortColumn.value) {
        case 'order':
          aValue = a.display_order || 0
          bValue = b.display_order || 0
          break
        case 'price':
          aValue = parseFloat(a.price) || 0
          bValue = parseFloat(b.price) || 0
          break
        case 'date':
          // Use created_at only
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0
          break
        case 'brand':
          aValue = (a.brand || '').toLowerCase()
          bValue = (b.brand || '').toLowerCase()
          break
        case 'model':
          aValue = (a.model || '').toLowerCase()
          bValue = (b.model || '').toLowerCase()
          break
        default:
          return 0
      }

      // Compare values
      if (sortColumn.value === 'order' || sortColumn.value === 'price' || sortColumn.value === 'date') {
        // Numeric comparison
        return sortDirection.value === 'asc' ? aValue - bValue : bValue - aValue
      } else {
        // String comparison
        if (aValue < bValue) return sortDirection.value === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection.value === 'asc' ? 1 : -1
        return 0
      }
    })
  } else {
    // Default sort by display_order descending (highest first)
    filtered = [...filtered].sort((a, b) => {
      const orderA = a.display_order || 0
      const orderB = b.display_order || 0
      return orderB - orderA
    })
  }

  return filtered
})

// Pagination dérivée de la liste filtrée
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredWatches.value.length / pageSize.value))
})

// Décalage de la page courante : convertit un index local de ligne rendue en index global dans filteredWatches
const pageOffset = computed(() => (currentPage.value - 1) * pageSize.value)

const paginatedWatches = computed(() => {
  const start = pageOffset.value
  return filteredWatches.value.slice(start, start + pageSize.value)
})

const paginationStart = computed(() => {
  if (filteredWatches.value.length === 0) return 0
  return (currentPage.value - 1) * pageSize.value + 1
})

const paginationEnd = computed(() => {
  return Math.min(currentPage.value * pageSize.value, filteredWatches.value.length)
})

// Revenir à la page 1 dès qu'un filtre, une recherche ou un tri change
vueWatch([searchQuery, selectedBrand, activeTab, sortColumn, sortDirection, pageSize], () => {
  currentPage.value = 1
})

// Si le nombre de pages diminue (suppression, filtre), garder currentPage valide
vueWatch(totalPages, (pages) => {
  if (currentPage.value > pages) {
    currentPage.value = pages
  }
})

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

// Methods
const loadWatches = async () => {
  try {
    isLoading.value = true
    error.value = null
    const data = await getAllWatchesForAdmin()
    watches.value = data
  } catch (err) {
    console.error('Erreur lors du chargement des montres:', err)
    error.value = err.message || 'Une erreur est survenue lors du chargement des montres'
  } finally {
    isLoading.value = false
  }
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
      await loadWatches()
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
      // Mettre à jour le statut localement
      watch.is_available = result.data.is_available
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
      // Recharger les montres pour afficher la date de mise en vente
      await loadWatches()
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

// Drag & Drop state
const draggedWatch = ref(null)
const draggedOverIndex = ref(null)

// Functions for reordering watches
const moveWatchUp = async (watchId) => {
  try {
    const currentIndex = filteredWatches.value.findIndex((w) => w.id === watchId)
    if (currentIndex <= 0) return // Already at the top

    const currentWatch = filteredWatches.value[currentIndex]
    
    // Don't move sold watches
    if (currentWatch.is_sold === true) return

    // Find the previous non-sold watch
    let previousIndex = currentIndex - 1
    while (previousIndex >= 0 && filteredWatches.value[previousIndex].is_sold === true) {
      previousIndex--
    }
    if (previousIndex < 0) return // No previous non-sold watch

    const previousWatch = filteredWatches.value[previousIndex]
    
    // Don't swap with sold watches
    if (previousWatch.is_sold === true) return

    // Swap display_order values
    const tempOrder = currentWatch.display_order
    currentWatch.display_order = previousWatch.display_order
    previousWatch.display_order = tempOrder

    // Update both watches in the database
    const result = await reorderWatches([
      { id: currentWatch.id, display_order: currentWatch.display_order },
      { id: previousWatch.id, display_order: previousWatch.display_order },
    ])

    if (result.success) {
      await loadWatches() // Reload to get updated order
      success.value = 'Ordre mis à jour avec succès'
      setTimeout(() => {
        success.value = null
      }, 3000)
    } else {
      error.value = result.error || 'Erreur lors de la mise à jour de l\'ordre'
    }
  } catch (err) {
    error.value = 'Une erreur est survenue lors de la mise à jour de l\'ordre'
    console.error(err)
  }
}

const moveWatchDown = async (watchId) => {
  try {
    const currentIndex = filteredWatches.value.findIndex((w) => w.id === watchId)
    if (currentIndex >= filteredWatches.value.length - 1) return // Already at the bottom

    const currentWatch = filteredWatches.value[currentIndex]
    
    // Don't move sold watches
    if (currentWatch.is_sold === true) return

    // Find the next non-sold watch
    let nextIndex = currentIndex + 1
    while (nextIndex < filteredWatches.value.length && filteredWatches.value[nextIndex].is_sold === true) {
      nextIndex++
    }
    if (nextIndex >= filteredWatches.value.length) return // No next non-sold watch

    const nextWatch = filteredWatches.value[nextIndex]
    
    // Don't swap with sold watches
    if (nextWatch.is_sold === true) return

    // Swap display_order values
    const tempOrder = currentWatch.display_order
    currentWatch.display_order = nextWatch.display_order
    nextWatch.display_order = tempOrder

    // Update both watches in the database
    const result = await reorderWatches([
      { id: currentWatch.id, display_order: currentWatch.display_order },
      { id: nextWatch.id, display_order: nextWatch.display_order },
    ])

    if (result.success) {
      await loadWatches() // Reload to get updated order
      success.value = 'Ordre mis à jour avec succès'
      setTimeout(() => {
        success.value = null
      }, 3000)
    } else {
      error.value = result.error || 'Erreur lors de la mise à jour de l\'ordre'
    }
  } catch (err) {
    error.value = 'Une erreur est survenue lors de la mise à jour de l\'ordre'
    console.error(err)
  }
}

// Drag & Drop handlers
const handleDragStart = (event, watch) => {
  if (activeTab.value === 'sold') return
  draggedWatch.value = watch
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/html', event.target)
  if (event.target && event.target.style) {
    event.target.style.opacity = '0.5'
  }
}

const handleDragOver = (event, index) => {
  if (activeTab.value === 'sold') return
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  draggedOverIndex.value = index
}

const handleDragLeave = () => {
  if (activeTab.value === 'sold') return
  draggedOverIndex.value = null
}

const handleDrop = async (event, dropIndex) => {
  if (activeTab.value === 'sold') return
  event.preventDefault()
  draggedOverIndex.value = null

  if (!draggedWatch.value) return

  const draggedIndex = filteredWatches.value.findIndex((w) => w.id === draggedWatch.value.id)
  if (draggedIndex === -1 || draggedIndex === dropIndex) {
    draggedWatch.value = null
    return
  }

  try {
    // Don't allow reordering sold watches
    if (draggedWatch.value.is_sold === true) {
      draggedWatch.value = null
      return
    }

    // Calculate new display_order values for all affected watches
    // Exclude sold watches from reordering - they keep display_order = null
    const watchesToUpdate = []
    
    // Get all non-sold watches from the filtered list
    const nonSoldWatches = filteredWatches.value.filter((w) => w.is_sold !== true)
    
    // Find indices in the non-sold list
    const draggedIndexInNonSold = nonSoldWatches.findIndex((w) => w.id === draggedWatch.value.id)
    if (draggedIndexInNonSold === -1) {
      draggedWatch.value = null
      return
    }

    // Calculate the drop index in the non-sold list
    // Count how many non-sold watches are before the drop position
    const nonSoldWatchesBeforeDrop = filteredWatches.value.slice(0, dropIndex).filter((w) => w.is_sold !== true)
    const dropIndexInNonSold = nonSoldWatchesBeforeDrop.length

    // Create a copy of non-sold watches for reordering
    const sortedWatches = [...nonSoldWatches]
    
    // Remove dragged watch from its current position
    const [draggedItem] = sortedWatches.splice(draggedIndexInNonSold, 1)
    
    // Insert it at the new position
    sortedWatches.splice(dropIndexInNonSold, 0, draggedItem)

    // Assign new display_order values (highest to lowest) - only for non-sold watches
    const maxOrder = Math.max(...sortedWatches.map((w) => w.display_order || 0), 0)
    sortedWatches.forEach((watch, index) => {
      const newOrder = maxOrder - index
      if (watch.display_order !== newOrder) {
        watchesToUpdate.push({ id: watch.id, display_order: newOrder })
      }
    })

    if (watchesToUpdate.length > 0) {
      const result = await reorderWatches(watchesToUpdate)
      if (result.success) {
        await loadWatches()
        success.value = 'Ordre mis à jour avec succès'
        setTimeout(() => {
          success.value = null
        }, 3000)
      } else {
        error.value = result.error || 'Erreur lors de la mise à jour de l\'ordre'
      }
    }
  } catch (err) {
    error.value = 'Une erreur est survenue lors de la mise à jour de l\'ordre'
    console.error(err)
  }

  draggedWatch.value = null
  event.target.style.opacity = '1'
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
  await loadWatches()
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
                {{ watches.filter((w) => w.is_available !== false).length }}
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
                {{ watches.filter((w) => w.is_available === false).length }}
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
                {{ watches.filter((w) => w.is_sold === true).length }}
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
                {{ watches.length }}
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
              <option v-for="brand in availableBrands" :key="brand" :value="brand">
                {{ brand }}
              </option>
            </select>
          </div>
          <div class="flex flex-col w-full gap-3 sm:w-auto sm:flex-row">
            <button
              @click="router.push('/admin/watches/new')"
              class="w-full px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-colors whitespace-nowrap sm:w-auto"
            >
              + Ajouter une montre
            </button>
          </div>
        </div>
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
      <div v-else-if="filteredWatches.length > 0" class="bg-white rounded-lg shadow overflow-hidden">
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
                v-for="(watch, index) in paginatedWatches"
                :key="watch.id"
                :class="[
                  'hover:bg-cream transition-colors',
                  activeTab !== 'sold' ? 'cursor-move' : 'cursor-default',
                  draggedOverIndex === pageOffset + index ? 'bg-blue-50 border-2 border-blue-300' : '',
                ]"
                :draggable="activeTab !== 'sold'"
                @dragstart="handleDragStart($event, watch)"
                @dragover.prevent="handleDragOver($event, pageOffset + index)"
                @dragleave="handleDragLeave"
                @drop="handleDrop($event, pageOffset + index)"
                @dragend="handleDragEnd"
              >
                <td v-if="activeTab !== 'sold'" class="w-0 px-2 py-4 whitespace-nowrap">
                  <div class="flex flex-col items-center gap-0.5">
                    <div class="text-xs text-gray-500 font-semibold">
                      #{{ watch.display_order || 0 }}
                    </div>
                    <div class="flex flex-col">
                      <button
                        @click.stop="moveWatchUp(watch.id)"
                        :disabled="pageOffset + index === 0"
                        :class="[
                          'p-0.5 rounded hover:bg-cream-200 transition-colors',
                          pageOffset + index === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                        ]"
                        title="Déplacer vers le haut"
                      >
                        <svg class="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        @click.stop="moveWatchDown(watch.id)"
                        :disabled="pageOffset + index === filteredWatches.length - 1"
                        :class="[
                          'p-0.5 rounded hover:bg-cream-200 transition-colors',
                          pageOffset + index === filteredWatches.length - 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                        ]"
                        title="Déplacer vers le bas"
                      >
                        <svg class="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
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
                      v-if="watch.is_sold !== true"
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
                      v-if="watch.is_sold !== true"
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
                      v-if="watch.is_available === false"
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
              {{ paginationStart }}-{{ paginationEnd }} sur {{ filteredWatches.length }} montre{{ filteredWatches.length > 1 ? 's' : '' }}
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
          v-if="!searchQuery && !selectedBrand"
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

