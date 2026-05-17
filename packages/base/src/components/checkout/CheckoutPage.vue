<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { loadStripe } from '@stripe/stripe-js'
import { useCart } from '@/composables/useCart.js'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { STRIPE_PUBLISHABLE_KEY } from '@/config'
import {
  createOrder,
  fetchOrder,
  updateOrderCustomer,
  updateOrderShipping,
  applyOrderPromo,
  removeOrderPromo,
  createOrderPayment,
  cancelOrder,
} from '@/services/orderService.js'
import CheckoutOrderSummary from './CheckoutOrderSummary.vue'

const router = useRouter()
const site = getSiteConfig()
const checkoutConfig = site.checkout || {}
const shippingMethods = checkoutConfig.shipping?.methods || []
const promoEnabled = checkoutConfig.promo?.enabled !== false
const vatRate = Number(checkoutConfig.vatRate) > 0 ? Number(checkoutConfig.vatRate) : 20

const { items, getCheckoutLines, cartMultiQuantity } = useCart()

const loading = ref(true)
const syncLoading = ref(false)
const promoLoading = ref(false)
const error = ref('')
const orderId = ref('')
const accessToken = ref('')
const orderSnapshot = ref(null)

const email = ref('')
const phone = ref('')
const billing = ref({
  firstName: '',
  lastName: '',
})

const selectedMethodId = ref('')
const fulfillmentMode = ref('home')
const shippingAddress = ref({
  line1: '',
  line2: '',
  postalCode: '',
  city: '',
  country: checkoutConfig.shipping?.defaultCountry || 'FR',
})

const promoInput = ref('')
const promoMessage = ref('')
const cgvAccepted = ref(false)

const paymentLoading = ref(false)
const stripeReady = ref(false)
let stripeInstance = null
let elementsInstance = null
let paymentElement = null
let syncDebounceTimer = null
let lastPaymentTotalCents = null
let lastClientSecret = null

const homeMethodsAll = computed(() => shippingMethods.filter((m) => m.type === 'home'))
const pickupMethodsAll = computed(() => shippingMethods.filter((m) => m.type === 'pickup'))
const showFulfillmentToggle = computed(
  () => homeMethodsAll.value.length > 0 && pickupMethodsAll.value.length > 0,
)

function getAvailableHomeMethods(country) {
  const cc = String(country || checkoutConfig.shipping?.defaultCountry || 'FR')
    .trim()
    .toUpperCase()
  return homeMethodsAll.value.filter((m) => {
    const countries = m.countries
    if (!Array.isArray(countries) || countries.length === 0) return true
    return countries.map((c) => String(c).toUpperCase()).includes(cc)
  })
}

const availableHomeMethods = computed(() =>
  getAvailableHomeMethods(shippingAddress.value.country),
)

const methodsForCurrentMode = computed(() =>
  fulfillmentMode.value === 'pickup' ? pickupMethodsAll.value : availableHomeMethods.value,
)

const quote = computed(() => orderSnapshot.value?.order?.quote)
const orderLines = computed(() => orderSnapshot.value?.order?.lines || [])

const selectedMethod = computed(() =>
  shippingMethods.find((m) => m.id === selectedMethodId.value),
)

const isHomeDelivery = computed(() => selectedMethod.value?.type === 'home')

const addressComplete = computed(() => {
  const a = shippingAddress.value
  return Boolean(
    a.line1?.trim() && a.postalCode?.trim() && a.city?.trim() && a.country,
  )
})

const shippingQuoteReady = computed(() => {
  if (!selectedMethodId.value) return false
  if (selectedMethod.value?.type === 'pickup') return true
  return addressComplete.value
})

const canSyncOrder = computed(() => {
  if (!String(email.value).trim()) return false
  if (!String(billing.value.firstName).trim() || !String(billing.value.lastName).trim()) {
    return false
  }
  if (!selectedMethodId.value) return false
  if (selectedMethod.value?.type === 'home' && !addressComplete.value) return false
  return true
})

const canInitPayment = computed(() => canSyncOrder.value)

function formatPrice(cents) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    (cents || 0) / 100,
  )
}

const storageKey = () => `watch_checkout:${site.siteId || site.id || 'default'}`

function saveSession() {
  if (!orderId.value || !accessToken.value) return
  sessionStorage.setItem(
    storageKey(),
    JSON.stringify({ orderId: orderId.value, accessToken: accessToken.value }),
  )
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(storageKey())
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function clearSession() {
  sessionStorage.removeItem(storageKey())
}

function buildBillingAddress() {
  if (selectedMethod.value?.type === 'pickup') {
    return {
      firstName: billing.value.firstName,
      lastName: billing.value.lastName,
      country: checkoutConfig.shipping?.defaultCountry || 'FR',
    }
  }
  return {
    firstName: billing.value.firstName,
    lastName: billing.value.lastName,
    line1: shippingAddress.value.line1,
    line2: shippingAddress.value.line2,
    postalCode: shippingAddress.value.postalCode,
    city: shippingAddress.value.city,
    country: shippingAddress.value.country,
  }
}

function buildShippingPayload() {
  if (selectedMethod.value?.type === 'pickup') {
    return { methodId: selectedMethodId.value }
  }
  return {
    methodId: selectedMethodId.value,
    shippingAddress: {
      ...shippingAddress.value,
      firstName: billing.value.firstName,
      lastName: billing.value.lastName,
    },
  }
}

async function refreshOrder() {
  if (!orderId.value || !accessToken.value) return
  orderSnapshot.value = await fetchOrder(orderId.value, accessToken.value)
}

async function ensureOrder() {
  const saved = loadSession()
  if (saved?.orderId && saved?.accessToken) {
    orderId.value = saved.orderId
    accessToken.value = saved.accessToken
    try {
      await refreshOrder()
      if (orderSnapshot.value?.order?.status === 'paid') {
        router.replace({
          path: '/commande/succes',
          query: { order: orderId.value, token: accessToken.value },
        })
        return
      }
      return
    } catch {
      clearSession()
    }
  }

  const lines = getCheckoutLines()
  if (!lines.length && !items.value.length) {
    router.replace('/collection')
    return
  }

  const payload = cartMultiQuantity.value
    ? { lines: getCheckoutLines() }
    : { lines: items.value.map((i) => ({ watchId: i.watchId, quantity: 1 })) }

  const created = await createOrder(payload)
  orderId.value = created.orderId || created.order?.id
  accessToken.value = created.accessToken
  orderSnapshot.value = created
  saveSession()
}

async function updateOrderDetailsPartial() {
  orderSnapshot.value = await updateOrderCustomer(orderId.value, accessToken.value, {
    email: email.value.trim(),
    phone: phone.value.trim() || null,
    billingAddress: buildBillingAddress(),
  })
  orderSnapshot.value = await updateOrderShipping(
    orderId.value,
    accessToken.value,
    buildShippingPayload(),
  )
}

async function syncOrder() {
  if (!orderId.value || !accessToken.value || !canSyncOrder.value) return
  syncLoading.value = true
  try {
    await updateOrderDetailsPartial()
    const total = quote.value?.totalCents
    if (canInitPayment.value) {
      if (stripeReady.value && total != null && total !== lastPaymentTotalCents) {
        await initPayment(true)
      } else if (!stripeReady.value && !paymentLoading.value) {
        await initPayment(false)
      }
    }
  } catch (e) {
    error.value = e.message
  } finally {
    syncLoading.value = false
  }
}

function scheduleSync() {
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer)
  syncDebounceTimer = setTimeout(() => {
    syncDebounceTimer = null
    syncOrder()
  }, 500)
}

function selectFirstMethodForMode(mode) {
  const list = mode === 'pickup' ? pickupMethodsAll.value : availableHomeMethods.value
  if (!list.length) return
  const current = list.find((m) => m.id === selectedMethodId.value)
  if (!current) {
    selectedMethodId.value = list[0].id
  }
}

async function onApplyPromo() {
  promoMessage.value = ''
  error.value = ''
  if (!String(promoInput.value).trim()) {
    error.value = 'Saisissez un code promo'
    return
  }
  promoLoading.value = true
  try {
    if (canSyncOrder.value) {
      await updateOrderDetailsPartial()
    }
    orderSnapshot.value = await applyOrderPromo(
      orderId.value,
      accessToken.value,
      promoInput.value,
    )
    promoMessage.value = 'Code appliqué'
    if (canInitPayment.value) {
      await initPayment(true)
    }
  } catch (e) {
    error.value = e.message
  } finally {
    promoLoading.value = false
  }
}

async function onRemovePromo() {
  promoLoading.value = true
  error.value = ''
  try {
    orderSnapshot.value = await removeOrderPromo(orderId.value, accessToken.value)
    promoInput.value = ''
    promoMessage.value = ''
    if (canInitPayment.value) {
      await initPayment(true)
    }
  } catch (e) {
    error.value = e.message
  } finally {
    promoLoading.value = false
  }
}

async function initPayment(forceRemount = false) {
  if (!STRIPE_PUBLISHABLE_KEY || !canInitPayment.value) return
  if (paymentLoading.value) return

  paymentLoading.value = true
  if (!forceRemount) {
    error.value = ''
    stripeReady.value = false
  }
  try {
    const pay = await createOrderPayment(orderId.value, accessToken.value)
    lastPaymentTotalCents = pay.totalCents ?? quote.value?.totalCents

    if (!stripeInstance) {
      stripeInstance = await loadStripe(STRIPE_PUBLISHABLE_KEY)
    }
    if (!stripeInstance) {
      throw new Error('Impossible de charger Stripe')
    }

    const needsNewElements =
      forceRemount || !elementsInstance || lastClientSecret !== pay.clientSecret

    if (needsNewElements) {
      if (paymentElement) {
        paymentElement.destroy()
        paymentElement = null
      }
      elementsInstance = stripeInstance.elements({ clientSecret: pay.clientSecret })
      lastClientSecret = pay.clientSecret
    }

    await nextTick()
    const mountEl = document.getElementById('payment-element')
    if (!mountEl) return

    if (!paymentElement || needsNewElements) {
      paymentElement = elementsInstance.create('payment')
      paymentElement.mount('#payment-element')
    }

    stripeReady.value = true
  } catch (e) {
    error.value = e.message
    stripeReady.value = false
  } finally {
    paymentLoading.value = false
  }
}

async function onConfirmPayment() {
  if (!stripeInstance || !elementsInstance) return
  if (checkoutConfig.legal?.requireAcceptance && !cgvAccepted.value) {
    error.value = 'Veuillez accepter les conditions générales'
    return
  }
  paymentLoading.value = true
  error.value = ''
  const returnUrl = `${window.location.origin}/commande/succes?order=${orderId.value}&token=${encodeURIComponent(accessToken.value)}`
  const { error: stripeError } = await stripeInstance.confirmPayment({
    elements: elementsInstance,
    confirmParams: { return_url: returnUrl },
  })
  if (stripeError) {
    error.value = stripeError.message || 'Paiement refusé'
  }
  paymentLoading.value = false
}

async function onCancelCheckout() {
  try {
    if (orderId.value && accessToken.value) {
      await cancelOrder(orderId.value, accessToken.value)
    }
  } catch {
    /* ignore */
  }
  clearSession()
  router.push('/collection')
}

function hydrateFromOrder(o) {
  if (!o) return
  if (o.customerEmail) email.value = o.customerEmail
  if (o.customerPhone) phone.value = o.customerPhone
  if (o.billingAddress) {
    billing.value.firstName = o.billingAddress.firstName || ''
    billing.value.lastName = o.billingAddress.lastName || ''
  }
  if (o.shippingAddress) {
    Object.assign(shippingAddress.value, {
      line1: o.shippingAddress.line1 || '',
      line2: o.shippingAddress.line2 || '',
      postalCode: o.shippingAddress.postalCode || '',
      city: o.shippingAddress.city || '',
      country: o.shippingAddress.country || shippingAddress.value.country,
    })
  } else if (o.billingAddress?.line1) {
    Object.assign(shippingAddress.value, {
      line1: o.billingAddress.line1 || '',
      line2: o.billingAddress.line2 || '',
      postalCode: o.billingAddress.postalCode || '',
      city: o.billingAddress.city || '',
      country: o.billingAddress.country || shippingAddress.value.country,
    })
  }
}

watch(fulfillmentMode, (mode) => {
  selectFirstMethodForMode(mode)
  scheduleSync()
})

watch(
  () => shippingAddress.value.country,
  () => {
    if (fulfillmentMode.value === 'home') {
      selectFirstMethodForMode('home')
      scheduleSync()
    }
  },
)

watch(
  [email, phone, billing, shippingAddress, selectedMethodId],
  () => {
    scheduleSync()
  },
  { deep: true },
)

onMounted(async () => {
  if (!shippingMethods.length) {
    error.value = 'Configuration livraison manquante'
    loading.value = false
    return
  }

  if (pickupMethodsAll.value.length && !homeMethodsAll.value.length) {
    fulfillmentMode.value = 'pickup'
  } else {
    fulfillmentMode.value = 'home'
  }

  try {
    await ensureOrder()
    const o = orderSnapshot.value?.order
    hydrateFromOrder(o)

    if (o?.shippingAddress || pickupMethodsAll.value.length === shippingMethods.length) {
      const hasPickupOnly = pickupMethodsAll.value.length && !homeMethodsAll.value.length
      fulfillmentMode.value = hasPickupOnly ? 'pickup' : 'home'
    }

    selectFirstMethodForMode(fulfillmentMode.value)
    if (!selectedMethodId.value) {
      selectedMethodId.value = shippingMethods[0]?.id || ''
    }

    if (canSyncOrder.value) {
      await syncOrder()
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer)
  if (paymentElement) {
    paymentElement.destroy()
    paymentElement = null
  }
})
</script>

<template>
  <section class="min-h-screen bg-cream py-8 px-4 sm:py-10">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Finaliser la commande</h1>
      <p class="text-gray-600 mb-6 text-sm sm:text-base">
        Paiement sécurisé par carte bancaire.
      </p>

      <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
      <p v-if="loading && !orderLines.length" class="text-gray-600">Chargement…</p>

      <div
        v-if="orderLines.length && !loading"
        class="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-10 items-start"
      >
        <!-- Récap mobile en premier, sticky à droite sur desktop -->
        <div class="order-1 lg:order-2 lg:sticky lg:top-24">
          <CheckoutOrderSummary
            :order-lines="orderLines"
            :quote="quote"
            :promo-enabled="promoEnabled"
            v-model:promo-input="promoInput"
            :promo-message="promoMessage"
            :promo-loading="promoLoading || syncLoading"
            :shipping-quote-ready="shippingQuoteReady"
            :vat-rate="vatRate"
            @apply-promo="onApplyPromo"
            @remove-promo="onRemovePromo"
          />
        </div>

        <!-- Formulaire -->
        <div class="order-2 lg:order-1 space-y-6">
          <form class="bg-white rounded-lg shadow-sm border border-gray-200/80 p-6 space-y-8">
            <section class="space-y-4">
              <h2 class="font-semibold text-lg text-gray-900">Contact</h2>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  v-model="email"
                  type="email"
                  required
                  autocomplete="email"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input
                    v-model="billing.firstName"
                    required
                    autocomplete="given-name"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    v-model="billing.lastName"
                    required
                    autocomplete="family-name"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  v-model="phone"
                  type="tel"
                  autocomplete="tel"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </section>

            <section class="space-y-4">
              <h2 class="font-semibold text-lg text-gray-900">Livraison</h2>

              <div
                v-if="showFulfillmentToggle"
                class="grid grid-cols-2 gap-0 rounded-lg border border-gray-300 overflow-hidden"
              >
                <button
                  type="button"
                  class="flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors"
                  :class="
                    fulfillmentMode === 'home'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
                  "
                  @click="fulfillmentMode = 'home'"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  Expédier
                </button>
                <button
                  type="button"
                  class="flex items-center justify-center gap-2 py-3 text-sm font-medium border-l border-gray-300 transition-colors"
                  :class="
                    fulfillmentMode === 'pickup'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
                  "
                  @click="fulfillmentMode = 'pickup'"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Retrait
                </button>
              </div>

              <template v-if="isHomeDelivery">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Pays *</label>
                  <select
                    v-model="shippingAddress.country"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="FR">France</option>
                    <option value="MC">Monaco</option>
                    <option value="BE">Belgique</option>
                    <option value="CH">Suisse</option>
                    <option value="LU">Luxembourg</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                  <input
                    v-model="shippingAddress.line1"
                    required
                    autocomplete="street-address"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Complément d’adresse</label
                  >
                  <input
                    v-model="shippingAddress.line2"
                    autocomplete="address-line2"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div class="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"
                      >Code postal *</label
                    >
                    <input
                      v-model="shippingAddress.postalCode"
                      required
                      autocomplete="postal-code"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                    <input
                      v-model="shippingAddress.city"
                      required
                      autocomplete="address-level2"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </template>

              <template v-else-if="selectedMethod?.type === 'pickup'">
                <p
                  v-if="selectedMethod.pickupLocation"
                  class="text-sm text-gray-700 rounded-lg bg-cream p-4 border border-gray-200"
                >
                  <span class="font-medium block">{{ selectedMethod.pickupLocation.name }}</span>
                  {{ selectedMethod.pickupLocation.address }}
                </p>
              </template>
            </section>

            <section class="space-y-4">
              <h2 class="font-semibold text-lg text-gray-900">Mode d’expédition</h2>

              <div
                v-if="isHomeDelivery && !addressComplete"
                class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                Saisissez votre adresse d’expédition pour voir les modes d’expédition disponibles.
              </div>

              <div
                v-else-if="methodsForCurrentMode.length === 0"
                class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              >
                Aucun mode de livraison disponible pour cette destination.
              </div>

              <div v-else class="space-y-2">
                <label
                  v-for="method in methodsForCurrentMode"
                  :key="method.id"
                  class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors"
                  :class="
                    selectedMethodId === method.id
                      ? 'border-primary bg-cream'
                      : 'border-gray-200'
                  "
                >
                  <input
                    v-model="selectedMethodId"
                    type="radio"
                    :value="method.id"
                    class="mt-1"
                  />
                  <span class="min-w-0 flex-1">
                    <span class="font-medium block">{{ method.label }}</span>
                    <span v-if="method.estimatedDays" class="text-xs text-gray-500 block">{{
                      method.estimatedDays
                    }}</span>
                    <span
                      v-if="method.type === 'pickup' && method.pickupLocation"
                      class="text-xs text-gray-600 block mt-1"
                    >
                      {{ method.pickupLocation.name }} — {{ method.pickupLocation.address }}
                    </span>
                  </span>
                </label>
              </div>
            </section>
          </form>

          <section class="bg-white rounded-lg shadow-sm border border-gray-200/80 p-6 space-y-4">
            <div>
              <h2 class="font-semibold text-lg text-gray-900">Paiement</h2>
              <p class="text-sm text-gray-500 mt-1">
                Toutes les transactions sont sécurisées et chiffrées.
              </p>
            </div>

            <div
              v-if="!canInitPayment"
              class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600"
            >
              Complétez vos informations de contact et de livraison pour accéder au paiement.
            </div>

            <label
              v-if="checkoutConfig.legal?.requireAcceptance && canInitPayment"
              class="flex items-start gap-2 text-sm"
            >
              <input v-model="cgvAccepted" type="checkbox" class="mt-1 rounded" />
              <span>
                J'accepte les
                <router-link
                  :to="checkoutConfig.legal?.cgvUrl || '/conditions-generales-utilisation'"
                  class="text-primary underline"
                  target="_blank"
                  >conditions générales</router-link
                >.
              </span>
            </label>

            <div
              v-if="paymentLoading && !stripeReady"
              class="text-sm text-gray-500 py-6 text-center"
            >
              Préparation du paiement sécurisé…
            </div>
            <div id="payment-element" class="min-h-[120px]" />

            <button
              type="button"
              :disabled="paymentLoading || !stripeReady || !canInitPayment"
              class="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
              @click="onConfirmPayment"
            >
              <span v-if="paymentLoading">Traitement…</span>
              <span v-else>Payer {{ quote ? formatPrice(quote.totalCents) : '' }}</span>
            </button>
          </section>

          <button
            type="button"
            class="text-sm text-gray-600 underline"
            @click="onCancelCheckout"
          >
            Annuler et retourner à la boutique
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
