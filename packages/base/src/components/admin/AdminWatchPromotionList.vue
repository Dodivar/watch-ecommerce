<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown, ArrowUp, ChevronDown } from '@lucide/vue'
import {
  getWatchPromotionCampaignsForAdmin,
  getWatchPromotionDraftsForAdmin,
  endWatchPromotionCampaignEarly,
  getWatchPromotionMenuConfigForAdmin,
  saveWatchPromotionMenuConfig,
} from '@/services/admin/adminWatchPromotionService'
import {
  getCampaignStatusLabel,
  resolveLiveCampaignStatus,
} from '@/utils/watchPromotionCampaign.js'
import { buildCampaignCollectionQuery } from '@/services/watchPromotionCampaignService.js'
import AdminShell from './AdminShell.vue'

const router = useRouter()
const campaigns = ref([])
const drafts = ref([])
const isLoading = ref(true)
const error = ref(null)

const menuEntries = ref([])
const savedMenuEntries = ref([])
const isMenuLoading = ref(false)
const isMenuSaving = ref(false)
const menuError = ref(null)
const menuSuccess = ref(null)

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function liveStatus(campaign) {
  return resolveLiveCampaignStatus(campaign)
}

function statusClass(status) {
  const map = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-amber-50 text-amber-800',
    active: 'bg-green-50 text-green-800',
    ended: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-50 text-red-700',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

const currentCampaigns = computed(() =>
  campaigns.value.filter((c) => {
    const s = liveStatus(c)
    return s === 'active' || s === 'scheduled'
  }),
)

const pastCampaigns = computed(() =>
  campaigns.value.filter((c) => {
    const s = liveStatus(c)
    return s === 'ended' || s === 'cancelled'
  }),
)

const menuConfigurableEntries = computed(() =>
  [...menuEntries.value]
    .filter((entry) => {
      const status = entry.liveStatus || resolveLiveCampaignStatus(entry)
      return status === 'active' || status === 'scheduled'
    })
    .sort((a, b) => a.menuOrder - b.menuOrder),
)

const hasMenuChanges = computed(() => {
  const savedById = new Map(savedMenuEntries.value.map((entry) => [entry.id, entry]))
  if (menuEntries.value.length !== savedMenuEntries.value.length) return true
  return menuEntries.value.some((entry) => {
    const saved = savedById.get(entry.id)
    if (!saved) return true
    return (
      entry.showInMenu !== saved.showInMenu
      || (entry.menuLabel ?? '') !== (saved.menuLabel ?? '')
      || entry.menuOrder !== saved.menuOrder
    )
  })
})

function cloneMenuEntries(rows) {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    liveStatus: row.liveStatus || resolveLiveCampaignStatus(row),
    showInMenu: Boolean(row.showInMenu),
    menuLabel: row.menuLabel ?? '',
    menuOrder: row.menuOrder ?? 0,
  }))
}

function canShowInMenu(entry) {
  const status = entry.liveStatus || resolveLiveCampaignStatus(entry)
  return status === 'active' || status === 'scheduled'
}

function menuPreviewUrl(entry) {
  if (!entry.slug) return null
  return buildCampaignCollectionQuery(entry.slug)
}

async function loadMenuConfig() {
  try {
    isMenuLoading.value = true
    menuError.value = null
    const rows = await getWatchPromotionMenuConfigForAdmin()
    menuEntries.value = cloneMenuEntries(rows)
    savedMenuEntries.value = cloneMenuEntries(rows)
  } catch (err) {
    menuError.value = err.message
  } finally {
    isMenuLoading.value = false
  }
}

async function load() {
  try {
    isLoading.value = true
    error.value = null
    const [list, draftList] = await Promise.all([
      getWatchPromotionCampaignsForAdmin(),
      getWatchPromotionDraftsForAdmin(),
    ])
    campaigns.value = list
    drafts.value = draftList
    await loadMenuConfig()
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

async function endCampaign(campaign) {
  const isScheduled = liveStatus(campaign) === 'scheduled'
  const message = isScheduled
    ? `Annuler l'événement « ${campaign.name} » avant son démarrage ?`
    : `Terminer l'événement « ${campaign.name} » maintenant ? Les remises seront désactivées.`

  if (!confirm(message)) return
  try {
    error.value = null
    await endWatchPromotionCampaignEarly(campaign.id)
    await load()
  } catch (err) {
    error.value = err.message
  }
}

function moveMenuEntry(index, direction) {
  const configurable = [...menuConfigurableEntries.value]
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= configurable.length) return

  const reordered = [...configurable]
  const [item] = reordered.splice(index, 1)
  reordered.splice(targetIndex, 0, item)

  reordered.forEach((entry, order) => {
    const match = menuEntries.value.find((row) => row.id === entry.id)
    if (match) match.menuOrder = order
  })
}

function resetMenuDraft() {
  menuEntries.value = cloneMenuEntries(savedMenuEntries.value)
  menuError.value = null
  menuSuccess.value = null
}

async function saveMenuConfig() {
  if (!hasMenuChanges.value) return

  isMenuSaving.value = true
  menuError.value = null
  menuSuccess.value = null

  try {
    await saveWatchPromotionMenuConfig(
      menuEntries.value.map((entry) => ({
        id: entry.id,
        showInMenu: canShowInMenu(entry) ? entry.showInMenu : false,
        menuLabel: entry.menuLabel,
        menuOrder: entry.menuOrder,
        liveStatus: entry.liveStatus,
        startsAt: entry.startsAt,
        endsAt: entry.endsAt,
        status: entry.status,
      })),
    )
    await loadMenuConfig()
    menuSuccess.value = 'Menu promotions mis à jour.'
  } catch (err) {
    menuError.value = err.message
  } finally {
    isMenuSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminShell title="Promotions montres" content-class="max-w-5xl">
    <template #actions>
      <button
        type="button"
        class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover"
        @click="router.push('/admin/watch-promotions/new')"
      >
        Nouvel événement
      </button>
    </template>

    <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{{ error }}</div>
    <div v-if="isLoading" class="text-center py-12 text-gray-500">Chargement…</div>

    <template v-else>
      <section v-if="drafts.length" class="mb-8">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Brouillons ({{ drafts.length }})
        </h2>
        <div class="bg-white rounded-lg shadow divide-y">
          <div
            v-for="draft in drafts"
            :key="draft.id"
            class="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
          >
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-semibold text-gray-900">{{ draft.name }}</span>
                <span class="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">Brouillon</span>
              </div>
              <p class="text-sm text-gray-500 mt-1">
                {{ draft.itemCount }} montre{{ draft.itemCount > 1 ? 's' : '' }} · modifié le {{ formatDate(draft.updatedAt) }}
              </p>
            </div>
            <div class="flex shrink-0 gap-3">
              <button
                type="button"
                class="text-primary underline text-sm"
                @click="router.push(`/admin/watch-promotions/${draft.id}/review`)"
              >
                Récapitulatif
              </button>
              <button
                type="button"
                class="text-gray-600 underline text-sm"
                @click="router.push(`/admin/watch-promotions/${draft.id}/edit`)"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          En cours / à venir ({{ currentCampaigns.length }})
        </h2>
        <div class="bg-white rounded-lg shadow divide-y">
          <div
            v-for="c in currentCampaigns"
            :key="c.id"
            class="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
          >
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-semibold text-gray-900">{{ c.name }}</span>
                <span class="text-xs px-2 py-0.5 rounded" :class="statusClass(liveStatus(c))">
                  {{ getCampaignStatusLabel(liveStatus(c)) }}
                </span>
                <span class="text-sm text-gray-500">−{{ c.defaultDiscountPercent }} %</span>
              </div>
              <p class="text-sm text-gray-500 mt-1">
                {{ formatDate(c.startsAt) }} → {{ c.endsAt ? formatDate(c.endsAt) : 'Sans fin' }}
                · {{ c.itemCount }} montre{{ c.itemCount > 1 ? 's' : '' }}
                <span v-if="c.slug" class="text-gray-400"> · /collection?event={{ c.slug }}</span>
              </p>
            </div>
            <div class="flex shrink-0 gap-3">
              <button
                type="button"
                class="text-primary underline text-sm"
                @click="router.push(`/admin/watch-promotions/${c.id}/edit`)"
              >
                Modifier
              </button>
              <button
                v-if="liveStatus(c) === 'active' || liveStatus(c) === 'scheduled'"
                type="button"
                class="text-red-600 underline text-sm"
                @click="endCampaign(c)"
              >
                {{ liveStatus(c) === 'scheduled' ? 'Annuler' : 'Terminer' }}
              </button>
            </div>
          </div>
          <div v-if="currentCampaigns.length === 0" class="p-8 text-center text-gray-500">
            Aucun événement en cours.
          </div>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Passés ({{ pastCampaigns.length }})
        </h2>
        <div class="bg-white rounded-lg shadow divide-y">
          <div
            v-for="c in pastCampaigns"
            :key="c.id"
            class="p-4 opacity-80"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold text-gray-700">{{ c.name }}</span>
              <span class="text-xs px-2 py-0.5 rounded" :class="statusClass(liveStatus(c))">
                {{ getCampaignStatusLabel(liveStatus(c)) }}
              </span>
            </div>
            <p class="text-sm text-gray-400 mt-1">
              {{ formatDate(c.startsAt) }} → {{ c.endsAt ? formatDate(c.endsAt) : 'Sans fin' }}
              · {{ c.itemCount }} montre{{ c.itemCount > 1 ? 's' : '' }}
            </p>
          </div>
          <div v-if="pastCampaigns.length === 0" class="p-8 text-center text-gray-500">
            Aucun événement passé.
          </div>
        </div>
      </section>

      <details class="overflow-hidden rounded-lg border border-primary/15 bg-white shadow-sm">
        <summary
          class="flex cursor-pointer list-none items-center gap-2 px-4 py-4 text-sm font-semibold text-text-main transition hover:bg-cream/60"
        >
          <span>Modifier le menu promotions</span>
          <ChevronDown
            class="menu-editor-chevron ml-auto h-4 w-4 shrink-0 text-gray-500 transition-transform"
            :stroke-width="2"
            aria-hidden="true"
          />
        </summary>

        <div class="border-t border-cream-200 px-4 py-4">
          <p class="mb-4 text-sm text-gray-600">
            Ajoutez des liens vers vos événements actifs dans la colonne « Promotions » du menu principal.
            Les entrées statiques déjà configurées (ex. Promotions homme / femme) restent affichées.
            Seuls les événements <strong>en cours</strong> apparaissent sur le site ; vous pouvez les préparer à l'avance s'ils sont <strong>à venir</strong>.
          </p>

          <div v-if="menuError" class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ menuError }}
          </div>
          <div
            v-if="menuSuccess"
            class="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            {{ menuSuccess }}
          </div>

          <div v-if="isMenuLoading" class="py-6 text-center text-sm text-gray-500">Chargement…</div>

          <template v-else>
            <div
              v-if="menuConfigurableEntries.length === 0"
              class="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500"
            >
              Aucun événement en cours ou à venir à afficher dans le menu.
            </div>

            <ul v-else class="space-y-3">
              <li
                v-for="(entry, index) in menuConfigurableEntries"
                :key="entry.id"
                class="rounded-lg border border-gray-200 p-4"
              >
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div class="min-w-0 flex-1 space-y-3">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-semibold text-gray-900">{{ entry.name }}</span>
                      <span
                        class="text-xs px-2 py-0.5 rounded"
                        :class="statusClass(entry.liveStatus)"
                      >
                        {{ getCampaignStatusLabel(entry.liveStatus) }}
                      </span>
                    </div>

                    <label class="flex items-center gap-2 text-sm">
                      <input
                        v-model="entry.showInMenu"
                        type="checkbox"
                        class="rounded border-gray-300"
                        :disabled="!canShowInMenu(entry)"
                      />
                      <span>Visible dans le menu</span>
                    </label>

                    <label class="block text-sm">
                      <span class="mb-1 block text-gray-600">Libellé dans le menu (optionnel)</span>
                      <input
                        v-model="entry.menuLabel"
                        type="text"
                        class="w-full rounded-lg border px-3 py-2"
                        :placeholder="entry.name"
                        :disabled="!entry.showInMenu"
                      />
                    </label>

                    <p v-if="entry.slug && entry.showInMenu" class="text-xs text-gray-500">
                      Lien : {{ menuPreviewUrl(entry) }}
                    </p>
                    <p
                      v-if="entry.liveStatus === 'scheduled' && entry.showInMenu"
                      class="text-xs text-amber-700"
                    >
                      Le lien sera visible dès le début de l'événement.
                    </p>
                  </div>

                  <div class="flex shrink-0 flex-row gap-2 sm:flex-col">
                    <button
                      type="button"
                      class="rounded-lg border p-2 hover:bg-cream disabled:opacity-40"
                      :disabled="index === 0"
                      aria-label="Monter dans le menu"
                      @click="moveMenuEntry(index, -1)"
                    >
                      <ArrowUp class="h-4 w-4" :stroke-width="2" />
                    </button>
                    <button
                      type="button"
                      class="rounded-lg border p-2 hover:bg-cream disabled:opacity-40"
                      :disabled="index === menuConfigurableEntries.length - 1"
                      aria-label="Descendre dans le menu"
                      @click="moveMenuEntry(index, 1)"
                    >
                      <ArrowDown class="h-4 w-4" :stroke-width="2" />
                    </button>
                  </div>
                </div>
              </li>
            </ul>

            <div class="mt-4 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-cream disabled:opacity-40"
                :disabled="!hasMenuChanges || isMenuSaving"
                @click="resetMenuDraft"
              >
                Annuler
              </button>
              <button
                type="button"
                class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-40"
                :disabled="!hasMenuChanges || isMenuSaving"
                @click="saveMenuConfig"
              >
                {{ isMenuSaving ? 'Enregistrement…' : 'Enregistrer le menu' }}
              </button>
            </div>
          </template>
        </div>
      </details>
    </template>
  </AdminShell>
</template>

<style scoped>
details > summary::-webkit-details-marker {
  display: none;
}

details > summary::marker {
  content: '';
}

details[open] .menu-editor-chevron {
  transform: rotate(180deg);
}
</style>
