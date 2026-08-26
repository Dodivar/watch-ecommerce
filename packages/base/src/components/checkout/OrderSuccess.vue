<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { verifyOrder, downloadOrderReceipt } from '@/services/orderService.js'
import { getWatchById, getLatestAvailableWatches } from '@/services/watchService'
import { useCart } from '@/composables/useCart.js'
import { trackPurchase } from '@/services/analytics'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { getBrowsePath } from '@/site/siteFeatures.js'
import { isAdminAuthenticated } from '@/services/admin/adminAuthService.js'
import {
  watchCardImageUrl,
  buildWatchCardSrcSet,
  WATCH_CARD_IMAGE_SIZES,
} from '@/utils/watchImageUrl.js'
import { formatPrice as formatAmount } from '@/utils/formatters.js'
import { t, getActiveLocale } from '@/i18n'

const route = useRoute()
const site = getSiteConfig()
const browsePath = getBrowsePath(site.features)

// `/commande/suivi` : lien durable envoyé dans l'email de confirmation. Même vue que la fin
// de tunnel, mais la commande peut être rouverte des mois plus tard — aucun effet de bord de
// fin de tunnel ne doit s'y rejouer (voir onMounted).
const isTrackingView = computed(() => route.path.endsWith('/commande/suivi'))

const orderId = ref('')
const fulfillmentStatus = ref('')
const paidAt = ref('')
const subtotalCents = ref(0)
const shippingCents = ref(0)
const discountCents = ref(0)
const totalCents = ref(0)
const discountInfo = ref(null)
const customerEmail = ref('')
const shippingMethodType = ref('')
const shippingMethodLabel = ref('')
const pickupLocation = ref(null)
const lines = ref([])
const watches = ref([])
const loading = ref(true)
const error = ref('')
const isPreview = ref(false)
const accessToken = ref('')
const receiptDownloading = ref(false)
const receiptError = ref('')

const DISCOUNT_TYPE_LABELS = {
  percent: 'Pourcentage',
  fixed: 'Montant fixe',
  free_shipping: 'Livraison offerte',
}

/** Les montants du tunnel sont en centimes. */
function formatPrice(cents) {
  return formatAmount((cents || 0) / 100, { decimals: true })
}

/** Clés de traduction des statuts de préparation (`orders.fulfillment_status`). */
const FULFILLMENT_STATUS_KEYS = {
  pending: 'checkout.statusPending',
  preparing: 'checkout.statusPreparing',
  shipped: 'checkout.statusShipped',
  ready_for_pickup: 'checkout.statusReadyForPickup',
  completed: 'checkout.statusCompleted',
}

const fulfillmentStatusLabel = computed(() => {
  const key = FULFILLMENT_STATUS_KEYS[fulfillmentStatus.value]
  return key ? t(key) : ''
})

const paidAtLabel = computed(() => {
  if (!paidAt.value) return ''
  const date = new Date(paidAt.value)
  if (Number.isNaN(date.getTime())) return ''
  return t('checkout.orderPlacedOn', {
    date: date.toLocaleDateString(getActiveLocale(), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  })
})

const hasDiscount = computed(() => !!discountInfo.value || discountCents.value > 0)

const discountTypeLabel = computed(() => {
  const type = discountInfo.value?.type
  if (!type) return ''
  return DISCOUNT_TYPE_LABELS[type] || type
})

/**
 * Image source d'une ligne : on privilégie l'instantané `image_url` stocké à la
 * commande, sinon on retombe sur la première image de la montre correspondante.
 * @param {object} line
 * @returns {string}
 */
function lineRawImage(line) {
  if (line?.image_url) return line.image_url
  const watch = watches.value.find((w) => w && String(w.id) === String(line?.watch_id))
  return watch?.images?.[0] || ''
}

function lineImageSrc(line) {
  const raw = lineRawImage(line)
  if (!raw) return ''
  return watchCardImageUrl(raw, { width: 160 }) ?? raw
}

function lineImageSrcSet(line) {
  return buildWatchCardSrcSet(lineRawImage(line))
}

const followUpMessage = computed(() => {
  if (shippingMethodType.value === 'pickup') {
    const place = pickupLocation.value?.name
    return place
      ? `Notre équipe prépare votre commande. Vous pourrez la retirer à ${place} dès qu’elle sera prête — nous vous contacterons par email.`
      : 'Notre équipe prépare votre commande. Vous serez contacté par email pour organiser le retrait en boutique.'
  }
  return 'Notre équipe prépare votre commande. Vous serez contacté pour l’expédition.'
})

function clearCheckoutSession() {
  const key = `watch_checkout:${site.siteId || site.id || 'default'}`
  sessionStorage.removeItem(key)
}

async function downloadReceipt() {
  if (!orderId.value || !accessToken.value || isPreview.value) return
  receiptError.value = ''
  receiptDownloading.value = true
  try {
    await downloadOrderReceipt(orderId.value, accessToken.value)
  } catch (err) {
    receiptError.value = err.message || t('checkout.receiptError')
  } finally {
    receiptDownloading.value = false
  }
}

/**
 * Aperçu de démonstration réservé aux admins : affiche une fausse confirmation
 * de commande avec une montre d'exemple pour visualiser le rendu de la page,
 * sans dépendre d'une vraie commande payée. Aucun panier n'est vidé ici.
 */
async function loadAdminPreview() {
  isPreview.value = true
  orderId.value = 'APERCU-DEMO-0001'
  customerEmail.value = 'client.exemple@email.com'
  shippingMethodType.value = 'shipping'
  shippingMethodLabel.value = 'Livraison à domicile'

  let exampleWatch = null
  try {
    // Une seule montre suffit ici : ne pas charger le catalogue entier pour un aperçu.
    const [latest] = await getLatestAvailableWatches(1)
    exampleWatch = latest || null
  } catch {
    /* ignore : on retombe sur un exemple purement fictif */
  }

  if (exampleWatch) {
    watches.value = [exampleWatch]
    const unitCents = Math.round((Number(exampleWatch.price) || 0) * 100)
    lines.value = [
      {
        id: 'preview-line-1',
        watch_id: exampleWatch.id,
        name: exampleWatch.name,
        reference: exampleWatch.reference || null,
        quantity: 1,
        unit_price_cents: unitCents,
        image_url: exampleWatch.images?.[0] || null,
      },
    ]
    subtotalCents.value = unitCents
    totalCents.value = unitCents
  } else {
    lines.value = [
      {
        id: 'preview-line-1',
        watch_id: null,
        name: "Montre d'exemple",
        quantity: 1,
        unit_price_cents: 1250000,
      },
    ]
    subtotalCents.value = 1250000
    totalCents.value = 1250000
  }

  loading.value = false
}

onMounted(async () => {
  orderId.value = String(route.query.order || '')
  const token = String(route.query.token || '')
  accessToken.value = token

  const wantsPreview =
    route.query.preview === '1' || route.query.preview === 'true'

  // Pas de commande réelle (ou aperçu explicitement demandé) : on propose un
  // aperçu de démonstration uniquement si un admin est connecté.
  if (!orderId.value || !token || wantsPreview) {
    if (await isAdminAuthenticated()) {
      await loadAdminPreview()
      return
    }
    error.value = 'Lien de confirmation invalide'
    loading.value = false
    return
  }

  try {
    const result = await verifyOrder(orderId.value, token)
    if (!result.valid) {
      error.value = result.reason || 'Paiement non confirmé'
      return
    }
    const order = result.order || {}
    fulfillmentStatus.value = order.fulfillmentStatus || ''
    paidAt.value = order.paidAt || ''
    totalCents.value = order.totalCents || 0
    subtotalCents.value = order.subtotalCents ?? order.totalCents ?? 0
    shippingCents.value = order.shippingCents || 0
    discountCents.value = order.discountCents || 0
    discountInfo.value = order.discount || null
    customerEmail.value = order.customerEmail || ''
    shippingMethodType.value = order.shippingMethodType || ''
    shippingMethodLabel.value = order.shippingMethodLabel || ''
    pickupLocation.value = order.pickupLocation || null
    lines.value = result.lines || []

    // Effets de bord de fin de tunnel — jamais sur le lien de suivi durable : rouvert des
    // mois plus tard, il viderait un panier en cours de constitution et rejouerait un achat.
    if (!isTrackingView.value) {
      // Avant de vider le panier : `trackPurchase` porte sa propre garde anti-doublon, la page
      // étant rechargeable et atteignable par retour arrière.
      trackPurchase({
        orderId: orderId.value,
        lines: lines.value,
        totalCents: totalCents.value,
        shippingCents: shippingCents.value,
      })

      const { clear: clearCart } = useCart()
      clearCart()
      clearCheckoutSession()
    }

    const loaded = []
    for (const line of lines.value) {
      try {
        const w = await getWatchById(line.watch_id, true)
        loaded.push(w)
      } catch {
        /* ignore */
      }
    }
    watches.value = loaded
  } catch (e) {
    error.value = e.message || t('checkout.verificationError')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="min-h-screen flex items-center justify-center py-12 px-4">
    <div class="w-full max-w-5xl mx-auto">
      <div
        v-if="loading"
        class="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center text-gray-600"
      >
        {{ isTrackingView ? t('checkout.loadingOrder') : t('checkout.verifyingPayment') }}
      </div>

      <div
        v-else-if="error"
        class="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center"
      >
        <h1 class="text-2xl font-bold text-gray-900 mb-4">
          {{ isTrackingView ? t('checkout.orderUnavailable') : t('checkout.confirmationUnavailable') }}
        </h1>
        <p class="text-gray-600 mb-6">{{ error }}</p>
        <router-link :to="browsePath" class="text-primary underline">{{ t('checkout.backToShop') }}</router-link>
      </div>

      <template v-else>
        <div
          v-if="isPreview"
          class="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800"
        >
          <span class="font-semibold">{{ t('checkout.adminPreview') }}</span> — confirmation de commande
          fictive avec une montre d'exemple. Aucune commande réelle n'a été passée.
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          <!-- Colonne gauche : confirmation -->
          <div class="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
            <div v-if="!isTrackingView" class="mb-6">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  class="w-9 h-9 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 mb-3">
              {{ isTrackingView ? t('checkout.trackingTitle') : t('checkout.paymentSuccessful') }}
            </h1>
            <p class="text-lg text-gray-600 mb-1">
              {{ isTrackingView ? t('checkout.trackingIntro') : t('checkout.thankYou') }}
            </p>
            <p v-if="orderId" class="text-sm text-gray-400 mb-4">
              Commande <span class="font-medium text-gray-500">{{ orderId }}</span>
            </p>
            <p v-if="isTrackingView && paidAtLabel" class="text-sm text-gray-500 mb-2">
              {{ paidAtLabel }}
            </p>
            <p v-if="isTrackingView && fulfillmentStatusLabel" class="text-sm text-gray-500 mb-6">
              {{ t('checkout.orderStatusLabel') }} :
              <span class="font-medium text-gray-700">{{ fulfillmentStatusLabel }}</span>
            </p>
            <p v-if="!isTrackingView && customerEmail" class="text-sm text-gray-500 mb-6">
              {{ t('checkout.confirmationEmailSentTo') }}
              <span class="font-medium text-gray-700">{{ customerEmail }}</span>.
            </p>

            <div v-if="!isTrackingView" class="rounded-xl bg-gray-50 border border-gray-100 p-4 mb-8">
              <p class="text-gray-600 text-sm leading-relaxed">{{ followUpMessage }}</p>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
              <router-link
                :to="browsePath"
                class="px-6 py-3 bg-primary text-white rounded-lg font-medium text-center transition-opacity hover:opacity-90"
              >
                {{ t('checkout.backToShop') }}
              </router-link>
              <button
                v-if="!isPreview"
                type="button"
                class="px-6 py-3 border border-gray-300 text-gray-800 rounded-lg font-medium text-center transition-colors hover:bg-gray-50 disabled:opacity-60"
                :disabled="receiptDownloading"
                @click="downloadReceipt"
              >
                {{ receiptDownloading ? t('common.loading') : t('checkout.downloadReceipt') }}
              </button>
            </div>
            <p v-if="receiptError" class="mt-3 text-sm text-red-600">{{ receiptError }}</p>
          </div>

          <!-- Colonne droite : reçu -->
          <div class="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-5">{{ t('checkout.yourOrder') }}</h2>

            <ul v-if="lines.length" class="space-y-4 mb-6">
              <li v-for="line in lines" :key="line.id" class="flex items-center gap-4">
                <div
                  class="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center"
                >
                  <img
                    v-if="lineImageSrc(line)"
                    :src="lineImageSrc(line)"
                    :srcset="lineImageSrcSet(line)"
                    :sizes="WATCH_CARD_IMAGE_SIZES"
                    :alt="line.name"
                    loading="lazy"
                    decoding="async"
                    class="w-full h-full object-cover"
                  />
                  <svg
                    v-else
                    class="w-8 h-8 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-gray-900 truncate">{{ line.name }}</p>
                  <p v-if="line.reference" class="text-xs text-gray-400 truncate">
                    {{ t('watch.referenceShort', { reference: line.reference }) }}
                  </p>
                  <p class="text-sm text-gray-500">{{ t('cart.quantity') }} : {{ line.quantity }}</p>
                </div>
                <span class="shrink-0 font-medium text-gray-900">
                  {{ formatPrice(line.unit_price_cents * line.quantity) }}
                </span>
              </li>
            </ul>

            <div class="border-t border-gray-100 pt-4 space-y-2 text-sm">
              <div class="flex justify-between text-gray-600">
                <span>{{ t('cart.subtotal') }}</span>
                <span>{{ formatPrice(subtotalCents) }}</span>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>{{ shippingMethodLabel || t('checkout.shippingFallback') }}</span>
                <span>{{ shippingCents > 0 ? formatPrice(shippingCents) : 'Offerte' }}</span>
              </div>
              <div v-if="hasDiscount" class="flex justify-between text-green-700">
                <span>
                  Réduction<template v-if="discountInfo?.code"> ({{ discountInfo.code }})</template>
                </span>
                <span>-{{ formatPrice(discountCents) }}</span>
              </div>
              <p v-if="hasDiscount && discountTypeLabel" class="text-xs text-gray-400">
                {{ discountTypeLabel }}
              </p>
              <div
                class="flex justify-between items-center pt-3 mt-1 border-t border-gray-100 text-base font-semibold text-gray-900"
              >
                <span>{{ t('checkout.total') }}</span>
                <span class="text-primary text-lg">{{ formatPrice(totalCents) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
