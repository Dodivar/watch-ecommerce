<template>
  <section class="min-h-screen flex items-center justify-center py-12 px-4">
    <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
      <!-- Cancel Icon -->
      <div class="mb-6">
        <div class="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
          <svg
            class="w-12 h-12 text-orange-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      </div>

      <!-- Admin Badge -->
      <div v-if="isAdmin" class="mb-4 flex flex-wrap gap-2 justify-center">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          Mode Admin
        </span>
        <span v-if="isPreviewMode" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          Mode Prévisualisation
        </span>
      </div>

      <!-- Admin Preview Panel -->
      <div v-if="isAdmin" class="mb-6 bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-purple-900 mb-3 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          Prévisualisation - Charger une montre de référence
        </h3>
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1">
            <input
              v-model="adminWatchId"
              type="text"
              placeholder="Entrez l'ID d'une montre (ex: uuid)"
              class="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>
          <button
            @click="loadWatchForPreview"
            :disabled="!adminWatchId || isLoadingWatch"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap"
          >
            <span v-if="isLoadingWatch">Chargement...</span>
            <span v-else>Charger la montre</span>
          </button>
          <button
            v-if="watch"
            @click="clearPreview"
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium whitespace-nowrap"
          >
            Réinitialiser
          </button>
        </div>
        <p class="text-xs text-purple-700 mt-2">
          Utilisez ce champ pour prévisualiser la page d'annulation avec une montre spécifique.
        </p>
      </div>

      <!-- Cancel Message -->
      <h1 class="text-3xl font-bold text-gray-900 mb-4">Paiement annulé</h1>
      <p class="text-lg text-gray-600 mb-6">
        Votre paiement a été annulé. Aucun montant n'a été débité.
      </p>

      <!-- Watch Image - Loading State -->
      <div v-if="isLoadingWatch" class="mb-6">
        <div class="bg-white rounded-lg p-6 animate-pulse shadow-lg">
          <div class="flex flex-col sm:flex-row items-center gap-6">
            <div class="w-full sm:w-64 h-64 bg-cream-200 rounded-lg"></div>
            <div class="flex-1 w-full space-y-3">
              <div class="h-6 bg-cream-200 rounded w-3/4"></div>
              <div class="h-4 bg-cream-200 rounded w-1/2"></div>
              <div class="h-4 bg-cream-200 rounded w-1/2"></div>
              <div class="h-4 bg-cream-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Watch Image - Display -->
      <div v-else-if="watch && watch.images && watch.images.length > 0" class="mb-6">
        <div class="bg-white rounded-xl p-6 shadow-lg">
          <h2 class="text-xl font-semibold text-gray-900 mb-4 text-center">Votre montre</h2>
          <div class="flex flex-col sm:flex-row items-center gap-6">
            <!-- Image Container -->
            <div class="w-full sm:w-64 h-64 bg-white rounded-xl overflow-hidden shadow-xl flex-shrink-0">
              <img
                :src="watch.images[0]"
                :alt="watch.name"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
            </div>
            <!-- Watch Details -->
            <div class="flex-1 text-left w-full">
              <h3 class="text-2xl font-bold text-gray-900 mb-2">{{ watch.name }}</h3>
              <p v-if="watch.reference" class="text-lg font-semibold text-primary mb-3">
                Réf. {{ watch.reference }}
              </p>
              <div class="space-y-2">
                <p v-if="watch.brand" class="text-gray-700">
                  <span class="font-semibold text-gray-900">Marque :</span> {{ watch.brand }}
                </p>
                <p v-if="watch.model" class="text-gray-700">
                  <span class="font-semibold text-gray-900">Modèle :</span> {{ watch.model }}
                </p>
                <p v-if="watch.price" class="text-lg font-bold text-primary mt-3">
                  {{ new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(watch.price) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Watch Image - Error State -->
      <div v-else-if="watchError" class="mb-6">
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p class="text-sm text-yellow-800">
            <strong>Note :</strong> Impossible de charger les détails de la montre. {{ watchError }}
          </p>
        </div>
      </div>

      <!-- Information -->
      <div class="bg-white rounded-lg p-6 mb-6 shadow-lg">
        <p class="text-gray-700 mb-4">
          Si vous avez rencontré un problème lors du paiement ou si vous souhaitez finaliser votre
          achat, n'hésitez pas à nous contacter.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            :href="
              primaryWatchId
                ? 'https://wa.me/' +
                  WHATSAPP_NUMBER +
                  '?text=' +
                  encodeURIComponent(
                    `Bonjour, je souhaite finaliser l'achat de la montre (ID: ${primaryWatchId})`,
                  )
                : `https://wa.me/${WHATSAPP_NUMBER}`
            "
            target="_blank"
            class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary-hover transition-colors duration-200"
          >
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"
              />
            </svg>
            Nous contacter sur WhatsApp
          </a>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <router-link
          v-if="primaryWatchId"
          :to="`/watch/${primaryWatchId}`"
          class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary-hover transition-colors duration-200"
        >
          <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Retour à la montre
        </router-link>
        <router-link
          v-if="features.collection"
          :to="browsePath"
          class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary-hover transition-colors duration-200"
        >
          Voir notre collection
        </router-link>
        <router-link
          to="/"
          class="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-cream transition-colors duration-200"
        >
          Retour à l'accueil
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { WHATSAPP_NUMBER } from '@/config'
import { isAdminAuthenticated } from '@/services/admin/adminAuthService'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { getBrowsePath } from '@/site/siteFeatures.js'
import { getWatchById } from '@/services/watchService'

const features = getSiteConfig().features
const browsePath = getBrowsePath(features)

const route = useRoute()
const watchId = ref(null)
const cancelWatchIds = ref([])
const isAdmin = ref(false)
const adminWatchId = ref('')
const isPreviewMode = ref(false)
const watch = ref(null)
const isLoadingWatch = ref(false)
const watchError = ref(null)

const primaryWatchId = computed(() => {
  if (watchId.value) return watchId.value
  if (cancelWatchIds.value.length > 0) return cancelWatchIds.value[0]
  return null
})

async function loadWatch() {
  if (!watchId.value) return

  isLoadingWatch.value = true
  watchError.value = null

  try {
    const watchData = await getWatchById(watchId.value, true)
    watch.value = watchData
  } catch (error) {
    console.error('Erreur lors du chargement de la montre:', error)
    watchError.value = error.message || 'Erreur lors du chargement de la montre'
  } finally {
    isLoadingWatch.value = false
  }
}

onMounted(async () => {
  isAdmin.value = await isAdminAuthenticated()

  watchId.value = route.query.watch_id || null
  const rawIds = route.query.watch_ids
  if (typeof rawIds === 'string' && rawIds.trim()) {
    cancelWatchIds.value = rawIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  if (!watchId.value && cancelWatchIds.value.length > 0) {
    watchId.value = cancelWatchIds.value[0]
  }

  if (watchId.value) {
    await loadWatch()
  }
})

async function loadWatchForPreview() {
  if (!adminWatchId.value || !isAdmin.value) return

  isLoadingWatch.value = true
  watchError.value = null
  isPreviewMode.value = true

  try {
    // Utiliser allowUnavailable = true pour permettre de voir toutes les montres
    const watchData = await getWatchById(adminWatchId.value.trim(), true)
    watch.value = watchData
    // Mettre à jour watchId pour l'affichage
    watchId.value = adminWatchId.value.trim()
  } catch (error) {
    console.error('Erreur lors du chargement de la montre:', error)
    watchError.value = error.message || 'Erreur lors du chargement de la montre'
  } finally {
    isLoadingWatch.value = false
  }
}

function clearPreview() {
  watch.value = null
  watchId.value = route.query.watch_id || null
  const rawIds = route.query.watch_ids
  cancelWatchIds.value =
    typeof rawIds === 'string' && rawIds.trim()
      ? rawIds.split(',').map((s) => s.trim()).filter(Boolean)
      : []
  if (!watchId.value && cancelWatchIds.value.length > 0) {
    watchId.value = cancelWatchIds.value[0]
  }
  adminWatchId.value = ''
  watchError.value = null
  isPreviewMode.value = false
}

function handleImageError(event) {
  console.error('Erreur lors du chargement de l\'image:', event)
  // Optionnel : masquer l'image en cas d'erreur
  if (event.target) {
    event.target.style.display = 'none'
  }
}
</script>

<style scoped>
</style>


