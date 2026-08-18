<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { Info, MapPin, Package } from '@lucide/vue'
import { useRoute, useRouter } from 'vue-router'
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
import AddressAutocompleteInput from './AddressAutocompleteInput.vue'
import PickupLocationCard from './PickupLocationCard.vue'
import LegalPageLinks from '@/components/legal/LegalPageLinks.vue'
import { CHECKOUT_FIELD_CLASS } from './checkoutFieldClasses.js'
import { formatPrice as formatAmount } from '@/utils/formatters.js'

const COUNTRY_LABELS = {
  FR: 'France',
  MC: 'Monaco',
  BE: 'Belgique',
  CH: 'Suisse',
  LU: 'Luxembourg',
}

const route = useRoute()
const router = useRouter()
const site = getSiteConfig()
const checkoutConfig = site.checkout || {}
const shippingMethods = checkoutConfig.shipping?.methods || []
const pickupEnabled = checkoutConfig.shipping?.pickupEnabled === true
const promoEnabled = checkoutConfig.promo?.enabled !== false
const vatRate = Number(checkoutConfig.vatRate) > 0 ? Number(checkoutConfig.vatRate) : 20

const { items, getCheckoutLines, cartMultiQuantity, replaceItems } = useCart()

const loading = ref(true)
const syncLoading = ref(false)
const promoLoading = ref(false)
const pageError = ref('')
const paymentError = ref('')
const cgvError = ref('')
const orderId = ref('')
const accessToken = ref('')
const orderSnapshot = ref(null)

const email = ref('')
const newsletterOptIn = ref(false)
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
const billingAddress = ref({
  line1: '',
  line2: '',
  postalCode: '',
  city: '',
  country: checkoutConfig.shipping?.defaultCountry || 'FR',
})

const promoInput = ref('')
const promoMessage = ref('')
const promoMessageType = ref('')
const cgvAccepted = ref(false)

const paymentLoading = ref(false)
const stripeReady = ref(false)
let stripeInstance = null
let elementsInstance = null
let paymentElement = null
let syncDebounceTimer = null
let syncInFlight = false
let syncQueued = false
let lastPaymentTotalCents = null
let lastClientSecret = null
let stripePreloadPromise = null
let paymentSectionObserver = null

const paymentSectionRef = ref(null)
const contactSectionRef = ref(null)
const shippingSectionRef = ref(null)
const cgvInputRef = ref(null)
const paymentSectionVisible = ref(false)

const homeMethodsAll = computed(() => shippingMethods.filter((m) => m.type === 'home'))
const pickupMethodsAll = computed(() => shippingMethods.filter((m) => m.type === 'pickup'))

const allowedShippingCountries = computed(() => {
  const set = new Set()
  for (const method of homeMethodsAll.value) {
    if (!Array.isArray(method.countries)) continue
    for (const code of method.countries) {
      set.add(String(code).trim().toUpperCase())
    }
  }
  if (set.size === 0) {
    set.add(String(checkoutConfig.shipping?.defaultCountry || 'FR').toUpperCase())
  }
  return [...set]
})

function countryLabel(code) {
  return COUNTRY_LABELS[code] || code
}
const showFulfillmentToggle = computed(
  () => pickupEnabled && homeMethodsAll.value.length > 0 && pickupMethodsAll.value.length > 0,
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
const isPickup = computed(() => selectedMethod.value?.type === 'pickup')

function isAddressComplete(address) {
  return Boolean(
    address.line1?.trim() &&
      address.postalCode?.trim() &&
      address.city?.trim() &&
      address.country,
  )
}

const shippingAddressComplete = computed(() => isAddressComplete(shippingAddress.value))
const billingAddressComplete = computed(() => isAddressComplete(billingAddress.value))

const shippingQuoteReady = computed(() => {
  if (!selectedMethodId.value) return false
  if (isPickup.value) return billingAddressComplete.value
  return shippingAddressComplete.value
})

const showShippingMethodSection = computed(
  () => !(isPickup.value && methodsForCurrentMode.value.length <= 1),
)

const shippingPendingLabel = computed(() =>
  isPickup.value
    ? 'Complétez votre adresse de facturation'
    : "Saisir une adresse d'expédition",
)

const shippingLineLabel = computed(() => (isPickup.value ? 'Retrait' : 'Expédition'))

const canSyncOrder = computed(() => {
  if (!String(email.value).trim()) return false
  if (!String(billing.value.firstName).trim() || !String(billing.value.lastName).trim()) {
    return false
  }
  if (!selectedMethodId.value) return false
  if (isHomeDelivery.value && !shippingAddressComplete.value) return false
  if (isPickup.value && !billingAddressComplete.value) return false
  return true
})

const canShowPayment = computed(
  () =>
    Boolean(STRIPE_PUBLISHABLE_KEY && orderId.value && accessToken.value && orderLines.value.length),
)

const canConfirmPayment = computed(() => canSyncOrder.value)

/** Les montants du tunnel sont en centimes. */
function formatPrice(cents) {
  return formatAmount((cents || 0) / 100, { decimals: true })
}

async function scrollToElement(el, { focus = false } = {}) {
  if (!el) return
  await nextTick()
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  if (focus && typeof el.focus === 'function') {
    el.focus({ preventScroll: true })
  }
}

async function scrollToPaymentSection({ focusCgv = false } = {}) {
  await scrollToElement(paymentSectionRef.value)
  if (focusCgv) {
    await scrollToElement(cgvInputRef.value, { focus: true })
  }
}

function getFirstIncompleteFieldEl() {
  if (!String(email.value).trim()) {
    return contactSectionRef.value?.querySelector('input[type="email"]')
  }
  if (!String(billing.value.firstName).trim()) {
    return contactSectionRef.value?.querySelector('input[autocomplete="given-name"]')
  }
  if (!String(billing.value.lastName).trim()) {
    return contactSectionRef.value?.querySelector('input[autocomplete="family-name"]')
  }
  if (isHomeDelivery.value && !shippingAddressComplete.value) {
    return shippingSectionRef.value?.querySelector('input[autocomplete="postal-code"]') ||
      shippingSectionRef.value
  }
  if (isPickup.value && !billingAddressComplete.value) {
    return shippingSectionRef.value?.querySelector('input[autocomplete="postal-code"]') ||
      shippingSectionRef.value
  }
  return null
}

async function scrollToFirstIncompleteSection() {
  await scrollToElement(getFirstIncompleteFieldEl(), { focus: true })
}

function clearPaymentErrors() {
  paymentError.value = ''
  cgvError.value = ''
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

function buildCartLinesPayload() {
  return cartMultiQuantity.value
    ? getCheckoutLines()
    : items.value.map((i) => ({ watchId: i.watchId, quantity: 1 }))
}

function normalizeCheckoutLines(lines) {
  return [...lines]
    .map((line) => ({
      watchId: String(line.watchId),
      quantity: Math.max(1, Number(line.quantity) || 1),
    }))
    .sort((a, b) => a.watchId.localeCompare(b.watchId))
}

function cartMatchesOrder(cartLines, orderLines) {
  const normalizedCart = normalizeCheckoutLines(cartLines)
  const normalizedOrder = normalizeCheckoutLines(orderLines)
  if (normalizedCart.length !== normalizedOrder.length) return false
  return normalizedCart.every(
    (line, index) =>
      line.watchId === normalizedOrder[index].watchId &&
      line.quantity === normalizedOrder[index].quantity,
  )
}

function resetPaymentState() {
  lastPaymentTotalCents = null
  lastClientSecret = null
  stripeReady.value = false
  if (paymentElement) {
    paymentElement.destroy()
    paymentElement = null
  }
  elementsInstance = null
}

function preloadStripe() {
  if (!STRIPE_PUBLISHABLE_KEY || stripePreloadPromise || stripeInstance) return
  stripePreloadPromise = loadStripe(STRIPE_PUBLISHABLE_KEY).then((instance) => {
    if (instance) stripeInstance = instance
    return instance
  })
}

async function ensureStripeInstance() {
  if (stripeInstance) return stripeInstance
  if (stripePreloadPromise) {
    stripeInstance = await stripePreloadPromise
    return stripeInstance
  }
  stripeInstance = await loadStripe(STRIPE_PUBLISHABLE_KEY)
  return stripeInstance
}

function canInitPayment() {
  return canShowPayment.value && (canSyncOrder.value || paymentSectionVisible.value)
}

async function maybeInitPayment() {
  if (!canInitPayment()) return
  await initPayment()
}

function setupPaymentSectionObserver() {
  const el = paymentSectionRef.value
  if (!el || !STRIPE_PUBLISHABLE_KEY || paymentSectionObserver) return
  paymentSectionObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        paymentSectionVisible.value = true
        maybeInitPayment()
      }
    },
    { rootMargin: '120px', threshold: 0.05 },
  )
  paymentSectionObserver.observe(el)
}

async function createOrderFromCart() {
  const lines = buildCartLinesPayload()
  if (!lines.length && !items.value.length) {
    router.replace('/collection')
    return false
  }

  const created = await createOrder({ lines })
  orderId.value = created.orderId || created.order?.id
  accessToken.value = created.accessToken
  orderSnapshot.value = created
  saveSession()
  return true
}

async function discardSavedOrder() {
  if (orderId.value && accessToken.value) {
    try {
      await cancelOrder(orderId.value, accessToken.value)
    } catch {
      /* ignore */
    }
  }
  clearSession()
  orderId.value = ''
  accessToken.value = ''
  orderSnapshot.value = null
  resetPaymentState()
}

function buildBillingAddress() {
  const addressSource = isPickup.value ? billingAddress.value : shippingAddress.value
  return {
    firstName: billing.value.firstName,
    lastName: billing.value.lastName,
    line1: addressSource.line1,
    line2: addressSource.line2,
    postalCode: addressSource.postalCode,
    city: addressSource.city,
    country: addressSource.country,
  }
}

function applyParsedAddress(target, parsed) {
  Object.assign(target, {
    line1: parsed.line1 || target.line1,
    line2: parsed.line2 ?? '',
    postalCode: parsed.postalCode || target.postalCode,
    city: parsed.city || target.city,
    country: parsed.country || target.country,
  })
}

function onShippingPlaceSelected(parsed) {
  applyParsedAddress(shippingAddress.value, parsed)
}

function onBillingPlaceSelected(parsed) {
  applyParsedAddress(billingAddress.value, parsed)
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

/**
 * Reprise d'une commande depuis un lien de relance panier abandonné
 * (`/checkout?order=…&token=…`, voir backend/orders/recovery.js). Le panier
 * local est remplacé par les lignes de la commande pour rester cohérent.
 * @returns {Promise<boolean>} true si la reprise a abouti (ou redirigé)
 */
async function resumeFromRecoveryLink() {
  const qOrder = typeof route.query.order === 'string' ? route.query.order : ''
  const qToken = typeof route.query.token === 'string' ? route.query.token : ''
  if (!qOrder || !qToken) return false

  orderId.value = qOrder
  accessToken.value = qToken
  try {
    await refreshOrder()
  } catch {
    orderId.value = ''
    accessToken.value = ''
    return false
  }

  const order = orderSnapshot.value?.order
  if (order?.status === 'paid') {
    router.replace({
      path: '/commande/succes',
      query: { order: qOrder, token: qToken },
    })
    return true
  }
  if (order?.status !== 'draft' && order?.status !== 'pending_payment') {
    orderId.value = ''
    accessToken.value = ''
    return false
  }

  replaceItems(
    (order.lines || []).map((line) => ({
      watchId: line.watchId,
      name: line.name,
      reference: line.reference ?? null,
      price: (Number(line.unitPriceCents) || 0) / 100,
      imageUrl: line.imageUrl ?? null,
      quantity: line.quantity,
    })),
  )
  saveSession()
  // Retire order/token de l'URL (le token ne doit pas traîner dans l'historique).
  router.replace({ path: '/checkout' })
  return true
}

async function ensureOrder() {
  if (await resumeFromRecoveryLink()) return

  const saved = loadSession()
  if (saved?.orderId && saved?.accessToken) {
    orderId.value = saved.orderId
    accessToken.value = saved.accessToken
    try {
      await refreshOrder()
      const order = orderSnapshot.value?.order
      if (order?.status === 'paid') {
        router.replace({
          path: '/commande/succes',
          query: { order: orderId.value, token: accessToken.value },
        })
        return
      }

      const cartLines = buildCartLinesPayload()
      const reusableStatus = order?.status === 'draft' || order?.status === 'pending_payment'
      const linesInSync = cartMatchesOrder(cartLines, order?.lines || [])

      if (reusableStatus && linesInSync) {
        return
      }

      await discardSavedOrder()
      await createOrderFromCart()
      return
    } catch {
      await discardSavedOrder()
    }
  }

  await createOrderFromCart()
}

async function updateOrderDetailsPartial() {
  orderSnapshot.value = await updateOrderCustomer(orderId.value, accessToken.value, {
    email: email.value.trim(),
    phone: phone.value.trim() || null,
    billingAddress: buildBillingAddress(),
    newsletterOptIn: newsletterOptIn.value,
  })
  orderSnapshot.value = await updateOrderShipping(
    orderId.value,
    accessToken.value,
    buildShippingPayload(),
  )
}

async function syncOrder() {
  if (!orderId.value || !accessToken.value || !canSyncOrder.value) return
  if (syncInFlight) {
    syncQueued = true
    return
  }
  syncInFlight = true
  syncLoading.value = true
  try {
    await updateOrderDetailsPartial()
    const total = quote.value?.totalCents
    if (canShowPayment.value) {
      if (stripeReady.value && total != null && total !== lastPaymentTotalCents) {
        await maybeInitPayment()
      } else if (!stripeReady.value && !paymentLoading.value) {
        await maybeInitPayment()
      }
    }
  } catch (e) {
    pageError.value = e.message || 'Erreur lors de la mise à jour de la commande'
  } finally {
    syncInFlight = false
    syncLoading.value = false
    if (syncQueued) {
      syncQueued = false
      scheduleSync()
    }
  }
}

function scheduleSync() {
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer)
  syncDebounceTimer = setTimeout(() => {
    syncDebounceTimer = null
    syncOrder()
  }, 1000)
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
  promoMessageType.value = ''
  pageError.value = ''
  if (!String(promoInput.value).trim()) {
    promoMessage.value = 'Saisissez un code promo'
    promoMessageType.value = 'error'
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
    promoMessageType.value = 'success'
    if (canShowPayment.value) {
      await maybeInitPayment()
    }
  } catch (e) {
    promoMessage.value = e.message || 'Code promo invalide'
    promoMessageType.value = 'error'
  } finally {
    promoLoading.value = false
  }
}

async function onRemovePromo() {
  promoLoading.value = true
  pageError.value = ''
  try {
    orderSnapshot.value = await removeOrderPromo(orderId.value, accessToken.value)
    promoInput.value = ''
    promoMessage.value = ''
    promoMessageType.value = ''
    if (canShowPayment.value) {
      await maybeInitPayment()
    }
  } catch (e) {
    pageError.value = e.message
  } finally {
    promoLoading.value = false
  }
}

async function initPayment() {
  if (!STRIPE_PUBLISHABLE_KEY || !canShowPayment.value) return
  if (paymentLoading.value) return

  const isFirstInit = !stripeReady.value
  if (isFirstInit) {
    paymentError.value = ''
    paymentLoading.value = true
  }
  try {
    const pay = await createOrderPayment(orderId.value, accessToken.value)
    const newTotal = pay.totalCents ?? quote.value?.totalCents
    const clientSecretChanged = pay.clientSecret !== lastClientSecret
    const totalChanged = newTotal != null && newTotal !== lastPaymentTotalCents

    stripeInstance = await ensureStripeInstance()
    if (!stripeInstance) {
      throw new Error('Impossible de charger Stripe')
    }

    const needsNewElements =
      !elementsInstance || !paymentElement || clientSecretChanged

    if (needsNewElements) {
      if (paymentElement) {
        paymentElement.destroy()
        paymentElement = null
      }
      elementsInstance = stripeInstance.elements({ clientSecret: pay.clientSecret })
      lastClientSecret = pay.clientSecret
    } else if (totalChanged && elementsInstance?.fetchUpdates) {
      await elementsInstance.fetchUpdates()
    }

    lastPaymentTotalCents = newTotal

    await nextTick()
    const mountEl = document.getElementById('payment-element')
    if (!mountEl) return

    if (!paymentElement || needsNewElements) {
      paymentElement = elementsInstance.create('payment')
      paymentElement.mount('#payment-element')
    }

    stripeReady.value = true
  } catch (e) {
    paymentError.value = e.message || 'Impossible de préparer le paiement'
    stripeReady.value = false
    await scrollToPaymentSection()
  } finally {
    if (isFirstInit) {
      paymentLoading.value = false
    }
  }
}

async function onConfirmPayment() {
  if (!stripeInstance || !elementsInstance) return
  clearPaymentErrors()

  if (!canConfirmPayment.value) {
    await scrollToFirstIncompleteSection()
    return
  }
  if (checkoutConfig.legal?.requireAcceptance && !cgvAccepted.value) {
    cgvError.value = 'Veuillez accepter les conditions générales pour continuer.'
    await scrollToPaymentSection({ focusCgv: true })
    return
  }

  paymentLoading.value = true
  paymentError.value = ''
  try {
    await updateOrderDetailsPartial()
    await initPayment()
    const returnUrl = `${window.location.origin}/commande/succes?order=${orderId.value}&token=${encodeURIComponent(accessToken.value)}`
    const { error: stripeError } = await stripeInstance.confirmPayment({
      elements: elementsInstance,
      confirmParams: { return_url: returnUrl },
    })
    if (stripeError) {
      paymentError.value = stripeError.message || 'Paiement refusé'
      await scrollToPaymentSection()
    }
  } catch (e) {
    paymentError.value = e.message || 'Erreur lors du paiement'
    await scrollToPaymentSection()
  } finally {
    paymentLoading.value = false
  }
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
  if (o.billingAddress?.line1) {
    Object.assign(billingAddress.value, {
      line1: o.billingAddress.line1 || '',
      line2: o.billingAddress.line2 || '',
      postalCode: o.billingAddress.postalCode || '',
      city: o.billingAddress.city || '',
      country: o.billingAddress.country || billingAddress.value.country,
    })
  }
}

function ensureValidFulfillmentMode() {
  if (fulfillmentMode.value === 'pickup' && !pickupMethodsAll.value.length) {
    fulfillmentMode.value = 'home'
  }
  if (fulfillmentMode.value === 'home' && !homeMethodsAll.value.length && pickupMethodsAll.value.length) {
    fulfillmentMode.value = 'pickup'
  }
  selectFirstMethodForMode(fulfillmentMode.value)
}

watch(pickupMethodsAll, () => {
  ensureValidFulfillmentMode()
  scheduleSync()
})

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
  [email, phone, billing, shippingAddress, billingAddress, selectedMethodId],
  () => {
    scheduleSync()
  },
  { deep: true },
)

watch(cgvAccepted, (accepted) => {
  if (accepted) cgvError.value = ''
})

watch(promoInput, () => {
  if (promoMessageType.value === 'error') {
    promoMessage.value = ''
    promoMessageType.value = ''
  }
})

watch(canSyncOrder, (ready) => {
  if (ready) maybeInitPayment()
})

onMounted(async () => {
  preloadStripe()

  if (!shippingMethods.length) {
    pageError.value = 'Configuration livraison manquante'
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

    if (o?.billingAddress?.line1 && !o?.shippingAddress && pickupMethodsAll.value.length) {
      fulfillmentMode.value = 'pickup'
    } else if (o?.shippingAddress || (pickupEnabled && pickupMethodsAll.value.length === shippingMethods.length)) {
      const hasPickupOnly = pickupMethodsAll.value.length && !homeMethodsAll.value.length
      fulfillmentMode.value = hasPickupOnly ? 'pickup' : 'home'
    }

    ensureValidFulfillmentMode()
    if (!selectedMethodId.value) {
      selectedMethodId.value = shippingMethods[0]?.id || ''
    }
  } catch (e) {
    pageError.value = e.message
  } finally {
    loading.value = false
  }

  await nextTick()
  setupPaymentSectionObserver()

  if (canSyncOrder.value) {
    void syncOrder()
  }
})

onUnmounted(() => {
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer)
  paymentSectionObserver?.disconnect()
  paymentSectionObserver = null
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

      <p v-if="pageError" class="mb-4 text-sm text-red-600" role="alert">{{ pageError }}</p>

      <div
        v-if="loading"
        class="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-10 items-start animate-pulse"
        aria-busy="true"
        aria-label="Préparation de la commande"
      >
        <div class="order-1 lg:order-2">
          <aside class="bg-white rounded-lg shadow-sm border border-gray-200/80 p-6 space-y-6">
            <ul v-if="items.length" class="space-y-4">
              <li v-for="item in items" :key="item.watchId" class="flex gap-3">
                <div class="relative shrink-0">
                  <div
                    class="h-16 w-16 overflow-hidden rounded-lg bg-gray-200 border border-gray-100"
                  />
                  <span
                    class="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-300 px-1 text-xs font-medium text-white"
                  >
                    {{ item.quantity || 1 }}
                  </span>
                </div>
                <div class="min-w-0 flex-1 flex justify-between gap-2">
                  <div class="min-w-0 space-y-2 flex-1">
                    <div class="h-4 bg-gray-200 rounded w-4/5" />
                    <div class="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                  <div class="h-4 w-16 bg-gray-200 rounded shrink-0" />
                </div>
              </li>
            </ul>
            <div v-else class="space-y-4">
              <div v-for="n in 2" :key="n" class="flex gap-3">
                <div class="h-16 w-16 rounded-lg bg-gray-200 shrink-0" />
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-gray-200 rounded w-3/4" />
                  <div class="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
            <div class="h-10 bg-gray-100 rounded-lg" />
            <div class="border-t border-gray-200 pt-4 space-y-3">
              <div v-for="n in 4" :key="n" class="flex justify-between gap-4">
                <div class="h-4 bg-gray-100 rounded w-24" />
                <div class="h-4 bg-gray-200 rounded w-16" />
              </div>
              <div class="flex justify-between items-baseline pt-2">
                <div class="h-6 bg-gray-200 rounded w-16" />
                <div class="h-6 bg-gray-300 rounded w-24" />
              </div>
            </div>
          </aside>
        </div>

        <div class="order-2 lg:order-1 space-y-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200/80 p-6 space-y-8">
            <section class="space-y-4">
              <div class="h-6 bg-gray-200 rounded w-24" />
              <div class="h-10 bg-gray-100 rounded-lg" />
              <div class="grid sm:grid-cols-2 gap-4">
                <div class="h-10 bg-gray-100 rounded-lg" />
                <div class="h-10 bg-gray-100 rounded-lg" />
              </div>
              <div class="h-10 bg-gray-100 rounded-lg" />
            </section>
            <section class="space-y-4">
              <div class="h-6 bg-gray-200 rounded w-28" />
              <div class="h-10 bg-gray-100 rounded-lg" />
              <div class="h-10 bg-gray-100 rounded-lg" />
              <div class="grid sm:grid-cols-3 gap-4">
                <div class="h-10 bg-gray-100 rounded-lg" />
                <div class="sm:col-span-2 h-10 bg-gray-100 rounded-lg" />
              </div>
            </section>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200/80 p-6 space-y-4">
            <div class="h-6 bg-gray-200 rounded w-20" />
            <div class="h-24 bg-gray-100 rounded-lg" />
            <div class="h-12 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>

      <div
        v-else-if="orderLines.length"
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
            :promo-message-type="promoMessageType"
            :promo-loading="promoLoading || syncLoading"
            :shipping-quote-ready="shippingQuoteReady"
            :shipping-pending-label="shippingPendingLabel"
            :shipping-line-label="shippingLineLabel"
            :vat-rate="vatRate"
            @apply-promo="onApplyPromo"
            @remove-promo="onRemovePromo"
          />
        </div>

        <!-- Formulaire -->
        <div class="order-2 lg:order-1 space-y-6">
          <form class="bg-white rounded-lg shadow-sm border border-gray-200/80 p-6 space-y-8">
            <section ref="contactSectionRef" class="space-y-4">
              <h2 class="font-semibold text-lg text-gray-900">Contact</h2>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  v-model="email"
                  type="email"
                  required
                  autocomplete="email"
                  placeholder="Adresse e-mail"
                  :class="CHECKOUT_FIELD_CLASS"
                />
              </div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input
                    v-model="billing.firstName"
                    required
                    autocomplete="given-name"
                    placeholder="Jean"
                    :class="CHECKOUT_FIELD_CLASS"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    v-model="billing.lastName"
                    required
                    autocomplete="family-name"
                    placeholder="Dupont"
                    :class="CHECKOUT_FIELD_CLASS"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  v-model="phone"
                  type="tel"
                  autocomplete="tel"
                  placeholder="06 12 34 56 78"
                  :class="CHECKOUT_FIELD_CLASS"
                />
              </div>

              <label
                v-if="site.features.newsletter"
                class="flex items-start gap-2 text-sm text-gray-600 cursor-pointer"
              >
                <input v-model="newsletterOptIn" type="checkbox" class="mt-1 shrink-0" />
                <span>
                  Je souhaite recevoir la newsletter (nouveautés et offres par email).
                  Désinscription possible à tout moment.
                </span>
              </label>
            </section>

            <section ref="shippingSectionRef" class="space-y-4">
              <h2 class="font-semibold text-lg text-gray-900">
                {{ isPickup ? 'Retrait en boutique' : 'Livraison' }}
              </h2>

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
                  <Package class="h-5 w-5" :stroke-width="1.5" />
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
                  <MapPin class="h-5 w-5" :stroke-width="1.5" />
                  Retrait
                </button>
              </div>

              <template v-if="isHomeDelivery">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Pays *</label>
                  <select
                    v-model="shippingAddress.country"
                    :class="CHECKOUT_FIELD_CLASS"
                  >
                    <option
                      v-for="code in allowedShippingCountries"
                      :key="code"
                      :value="code"
                    >
                      {{ countryLabel(code) }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                  <AddressAutocompleteInput
                    v-model="shippingAddress.line1"
                    :countries="allowedShippingCountries"
                    :enabled="isHomeDelivery"
                    placeholder="12 rue de la Paix"
                    @place-selected="onShippingPlaceSelected"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Complément d’adresse</label
                  >
                  <input
                    v-model="shippingAddress.line2"
                    autocomplete="address-line2"
                    placeholder="Appartement, bâtiment…"
                    :class="CHECKOUT_FIELD_CLASS"
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
                      placeholder="75001"
                      :class="CHECKOUT_FIELD_CLASS"
                    />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                    <input
                      v-model="shippingAddress.city"
                      required
                      autocomplete="address-level2"
                      placeholder="Paris"
                      :class="CHECKOUT_FIELD_CLASS"
                    />
                  </div>
                </div>
              </template>

              <template v-else-if="isPickup">
                <PickupLocationCard
                  v-if="selectedMethod?.pickupLocation"
                  :name="selectedMethod.pickupLocation.name"
                  :address="selectedMethod.pickupLocation.address"
                  :estimated-days="selectedMethod.estimatedDays"
                />

                <div class="space-y-4 pt-2">
                  <h3 class="font-medium text-gray-900">Adresse de facturation</h3>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Pays *</label>
                    <select v-model="billingAddress.country" :class="CHECKOUT_FIELD_CLASS">
                      <option
                        v-for="code in allowedShippingCountries"
                        :key="code"
                        :value="code"
                      >
                        {{ countryLabel(code) }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                    <AddressAutocompleteInput
                      v-model="billingAddress.line1"
                      :countries="allowedShippingCountries"
                      :enabled="isPickup"
                      placeholder="12 rue de la Paix"
                      @place-selected="onBillingPlaceSelected"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"
                      >Complément d’adresse</label
                    >
                    <input
                      v-model="billingAddress.line2"
                      autocomplete="address-line2"
                      placeholder="Appartement, bâtiment…"
                      :class="CHECKOUT_FIELD_CLASS"
                    />
                  </div>
                  <div class="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1"
                        >Code postal *</label
                      >
                      <input
                        v-model="billingAddress.postalCode"
                        required
                        autocomplete="postal-code"
                        placeholder="75001"
                        :class="CHECKOUT_FIELD_CLASS"
                      />
                    </div>
                    <div class="sm:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                      <input
                        v-model="billingAddress.city"
                        required
                        autocomplete="address-level2"
                        placeholder="Paris"
                        :class="CHECKOUT_FIELD_CLASS"
                      />
                    </div>
                  </div>
                </div>
              </template>
            </section>

            <section v-if="showShippingMethodSection" class="space-y-4">
              <h2 class="font-semibold text-lg text-gray-900">Mode d’expédition</h2>

              <p
                v-if="isHomeDelivery && !shippingAddressComplete"
                class="flex items-start gap-2 text-sm text-gray-500"
              >
                <Info class="h-4 w-4 shrink-0 mt-0.5" :stroke-width="1.5" aria-hidden="true" />
                <span
                  >Saisissez votre adresse d’expédition pour voir les modes d’expédition
                  disponibles.</span
                >
              </p>

              <div
                v-else-if="isPickup && !billingAddressComplete"
                class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              >
                Complétez votre adresse de facturation pour finaliser le retrait en boutique.
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
                  class="block cursor-pointer transition-colors"
                  :class="
                    method.type === 'pickup'
                      ? selectedMethodId === method.id
                        ? 'rounded-xl ring-2 ring-primary ring-offset-2'
                        : 'rounded-xl'
                      : ''
                  "
                >
                  <div
                    v-if="method.type === 'pickup' && method.pickupLocation"
                    class="flex items-start gap-3"
                  >
                    <input
                      v-model="selectedMethodId"
                      type="radio"
                      :value="method.id"
                      class="mt-5 shrink-0"
                    />
                    <PickupLocationCard
                      class="flex-1 min-w-0"
                      :name="method.pickupLocation.name"
                      :address="method.pickupLocation.address"
                      :estimated-days="method.estimatedDays"
                    />
                  </div>
                  <div
                    v-else
                    class="flex items-start gap-3 p-3 border rounded-lg transition-colors"
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
                    </span>
                  </div>
                </label>
              </div>
            </section>
          </form>

          <section
            ref="paymentSectionRef"
            class="bg-white rounded-lg shadow-sm border border-gray-200/80 p-6 space-y-4"
          >
            <div>
              <h2 class="font-semibold text-lg text-gray-900">Paiement</h2>
              <p class="text-sm text-gray-500 mt-1">
                Toutes les transactions sont sécurisées et chiffrées.
              </p>
            </div>

            <p
              v-if="!canConfirmPayment"
              class="text-sm text-gray-500"
            >
              Complétez vos informations de livraison pour afficher le montant final.
              <button
                type="button"
                class="ml-1 text-primary underline font-medium"
                @click="scrollToFirstIncompleteSection"
              >
                Compléter mes informations
              </button>
            </p>

            <div v-if="checkoutConfig.legal?.requireAcceptance" class="space-y-1">
              <label
                class="flex items-start gap-2 text-sm rounded-lg p-2 -m-2 transition-colors"
                :class="
                  cgvError
                    ? 'ring-2 ring-red-400 bg-red-50'
                    : ''
                "
              >
                <input
                  ref="cgvInputRef"
                  v-model="cgvAccepted"
                  type="checkbox"
                  class="mt-1 rounded"
                  :aria-invalid="cgvError ? 'true' : 'false'"
                  :aria-describedby="cgvError ? 'cgv-error' : undefined"
                />
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
              <p
                v-if="cgvError"
                id="cgv-error"
                class="text-sm text-red-600"
                role="alert"
              >
                {{ cgvError }}
              </p>
            </div>

            <div
              v-if="paymentLoading && !stripeReady"
              class="text-sm text-gray-500 py-6 text-center"
            >
              Préparation du paiement sécurisé…
            </div>
            <div id="payment-element" class="min-h-[120px]" />

            <div
              v-if="paymentError"
              class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
              aria-live="polite"
            >
              {{ paymentError }}
            </div>

            <button
              type="button"
              :disabled="paymentLoading || !stripeReady"
              class="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
              @click="onConfirmPayment"
            >
              <span v-if="paymentLoading">Traitement…</span>
              <span v-else>Payer {{ quote ? formatPrice(quote.totalCents) : '' }}</span>
            </button>

            <LegalPageLinks variant="checkout" />
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
