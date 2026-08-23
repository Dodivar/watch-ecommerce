<script setup>
import { computed, ref, watch } from 'vue'
import { ExternalLink, Copy, Check } from '@lucide/vue'
import { STRIPE_PUBLISHABLE_KEY } from '@/config'
import { updateOrderReturn } from '@/services/admin/adminOrderService'
import {
  RETURN_STATUSES,
  RETURN_STATUS_LABELS,
  WITHDRAWAL_PERIOD_DAYS,
  computeRefundDeadline,
  computeWithdrawalWindow,
  stripePaymentDashboardUrl,
} from '@/services/admin/orderReturns'
import { useAdminPermissions } from '@/services/admin/useAdminPermissions'

const props = defineProps({
  /** Commande mappée par `adminOrderService` (mapOrderRow). */
  order: { type: Object, required: true },
})

const emit = defineEmits(['updated'])

const { canWrite } = useAdminPermissions()

const returnStatus = ref('none')
const deliveredAt = ref('')
const returnRequestedAt = ref('')
const refundAmountEuros = ref('')
const refundedAt = ref('')
const stripeRefundId = ref('')
const returnNotes = ref('')

const isSaving = ref(false)
const error = ref(null)
const success = ref(null)
const copied = ref(false)

/** `Date`/ISO vers la valeur d'un `<input type="date">`, en heure locale. */
function toDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Valeur d'un `<input type="date">` vers ISO. On vise midi local : la date
 * saisie reste la même quel que soit le fuseau de relecture.
 */
function fromDateInput(value) {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day, 12, 0, 0).toISOString()
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatPrice(cents) {
  if (cents == null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function syncFromOrder(order) {
  returnStatus.value = order?.returnStatus || 'none'
  deliveredAt.value = toDateInput(order?.deliveredAt)
  returnRequestedAt.value = toDateInput(order?.returnRequestedAt)
  refundAmountEuros.value =
    order?.refundAmountCents != null ? (order.refundAmountCents / 100).toFixed(2) : ''
  refundedAt.value = toDateInput(order?.refundedAt)
  stripeRefundId.value = order?.stripeRefundId || ''
  returnNotes.value = order?.returnNotes || ''
}

watch(() => props.order, syncFromOrder, { immediate: true })

const today = () => toDateInput(new Date())

// Passer un dossier à l'étape suivante pré-remplit la date correspondante :
// c'est la saisie attendue dans la quasi-totalité des cas, et elle reste
// modifiable.
watch(returnStatus, (status, previous) => {
  if (status === previous) return
  if (status !== 'none' && !returnRequestedAt.value) {
    returnRequestedAt.value = today()
  }
  if (status === 'refunded') {
    if (!refundedAt.value) refundedAt.value = today()
    if (!refundAmountEuros.value && props.order?.totalCents != null) {
      refundAmountEuros.value = (props.order.totalCents / 100).toFixed(2)
    }
  }
})

const withdrawalWindow = computed(() =>
  computeWithdrawalWindow(
    { deliveredAt: props.order?.deliveredAt, paidAt: props.order?.paidAt },
    new Date(),
  ),
)

const withdrawalLabel = computed(() => {
  const window = withdrawalWindow.value
  if (!window) return null
  if (window.isOpen) {
    const days = window.daysLeft
    return `Rétractation possible jusqu'au ${formatDate(window.deadline)} — ${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`
  }
  return `Délai de rétractation expiré depuis le ${formatDate(window.deadline)}`
})

const refundDeadline = computed(() => computeRefundDeadline(props.order?.returnRequestedAt))

const isRefundPending = computed(
  () => ['requested', 'received'].includes(props.order?.returnStatus) && !props.order?.refundedAt,
)

const stripeUrl = computed(() =>
  stripePaymentDashboardUrl(props.order?.stripePaymentIntentId, {
    testMode: STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_'),
  }),
)

const showRefundFields = computed(() => returnStatus.value !== 'none')

async function copyPaymentIntentId() {
  const value = props.order?.stripePaymentIntentId
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    copied.value = false
  }
}

function fillFullRefund() {
  if (props.order?.totalCents == null) return
  refundAmountEuros.value = (props.order.totalCents / 100).toFixed(2)
}

function parseAmountCents() {
  const raw = String(refundAmountEuros.value).trim().replace(',', '.')
  if (!raw) return null
  const euros = Number(raw)
  if (!Number.isFinite(euros)) return Number.NaN
  return Math.round(euros * 100)
}

async function save() {
  error.value = null
  success.value = null

  const refundAmountCents = parseAmountCents()
  if (Number.isNaN(refundAmountCents)) {
    error.value = 'Montant remboursé invalide'
    return
  }

  try {
    isSaving.value = true
    await updateOrderReturn(
      props.order.id,
      {
        returnStatus: returnStatus.value,
        deliveredAt: fromDateInput(deliveredAt.value),
        returnRequestedAt: fromDateInput(returnRequestedAt.value),
        refundAmountCents,
        refundedAt: fromDateInput(refundedAt.value),
        stripeRefundId: stripeRefundId.value,
        returnNotes: returnNotes.value,
      },
      { totalCents: props.order?.totalCents },
    )
    success.value = 'Dossier retour mis à jour'
    emit('updated')
  } catch (err) {
    error.value = err.message || 'Enregistrement impossible'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <section class="bg-white rounded-lg shadow p-6">
    <h2 class="text-lg font-semibold mb-1">Retour &amp; remboursement</h2>
    <p class="text-sm text-gray-500 mb-4">
      Droit de rétractation de {{ WITHDRAWAL_PERIOD_DAYS }} jours à compter de la réception
      (art. L221-18). Le remboursement doit couvrir la commande et les frais de livraison
      standard.
    </p>

    <div
      v-if="withdrawalLabel"
      class="rounded-lg border px-4 py-3 mb-4 text-sm"
      :class="
        withdrawalWindow.isOpen
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-gray-200 bg-gray-50 text-gray-600'
      "
      data-testid="withdrawal-window"
    >
      <p class="font-medium">{{ withdrawalLabel }}</p>
      <p v-if="withdrawalWindow.isProvisional" class="mt-1 text-xs">
        Calculé depuis la date de paiement : renseignez la date de réception pour obtenir la
        vraie échéance.
      </p>
    </div>

    <div
      v-if="refundDeadline && isRefundPending"
      class="rounded-lg border px-4 py-3 mb-4 text-sm"
      :class="
        refundDeadline.isOverdue
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-blue-200 bg-blue-50 text-blue-800'
      "
      data-testid="refund-deadline"
    >
      <span v-if="refundDeadline.isOverdue">
        Remboursement en retard : il était dû le {{ formatDate(refundDeadline.deadline) }}.
      </span>
      <span v-else>
        À rembourser avant le {{ formatDate(refundDeadline.deadline) }}
        ({{ refundDeadline.daysLeft }} jour(s)).
      </span>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
      {{ error }}
    </div>
    <div
      v-if="success"
      class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4"
    >
      {{ success }}
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label class="block text-sm">
        <span class="font-medium text-gray-700">Date de réception par le client</span>
        <input
          v-model="deliveredAt"
          type="date"
          :disabled="!canWrite"
          class="mt-1 w-full px-3 py-2 border rounded-lg disabled:opacity-60"
        />
      </label>

      <label class="block text-sm">
        <span class="font-medium text-gray-700">Statut du retour</span>
        <select
          v-model="returnStatus"
          :disabled="!canWrite"
          class="mt-1 w-full px-3 py-2 border rounded-lg disabled:opacity-60"
        >
          <option v-for="status in RETURN_STATUSES" :key="status" :value="status">
            {{ RETURN_STATUS_LABELS[status] }}
          </option>
        </select>
      </label>

      <label v-if="showRefundFields" class="block text-sm">
        <span class="font-medium text-gray-700">Date de la demande de rétractation</span>
        <input
          v-model="returnRequestedAt"
          type="date"
          :disabled="!canWrite"
          class="mt-1 w-full px-3 py-2 border rounded-lg disabled:opacity-60"
        />
      </label>
    </div>

    <template v-if="showRefundFields">
      <div class="mt-6 rounded-lg border border-gray-200 bg-cream/40 p-4">
        <p class="text-sm font-medium text-gray-800">
          Le remboursement se fait depuis le dashboard Stripe
        </p>
        <p class="text-sm text-gray-600 mt-1">
          Aucun remboursement n'est déclenché par l'administration : remboursez le paiement dans
          Stripe, puis notez ci-dessous le montant et l'identifiant obtenus.
        </p>

        <div v-if="stripeUrl" class="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
          <a
            :href="stripeUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
            data-testid="stripe-link"
          >
            <ExternalLink class="h-4 w-4" />
            Ouvrir le paiement dans Stripe
          </a>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            @click="copyPaymentIntentId"
          >
            <component :is="copied ? Check : Copy" class="h-4 w-4" />
            {{ copied ? 'Copié' : "Copier l'ID de paiement" }}
          </button>
          <code class="text-xs text-gray-500 break-all">{{ order.stripePaymentIntentId }}</code>
        </div>
        <p v-else class="mt-3 text-sm text-gray-500">
          Aucun paiement Stripe rattaché à cette commande : retrouvez la transaction dans le
          dashboard à partir de l'email du client.
        </p>
      </div>

      <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label class="block text-sm">
          <span class="font-medium text-gray-700">Montant remboursé (€)</span>
          <input
            v-model="refundAmountEuros"
            type="number"
            min="0"
            step="0.01"
            inputmode="decimal"
            :disabled="!canWrite"
            class="mt-1 w-full px-3 py-2 border rounded-lg disabled:opacity-60"
          />
          <button
            v-if="canWrite && order.totalCents != null"
            type="button"
            class="mt-1 text-xs text-primary underline"
            @click="fillFullRefund"
          >
            Rembourser le total ({{ formatPrice(order.totalCents) }})
          </button>
        </label>

        <label class="block text-sm">
          <span class="font-medium text-gray-700">Identifiant Stripe</span>
          <input
            v-model="stripeRefundId"
            type="text"
            placeholder="re_…"
            :disabled="!canWrite"
            class="mt-1 w-full px-3 py-2 border rounded-lg disabled:opacity-60"
          />
        </label>

        <label class="block text-sm">
          <span class="font-medium text-gray-700">Date du remboursement</span>
          <input
            v-model="refundedAt"
            type="date"
            :disabled="!canWrite"
            class="mt-1 w-full px-3 py-2 border rounded-lg disabled:opacity-60"
          />
        </label>
      </div>

      <label class="block text-sm mt-4">
        <span class="font-medium text-gray-700">Notes internes</span>
        <textarea
          v-model="returnNotes"
          rows="3"
          :disabled="!canWrite"
          placeholder="Motif, état du produit, échanges avec le client…"
          class="mt-1 w-full px-3 py-2 border rounded-lg disabled:opacity-60"
        ></textarea>
      </label>
    </template>

    <div v-if="canWrite" class="mt-4">
      <button
        type="button"
        class="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
        :disabled="isSaving"
        @click="save"
      >
        {{ isSaving ? 'Enregistrement…' : 'Enregistrer le dossier retour' }}
      </button>
    </div>
  </section>
</template>
