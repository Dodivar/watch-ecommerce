<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[9999] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="watch-filters-drawer-title"
    >
      <div
        class="absolute inset-0 bg-black/50 transition-opacity"
        aria-hidden="true"
        @click="onClose"
      />
      <aside
        class="relative flex h-full w-full max-w-full flex-col bg-white shadow-2xl sm:max-w-md md:min-w-[380px] md:max-w-lg lg:min-w-[420px] lg:max-w-xl xl:min-w-[460px] xl:max-w-2xl animate-drawer-in"
      >
        <header class="flex shrink-0 items-center gap-3 border-b border-gray-200 px-4 py-4">
          <button
            type="button"
            class="rounded-lg p-2 text-gray-600 hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-primary"
            :aria-label="t('collection.closeFilters')"
            @click="onClose"
          >
            <ChevronLeft class="h-6 w-6" :stroke-width="2" />
          </button>
          <h2 id="watch-filters-drawer-title" class="text-lg font-bold text-text-main">
            {{ t('collection.filterProducts') }}
          </h2>
        </header>

        <div
          class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-2"
        >
          <!-- Marque -->
          <section v-if="sections.brand" class="border-b border-gray-100">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 py-4 text-left"
              @click="toggleSection('brand')"
            >
              <span class="flex items-center gap-2 font-medium text-text-main">
                {{ t('collection.brand') }}
                <span
                  v-if="listing.getDraftSectionCount('brand') > 0"
                  class="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-text-main px-1.5 py-0.5 text-xs font-semibold text-white"
                >
                  {{ listing.getDraftSectionCount('brand') }}
                </span>
              </span>
              <ChevronDown
                class="h-5 w-5 shrink-0 text-gray-500 transition-transform"
                :class="{ 'rotate-180': expanded.brand }"
                :stroke-width="2"
              />
            </button>
            <div v-show="expanded.brand" class="pb-4">
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="brand in listing.availableBrands"
                  :key="brand"
                  type="button"
                  class="rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors"
                  :class="
                    listing.tempSelectedBrands.includes(brand)
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-text-main hover:border-primary'
                  "
                  @click="listing.toggleBrand(brand)"
                >
                  {{ brand }}
                </button>
              </div>
            </div>
          </section>

          <!-- Prix -->
          <section v-if="sections.price" class="border-b border-gray-100">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 py-4 text-left"
              @click="toggleSection('price')"
            >
              <span class="flex items-center gap-2 font-medium text-text-main">
                {{ t('collection.price') }}
                <span
                  v-if="listing.getDraftSectionCount('price') > 0"
                  class="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-text-main px-1.5 py-0.5 text-xs font-semibold text-white"
                >
                  {{ listing.getDraftSectionCount('price') }}
                </span>
              </span>
              <ChevronDown
                class="h-5 w-5 shrink-0 text-gray-500 transition-transform"
                :class="{ 'rotate-180': expanded.price }"
                :stroke-width="2"
              />
            </button>
            <div v-show="expanded.price" class="space-y-4 pb-4">
              <!-- <div>
                <label class="mb-2 block text-sm font-medium text-gray-700">{{ t('collection.popularPrices') }}</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="quickPrice in listing.quickPriceRanges"
                    :key="quickPrice.id"
                    type="button"
                    class="rounded-lg border px-3 py-2 text-sm transition-colors"
                    :class="
                      listing.isQuickPriceSelected(quickPrice)
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300 bg-white text-text-main hover:border-primary'
                    "
                    @click="listing.applyQuickPrice(quickPrice)"
                  >
                    {{ quickPrice.label }}
                  </button>
                </div>
              </div> -->
              <div class="watch-filters-price-slider mt-6 max-w-full px-8 pt-10 pb-1 sm:px-10">
                <Slider
                  v-model="priceRangeModel"
                  :min="listing.priceMinLimit"
                  :max="listing.priceMaxLimit"
                  :step="10"
                  :tooltips="true"
                  :format="{ suffix: ' €', decimals: 0, thousand: ' ' }"
                  class="w-full max-w-full min-w-0"
                />
                <div class="mt-2 flex justify-between text-xs text-gray-500">
                  <span>{{ listing.priceMinLimit.toLocaleString() }} €</span>
                  <span>{{ listing.priceMaxLimit.toLocaleString() }} €</span>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('collection.minimum') }}</label>
                  <div class="relative">
                    <input
                      v-model.number="listing.tempPriceMinInput"
                      type="number"
                      :min="listing.priceMinLimit"
                      :max="listing.priceMaxLimit"
                      class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
                      @blur="listing.updatePriceFromInput"
                    />
                    <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                  </div>
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('collection.maximum') }}</label>
                  <div class="relative">
                    <input
                      v-model.number="listing.tempPriceMaxInput"
                      type="number"
                      :min="listing.priceMinLimit"
                      :max="listing.priceMaxLimit"
                      class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
                      @blur="listing.updatePriceFromInput"
                    />
                    <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                  </div>
                </div>
              </div>
              <!-- <p class="text-sm text-gray-600">
                {{ listing.getDraftFilteredCount() }} résultat{{
                  listing.getDraftFilteredCount() > 1 ? 's' : ''
                }}
              </p> -->
            </div>
          </section>

          <!-- Diamètre du boîtier -->
          <section v-if="sections.caseSize" class="border-b border-gray-100">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 py-4 text-left"
              @click="toggleSection('caseSize')"
            >
              <span class="flex items-center gap-2 font-medium text-text-main">
                {{ t('collection.caseSize') }}
                <span
                  v-if="listing.getDraftSectionCount('caseSize') > 0"
                  class="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-text-main px-1.5 py-0.5 text-xs font-semibold text-white"
                >
                  {{ listing.getDraftSectionCount('caseSize') }}
                </span>
              </span>
              <ChevronDown
                class="h-5 w-5 shrink-0 text-gray-500 transition-transform"
                :class="{ 'rotate-180': expanded.caseSize }"
                :stroke-width="2"
              />
            </button>
            <div v-show="expanded.caseSize" class="pb-4">
              <p v-if="listing.availableCaseSizes.length === 0" class="text-sm text-gray-500">
                {{ t('collection.noCaseSize') }}
              </p>
              <div v-else class="flex flex-wrap gap-2">
                <button
                  v-for="size in listing.availableCaseSizes"
                  :key="size"
                  type="button"
                  class="rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors"
                  :class="
                    listing.tempSelectedCaseSizes.includes(size)
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-text-main hover:border-primary'
                  "
                  @click="listing.toggleCaseSize(size)"
                >
                  {{ formatCaseSizeLabel(size) }}
                </button>
              </div>
            </div>
          </section>

          <!-- Couleur du bracelet -->
          <section v-if="sections.braceletColor" class="border-b border-gray-100">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 py-4 text-left"
              @click="toggleSection('braceletColor')"
            >
              <span class="flex items-center gap-2 font-medium text-text-main">
                {{ t('collection.braceletColor') }}
                <span
                  v-if="listing.getDraftSectionCount('braceletColor') > 0"
                  class="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-text-main px-1.5 py-0.5 text-xs font-semibold text-white"
                >
                  {{ listing.getDraftSectionCount('braceletColor') }}
                </span>
              </span>
              <ChevronDown
                class="h-5 w-5 shrink-0 text-gray-500 transition-transform"
                :class="{ 'rotate-180': expanded.braceletColor }"
                :stroke-width="2"
              />
            </button>
            <div v-show="expanded.braceletColor" class="pb-4">
              <p
                v-if="listing.availableBraceletColors.length === 0"
                class="text-sm text-gray-500"
              >
                {{ t('collection.noBraceletColor') }}
              </p>
              <div v-else class="flex flex-wrap gap-5">
                <button
                  v-for="color in listing.availableBraceletColors"
                  :key="color.slug"
                  type="button"
                  class="flex flex-col items-center gap-1.5 focus:outline-none"
                  :aria-pressed="listing.tempSelectedBraceletColors.includes(color.slug)"
                  :title="getBraceletColorLabel(color.slug)"
                  @click="listing.toggleBraceletColor(color.slug)"
                >
                  <span
                    class="relative inline-flex h-11 w-11 items-center justify-center rounded-full ring-offset-2 transition-all"
                    :class="
                      listing.tempSelectedBraceletColors.includes(color.slug)
                        ? 'ring-2 ring-primary'
                        : 'ring-1 ring-gray-300 hover:ring-gray-400'
                    "
                  >
                    <span
                      class="h-9 w-9 rounded-full shadow-inner"
                      :style="{ backgroundImage: color.gradient }"
                    />
                    <svg
                      v-if="listing.tempSelectedBraceletColors.includes(color.slug)"
                      class="absolute h-5 w-5 text-white drop-shadow"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="3"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span class="text-xs text-text-main">{{ getBraceletColorLabel(color.slug) }}</span>
                </button>
              </div>
            </div>
          </section>

          <!-- Matière du bracelet -->
          <section v-if="sections.braceletMaterial" class="border-b border-gray-100">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 py-4 text-left"
              @click="toggleSection('braceletMaterial')"
            >
              <span class="flex items-center gap-2 font-medium text-text-main">
                {{ t('collection.braceletMaterial') }}
                <span
                  v-if="listing.getDraftSectionCount('braceletMaterial') > 0"
                  class="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-text-main px-1.5 py-0.5 text-xs font-semibold text-white"
                >
                  {{ listing.getDraftSectionCount('braceletMaterial') }}
                </span>
              </span>
              <ChevronDown
                class="h-5 w-5 shrink-0 text-gray-500 transition-transform"
                :class="{ 'rotate-180': expanded.braceletMaterial }"
                :stroke-width="2"
              />
            </button>
            <div v-show="expanded.braceletMaterial" class="pb-4">
              <p
                v-if="listing.availableBraceletMaterials.length === 0"
                class="text-sm text-gray-500"
              >
                {{ t('collection.noBraceletMaterial') }}
              </p>
              <div v-else class="flex flex-wrap gap-2">
                <button
                  v-for="material in listing.availableBraceletMaterials"
                  :key="material.slug"
                  type="button"
                  class="rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors"
                  :class="
                    listing.tempSelectedBraceletMaterials.includes(material.slug)
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-text-main hover:border-primary'
                  "
                  @click="listing.toggleBraceletMaterial(material.slug)"
                >
                  {{ getBraceletMaterialLabel(material.slug) }}
                </button>
              </div>
            </div>
          </section>

          <!-- Public -->
          <section v-if="sections.audience" class="border-b border-gray-100">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 py-4 text-left"
              @click="toggleSection('audience')"
            >
              <span class="flex items-center gap-2 font-medium text-text-main">
                {{ t('collection.audience') }}
                <span
                  v-if="listing.getDraftSectionCount('audience') > 0"
                  class="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-text-main px-1.5 py-0.5 text-xs font-semibold text-white"
                >
                  {{ listing.getDraftSectionCount('audience') }}
                </span>
              </span>
              <ChevronDown
                class="h-5 w-5 shrink-0 text-gray-500 transition-transform"
                :class="{ 'rotate-180': expanded.audience }"
                :stroke-width="2"
              />
            </button>
            <div v-show="expanded.audience" class="flex flex-wrap gap-2 pb-4">
              <button
                v-for="opt in audienceOptions"
                :key="opt.id"
                type="button"
                class="rounded-md border px-3 py-2 text-sm font-medium transition-colors"
                :class="
                  listing.tempAudience === opt.id
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 bg-white text-text-main hover:border-primary'
                "
                @click="listing.tempAudience = opt.id"
              >
                {{ opt.label }}
              </button>
            </div>
          </section>

          <!-- Promotion -->
          <section v-if="sections.promotion" class="border-b border-gray-100">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 py-4 text-left"
              @click="toggleSection('promotion')"
            >
              <span class="flex items-center gap-2 font-medium text-text-main">
                Promotion
                <span
                  v-if="listing.getDraftSectionCount('promotion') > 0"
                  class="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-text-main px-1.5 py-0.5 text-xs font-semibold text-white"
                >
                  {{ listing.getDraftSectionCount('promotion') }}
                </span>
              </span>
              <ChevronDown
                class="h-5 w-5 shrink-0 text-gray-500 transition-transform"
                :class="{ 'rotate-180': expanded.promotion }"
                :stroke-width="2"
              />
            </button>
            <div v-show="expanded.promotion" class="flex flex-wrap gap-2 pb-4">
              <button
                v-for="opt in promotionOptions"
                :key="String(opt.id)"
                type="button"
                class="rounded-md border px-3 py-2 text-sm font-medium transition-colors"
                :class="
                  listing.tempPromotionOnly === opt.id
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 bg-white text-text-main hover:border-primary'
                "
                @click="listing.tempPromotionOnly = opt.id"
              >
                {{ opt.label }}
              </button>
            </div>
          </section>
        </div>

        <footer
          class="flex shrink-0 gap-3 border-t border-gray-200 bg-white px-4 py-4 safe-area-pb"
        >
          <button
            type="button"
            class="flex-1 rounded-lg border border-primary bg-white py-3 text-sm font-semibold uppercase tracking-wide text-primary hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-primary"
            @click="handleClear"
          >
            Effacer
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            @click="handleApply"
          >
            {{ t('collection.applyFilters') }} ({{ listing.draftFilterCount }})
          </button>
        </footer>
      </aside>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted, onUnmounted } from 'vue'
import { ChevronDown, ChevronLeft } from '@lucide/vue'
import { getWatchAudiencesForCollectionFilter } from '@/services/watchService'
import { formatCaseSizeDisplay } from '@/utils/caseSize'
import { getBraceletColorLabel } from '@/constants/watchBraceletColors'
import { getBraceletMaterialLabel } from '@/constants/watchBraceletMaterials'
import Slider from '@vueform/slider'
import '@vueform/slider/themes/default.css'
import { t } from '@/i18n'

const props = defineProps({
  open: { type: Boolean, default: false },
  /** Réactif retourné par `useWatchListing` */
  listing: { type: Object, required: true },
  /** Sections affichées (depuis `getMergedCollectionFilters` + contexte route) */
  sections: {
    type: Object,
    default: () => ({
      price: true,
      brand: true,
      audience: true,
      caseSize: true,
      braceletColor: true,
      braceletMaterial: true,
      promotion: true,
    }),
  },
})

const promotionOptions = [
  { id: false, label: t('collection.allFemale') },
  { id: true, label: 'En promotion' },
]

function formatCaseSizeLabel(size) {
  return formatCaseSizeDisplay(size)
}

const emit = defineEmits(['close', 'applied'])

/** @type {import('vue').Ref<Array<{ id: string, label: string }>>} */
const audienceOptions = ref([{ id: 'all', label: t('collection.allMale') }])

async function loadAudienceFilterOptions() {
  const rows = await getWatchAudiencesForCollectionFilter()
  audienceOptions.value = [{ id: 'all', label: t('collection.allMale') }, ...rows]
}

const expanded = reactive({
  brand: false,
  price: false,
  caseSize: false,
  braceletColor: false,
  braceletMaterial: false,
  audience: false,
  promotion: false,
})

function toggleSection(key) {
  expanded[key] = !expanded[key]
}

const priceRangeModel = computed({
  get() {
    return props.listing.tempPriceRange
  },
  set(val) {
    if (Array.isArray(val) && val.length === 2) {
      props.listing.tempPriceRange = [val[0], val[1]]
    }
  },
})

function onClose() {
  emit('close')
}

function handleApply() {
  const result = props.listing.applyDrawerFilters()
  emit('applied', result)
}

function handleClear() {
  props.listing.clearDraftFilters()
  const result = props.listing.applyDrawerFilters()
  emit('applied', result)
}

function onEscape(e) {
  if (e.key === 'Escape' && props.open) {
    onClose()
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      expanded.brand = false
      expanded.price = false
      expanded.caseSize = false
      expanded.braceletColor = false
      expanded.braceletMaterial = false
      expanded.audience = false
      expanded.promotion = false
      document.addEventListener('keydown', onEscape)
    } else {
      document.removeEventListener('keydown', onEscape)
    }
  },
)

onMounted(() => {
  loadAudienceFilterOptions()
  if (props.open) document.addEventListener('keydown', onEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onEscape)
})
</script>

<style scoped>
@keyframes drawer-slide-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.animate-drawer-in {
  animation: drawer-slide-in 0.25s ease-out;
}

/* Espace pour les tooltips au-dessus des poignées + tooltips un peu plus compacts pour rester dans le tiroir */
.watch-filters-price-slider {
  --slider-tooltip-font-size: 0.75rem;
  --slider-tooltip-line-height: 1.125rem;
  --slider-tooltip-px: 4px;
  --slider-tooltip-py: 2px;
}

:deep(.slider-connect) {
  background: var(--color-primary, #0f2a1d);
}

:deep(.slider-handle) {
  background: var(--color-primary, #0f2a1d);
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

:deep(.slider-handle:hover) {
  background: var(--color-primary-hover, #163d2a);
}

:deep(.slider-tooltip) {
  background: var(--color-primary, #0f2a1d);
  border: 1px solid var(--color-primary, #0f2a1d);
  color: white;
}

:deep(.slider-horizontal .slider-tooltip-top::before) {
  border-top-color: var(--color-primary, #0f2a1d);
}

.safe-area-pb {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
</style>
