<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BadgePercent, Search, Watch } from '@lucide/vue'
import { getPromotedWatchesForAdmin } from '@/services/admin/adminWatchPromotionService'
import {
  describeWatchPromotion,
  getPromotionSourceClass,
  summarizePromotedWatches,
  PROMOTION_SOURCE_LABELS,
} from '@/utils/watchPromotionSummary.js'
import { describeCampaignSchedule } from '@/utils/watchPromotionCampaign.js'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import AdminShell from './AdminShell.vue'

const router = useRouter()

const isRetailCatalog = computed(() => getSiteConfig().watchCatalog?.mode !== 'resale')

const rows = ref([])
const isLoading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const sourceFilter = ref('all') // 'all' | 'campaign' | 'direct' | 'scheduled'
// Une remise sur une montre vendue (ou dépubliée) n'a plus d'effet commercial : elle
// fausserait la synthèse. Elle reste consultable à la demande.
const includeOffline = ref(false)

/** Toutes les montres promues, décorées de l'origine et du chiffrage de leur remise. */
const promotedRows = computed(() =>
  rows.value
    .map(({ watch, campaign }) => ({
      watch,
      campaign,
      promotion: describeWatchPromotion(watch, campaign),
    }))
    // Un `promotion_price` supérieur au prix catalogue n'est pas une remise : la fiche
    // n'affiche rien de particulier côté public, la récapitulation non plus.
    .filter((row) => row.promotion.source),
)

/** Périmètre chiffré : le catalogue en vente, ou tout, selon la case cochée. */
const scopedRows = computed(() =>
  promotedRows.value.filter((row) => includeOffline.value || !isOffline(row.watch)),
)

const offlineCount = computed(() => promotedRows.value.length - scopedRows.value.length)

const summary = computed(() => summarizePromotedWatches(scopedRows.value))

const filters = computed(() => [
  { key: 'all', label: 'Toutes', count: summary.value.total },
  { key: 'campaign', label: 'Campagnes en cours', count: summary.value.campaignCount },
  { key: 'direct', label: 'Promos directes', count: summary.value.directCount },
  { key: 'scheduled', label: 'Campagnes à venir', count: summary.value.scheduledCount },
])

const visibleRows = computed(() => {
  const term = searchQuery.value.trim().toLowerCase()
  return scopedRows.value.filter((row) => {
    if (sourceFilter.value !== 'all' && row.promotion.source !== sourceFilter.value) return false
    if (!term) return true
    return [
      row.watch.name,
      row.watch.brand,
      row.watch.model,
      row.watch.reference,
      row.watch.ad_code,
      row.campaign?.name,
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(term))
  })
})

/** Montres remisées par campagne, pour la synthèse par événement. */
const byCampaign = computed(() => {
  const grouped = new Map()
  for (const row of scopedRows.value) {
    if (!row.campaign) continue
    if (!grouped.has(row.campaign.id)) {
      grouped.set(row.campaign.id, { campaign: row.campaign, count: 0, savings: 0 })
    }
    const entry = grouped.get(row.campaign.id)
    entry.count += 1
    entry.savings += row.promotion.savings
  }
  return Array.from(grouped.values()).sort((a, b) => b.count - a.count)
})

function formatPrice(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function scheduleLabel(campaign) {
  if (!campaign) return null
  const schedule = describeCampaignSchedule(campaign)
  return schedule.endsLabel ? `Jusqu'au ${schedule.endsLabel}` : 'Sans date de fin'
}

function statusLabel(watch) {
  if (isRetailCatalog.value) {
    return Number(watch.stock_quantity) <= 0 ? 'Hors stock' : 'En vente'
  }
  return watch.is_sold === true ? 'Vendue' : 'En vente'
}

function isOffline(watch) {
  if (watch.is_available === false) return true
  return isRetailCatalog.value ? Number(watch.stock_quantity) <= 0 : watch.is_sold === true
}

async function load() {
  isLoading.value = true
  error.value = null
  try {
    rows.value = await getPromotedWatchesForAdmin()
  } catch (err) {
    error.value = err.message || 'Impossible de charger les montres en promotion'
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminShell
    title="Montres en promotion"
    subtitle="Toutes les remises actives du catalogue, campagne ou promotion directe"
    show-back-button
    back-button-route="/admin/watch-promotions"
    back-button-text="Promotions montres"
  >
    <template #actions>
      <button
        type="button"
        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-cream text-sm font-medium"
        @click="router.push('/admin/watches')"
      >
        Catalogue
      </button>
      <button
        type="button"
        class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover"
        @click="router.push('/admin/watch-promotions/new')"
      >
        Nouvel événement
      </button>
    </template>

    <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{{ error }}</div>
    <div v-if="isLoading" class="text-center py-12 text-gray-500">Chargement des promotions…</div>

    <template v-else>
      <!-- Synthèse -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow p-5">
          <p class="text-xs text-gray-500 mb-1">Montres en promotion</p>
          <p class="text-2xl font-bold text-text-main">{{ summary.total }}</p>
          <p class="text-xs text-gray-500 mt-1">
            dont {{ summary.scheduledCount }} programmée{{ summary.scheduledCount > 1 ? 's' : '' }}
          </p>
        </div>
        <div class="bg-white rounded-lg shadow p-5">
          <p class="text-xs text-gray-500 mb-1">Remise moyenne</p>
          <p class="text-2xl font-bold text-primary">
            {{ summary.averageDiscount != null ? `−${summary.averageDiscount} %` : '—' }}
          </p>
          <p class="text-xs text-gray-500 mt-1">sur les remises déjà appliquées</p>
        </div>
        <div class="bg-white rounded-lg shadow p-5">
          <p class="text-xs text-gray-500 mb-1">Effort commercial</p>
          <p class="text-2xl font-bold text-text-main">{{ formatPrice(summary.totalSavings) }}</p>
          <p class="text-xs text-gray-500 mt-1">écart prix catalogue / prix promo</p>
        </div>
        <div class="bg-white rounded-lg shadow p-5">
          <p class="text-xs text-gray-500 mb-1">Valeur remisée</p>
          <p class="text-2xl font-bold text-text-main">{{ formatPrice(summary.promotedValue) }}</p>
          <p class="text-xs text-gray-500 mt-1">
            au lieu de {{ formatPrice(summary.catalogValue) }}
          </p>
        </div>
      </section>

      <!-- Par événement -->
      <section v-if="byCampaign.length" class="bg-white rounded-lg shadow p-5 mb-6">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Par événement
        </h2>
        <ul class="divide-y divide-gray-100">
          <li
            v-for="entry in byCampaign"
            :key="entry.campaign.id"
            class="py-3 flex flex-wrap items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-medium text-gray-900">{{ entry.campaign.name }}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded"
                  :class="getPromotionSourceClass(entry.campaign.status === 'active' ? 'campaign' : 'scheduled')"
                >
                  {{ entry.campaign.status === 'active' ? 'En cours' : 'À venir' }}
                </span>
              </div>
              <p class="text-sm text-gray-500 mt-0.5">
                {{ entry.count }} montre{{ entry.count > 1 ? 's' : '' }}
                · {{ scheduleLabel(entry.campaign) }}
                <span v-if="entry.savings > 0"> · {{ formatPrice(entry.savings) }} de remise</span>
              </p>
            </div>
            <button
              type="button"
              class="text-primary underline text-sm shrink-0"
              @click="router.push(`/admin/watch-promotions/${entry.campaign.id}/edit`)"
            >
              Modifier l'événement
            </button>
          </li>
        </ul>
      </section>

      <!-- Filtres -->
      <div class="bg-white rounded-lg shadow p-4 mb-6 flex flex-col lg:flex-row lg:items-center gap-4">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="filter in filters"
            :key="filter.key"
            type="button"
            class="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
            :class="
              sourceFilter === filter.key
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-cream'
            "
            @click="sourceFilter = filter.key"
          >
            {{ filter.label }}
            <span class="ml-1 text-xs opacity-80">{{ filter.count }}</span>
          </button>
        </div>
        <label
          class="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap cursor-pointer"
          :title="`${offlineCount} montre(s) remisée(s) vendue(s) ou hors catalogue`"
        >
          <input
            v-model="includeOffline"
            type="checkbox"
            class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span>Inclure les montres vendues ou hors stock ({{ offlineCount }})</span>
        </label>
        <div class="relative flex-1 lg:max-w-xs lg:ml-auto">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" :stroke-width="1.75" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher (montre, marque, événement)…"
            class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <!-- Tableau -->
      <section v-if="visibleRows.length" class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-cream-100 text-left text-gray-600">
              <tr>
                <th class="px-4 py-3 font-medium">Montre</th>
                <th class="px-4 py-3 font-medium">Origine</th>
                <th class="px-4 py-3 font-medium">Prix catalogue</th>
                <th class="px-4 py-3 font-medium">Prix promo</th>
                <th class="px-4 py-3 font-medium">Remise</th>
                <th class="px-4 py-3 font-medium">Statut</th>
                <th class="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in visibleRows" :key="row.watch.id" class="hover:bg-cream/50">
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">
                    {{ row.watch.brand }} — {{ row.watch.name }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ row.watch.reference || row.watch.model || '—' }}
                    <span v-if="row.watch.ad_code"> · {{ row.watch.ad_code }}</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span
                    class="text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap"
                    :class="getPromotionSourceClass(row.promotion.source)"
                  >
                    {{ PROMOTION_SOURCE_LABELS[row.promotion.source] }}
                  </span>
                  <div v-if="row.campaign" class="text-xs text-gray-500 mt-1">
                    {{ row.campaign.name }} · {{ scheduleLabel(row.campaign) }}
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-gray-500">
                  {{ formatPrice(row.promotion.price) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap font-semibold text-gray-900">
                  <template v-if="row.promotion.promotionPrice">
                    {{ formatPrice(row.promotion.promotionPrice) }}
                  </template>
                  <span v-else class="text-gray-400 font-normal">Pas encore appliqué</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span v-if="row.promotion.discountPercent" class="font-semibold text-primary">
                    −{{ row.promotion.discountPercent }} %
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="isOffline(row.watch) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'"
                  >
                    {{ statusLabel(row.watch) }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right">
                  <div class="flex justify-end gap-3">
                    <button
                      type="button"
                      class="text-gray-600 underline"
                      @click="router.push(`/admin/watches/${row.watch.id}/edit`)"
                    >
                      Fiche
                    </button>
                    <button
                      v-if="row.campaign"
                      type="button"
                      class="text-primary underline"
                      @click="router.push(`/admin/watch-promotions/${row.campaign.id}/edit`)"
                    >
                      Événement
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else class="bg-white rounded-lg shadow p-12 text-center">
        <BadgePercent class="w-10 h-10 mx-auto text-gray-300 mb-3" :stroke-width="1.5" />
        <h3 class="text-lg text-gray-600 mb-1">
          {{ scopedRows.length ? 'Aucune montre pour ce filtre' : 'Aucune montre en promotion' }}
        </h3>
        <p class="text-sm text-gray-500 mb-6">
          <template v-if="scopedRows.length">
            Modifiez la recherche ou choisissez une autre origine.
          </template>
          <template v-else-if="offlineCount">
            Les {{ offlineCount }} remise{{ offlineCount > 1 ? 's' : '' }} restante{{ offlineCount > 1 ? 's' : '' }}
            portent sur des montres vendues ou hors stock : cochez la case ci-dessus pour les voir.
          </template>
          <template v-else>
            Les remises apparaissent ici dès qu'un événement est appliqué ou qu'un prix promo
            est saisi sur une fiche montre.
          </template>
        </p>
        <button
          v-if="!scopedRows.length"
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover"
          @click="router.push('/admin/watch-promotions/new')"
        >
          <Watch class="w-4 h-4" :stroke-width="1.75" />
          Créer un événement promotionnel
        </button>
      </section>
    </template>
  </AdminShell>
</template>
