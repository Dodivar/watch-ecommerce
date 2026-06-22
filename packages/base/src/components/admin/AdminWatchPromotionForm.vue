<script setup>
import { ref, computed, onMounted, watch as vueWatch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import { fr } from 'date-fns/locale'
import '@vuepic/vue-datepicker/dist/main.css'
import { getAllWatchesForAdmin } from '@/services/admin/adminWatchService'
import { saveWatchPromotionCampaignDraft } from '@/services/admin/adminWatchPromotionService'
import {
  computeDiscountPercentFromPrices,
  getDisplayDiscountPercent,
  getEffectiveWatchPrice,
  isWatchOnPromotion,
  suggestPromotionPrice,
} from '@/utils/watchPricing.js'
import {
  getMinCampaignEndDate,
  normalizeCampaignSchedule,
  resolveLiveCampaignStatus,
} from '@/utils/watchPromotionCampaign.js'
import AdminShell from './AdminShell.vue'

const datePickerFormats = { input: 'dd/MM/yyyy HH:mm' }
const datePickerTimeConfig = { enableTimePicker: true, is24: true }

const router = useRouter()
const route = useRoute()
const isEdit = computed(() => !!route.params.id && route.params.id !== 'new')
const draftId = computed(() => (isEdit.value ? route.params.id : null))
const campaignStatus = ref(null)
const isLiveEdit = computed(() => {
  if (!campaignStatus.value || campaignStatus.value === 'draft') return false
  const live = resolveLiveCampaignStatus({ status: campaignStatus.value })
  return live === 'active' || live === 'scheduled'
})

const form = ref({
  name: '',
  description: '',
  defaultDiscountPercent: 10,
  startsAt: new Date().toISOString(),
  endsAt: '',
})

const watches = ref([])
const selectedWatchIds = ref(new Set())
const itemOverrides = ref({})
/** Promo catalogue avant événement (snapshot campagne ou promo montre). */
const baselinePromos = ref({})
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref(null)

const searchQuery = ref('')
const selectedBrand = ref('')
const sortColumn = ref('brand')
const sortDirection = ref('asc')
const currentPage = ref(1)
const pageSize = ref(25)

const availableBrands = computed(() => {
  const brands = [...new Set(watches.value.map((w) => w.brand).filter(Boolean))]
  return brands.sort()
})

const filteredWatches = computed(() => {
  let list = watches.value.filter(
    (w) =>
      (w.is_available !== false && w.is_sold !== true) || selectedWatchIds.value.has(w.id),
  )

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (w) =>
        w.name?.toLowerCase().includes(q) ||
        w.brand?.toLowerCase().includes(q) ||
        w.model?.toLowerCase().includes(q) ||
        w.reference?.toLowerCase().includes(q),
    )
  }

  if (selectedBrand.value) {
    list = list.filter((w) => w.brand === selectedBrand.value)
  }

  if (sortColumn.value) {
    list = [...list].sort((a, b) => {
      let aVal
      let bVal
      switch (sortColumn.value) {
        case 'price':
          aVal = parseFloat(a.price) || 0
          bVal = parseFloat(b.price) || 0
          return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal
        case 'brand':
          aVal = (a.brand || '').toLowerCase()
          bVal = (b.brand || '').toLowerCase()
          break
        default:
          aVal = (a.name || '').toLowerCase()
          bVal = (b.name || '').toLowerCase()
      }
      if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
      return 0
    })
  }

  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredWatches.value.length / pageSize.value)))
const paginatedWatches = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredWatches.value.slice(start, start + pageSize.value)
})

const paginatedWatchRows = computed(() =>
  paginatedWatches.value.map((watch) => ({
    watch,
    existing: getExistingWatchPromo(watch),
    event: resolveRowPricing(watch),
  })),
)

const selectedCount = computed(() => selectedWatchIds.value.size)

const minEndsAt = computed(() => getMinCampaignEndDate(form.value.startsAt))

vueWatch(
  () => form.value.startsAt,
  () => {
    if (!form.value.endsAt) return
    try {
      normalizeCampaignSchedule(form.value.startsAt, form.value.endsAt)
    } catch {
      form.value.endsAt = ''
    }
  },
)

vueWatch([searchQuery, selectedBrand, sortColumn, sortDirection, pageSize], () => {
  currentPage.value = 1
})

function formatPrice(price) {
  if (price == null || !Number.isFinite(price)) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}

function normalizeWatchPricingFields(watch) {
  return {
    price: watch?.price,
    promotionPrice: watch?.promotion_price ?? watch?.promotionPrice ?? null,
    discountPercent: watch?.discount_percent ?? watch?.discountPercent ?? null,
  }
}

function getExistingWatchPromo(watch) {
  const baseline = baselinePromos.value[watch.id]
  if (baseline?.promotionPrice != null) {
    const promotionPrice = parseFloat(String(baseline.promotionPrice))
    if (!Number.isFinite(promotionPrice)) return null
    const base = parseFloat(watch.price)
    const storedPct = baseline.discountPercent
    const discountPercent =
      storedPct != null && storedPct !== ''
        ? parseInt(String(storedPct), 10)
        : computeDiscountPercentFromPrices(base, promotionPrice)
    return {
      promotionPrice,
      discountPercent: Number.isFinite(discountPercent) ? discountPercent : null,
    }
  }

  const normalized = normalizeWatchPricingFields(watch)
  if (!isWatchOnPromotion(normalized)) return null

  return {
    promotionPrice: getEffectiveWatchPrice(normalized),
    discountPercent: getDisplayDiscountPercent(normalized),
  }
}

const selectedWithExistingPromoCount = computed(() => {
  let count = 0
  for (const watchId of selectedWatchIds.value) {
    const watch = watches.value.find((row) => row.id === watchId)
    if (watch && getExistingWatchPromo(watch)) count += 1
  }
  return count
})

function getOverride(watchId) {
  if (!itemOverrides.value[watchId]) {
    itemOverrides.value[watchId] = { discountPercent: '', promotionPrice: '' }
  }
  return itemOverrides.value[watchId]
}

function resolveRowPricing(watch) {
  const override = getOverride(watch.id)
  const base = parseFloat(watch.price)
  let pct =
    override.discountPercent !== ''
      ? parseInt(String(override.discountPercent), 10)
      : form.value.defaultDiscountPercent
  let promo =
    override.promotionPrice !== ''
      ? parseFloat(String(override.promotionPrice))
      : suggestPromotionPrice(base, pct)
  if (override.promotionPrice !== '' && Number.isFinite(promo)) {
    pct = computeDiscountPercentFromPrices(base, promo) ?? pct
  }
  return { base, promo, pct }
}

function toggleWatch(watchId) {
  const next = new Set(selectedWatchIds.value)
  if (next.has(watchId)) next.delete(watchId)
  else next.add(watchId)
  selectedWatchIds.value = next
}

function toggleAllOnPage() {
  const ids = paginatedWatches.value.map((w) => w.id)
  const allSelected = ids.every((id) => selectedWatchIds.value.has(id))
  const next = new Set(selectedWatchIds.value)
  if (allSelected) ids.forEach((id) => next.delete(id))
  else ids.forEach((id) => next.add(id))
  selectedWatchIds.value = next
}

function applyDefaultPercentToSelected() {
  for (const id of selectedWatchIds.value) {
    const override = getOverride(id)
    override.discountPercent = ''
    override.promotionPrice = ''
  }
}

function handleSort(column) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

async function loadWatches() {
  watches.value = await getAllWatchesForAdmin()
}

async function loadCampaign() {
  if (!isEdit.value) return
  const { getWatchPromotionCampaignByIdForAdmin } = await import(
    '@/services/admin/adminWatchPromotionService'
  )
  const existing = await getWatchPromotionCampaignByIdForAdmin(draftId.value)
  if (!existing) {
    error.value = 'Événement introuvable'
    return
  }

  const live = resolveLiveCampaignStatus(existing)
  if (existing.status === 'draft') {
    campaignStatus.value = 'draft'
  } else if (live === 'active' || live === 'scheduled') {
    campaignStatus.value = existing.status
  } else {
    error.value = 'Cet événement ne peut plus être modifié'
    return
  }

  form.value = {
    name: existing.name,
    description: existing.description || '',
    defaultDiscountPercent: existing.defaultDiscountPercent,
    startsAt: existing.startsAt || new Date().toISOString(),
    endsAt: existing.endsAt || '',
  }
  const ids = new Set()
  const overrides = {}
  const baselines = {}
  for (const item of existing.items || []) {
    ids.add(item.watchId)
    overrides[item.watchId] = {
      discountPercent: item.discountPercent?.toString() || '',
      promotionPrice: item.promotionPrice?.toString() || '',
    }
    if (item.previousPromotionPrice != null) {
      baselines[item.watchId] = {
        promotionPrice: item.previousPromotionPrice,
        discountPercent: item.previousDiscountPercent ?? null,
      }
    }
  }
  selectedWatchIds.value = ids
  itemOverrides.value = overrides
  baselinePromos.value = baselines
}

function buildPayload(schedule) {
  const items = [...selectedWatchIds.value].map((watchId) => {
    const override = getOverride(watchId)
    return {
      watchId,
      discountPercent: override.discountPercent !== '' ? override.discountPercent : null,
      promotionPrice: override.promotionPrice !== '' ? override.promotionPrice : null,
    }
  })

  return {
    ...form.value,
    startsAt: schedule.startsAt,
    endsAt: schedule.endsAt,
    items,
  }
}

async function continueToReview() {
  try {
    isSaving.value = true
    error.value = null

    const schedule = normalizeCampaignSchedule(form.value.startsAt, form.value.endsAt || null)
    const payload = buildPayload(schedule)

    if (isLiveEdit.value) {
      router.push({
        path: `/admin/watch-promotions/${draftId.value}/review`,
        state: { pendingUpdate: payload },
      })
      return
    }

    const saved = await saveWatchPromotionCampaignDraft(payload, draftId.value)
    router.push(`/admin/watch-promotions/${saved.id}/review`)
  } catch (err) {
    error.value = err.message
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  try {
    isLoading.value = true
    await loadWatches()
    await loadCampaign()
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <AdminShell
    :title="isEdit ? (isLiveEdit ? 'Modifier l\'événement en cours' : 'Modifier l\'événement promotionnel') : 'Nouvel événement promotionnel'"
    show-back-button
    back-button-route="/admin/watch-promotions"
    back-button-text="Promotions montres"
    content-class="max-w-6xl"
  >
    <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{{ error }}</div>
    <div v-if="isLoading" class="text-center py-12 text-gray-500">Chargement…</div>

    <form v-else class="space-y-8" @submit.prevent="continueToReview">
      <section class="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 class="text-lg font-semibold text-gray-900">Informations de l'événement</h2>
        <div>
          <label for="campaign-name" class="block text-sm font-medium mb-1">Titre</label>
          <input
            id="campaign-name"
            v-model="form.name"
            required
            maxlength="120"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Ex. Soldes de Noël 2026"
          />
        </div>
        <div>
          <label for="campaign-description" class="block text-sm font-medium mb-1">Description</label>
          <textarea
            id="campaign-description"
            v-model="form.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Usage interne ou note pour l'équipe (optionnel)"
          />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label for="default-percent" class="block text-sm font-medium mb-1">Remise par défaut (%)</label>
            <input
              id="default-percent"
              v-model.number="form.defaultDiscountPercent"
              type="number"
              min="1"
              max="99"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              @change="applyDefaultPercentToSelected"
            />
          </div>
          <div>
            <label for="starts-at" class="block text-sm font-medium mb-1">Début</label>
            <div class="campaign-date-picker">
              <VueDatePicker
                v-model="form.startsAt"
                model-type="iso"
                :locale="fr"
                :formats="datePickerFormats"
                :time-config="datePickerTimeConfig"
                :input-attrs="{ id: 'starts-at', autocomplete: 'off' }"
                placeholder="jj/mm/aaaa hh:mm"
                :week-start="1"
                auto-apply
                teleport="body"
              />
            </div>
          </div>
          <div>
            <label for="ends-at" class="block text-sm font-medium mb-1">Fin (optionnel)</label>
            <p class="text-xs text-gray-500 mb-1">Doit être postérieure au début (date et heure).</p>
            <div class="campaign-date-picker">
              <VueDatePicker
                v-model="form.endsAt"
                model-type="iso"
                :locale="fr"
                :formats="datePickerFormats"
                :time-config="datePickerTimeConfig"
                :min-date="minEndsAt"
                :input-attrs="{ id: 'ends-at', autocomplete: 'off' }"
                placeholder="Sans limite"
                :week-start="1"
                auto-apply
                clearable
                teleport="body"
              />
            </div>
          </div>
        </div>
      </section>

      <section class="bg-white rounded-lg shadow overflow-hidden">
        <div class="p-6 border-b border-gray-100 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-gray-900">
              Sélection des montres
              <span class="text-sm font-normal text-gray-500">({{ selectedCount }} sélectionnée{{ selectedCount > 1 ? 's' : '' }})</span>
            </h2>
          </div>
          <div class="flex flex-wrap gap-3">
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Rechercher marque, modèle, référence…"
              class="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <select v-model="selectedBrand" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Toutes les marques</option>
              <option v-for="brand in availableBrands" :key="brand" :value="brand">{{ brand }}</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-cream-100 text-left text-gray-600">
              <tr>
                <th class="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    :checked="paginatedWatches.length > 0 && paginatedWatches.every((w) => selectedWatchIds.has(w.id))"
                    :aria-label="'Sélectionner la page'"
                    @change="toggleAllOnPage"
                  />
                </th>
                <th class="px-4 py-3 cursor-pointer" @click="handleSort('brand')">Marque</th>
                <th class="px-4 py-3 cursor-pointer" @click="handleSort('name')">Montre</th>
                <th class="px-4 py-3 cursor-pointer" @click="handleSort('price')">Prix catalogue</th>
                <th class="px-4 py-3">Promo actuelle</th>
                <th class="px-4 py-3">Remise événement %</th>
                <th class="px-4 py-3">Prix promo événement</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="{ watch, existing, event } in paginatedWatchRows"
                :key="watch.id"
                class="hover:bg-cream/40"
                :class="selectedWatchIds.has(watch.id) ? 'bg-primary/5' : ''"
              >
                <td class="px-4 py-3">
                  <input
                    type="checkbox"
                    :checked="selectedWatchIds.has(watch.id)"
                    @change="toggleWatch(watch.id)"
                  />
                </td>
                <td class="px-4 py-3">{{ watch.brand }}</td>
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">{{ watch.name }}</div>
                  <div v-if="watch.reference" class="text-xs text-gray-500">{{ watch.reference }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">{{ formatPrice(parseFloat(watch.price)) }}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <template v-if="existing">
                    <span class="text-gray-600">{{ formatPrice(existing.promotionPrice) }}</span>
                    <span v-if="existing.discountPercent != null" class="ml-1 text-xs text-gray-400">
                      (−{{ existing.discountPercent }} %)
                    </span>
                  </template>
                  <span v-else class="text-gray-400">Pas de promo</span>
                </td>
                <td class="px-4 py-3">
                  <template v-if="selectedWatchIds.has(watch.id)">
                    <input
                      v-model="getOverride(watch.id).discountPercent"
                      type="number"
                      min="1"
                      max="99"
                      :placeholder="String(event.pct ?? form.defaultDiscountPercent)"
                      class="w-20 px-2 py-1 border border-primary/30 rounded text-sm font-medium text-primary"
                      :title="'Remplace la promo actuelle le temps de l\'événement'"
                    />
                    <p
                      v-if="existing?.discountPercent != null"
                      class="mt-1 text-[11px] text-amber-700 leading-tight"
                    >
                      Remplace −{{ existing.discountPercent }} %
                    </p>
                  </template>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <template v-if="selectedWatchIds.has(watch.id)">
                    <input
                      v-model="getOverride(watch.id).promotionPrice"
                      type="number"
                      min="1"
                      :placeholder="String(event.promo ?? '')"
                      class="w-28 px-2 py-1 border border-primary/30 rounded text-sm font-medium text-primary"
                      :title="'Remplace la promo actuelle le temps de l\'événement'"
                    />
                    <p v-if="existing" class="mt-1 text-[11px] text-amber-700 leading-tight">
                      au lieu de {{ formatPrice(existing.promotionPrice) }}
                    </p>
                  </template>
                  <span v-else class="text-gray-400">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p
          v-if="selectedWithExistingPromoCount > 0"
          class="px-6 py-3 text-xs text-amber-900 border-t border-amber-100 bg-amber-50"
        >
          {{ selectedWithExistingPromoCount }} montre{{ selectedWithExistingPromoCount > 1 ? 's' : '' }}
          avec une promo individuelle : la remise événement la remplace pendant la campagne, puis l'ancienne promo est restaurée à la fin.
        </p>

        <div class="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
          <span>{{ filteredWatches.length }} montre{{ filteredWatches.length > 1 ? 's' : '' }}</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3 py-1 border rounded disabled:opacity-40"
              :disabled="currentPage <= 1"
              @click="currentPage--"
            >
              Préc.
            </button>
            <span>Page {{ currentPage }} / {{ totalPages }}</span>
            <button
              type="button"
              class="px-3 py-1 border rounded disabled:opacity-40"
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
            >
              Suiv.
            </button>
          </div>
        </div>
      </section>

      <div class="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-cream"
          @click="router.push('/admin/watch-promotions')"
        >
          Annuler
        </button>
        <button
          type="submit"
          class="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50"
          :disabled="isSaving || selectedCount === 0"
        >
          {{ isSaving ? 'Enregistrement…' : (isLiveEdit ? 'Continuer vers la validation' : 'Continuer vers le récapitulatif') }}
        </button>
      </div>
    </form>
  </AdminShell>
</template>

<style scoped>
.campaign-date-picker {
  --dp-primary-color: var(--color-primary);
  --dp-primary-disabled-color: color-mix(in srgb, var(--color-primary) 45%, white);
  --dp-border-color-focus: var(--color-primary);
  --dp-font-family: inherit;
}

.campaign-date-picker :deep(.dp__input) {
  border-color: #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
}
</style>
