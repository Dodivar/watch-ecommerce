<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getWatchPromotionCampaignByIdForAdmin,
  cancelWatchPromotionCampaignDraft,
  applyWatchPromotionCampaign,
  updateWatchPromotionCampaign,
} from '@/services/admin/adminWatchPromotionService'
import {
  describeCampaignSchedule,
  resolveCampaignItemPricing,
  resolveLiveCampaignStatus,
  getCampaignStatusLabel,
} from '@/utils/watchPromotionCampaign.js'
import { getWatchesByIdsForAdmin } from '@/services/admin/adminWatchService'
import AdminShell from './AdminShell.vue'

const route = useRoute()
const router = useRouter()
const campaignId = computed(() => route.params.id)

const campaign = ref(null)
const isLoading = ref(true)
const error = ref(null)
const success = ref(null)
const isApplying = ref(false)
const isCancelling = ref(false)
const showCancelConfirm = ref(false)
const showApplyConfirm = ref(false)
const isLiveEdit = ref(false)
const pendingUpdate = ref(null)

const liveStatus = computed(() =>
  campaign.value ? resolveLiveCampaignStatus(campaign.value) : null,
)

const pageTitle = computed(() =>
  isLiveEdit.value ? 'Valider les modifications' : 'Récapitulatif avant application',
)

const pageSubtitle = computed(() =>
  isLiveEdit.value
    ? 'Vérifiez les changements avant de mettre à jour l\'événement'
    : 'Vérifiez les informations avant d\'activer l\'événement promotionnel',
)

const schedule = computed(() => {
  if (!campaign.value) return null
  if (pendingUpdate.value) {
    return describeCampaignSchedule({
      startsAt: pendingUpdate.value.startsAt,
      endsAt: pendingUpdate.value.endsAt,
    })
  }
  return describeCampaignSchedule(campaign.value)
})

const resolvedItems = computed(() => {
  if (!campaign.value?.items?.length) return []
  const defaultDiscountPercent = pendingUpdate.value?.defaultDiscountPercent
    ?? campaign.value.defaultDiscountPercent

  return campaign.value.items.map((item) => {
    const watch = item.watch
    const pricing = resolveCampaignItemPricing(
      watch,
      item,
      defaultDiscountPercent,
    )
    return {
      ...item,
      watch,
      ...pricing,
    }
  })
})

function normalizeWatchForReview(watch) {
  if (!watch) return null
  return {
    id: watch.id,
    name: watch.name,
    brand: watch.brand,
    model: watch.model,
    reference: watch.reference,
    price: watch.price,
    promotionPrice: watch.promotion_price ?? watch.promotionPrice ?? null,
    discountPercent: watch.discount_percent ?? watch.discountPercent ?? null,
  }
}

function buildCampaignFromPending(existing, payload, watches) {
  const watchesById = new Map(watches.map((watch) => [watch.id, watch]))
  const items = payload.items.map((item) => ({
    id: item.watchId,
    watchId: item.watchId,
    discountPercent:
      item.discountPercent != null && item.discountPercent !== ''
        ? parseInt(String(item.discountPercent), 10)
        : null,
    promotionPrice:
      item.promotionPrice != null && item.promotionPrice !== ''
        ? parseFloat(String(item.promotionPrice))
        : null,
    watch: normalizeWatchForReview(watchesById.get(item.watchId)),
  }))

  return {
    ...existing,
    name: payload.name,
    description: payload.description || null,
    defaultDiscountPercent: payload.defaultDiscountPercent,
    startsAt: payload.startsAt,
    endsAt: payload.endsAt,
    items,
  }
}

const invalidItems = computed(() =>
  resolvedItems.value.filter((item) => !item.promotionPrice),
)

function formatPrice(price) {
  if (price == null || !Number.isFinite(price)) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}

async function load() {
  try {
    isLoading.value = true
    error.value = null
    const data = await getWatchPromotionCampaignByIdForAdmin(campaignId.value)
    if (!data) {
      error.value = 'Événement introuvable'
      return
    }

    const pending = history.state?.pendingUpdate ?? null
    const live = resolveLiveCampaignStatus(data)

    if (data.status === 'draft') {
      campaign.value = data
      isLiveEdit.value = false
      return
    }

    if ((live === 'active' || live === 'scheduled') && pending) {
      const watches = await getWatchesByIdsForAdmin(pending.items.map((item) => item.watchId))
      pendingUpdate.value = pending
      campaign.value = buildCampaignFromPending(data, pending, watches)
      isLiveEdit.value = true
      return
    }

    if (live === 'active' || live === 'scheduled') {
      router.replace(`/admin/watch-promotions/${campaignId.value}/edit`)
      return
    }

    error.value = 'Cet événement ne peut plus être modifié'
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

function openCancelConfirm() {
  showCancelConfirm.value = true
}

function closeCancelConfirm() {
  showCancelConfirm.value = false
}

async function confirmCancel() {
  try {
    isCancelling.value = true
    error.value = null
    await cancelWatchPromotionCampaignDraft(campaignId.value)
    router.push('/admin/watch-promotions')
  } catch (err) {
    error.value = err.message
    showCancelConfirm.value = false
  } finally {
    isCancelling.value = false
  }
}

function openApplyConfirm() {
  if (invalidItems.value.length > 0) {
    error.value = `${invalidItems.value.length} montre(s) ont une remise invalide. Modifiez la sélection avant d'appliquer.`
    return
  }
  error.value = null
  showApplyConfirm.value = true
}

function closeApplyConfirm() {
  showApplyConfirm.value = false
}

async function confirmApply() {
  try {
    isApplying.value = true
    error.value = null

    if (isLiveEdit.value) {
      if (!pendingUpdate.value) {
        throw new Error('Les modifications à enregistrer sont introuvables. Revenez au formulaire.')
      }
      await updateWatchPromotionCampaign(campaignId.value, pendingUpdate.value)
      showApplyConfirm.value = false
      success.value = 'Événement promotionnel mis à jour avec succès.'
    } else {
      await applyWatchPromotionCampaign(campaignId.value)
      showApplyConfirm.value = false
      success.value = 'Événement promotionnel appliqué avec succès.'
    }

    setTimeout(() => {
      router.push('/admin/watch-promotions')
    }, 1200)
  } catch (err) {
    error.value = err.message
    showApplyConfirm.value = false
  } finally {
    isApplying.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminShell
    :title="pageTitle"
    :subtitle="pageSubtitle"
    show-back-button
    back-button-route="/admin/watch-promotions"
    back-button-text="Promotions montres"
    content-class="max-w-5xl"
  >
    <template #actions>
      <button
        type="button"
        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-cream text-sm font-medium"
        @click="router.push(`/admin/watch-promotions/${campaignId}/edit`)"
      >
        Modifier la sélection
      </button>
    </template>

    <div v-if="success" class="bg-green-50 text-green-800 px-4 py-3 rounded-lg mb-4">{{ success }}</div>
    <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{{ error }}</div>
    <div v-if="isLoading" class="text-center py-12 text-gray-500">Chargement du récapitulatif…</div>

    <template v-else-if="campaign">
      <section class="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Événement</p>
          <h2 class="text-xl font-semibold text-gray-900">{{ campaign.name }}</h2>
          <p v-if="campaign.description" class="mt-2 text-gray-600 whitespace-pre-line">
            {{ campaign.description }}
          </p>
          <p v-else class="mt-2 text-sm text-gray-400 italic">Aucune description</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
          <div>
            <p class="text-xs text-gray-500 mb-0.5">Remise par défaut</p>
            <p class="text-lg font-semibold text-primary">{{ campaign.defaultDiscountPercent }} %</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-0.5">Montres impactées</p>
            <p class="text-lg font-semibold text-gray-900">{{ resolvedItems.length }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-0.5">Statut actuel</p>
            <p
              class="text-lg font-semibold"
              :class="isLiveEdit ? 'text-green-700' : 'text-amber-700'"
            >
              {{ isLiveEdit ? getCampaignStatusLabel(liveStatus) : 'Brouillon' }}
            </p>
          </div>
        </div>
      </section>

      <section class="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6">
        <h3 class="text-sm font-semibold text-amber-900 mb-2">Dates de prise d'effet</h3>
        <p class="text-sm text-amber-900 mb-3">{{ schedule?.summary }}</p>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt class="text-amber-800/70">Début</dt>
            <dd class="font-medium text-amber-950">{{ schedule?.startsLabel }}</dd>
          </div>
          <div>
            <dt class="text-amber-800/70">Fin</dt>
            <dd class="font-medium text-amber-950">
              {{ schedule?.isIndefinite ? 'Sans date de fin' : schedule?.endsLabel }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">Montres et remises appliquées</h3>
          <p class="text-sm text-gray-500 mt-0.5">
            Détail des prix catalogue, remises et prix promotionnels calculés.
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-cream-100 text-left text-gray-600">
              <tr>
                <th class="px-4 py-3">Montre</th>
                <th class="px-4 py-3">Prix catalogue</th>
                <th class="px-4 py-3">Remise</th>
                <th class="px-4 py-3">Prix promo</th>
                <th class="px-4 py-3">Promo actuelle</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="item in resolvedItems"
                :key="item.id"
                :class="!item.promotionPrice ? 'bg-red-50' : ''"
              >
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">{{ item.watch?.brand }} — {{ item.watch?.name }}</div>
                  <div v-if="item.watch?.reference" class="text-xs text-gray-500">{{ item.watch.reference }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">{{ formatPrice(item.basePrice) }}</td>
                <td class="px-4 py-3">
                  <span v-if="item.discountPercent != null" class="font-medium text-primary">
                    −{{ item.discountPercent }} %
                  </span>
                  <span v-else class="text-red-600">Invalide</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap font-semibold">
                  {{ formatPrice(item.promotionPrice) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-gray-500">
                  <template v-if="item.watch?.promotionPrice">
                    {{ formatPrice(parseFloat(item.watch.promotionPrice)) }}
                    <span v-if="item.watch.discountPercent" class="text-xs">(−{{ item.watch.discountPercent }} %)</span>
                  </template>
                  <span v-else>Pas de promo</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p
          v-if="resolvedItems.some((i) => i.watch?.promotionPrice)"
          class="px-6 py-3 text-xs text-gray-500 border-t border-gray-100 bg-cream/30"
        >
          Les promotions individuelles existantes seront remplacées le temps de cet événement, puis restaurées à la fin de la campagne.
        </p>
      </section>

      <div class="flex flex-wrap justify-between gap-3">
        <button
          v-if="!isLiveEdit"
          type="button"
          class="px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 font-medium"
          @click="openCancelConfirm"
        >
          Annuler l'événement
        </button>
        <div v-else />
        <button
          type="button"
          class="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover disabled:opacity-50"
          :disabled="isApplying || resolvedItems.length === 0"
          @click="openApplyConfirm"
        >
          {{
            isApplying
              ? (isLiveEdit ? 'Enregistrement…' : 'Application…')
              : (isLiveEdit ? 'Enregistrer les modifications' : 'Appliquer l\'événement')
          }}
        </button>
      </div>
    </template>

    <!-- Confirmation annulation -->
    <div
      v-if="showCancelConfirm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click="closeCancelConfirm"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full" @click.stop>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Annuler l'événement ?</h3>
        <p class="text-gray-600 mb-6">
          Le brouillon « <strong>{{ campaign?.name }}</strong> » et la sélection de
          {{ resolvedItems.length }} montre{{ resolvedItems.length > 1 ? 's' : '' }} seront supprimés.
          Cette action est irréversible.
        </p>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 bg-cream-100 rounded-lg hover:bg-cream-200"
            :disabled="isCancelling"
            @click="closeCancelConfirm"
          >
            Retour
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            :disabled="isCancelling"
            @click="confirmCancel"
          >
            {{ isCancelling ? 'Suppression…' : 'Confirmer l\'annulation' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmation application -->
    <div
      v-if="showApplyConfirm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click="closeApplyConfirm"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full" @click.stop>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          {{ isLiveEdit ? 'Enregistrer les modifications ?' : 'Appliquer l\'événement promotionnel ?' }}
        </h3>
        <p class="text-gray-600 mb-4">
          <template v-if="isLiveEdit">
            Vous allez mettre à jour « <strong>{{ campaign?.name }}</strong> » sur
            <strong>{{ resolvedItems.length }}</strong> montre{{ resolvedItems.length > 1 ? 's' : '' }}.
          </template>
          <template v-else>
            Vous allez activer « <strong>{{ campaign?.name }}</strong> » sur
            <strong>{{ resolvedItems.length }}</strong> montre{{ resolvedItems.length > 1 ? 's' : '' }}.
          </template>
        </p>
        <div class="bg-cream rounded-lg p-4 mb-6 text-sm space-y-2">
          <p class="font-medium text-gray-900">Prise d'effet</p>
          <p class="text-gray-700">{{ schedule?.summary }}</p>
          <ul class="list-disc list-inside text-gray-600 space-y-1">
            <li>Début : {{ schedule?.startsLabel }}</li>
            <li>Fin : {{ schedule?.isIndefinite ? 'Sans limite' : schedule?.endsLabel }}</li>
          </ul>
        </div>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 bg-cream-100 rounded-lg hover:bg-cream-200"
            :disabled="isApplying"
            @click="closeApplyConfirm"
          >
            Retour au récapitulatif
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
            :disabled="isApplying"
            @click="confirmApply"
          >
            {{ isApplying ? (isLiveEdit ? 'Enregistrement…' : 'Application…') : (isLiveEdit ? 'Confirmer et enregistrer' : 'Confirmer et appliquer') }}
          </button>
        </div>
      </div>
    </div>
  </AdminShell>
</template>
