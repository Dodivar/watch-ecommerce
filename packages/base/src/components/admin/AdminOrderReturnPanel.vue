<script setup>
import { computed, ref, watch } from 'vue'
import { ExternalLink, RotateCcw, TriangleAlert } from '@lucide/vue'
import { STRIPE_PUBLISHABLE_KEY } from '@/config'
import { getOrderRefunds, refundOrder, updateOrderReturn } from '@/services/admin/adminOrderService'
import {
  REFUND_SOURCE_LABELS,
  REFUND_STATUS_LABELS,
  RETURN_STATUSES,
  RETURN_STATUS_LABELS,
  WITHDRAWAL_PERIOD_DAYS,
  canRefundOrder,
  computeRefundDeadline,
  computeWithdrawalWindow,
  stripePaymentDashboardUrl,
  summarizeRefunds,
} from '@/services/admin/orderReturns'
import { useAdminPermissions } from '@/services/admin/useAdminPermissions'

const props = defineProps({
  /** Commande mappée par `adminOrderService` (mapOrderRow). */
  order: { type: Object, required: true },
})

const emit = defineEmits(['updated'])

const { canWrite, role } = useAdminPermissions()

/**
 * Le remboursement fait sortir de l'argent : réservé au rôle `admin`, comme
 * côté backend. Un modérateur instruit le dossier, il ne le solde pas.
 */
const canRefund = computed(() => role.value === 'admin')

const returnStatus = ref('none')
const deliveredAt = ref('')
const returnRequestedAt = ref('')
const returnNotes = ref('')

const refunds = ref([])
const refundsLoading = ref(false)
const refundAmountEuros = ref('')
const refundReason = ref('')
const isConfirmingRefund = ref(false)
const isRefunding = ref(false)
const refundError = ref(null)
const refundSuccess = ref(null)

const isSaving = ref(false)
const error = ref(null)
const success = ref(null)

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
  // `Number.NaN` arrive du champ montant tant que la saisie est incomplète : le
  // bouton doit afficher un tiret, pas « NaN € ».
  if (cents == null || !Number.isFinite(cents)) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function syncFromOrder(order) {
  returnStatus.value = order?.returnStatus || 'none'
  deliveredAt.value = toDateInput(order?.deliveredAt)
  returnRequestedAt.value = toDateInput(order?.returnRequestedAt)
  returnNotes.value = order?.returnNotes || ''
}

async function loadRefunds(orderId) {
  if (!orderId) return
  refundsLoading.value = true
  try {
    refunds.value = await getOrderRefunds(orderId)
  } catch (err) {
    refundError.value = err.message || 'Impossible de charger les remboursements'
  } finally {
    refundsLoading.value = false
  }
}

watch(
  () => props.order,
  (order) => {
    syncFromOrder(order)
    loadRefunds(order?.id)
  },
  { immediate: true },
)

const today = () => toDateInput(new Date())

// Passer un dossier à l'étape suivante pré-remplit la date de notification :
// c'est la saisie attendue dans la quasi-totalité des cas, et elle reste
// modifiable. La date de remboursement, elle, n'est plus saisie du tout.
watch(returnStatus, (status, previous) => {
  if (status === previous) return
  if (status !== 'none' && !returnRequestedAt.value) {
    returnRequestedAt.value = today()
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

const totals = computed(() => summarizeRefunds(refunds.value))

const refundEligibility = computed(() => canRefundOrder(props.order, refunds.value))

const availableCents = computed(() => refundEligibility.value.availableCents)

/**
 * Lien de secours vers Stripe : affiché seulement quand l'application ne peut
 * pas rembourser elle-même, ou après un refus de l'API. En marche normale,
 * personne n'ouvre le dashboard.
 */
const stripeUrl = computed(() =>
  stripePaymentDashboardUrl(props.order?.stripePaymentIntentId, {
    testMode: STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_'),
  }),
)

const showStripeFallback = computed(
  () => Boolean(stripeUrl.value) && (Boolean(refundError.value) || !refundEligibility.value.ok),
)

const showReturnFields = computed(() => returnStatus.value !== 'none')

/** Remise à zéro du formulaire de remboursement sur le reste à rembourser. */
watch(
  availableCents,
  (cents) => {
    refundAmountEuros.value = cents > 0 ? (cents / 100).toFixed(2) : ''
  },
  { immediate: true },
)

function parseAmountCents() {
  const raw = String(refundAmountEuros.value).trim().replace(',', '.')
  if (!raw) return null
  const euros = Number(raw)
  if (!Number.isFinite(euros)) return Number.NaN
  return Math.round(euros * 100)
}

const refundAmountCents = computed(() => parseAmountCents())

const isPartialRefund = computed(
  () => refundAmountCents.value != null && refundAmountCents.value < availableCents.value,
)

function startRefund() {
  refundError.value = null
  refundSuccess.value = null

  const amount = parseAmountCents()
  if (amount == null || Number.isNaN(amount) || amount <= 0) {
    refundError.value = 'Montant de remboursement invalide'
    return
  }
  if (amount > availableCents.value) {
    refundError.value = `Montant supérieur au reste à rembourser (${formatPrice(availableCents.value)})`
    return
  }
  isConfirmingRefund.value = true
}

function cancelRefund() {
  isConfirmingRefund.value = false
}

async function confirmRefund() {
  refundError.value = null
  const amount = parseAmountCents()

  try {
    isRefunding.value = true
    const result = await refundOrder(props.order.id, {
      amountCents: amount,
      reason: refundReason.value.trim() || null,
    })
    refundSuccess.value =
      result?.refund?.status === 'succeeded'
        ? `Remboursement de ${formatPrice(result.refund.amountCents)} effectué`
        : `Remboursement de ${formatPrice(result?.refund?.amountCents ?? amount)} envoyé à Stripe (statut : ${
            REFUND_STATUS_LABELS[result?.refund?.status] || result?.refund?.status
          })`
    refundReason.value = ''
    isConfirmingRefund.value = false
    await loadRefunds(props.order.id)
    emit('updated')
  } catch (err) {
    refundError.value = err.message || 'Remboursement impossible'
    isConfirmingRefund.value = false
  } finally {
    isRefunding.value = false
  }
}

async function save() {
  error.value = null
  success.value = null

  try {
    isSaving.value = true
    await updateOrderReturn(
      props.order.id,
      {
        returnStatus: returnStatus.value,
        deliveredAt: fromDateInput(deliveredAt.value),
        returnRequestedAt: fromDateInput(returnRequestedAt.value),
        returnNotes: returnNotes.value,
      },
      {
        totalCents: props.order?.totalCents,
        refundAmountCents: props.order?.refundAmountCents,
        returnStatus: props.order?.returnStatus,
      },
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

    <!-- Demande venue du client depuis la page de suivi : lecture seule. -->
    <div
      v-if="order.returnRequestedBy === 'customer'"
      class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 mb-4 text-sm"
      data-testid="customer-request"
    >
      <p class="font-medium text-gray-800">
        Rétractation déclarée par le client le {{ formatDate(order.returnRequestedAt) }}
      </p>
      <p v-if="order.returnReason" class="mt-1 text-gray-600 whitespace-pre-line">
        « {{ order.returnReason }} »
      </p>
    </div>

    <!-- ------------------------------------------------------ Remboursement -->
    <div class="rounded-lg border border-gray-200 p-4 mb-6" data-testid="refund-panel">
      <div class="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h3 class="font-medium text-gray-900">Remboursement</h3>
        <span class="text-xs text-gray-500">Exécuté par Stripe, piloté depuis cette page</span>
      </div>

      <dl class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4" data-testid="refund-summary">
        <div>
          <dt class="text-gray-500">Total payé</dt>
          <dd class="font-medium text-gray-900">{{ formatPrice(order.totalCents) }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Déjà remboursé</dt>
          <dd class="font-medium text-gray-900">{{ formatPrice(totals.refundedCents) }}</dd>
        </div>
        <div v-if="totals.pendingCents > 0">
          <dt class="text-gray-500">En cours</dt>
          <dd class="font-medium text-amber-700">{{ formatPrice(totals.pendingCents) }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Reste à rembourser</dt>
          <dd class="font-medium text-primary">{{ formatPrice(availableCents) }}</dd>
        </div>
      </dl>

      <div
        v-if="refundError"
        class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-3 text-sm"
        data-testid="refund-error"
      >
        {{ refundError }}
      </div>
      <div
        v-if="refundSuccess"
        class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-3 text-sm"
        data-testid="refund-success"
      >
        {{ refundSuccess }}
      </div>

      <ul v-if="refunds.length" class="mb-4 divide-y divide-gray-100" data-testid="refund-history">
        <li v-for="refund in refunds" :key="refund.id" class="py-2 text-sm">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <span class="font-medium text-gray-900">{{ formatPrice(refund.amountCents) }}</span>
            <span
              class="text-xs px-2 py-0.5 rounded-full"
              :class="
                refund.status === 'succeeded'
                  ? 'bg-green-100 text-green-800'
                  : refund.status === 'failed' || refund.status === 'canceled'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-800'
              "
            >
              {{ REFUND_STATUS_LABELS[refund.status] || refund.status }}
            </span>
          </div>
          <p class="text-xs text-gray-500">
            {{ formatDate(refund.refundedAt) }} ·
            {{ REFUND_SOURCE_LABELS[refund.source] || refund.source }}
            <template v-if="refund.initiatedBy"> · {{ refund.initiatedBy }}</template>
          </p>
          <p v-if="refund.failureReason" class="text-xs text-red-600">
            Échec : {{ refund.failureReason }}
          </p>
        </li>
      </ul>
      <p v-else-if="!refundsLoading" class="text-sm text-gray-500 mb-4">
        Aucun remboursement sur cette commande.
      </p>

      <div v-if="!canRefund" class="text-sm text-gray-500">
        Le remboursement est réservé au rôle administrateur.
      </div>

      <div v-else-if="!refundEligibility.ok" class="text-sm text-gray-600">
        {{ refundEligibility.reason }}
      </div>

      <template v-else>
        <div v-if="!isConfirmingRefund" class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <label class="block text-sm">
            <span class="font-medium text-gray-700">Montant à rembourser (€)</span>
            <input
              v-model="refundAmountEuros"
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
              class="mt-1 w-full px-3 py-2 border rounded-lg"
              data-testid="refund-amount"
            />
          </label>

          <label class="block text-sm sm:col-span-2">
            <span class="font-medium text-gray-700">Motif (facultatif, interne)</span>
            <input
              v-model="refundReason"
              type="text"
              placeholder="Rétractation, geste commercial, article endommagé…"
              class="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </label>

          <div class="sm:col-span-3">
            <button
              type="button"
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
              :disabled="isRefunding"
              data-testid="refund-button"
              @click="startRefund"
            >
              <RotateCcw class="h-4 w-4" />
              Rembourser {{ formatPrice(refundAmountCents) }}
            </button>
          </div>
        </div>

        <!-- Confirmation explicite : une sortie d'argent ne se déclenche pas d'un clic. -->
        <div
          v-else
          class="rounded-lg border border-amber-300 bg-amber-50 p-4"
          data-testid="refund-confirm"
        >
          <p class="flex items-start gap-2 text-sm text-amber-900">
            <TriangleAlert class="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Rembourser <strong>{{ formatPrice(refundAmountCents) }}</strong> au client
              {{ isPartialRefund ? '(remboursement partiel)' : '(remboursement total du reste dû)' }} ?
              L'opération est immédiate et irréversible. Les commissions Stripe du paiement
              initial ne sont pas restituées.
            </span>
          </p>
          <div class="mt-3 flex gap-3">
            <button
              type="button"
              class="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
              :disabled="isRefunding"
              data-testid="refund-confirm-button"
              @click="confirmRefund"
            >
              {{ isRefunding ? 'Remboursement…' : 'Confirmer le remboursement' }}
            </button>
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 rounded-lg"
              :disabled="isRefunding"
              @click="cancelRefund"
            >
              Annuler
            </button>
          </div>
        </div>
      </template>

      <p v-if="showStripeFallback" class="mt-3 text-xs text-gray-500">
        Un remboursement fait directement dans Stripe reste enregistré ici automatiquement.
        <a
          :href="stripeUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-primary underline"
          data-testid="stripe-link"
        >
          <ExternalLink class="h-3 w-3" />
          Ouvrir le paiement dans Stripe
        </a>
      </p>
    </div>

    <!-- ------------------------------------------------------- Suivi dossier -->
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

      <label v-if="showReturnFields" class="block text-sm">
        <span class="font-medium text-gray-700">Date de la demande de rétractation</span>
        <input
          v-model="returnRequestedAt"
          type="date"
          :disabled="!canWrite"
          class="mt-1 w-full px-3 py-2 border rounded-lg disabled:opacity-60"
        />
      </label>
    </div>

    <label v-if="showReturnFields" class="block text-sm mt-4">
      <span class="font-medium text-gray-700">Notes internes</span>
      <textarea
        v-model="returnNotes"
        rows="3"
        :disabled="!canWrite"
        placeholder="Motif, état du produit, échanges avec le client…"
        class="mt-1 w-full px-3 py-2 border rounded-lg disabled:opacity-60"
      ></textarea>
    </label>

    <div v-if="canWrite" class="mt-4">
      <button
        type="button"
        class="px-4 py-2 border border-gray-300 text-gray-800 rounded-lg disabled:opacity-50"
        :disabled="isSaving"
        data-testid="save-return"
        @click="save"
      >
        {{ isSaving ? 'Enregistrement…' : 'Enregistrer le dossier retour' }}
      </button>
    </div>
  </section>
</template>
