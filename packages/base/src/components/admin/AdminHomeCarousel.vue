<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ArrowDown, ArrowUp, ChevronDown, Lightbulb, Trash2, Upload } from '@lucide/vue'

import AdminShell from './AdminShell.vue'
import {
  getHomeCarouselSlidesForAdmin,
  saveHomeCarouselChanges,
} from '@/services/admin/adminHomeCarouselService.js'
import { getAllWatchesForAdmin } from '@/services/admin/adminWatchService.js'
import { getAvailableCatalogBrands } from '@/services/watchService.js'
import { getActiveWatchPromotionCampaignsForCarousel } from '@/services/admin/adminWatchPromotionService.js'

/** @typedef {'none' | 'brand' | 'watch' | 'campaign'} LinkMode */
/** @typedef {{ id: string, image_url: string, image_path?: string, alt_text: string, brand_name: string, watch_id: string, promotion_campaign_id: string, _isNew?: false }} SavedDraftSlide */
/** @typedef {{ localId: string, previewUrl: string, file: File, alt_text: string, brand_name: string, watch_id: string, promotion_campaign_id: string, _isNew: true }} NewDraftSlide */

const savedSlides = ref(/** @type {SavedDraftSlide[]} */ ([]))
const draftSlides = ref(/** @type {(SavedDraftSlide | NewDraftSlide)[]} */ ([]))
const brands = ref([])
const watches = ref([])
const campaigns = ref([])
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref(null)
const fileInput = ref(null)

const ALT_TEXT_PLACEHOLDER = 'Ex. : Montres sport, bracelets acier'

const uploadMeta = ref({
  altText: '',
  linkMode: /** @type {LinkMode} */ ('none'),
  brandName: '',
  watchId: '',
  promotionCampaignId: '',
})

function getLinkMode(slide) {
  if (slide.watch_id) return 'watch'
  if (slide.promotion_campaign_id) return 'campaign'
  if (slide.brand_name?.trim()) return 'brand'
  return 'none'
}

function setLinkMode(slide, mode) {
  if (mode === 'none') {
    slide.brand_name = ''
    slide.watch_id = ''
    slide.promotion_campaign_id = ''
  } else if (mode === 'brand') {
    slide.watch_id = ''
    slide.promotion_campaign_id = ''
  } else if (mode === 'watch') {
    slide.brand_name = ''
    slide.promotion_campaign_id = ''
  } else if (mode === 'campaign') {
    slide.brand_name = ''
    slide.watch_id = ''
  }
}

function campaignLabel(campaignId) {
  const campaign = campaigns.value.find((entry) => entry.id === campaignId)
  return campaign?.name || 'Événement sélectionné'
}

function watchLabel(watchId) {
  const watch = watches.value.find((w) => w.id === watchId)
  if (!watch) return 'Montre sélectionnée'
  return `${watch.brand} — ${watch.name}`
}

function isAltTextValid(value) {
  return typeof value === 'string' && value.trim().length >= 3
}

const slidesWithMissingAlt = computed(() =>
  draftSlides.value
    .map((slide, index) => ({ slide, index }))
    .filter(({ slide }) => !isAltTextValid(slide.alt_text)),
)

const hasValidAltTexts = computed(() => slidesWithMissingAlt.value.length === 0)

const hasValidCampaignLinks = computed(() =>
  draftSlides.value.every((slide) => {
    if (getLinkMode(slide) !== 'campaign') return true
    if (!slide.promotion_campaign_id) return false
    return campaigns.value.some((entry) => entry.id === slide.promotion_campaign_id)
  }),
)

const canPublish = computed(() => hasChanges.value && hasValidAltTexts.value && hasValidCampaignLinks.value)

function normalizeSavedSlide(row) {
  return {
    id: row.id,
    image_url: row.image_url,
    image_path: row.image_path,
    alt_text: row.alt_text ?? '',
    brand_name: row.brand_name ?? '',
    watch_id: row.watch_id ?? '',
    promotion_campaign_id: row.promotion_campaign_id ?? '',
  }
}

function cloneSavedSlides(rows) {
  return rows.map((row) => normalizeSavedSlide(row))
}

function slidePreviewUrl(slide) {
  return slide._isNew ? slide.previewUrl : slide.image_url
}

function slideKey(slide) {
  return slide._isNew ? slide.localId : slide.id
}

function buildPayloadFromDraft() {
  const savedById = new Map(savedSlides.value.map((s) => [s.id, s]))
  const draftSavedIds = new Set(
    draftSlides.value.filter((s) => !s._isNew).map((s) => s.id),
  )

  const slideIdsToDelete = savedSlides.value
    .filter((s) => !draftSavedIds.has(s.id))
    .map((s) => s.id)

  const newSlides = draftSlides.value
    .filter((s) => s._isNew)
    .map((s) => ({
      localId: s.localId,
      file: s.file,
      alt_text: s.alt_text,
      brand_name: s.brand_name,
      watch_id: s.watch_id,
      promotion_campaign_id: s.promotion_campaign_id,
    }))

  const slideUpdates = draftSlides.value
    .filter((s) => !s._isNew)
    .filter((s) => {
      const original = savedById.get(s.id)
      if (!original) return false
      return (
        s.alt_text !== original.alt_text
        || s.brand_name !== original.brand_name
        || s.watch_id !== original.watch_id
        || s.promotion_campaign_id !== original.promotion_campaign_id
      )
    })
    .map((s) => ({
      id: s.id,
      alt_text: s.alt_text,
      brand_name: s.brand_name,
      watch_id: s.watch_id,
      promotion_campaign_id: s.promotion_campaign_id,
    }))

  const orderedRefs = draftSlides.value.map((s) =>
    s._isNew ? { localId: s.localId } : { id: s.id },
  )

  return { slideIdsToDelete, newSlides, slideUpdates, orderedRefs }
}

const hasChanges = computed(() => {
  if (draftSlides.value.length !== savedSlides.value.length) return true

  for (let i = 0; i < draftSlides.value.length; i += 1) {
    const draft = draftSlides.value[i]
    const saved = savedSlides.value[i]
    if (!saved) return true
    if (draft._isNew) return true
    if (draft.id !== saved.id) return true
    if (draft.alt_text !== saved.alt_text) return true
    if (draft.brand_name !== saved.brand_name) return true
    if (draft.watch_id !== saved.watch_id) return true
    if (draft.promotion_campaign_id !== saved.promotion_campaign_id) return true
  }

  return false
})

function revokeNewSlideUrls(slides) {
  for (const slide of slides) {
    if (slide._isNew && slide.previewUrl) {
      URL.revokeObjectURL(slide.previewUrl)
    }
  }
}

function resetDraftFromSaved() {
  revokeNewSlideUrls(draftSlides.value.filter((s) => s._isNew))
  draftSlides.value = cloneSavedSlides(savedSlides.value)
}

async function load() {
  try {
    isLoading.value = true
    error.value = null
    const [rows, catalogBrands, catalogWatches, activeCampaigns] = await Promise.all([
      getHomeCarouselSlidesForAdmin(),
      getAvailableCatalogBrands().catch(() => []),
      getAllWatchesForAdmin().catch(() => []),
      getActiveWatchPromotionCampaignsForCarousel().catch(() => []),
    ])
    revokeNewSlideUrls(draftSlides.value.filter((s) => s._isNew))
    savedSlides.value = cloneSavedSlides(rows)
    draftSlides.value = cloneSavedSlides(rows)
    brands.value = catalogBrands
    const availableWatches = catalogWatches.filter((w) => w.is_available !== false)
    const linkedWatchIds = new Set(rows.map((row) => row.watch_id).filter(Boolean))
    const linkedUnavailable = catalogWatches.filter(
      (w) => linkedWatchIds.has(w.id) && w.is_available === false,
    )
    watches.value = [...availableWatches, ...linkedUnavailable]
    campaigns.value = activeCampaigns
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

function openFilePicker() {
  fileInput.value?.click()
}

function handleUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const slide = {
    localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    _isNew: true,
    file,
    previewUrl: URL.createObjectURL(file),
    alt_text: uploadMeta.value.altText,
    brand_name: uploadMeta.value.linkMode === 'brand' ? uploadMeta.value.brandName : '',
    watch_id: uploadMeta.value.linkMode === 'watch' ? uploadMeta.value.watchId : '',
    promotion_campaign_id:
      uploadMeta.value.linkMode === 'campaign' ? uploadMeta.value.promotionCampaignId : '',
  }

  draftSlides.value.push(slide)
  uploadMeta.value = {
    altText: '',
    linkMode: 'none',
    brandName: '',
    watchId: '',
    promotionCampaignId: '',
  }
  error.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function removeAt(index) {
  const slide = draftSlides.value[index]
  if (slide?._isNew && slide.previewUrl) {
    URL.revokeObjectURL(slide.previewUrl)
  }
  draftSlides.value.splice(index, 1)
}

function moveSlide(index, direction) {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= draftSlides.value.length) return

  const reordered = [...draftSlides.value]
  const [item] = reordered.splice(index, 1)
  reordered.splice(targetIndex, 0, item)
  draftSlides.value = reordered
}

async function saveChanges() {
  if (!hasChanges.value) return

  if (!hasValidAltTexts.value) {
    error.value =
      'Chaque image doit avoir un texte alternatif descriptif avant publication.'
    return
  }

  if (!hasValidCampaignLinks.value) {
    error.value =
      'Chaque slide liée à un événement promotionnel doit pointer vers un événement en cours.'
    return
  }

  if (
    !confirm(
      'Publier les modifications du carrousel sur le site en production ?\n\nLes visiteurs verront la nouvelle version immédiatement.',
    )
  ) {
    return
  }

  isSaving.value = true
  error.value = null
  try {
    await saveHomeCarouselChanges(buildPayloadFromDraft())
    await load()
  } catch (err) {
    error.value = err.message
  } finally {
    isSaving.value = false
  }
}

function cancelChanges() {
  if (!hasChanges.value) return
  if (
    !confirm(
      'Annuler toutes les modifications non enregistrées ?\n\nLe brouillon sera réinitialisé à la version actuellement en ligne.',
    )
  ) {
    return
  }
  resetDraftFromSaved()
  error.value = null
}

onMounted(load)

onUnmounted(() => {
  revokeNewSlideUrls(draftSlides.value.filter((s) => s._isNew))
})
</script>

<template>
  <AdminShell title="Carrousel d'accueil" content-class="max-w-4xl">
    <details class="carousel-practices mb-4 overflow-hidden rounded-lg border border-primary/15 bg-white shadow-sm">
      <summary
        class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-text-main transition hover:bg-cream/60"
      >
        <Lightbulb class="h-4 w-4 shrink-0 text-primary" :stroke-width="2" aria-hidden="true" />
        <span>Les bonnes pratiques d'un carrousel</span>
        <ChevronDown
          class="carousel-practices-chevron ml-auto h-4 w-4 shrink-0 text-gray-500 transition-transform"
          :stroke-width="2"
          aria-hidden="true"
        />
      </summary>
      <div class="space-y-4 border-t border-cream-200 px-4 py-4 text-sm text-gray-600">
        <div>
          <h3 class="mb-1 font-semibold text-text-main">Nombre de visuels</h3>
          <ul class="list-disc space-y-1 pl-5">
            <li>Visez <strong>3 à 5 slides</strong> : assez pour varier les messages, sans diluer l'attention.</li>
            <li>Placez votre message le plus fort en <strong>première position</strong> (première impression + vitesse de chargement).</li>
          </ul>
        </div>

        <div>
          <h3 class="mb-1 font-semibold text-text-main">Format et poids des images</h3>
          <ul class="list-disc space-y-1 pl-5">
            <li>Ratio <strong>21:9</strong> (ex. 1920×823 px ou 1680×720 px) — le site recadre en bannière panoramique.</li>
            <li>Ciblez <strong>moins de 500 Ko</strong> par fichier ; privilégiez le <strong>WebP</strong> ou un JPEG optimisé.</li>
            <li>Gardez texte, produit et logo dans la <strong>zone centrale</strong> (bords souvent coupés sur mobile).</li>
          </ul>
        </div>

        <div>
          <h3 class="mb-1 font-semibold text-text-main">Performance (chargement)</h3>
          <ul class="list-disc space-y-1 pl-5">
            <li>La <strong>première image</strong> impacte directement la vitesse perçue de la page d'accueil : optimisez-la en priorité.</li>
            <li>Évitez les fichiers 4K ou très lourds : un visiteur en 4G attendra plusieurs secondes avant d'afficher le carrousel.</li>
          </ul>
        </div>

        <div>
          <h3 class="mb-1 font-semibold text-text-main">Contenu et liens</h3>
          <ul class="list-disc space-y-1 pl-5">
            <li>Rédigez un <strong>texte alternatif descriptif</strong> par slide (accessibilité, SEO, lecteurs d'écran).</li>
            <li>Associez une <strong>redirection</strong> uniquement si le visuel doit mener vers une collection marque ou une fiche montre précise.</li>
            <li>Préférez un visuel = un message clair (promo, marque, nouveauté) plutôt qu'un montage trop chargé.</li>
          </ul>
        </div>

        <div>
          <h3 class="mb-1 font-semibold text-text-main">Publication</h3>
          <ul class="list-disc space-y-1 pl-5">
            <li>Préparez tout le carrousel en brouillon, vérifiez l'ordre et les textes alternatifs, puis publiez en une fois.</li>
            <li>Après publication, contrôlez l'accueil sur <strong>desktop et mobile</strong>, ainsi que le clic vers la destination choisie.</li>
          </ul>
        </div>
      </div>
    </details>

    <div
      v-if="hasChanges"
      class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      Modifications non publiées — le site affiche encore la version en ligne.
    </div>

    <div v-if="error" class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-red-700">{{ error }}</div>

    <div
      v-if="hasChanges && !hasValidCampaignLinks"
      class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      Une ou plusieurs slides pointent vers un événement promotionnel inactif ou non sélectionné.
      Choisissez un événement en cours ou retirez la redirection.
    </div>

    <div
      v-if="hasChanges && !hasValidAltTexts"
      class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      Texte alternatif manquant sur
      {{ slidesWithMissingAlt.length > 1 ? 'les images' : "l'image" }}
      {{ slidesWithMissingAlt.map(({ index }) => index + 1).join(', ') }}.
      Complétez chaque champ avant de publier.
    </div>

    <div class="mb-6 rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-lg font-semibold text-text-main">Ajouter une image</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block text-sm sm:col-span-2">
          <span class="mb-1 block text-gray-600">Texte alternatif (optionnel à l'ajout)</span>
          <input
            v-model="uploadMeta.altText"
            type="text"
            class="w-full rounded-lg border px-3 py-2"
            :placeholder="ALT_TEXT_PLACEHOLDER"
          />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block text-gray-600">Redirection au clic (optionnel)</span>
          <select
            v-model="uploadMeta.linkMode"
            class="w-full rounded-lg border px-3 py-2"
            @change="uploadMeta.brandName = ''; uploadMeta.watchId = ''; uploadMeta.promotionCampaignId = ''"
          >
            <option value="none">Aucune redirection</option>
            <option value="brand">Collection marque</option>
            <option value="watch">Fiche montre</option>
            <option value="campaign">Événement promotionnel (actif)</option>
          </select>
        </label>
        <label v-if="uploadMeta.linkMode === 'brand'" class="block text-sm">
          <span class="mb-1 block text-gray-600">Marque</span>
          <select v-model="uploadMeta.brandName" class="w-full rounded-lg border px-3 py-2">
            <option value="">Choisir une marque…</option>
            <option v-for="brand in brands" :key="brand" :value="brand">{{ brand }}</option>
          </select>
        </label>
        <label v-else-if="uploadMeta.linkMode === 'watch'" class="block text-sm">
          <span class="mb-1 block text-gray-600">Montre</span>
          <select v-model="uploadMeta.watchId" class="w-full rounded-lg border px-3 py-2">
            <option value="">Choisir une montre…</option>
            <option v-for="watch in watches" :key="watch.id" :value="watch.id">
              {{ watch.brand }} — {{ watch.name }}
            </option>
          </select>
        </label>
        <label v-else-if="uploadMeta.linkMode === 'campaign'" class="block text-sm sm:col-span-2">
          <span class="mb-1 block text-gray-600">Événement en cours</span>
          <select
            v-model="uploadMeta.promotionCampaignId"
            class="w-full rounded-lg border px-3 py-2"
          >
            <option value="">Choisir un événement…</option>
            <option v-for="campaign in campaigns" :key="campaign.id" :value="campaign.id">
              {{ campaign.name }}
            </option>
          </select>
          <p v-if="campaigns.length === 0" class="mt-1 text-xs text-amber-700">
            Aucun événement promotionnel actif pour le moment.
          </p>
        </label>
      </div>
      <button
        type="button"
        class="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-hover"
        @click="openFilePicker"
      >
        <Upload class="h-4 w-4" :stroke-width="2" />
        Ajouter au brouillon
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        class="hidden"
        @change="handleUpload"
      />
    </div>

    <div v-if="isLoading" class="py-8 text-center">Chargement…</div>

    <template v-else>
      <ul class="space-y-4">
        <li
          v-for="(slide, index) in draftSlides"
          :key="slideKey(slide)"
          class="rounded-lg bg-white p-4 shadow"
        >
          <div class="mb-3 flex items-center gap-2">
            <span
              class="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-white"
              :aria-label="`Image ${index + 1}`"
            >
              {{ index + 1 }}
            </span>
            <span class="text-sm font-semibold text-text-main">Image {{ index + 1 }}</span>
            <span
              v-if="slide._isNew"
              class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
            >
              Nouveau (brouillon)
            </span>
          </div>

          <div class="flex flex-col gap-4 sm:flex-row">
            <img
              :src="slidePreviewUrl(slide)"
              :alt="slide.alt_text || `Aperçu image ${index + 1}`"
              class="h-28 w-full shrink-0 rounded object-cover sm:h-24 sm:w-40"
            />
            <div class="min-w-0 flex-1 space-y-3">
              <label class="block text-sm">
                <span class="mb-1 block text-gray-600">
                  Texte alternatif <span class="text-red-600" aria-hidden="true">*</span>
                  <span class="sr-only">(obligatoire)</span>
                </span>
                <input
                  v-model="slide.alt_text"
                  type="text"
                  required
                  minlength="3"
                  class="w-full rounded-lg border px-3 py-2"
                  :class="{ 'border-red-400 ring-1 ring-red-200': !isAltTextValid(slide.alt_text) }"
                  :placeholder="ALT_TEXT_PLACEHOLDER"
                  :aria-invalid="!isAltTextValid(slide.alt_text)"
                  :aria-describedby="`carousel-alt-error-${index}`"
                />
                <p
                  v-if="!isAltTextValid(slide.alt_text)"
                  :id="`carousel-alt-error-${index}`"
                  class="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  Texte alternatif requis (min. 3 caractères).
                </p>
              </label>
              <label class="block text-sm">
                <span class="mb-1 block text-gray-600">Redirection au clic</span>
                <select
                  :value="getLinkMode(slide)"
                  class="w-full rounded-lg border px-3 py-2"
                  @change="setLinkMode(slide, $event.target.value)"
                >
                  <option value="none">Aucune redirection</option>
                  <option value="brand">Collection marque</option>
                  <option value="watch">Fiche montre</option>
                  <option value="campaign">Événement promotionnel (actif)</option>
                </select>
              </label>
              <label v-if="getLinkMode(slide) === 'brand'" class="block text-sm">
                <span class="mb-1 block text-gray-600">Marque</span>
                <select v-model="slide.brand_name" class="w-full rounded-lg border px-3 py-2">
                  <option value="">Choisir une marque…</option>
                  <option v-for="brand in brands" :key="brand" :value="brand">{{ brand }}</option>
                </select>
              </label>
              <label v-else-if="getLinkMode(slide) === 'watch'" class="block text-sm">
                <span class="mb-1 block text-gray-600">Montre</span>
                <select v-model="slide.watch_id" class="w-full rounded-lg border px-3 py-2">
                  <option value="">Choisir une montre…</option>
                  <option v-for="watch in watches" :key="watch.id" :value="watch.id">
                    {{ watch.brand }} — {{ watch.name }}
                  </option>
                </select>
                <p
                  v-if="slide.watch_id && !watches.some((w) => w.id === slide.watch_id)"
                  class="mt-1 text-xs text-amber-700"
                >
                  Montre liée : {{ watchLabel(slide.watch_id) }} (peut-être indisponible ou vendue).
                </p>
              </label>
              <label v-else-if="getLinkMode(slide) === 'campaign'" class="block text-sm">
                <span class="mb-1 block text-gray-600">Événement en cours</span>
                <select
                  v-model="slide.promotion_campaign_id"
                  class="w-full rounded-lg border px-3 py-2"
                  :class="{
                    'border-red-400 ring-1 ring-red-200':
                      slide.promotion_campaign_id
                      && !campaigns.some((entry) => entry.id === slide.promotion_campaign_id),
                  }"
                >
                  <option value="">Choisir un événement…</option>
                  <option v-for="campaign in campaigns" :key="campaign.id" :value="campaign.id">
                    {{ campaign.name }}
                  </option>
                </select>
                <p
                  v-if="slide.promotion_campaign_id && !campaigns.some((entry) => entry.id === slide.promotion_campaign_id)"
                  class="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  Événement lié : {{ campaignLabel(slide.promotion_campaign_id) }} (inactif ou expiré).
                </p>
                <p v-else-if="campaigns.length === 0" class="mt-1 text-xs text-amber-700">
                  Aucun événement promotionnel actif pour le moment.
                </p>
              </label>
            </div>
            <div class="flex shrink-0 flex-row items-start gap-2 sm:flex-col">
              <button
                type="button"
                class="rounded-lg border p-2 hover:bg-cream disabled:opacity-40"
                :disabled="index === 0"
                :aria-label="`Monter l'image ${index + 1}`"
                @click="moveSlide(index, -1)"
              >
                <ArrowUp class="h-4 w-4" :stroke-width="2" />
              </button>
              <button
                type="button"
                class="rounded-lg border p-2 hover:bg-cream disabled:opacity-40"
                :disabled="index === draftSlides.length - 1"
                :aria-label="`Descendre l'image ${index + 1}`"
                @click="moveSlide(index, 1)"
              >
                <ArrowDown class="h-4 w-4" :stroke-width="2" />
              </button>
              <button
                type="button"
                class="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                :aria-label="`Retirer l'image ${index + 1} du brouillon`"
                @click="removeAt(index)"
              >
                <Trash2 class="h-4 w-4" :stroke-width="2" />
              </button>
            </div>
          </div>
        </li>
        <li
          v-if="draftSlides.length === 0"
          class="rounded-lg bg-white p-8 text-center text-gray-500 shadow"
        >
          Aucune image. Ajoutez la première slide au brouillon puis publiez.
        </li>
      </ul>

      <div
        class="sticky bottom-0 z-10 mt-6 flex flex-wrap items-center justify-end gap-3 rounded-lg border border-gray-200 bg-white/95 p-4 shadow backdrop-blur"
      >
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!hasChanges || isSaving"
          @click="cancelChanges"
        >
          Annuler
        </button>
        <button
          type="button"
          class="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!canPublish || isSaving"
          :title="!hasValidAltTexts && hasChanges ? 'Complétez tous les textes alternatifs' : undefined"
          @click="saveChanges"
        >
          {{ isSaving ? 'Publication…' : 'Sauvegarder' }}
        </button>
      </div>
    </template>
  </AdminShell>
</template>

<style scoped>
.carousel-practices > summary::-webkit-details-marker {
  display: none;
}

.carousel-practices > summary::marker {
  content: '';
}

.carousel-practices[open] .carousel-practices-chevron {
  transform: rotate(180deg);
}
</style>
