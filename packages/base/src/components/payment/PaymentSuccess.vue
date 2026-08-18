<template>
  <section class="min-h-screen flex items-center justify-center py-12 px-4">
    <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
      <!-- Success Icon -->
      <div class="mb-6">
        <div class="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            class="w-12 h-12 text-green-600"
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
              :placeholder="t('payment.watchIdPlaceholder')"
              class="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>
          <button
            @click="loadWatchForPreview"
            :disabled="!adminWatchId || isLoadingWatch"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap"
          >
            <span v-if="isLoadingWatch">{{ t('common.loading') }}</span>
            <span v-else>{{ t('payment.loadWatch') }}</span>
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
          Utilisez ce champ pour prévisualiser la page de succès avec une montre spécifique.
        </p>
      </div>

      <!-- Success Message -->
      <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ t('payment.successTitle') }}</h1>
      <p class="text-lg text-gray-600 mb-6">
        Merci pour votre achat. Votre commande a été confirmée avec succès.
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
      <div v-else-if="displayWatches.length > 0" class="mb-6 space-y-6">
        <h2 v-if="displayWatches.length > 1" class="text-xl font-semibold text-gray-900 text-center mb-2">
          Vos montres
        </h2>
        <div
          v-for="w in displayWatches"
          :key="w.id"
          class="bg-white rounded-xl p-6 shadow-lg"
        >
          <h3 v-if="displayWatches.length === 1" class="text-xl font-semibold text-gray-900 mb-4 text-center">
            {{ t('payment.yourWatch') }}
          </h3>
          <div v-if="w.images && w.images.length > 0" class="flex flex-col sm:flex-row items-center gap-6">
            <div class="w-full sm:w-64 h-64 bg-white rounded-xl overflow-hidden shadow-xl flex-shrink-0">
              <img
                :src="w.images[0]"
                :alt="w.name"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
            </div>
            <div class="flex-1 text-left w-full">
              <h3 class="text-2xl font-bold text-gray-900 mb-2">{{ w.name }}</h3>
              <p v-if="w.reference" class="text-lg font-semibold text-primary mb-3">
                Réf. {{ w.reference }}
              </p>
              <div class="space-y-2">
                <p v-if="w.brand" class="text-gray-700">
                  <span class="font-semibold text-gray-900">{{ t('payment.brandLabel') }}</span> {{ w.brand }}
                </p>
                <p v-if="w.model" class="text-gray-700">
                  <span class="font-semibold text-gray-900">{{ t('payment.modelLabel') }}</span> {{ w.model }}
                </p>
                <p v-if="w.price" class="text-lg font-bold text-primary mt-3">
                  {{ formatPrice(w.price, { decimals: true }) }}
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
            <strong>{{ t('payment.noteLabel') }}</strong> Impossible de charger les détails de la montre. Les informations de commande restent valides.
          </p>
        </div>
      </div>

      <!-- Order Details -->
      <div v-if="sessionId || watchId || displayWatches.length" class="bg-white rounded-lg p-6 mb-6 shadow-lg">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ t('payment.orderDetails') }}</h2>
        <div class="space-y-3 text-left">
          <div
            v-for="w in displayWatches"
            :key="'ord-' + w.id"
            class="pb-3 border-b border-gray-200 last:border-0 last:pb-0"
          >
            <span class="text-gray-600 block mb-1">{{ t('payment.watchLabel') }}</span>
            <span class="font-semibold text-lg text-gray-900">{{ w.name }}</span>
            <p v-if="w.reference" class="text-sm text-gray-600 mt-1">Réf. {{ w.reference }}</p>
          </div>
          <div v-if="sessionId" class="flex justify-between pt-2">
            <span class="text-gray-600">{{ t('payment.reference') }}</span>
            <span class="font-medium text-gray-900 text-right break-all max-w-[60%]">{{ sessionId }}</span>
          </div>
        </div>
      </div>

      <!-- Information -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p class="text-sm text-blue-800">
          <strong>{{ t('payment.nextSteps') }}</strong> Vous recevrez un email de confirmation avec tous les
          détails de votre commande. Notre équipe finalisera sous peu la livraison.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <router-link
          v-if="features.collection"
          :to="browsePath"
          class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary-hover transition-colors duration-200"
        >
          <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
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
import { getWatchById } from '@/services/watchService'
import { isAdminAuthenticated } from '@/services/admin/adminAuthService'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { getBrowsePath } from '@/site/siteFeatures.js'
import { verifyPaymentSession } from '@/services/stripeService'
import { useCart } from '@/composables/useCart.js'
import { formatPrice } from '@/utils/formatters.js'
import { t } from '@/i18n'

const features = getSiteConfig().features
const browsePath = getBrowsePath(features)

const route = useRoute()
const sessionId = ref(null)
const watchId = ref(null)
const watch = ref(null)
const purchasedWatches = ref([])
const isLoadingWatch = ref(false)
const watchError = ref(null)
const isAdmin = ref(false)
const adminWatchId = ref('')
const isPreviewMode = ref(false)

const displayWatches = computed(() => {
  if (purchasedWatches.value.length > 0) {
    return purchasedWatches.value
  }
  if (watch.value) {
    return [watch.value]
  }
  return []
})

onMounted(async () => {
  isAdmin.value = await isAdminAuthenticated()

  sessionId.value = route.query.session_id || null
  watchId.value = route.query.watch_id || null

  if (!isAdmin.value) {
    const { clear: clearCart } = useCart()
    clearCart()
  }

  if (watchId.value) {
    await loadWatch()
    if (watch.value) {
      purchasedWatches.value = [watch.value]
    }
  } else if (sessionId.value && !isAdmin.value) {
    isLoadingWatch.value = true
    watchError.value = null
    try {
      const v = await verifyPaymentSession(sessionId.value, null, null)
      if (!v.valid || !Array.isArray(v.watchIds) || v.watchIds.length === 0) {
        watchError.value = v.reason || 'Session invalide'
        return
      }
      const list = []
      for (const id of v.watchIds) {
        try {
          const w = await getWatchById(id, true)
          list.push(w)
        } catch (e) {
          console.warn('Montre introuvable après paiement:', id, e)
        }
      }
      purchasedWatches.value = list
      if (list.length === 1) {
        watch.value = list[0]
      }
    } catch (e) {
      console.error(e)
      watchError.value = e.message || 'Erreur lors du chargement'
    } finally {
      isLoadingWatch.value = false
    }
  }
})

async function loadWatch() {
  if (!watchId.value) return

  isLoadingWatch.value = true
  watchError.value = null

  try {
    // Utiliser allowUnavailable = true car la montre vient d'être achetée
    const watchData = await getWatchById(watchId.value, true)
    watch.value = watchData
  } catch (error) {
    console.error('Erreur lors du chargement de la montre:', error)
    watchError.value = error.message || 'Erreur lors du chargement de la montre'
  } finally {
    isLoadingWatch.value = false
  }
}

async function loadWatchForPreview() {
  if (!adminWatchId.value || !isAdmin.value) return

  isLoadingWatch.value = true
  watchError.value = null
  isPreviewMode.value = true

  try {
    // Utiliser allowUnavailable = true pour permettre de voir toutes les montres
    const watchData = await getWatchById(adminWatchId.value.trim(), true)
    watch.value = watchData
    purchasedWatches.value = [watchData]
    // Mettre à jour watchId pour l'affichage
    watchId.value = adminWatchId.value.trim()
    // Générer un sessionId fictif pour l'affichage
    if (!sessionId.value) {
      sessionId.value = `preview_${Date.now()}`
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la montre:', error)
    watchError.value = error.message || 'Erreur lors du chargement de la montre'
  } finally {
    isLoadingWatch.value = false
  }
}

function clearPreview() {
  watch.value = null
  purchasedWatches.value = []
  watchId.value = route.query.watch_id || null
  sessionId.value = route.query.session_id || null
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


