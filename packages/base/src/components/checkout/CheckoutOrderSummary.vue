<script setup>
import { computed } from 'vue'

const props = defineProps({
  orderLines: { type: Array, default: () => [] },
  quote: { type: Object, default: null },
  promoEnabled: { type: Boolean, default: true },
  promoInput: { type: String, default: '' },
  promoMessage: { type: String, default: '' },
  promoMessageType: { type: String, default: '' },
  promoLoading: { type: Boolean, default: false },
  shippingQuoteReady: { type: Boolean, default: false },
  vatRate: { type: Number, default: 20 },
})

const emit = defineEmits(['update:promoInput', 'apply-promo', 'remove-promo'])

function formatPrice(cents) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    (cents || 0) / 100,
  )
}

const taxCents = computed(() => {
  const total = props.quote?.totalCents ?? 0
  if (total <= 0) return 0
  const rate = props.vatRate > 0 ? props.vatRate : 20
  return total - Math.round(total / (1 + rate / 100))
})

const shippingLabel = computed(() => {
  if (!props.shippingQuoteReady) {
    return null
  }
  const cents = props.quote?.shippingCents ?? 0
  if (cents === 0) return 'Gratuite'
  return formatPrice(cents)
})
</script>

<template>
  <aside class="bg-white rounded-lg shadow-sm border border-gray-200/80 p-6 space-y-6">
    <ul v-if="orderLines.length" class="space-y-4">
      <li
        v-for="line in orderLines"
        :key="line.watchId"
        class="flex gap-3"
      >
        <div class="relative shrink-0">
          <div
            class="h-16 w-16 overflow-hidden rounded-lg bg-cream-100 flex items-center justify-center border border-gray-100"
          >
            <img
              v-if="line.imageUrl"
              :src="line.imageUrl"
              :alt="line.name"
              class="h-full w-full object-cover"
            />
            <svg
              v-else
              class="h-7 w-7 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span
            class="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-white"
          >
            {{ line.quantity }}
          </span>
        </div>
        <div class="min-w-0 flex-1 flex justify-between gap-2">
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
              {{ line.name }}
            </p>
            <p v-if="line.reference" class="text-xs text-gray-500 mt-0.5">
              Réf. {{ line.reference }}
            </p>
          </div>
          <p class="text-sm font-medium text-gray-900 whitespace-nowrap shrink-0">
            {{ formatPrice(line.unitPriceCents * line.quantity) }}
          </p>
        </div>
      </li>
    </ul>

    <div v-if="promoEnabled" class="flex gap-2">
      <input
        :value="promoInput"
        type="text"
        placeholder="Code de réduction"
        class="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase"
        @input="emit('update:promoInput', $event.target.value)"
      />
      <button
        type="button"
        class="shrink-0 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
        :disabled="promoLoading"
        @click="emit('apply-promo')"
      >
        Valider
      </button>
    </div>
    <p
      v-if="promoMessage"
      class="text-xs -mt-4"
      :class="
        promoMessageType === 'success'
          ? 'text-green-700'
          : 'text-gray-500'
      "
    >
      {{ promoMessage }}
    </p>
    <button
      v-if="quote?.discountCents > 0"
      type="button"
      class="text-sm text-gray-600 underline -mt-4"
      @click="emit('remove-promo')"
    >
      Retirer le code
    </button>

    <div v-if="quote" class="border-t border-gray-200 pt-4 space-y-2 text-sm">
      <div class="flex justify-between text-gray-700">
        <span>Sous-total</span>
        <span>{{ formatPrice(quote.subtotalCents) }}</span>
      </div>
      <div class="flex justify-between text-gray-700 gap-4">
        <span>Expédition</span>
        <span
          class="text-right"
          :class="shippingQuoteReady ? 'text-gray-900' : 'text-gray-500 text-xs max-w-[10rem]'"
        >
          {{ shippingQuoteReady ? shippingLabel : "Saisir une adresse d'expédition" }}
        </span>
      </div>
      <div
        v-if="quote.discountCents > 0"
        class="flex justify-between text-green-700"
      >
        <span>Remise</span>
        <span>-{{ formatPrice(quote.discountCents) }}</span>
      </div>
      <div class="flex justify-between items-baseline pt-2">
        <span class="text-lg font-semibold text-gray-900">Total</span>
        <span class="text-lg font-semibold text-gray-900">
          EUR {{ formatPrice(quote.totalCents) }}
        </span>
      </div>
      <p v-if="quote.totalCents > 0" class="text-xs text-gray-500 text-right">
        Taxes de {{ formatPrice(taxCents) }} incluses
      </p>
    </div>
  </aside>
</template>
