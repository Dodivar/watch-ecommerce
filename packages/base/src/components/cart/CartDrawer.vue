<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Clock, X } from '@lucide/vue'
import { useCart } from '@/composables/useCart.js'
import { useRouter } from 'vue-router'

const {
  items,
  itemCount,
  totalPrice,
  remove,
  incrementQuantity,
  decrementQuantity,
  drawerOpen,
  closeDrawer,
  getWatchIds,
  getCheckoutLines,
  cartMultiQuantity,
} = useCart()

function lineQty(line) {
  const q = Number(line?.quantity)
  if (!Number.isFinite(q) || q < 1) return 1
  return Math.min(99, Math.floor(q))
}

const router = useRouter()
const checkoutError = ref('')
const isCheckingOut = ref(false)

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value) || 0)
}

function onOverlayClick() {
  closeDrawer()
}

function watchPath(watchId) {
  return `/watch/${watchId}`
}

function onLineNavigate() {
  closeDrawer()
}

function onEscape(e) {
  if (e.key === 'Escape' && drawerOpen.value) {
    closeDrawer()
  }
}

watch(drawerOpen, (open) => {
  if (open) {
    checkoutError.value = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', onEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onEscape)
})

function onCheckout() {
  const ids = getWatchIds()
  if (ids.length === 0) {
    return
  }
  checkoutError.value = ''
  isCheckingOut.value = true
  closeDrawer()
  router.push('/checkout').finally(() => {
    isCheckingOut.value = false
  })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-show="drawerOpen"
      class="fixed inset-0 z-[100] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      <div
        class="scrim absolute inset-0 transition-opacity"
        aria-hidden="true"
        @click="onOverlayClick"
      />
      <aside
        class="relative flex h-full w-full max-w-full flex-col bg-white shadow-2xl sm:max-w-md md:min-w-[380px] md:max-w-lg lg:min-w-[420px] lg:max-w-xl xl:min-w-[460px] xl:max-w-2xl animate-cart-drawer-in"
      >
        <header class="flex shrink-0 items-center justify-between gap-3 border-b border-border-subtle px-4 py-4">
          <div>
            <h2 id="cart-drawer-title" class="text-lg font-semibold text-text-main">
              Mon panier
            </h2>
            <p class="text-sm text-subtle">
              {{ itemCount }} article{{ itemCount > 1 ? 's' : '' }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg p-2 text-muted hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Fermer le panier"
            @click="closeDrawer"
          >
            <X class="h-6 w-6" :stroke-width="2" />          </button>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
          <p v-if="itemCount === 0" class="text-center text-subtle py-12">
            Votre panier est vide.
          </p>
          <ul v-else class="space-y-4">
            <li
              v-for="line in items"
              :key="line.watchId"
              class="flex gap-3 border-b border-border-subtle pb-4"
            >
              <router-link
                :to="watchPath(line.watchId)"
                class="h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-cream-100 flex items-center justify-center sm:h-32 sm:w-32 focus:outline-none focus:ring-2 focus:ring-primary hover:opacity-90 transition-opacity"
                :aria-label="'Voir ' + line.name"
                @click="onLineNavigate"
              >
                <img
                  v-if="line.imageUrl"
                  :src="line.imageUrl"
                  :alt="line.name"
                  class="h-full w-full object-cover"
                />
                <Clock v-else class="h-8 w-8 text-subtle" :stroke-width="1.5" />              </router-link>
              <div class="min-w-0 flex-1">
                <div class="flex justify-between gap-2">
                  <router-link
                    :to="watchPath(line.watchId)"
                    class="font-medium text-text-main leading-snug line-clamp-2 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
                    @click="onLineNavigate"
                  >
                    {{ line.name }}
                  </router-link>
                  <button
                    type="button"
                    class="shrink-0 rounded p-1 text-subtle hover:text-red-600 hover:bg-red-50"
                    :aria-label="'Retirer ' + line.name"
                    @click="remove(line.watchId)"
                  >
                    <X class="h-5 w-5" :stroke-width="2" />                  </button>
                </div>
                <p v-if="line.reference" class="text-xs text-subtle mt-0.5">
                  Réf. {{ line.reference }}
                </p>
                <div
                  v-if="cartMultiQuantity"
                  class="mt-3 inline-flex items-center rounded-lg border border-border-subtle bg-cream-100/60 p-0.5"
                >
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-md text-lg font-medium text-text-main hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40"
                    aria-label="Diminuer la quantité"
                    :disabled="lineQty(line) <= 1"
                    @click="decrementQuantity(line.watchId)"
                  >
                    −
                  </button>
                  <span class="min-w-[2.25rem] text-center text-sm font-semibold tabular-nums text-text-main">
                    {{ lineQty(line) }}
                  </span>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-md text-lg font-medium text-text-main hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Augmenter la quantité"
                    @click="incrementQuantity(line.watchId)"
                  >
                    +
                  </button>
                </div>
                <div class="mt-2 space-y-0.5">
                  <p
                    v-if="cartMultiQuantity && lineQty(line) > 1"
                    class="text-xs text-subtle"
                  >
                    {{ formatPrice(line.price) }} × {{ lineQty(line) }}
                  </p>
                  <p class="text-sm font-semibold text-primary lg:text-base">
                    {{ formatPrice(line.price * lineQty(line)) }}
                  </p>
                </div>
              </div>
            </li>
          </ul>
        </div>

        <footer
          class="shrink-0 border-t border-border-subtle bg-white px-4 py-4 space-y-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
        >
          <p v-if="checkoutError" class="text-sm text-red-600">
            {{ checkoutError }}
          </p>
          <div
            class="flex justify-between text-sm text-muted"
            role="region"
            aria-label="Livraison"
          >
            <span>Livraison</span>
            <span class="font-medium text-text-main">Gratuite</span>
          </div>
          <div class="flex justify-between text-sm text-muted">
            <span>Sous-total</span>
            <span class="font-medium text-text-main">{{ formatPrice(totalPrice) }}</span>
          </div>
          <div class="flex justify-between text-base font-semibold text-text-main">
            <span>Total</span>
            <span>{{ formatPrice(totalPrice) }}</span>
          </div>
          <p class="text-xs text-subtle text-center">Paiement 100% sécurisé via Stripe</p>
          <button
            type="button"
            class="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-lg text-base font-semibold text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="itemCount === 0 || isCheckingOut"
            @click="onCheckout"
          >
            <span v-if="isCheckingOut">Redirection…</span>
            <span v-else>Commander</span>
          </button>
        </footer>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes cart-drawer-slide-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.animate-cart-drawer-in {
  animation: cart-drawer-slide-in 0.25s ease-out;
}
</style>
