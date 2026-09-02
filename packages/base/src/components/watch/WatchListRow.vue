<template>
  <article
    :class="[
      'group flex items-stretch gap-3 rounded-md border border-gray-100 bg-white p-2 transition-shadow sm:gap-5 sm:p-3',
      clickable ? 'cursor-pointer hover:shadow-md' : '',
    ]"
    @click="handleRowClick"
  >
    <!-- Plaque blanche : les visuels montres gardent leur fond clair quel que soit le thème. -->
    <div
      class="relative aspect-square w-24 shrink-0 overflow-hidden rounded bg-white sm:w-32 lg:w-40"
    >
      <span
        v-if="showNewBadge"
        class="absolute top-1 left-1 z-10 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
      >
        {{ t('watch.new') }}
      </span>
      <span
        v-else-if="watchItem.isOnPromotion"
        class="absolute top-1 left-1 z-10 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
      >
        -{{ watchItem.displayDiscountPercent }} %
      </span>
      <img
        v-if="imageSrc"
        :src="imageSrc"
        :srcset="imageSrcSet"
        :sizes="imageSrcSet ? WATCH_LIST_ROW_IMAGE_SIZES : undefined"
        :alt="watchItem.name"
        :loading="imageLoading"
        :fetchpriority="imageFetchPriority"
        decoding="async"
        width="400"
        height="400"
        class="h-full w-full object-cover object-center"
      />
      <div v-else class="flex h-full w-full items-center justify-center px-2 text-center">
        <span class="text-[10px] text-gray-400 sm:text-sm">{{ t('watch.imageUnavailable') }}</span>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col justify-center gap-1 py-1 sm:gap-2">
      <div class="flex items-start gap-2">
        <h3
          class="min-w-0 flex-1 text-sm font-semibold leading-tight text-gray-900 sm:text-lg lg:text-xl"
          :title="watchItem.name"
        >
          {{ watchItem.name }}
        </h3>
        <span
          v-if="watchItem.isSold && effectiveShowSoldBadge"
          class="shrink-0 whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800 sm:text-xs"
        >
          {{ t('watch.sold') }}
        </span>
        <span
          v-else-if="isOutOfStock"
          class="shrink-0 whitespace-nowrap rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-800 sm:text-xs"
        >
          {{ t('watch.outOfStock') }}
        </span>
      </div>

      <p v-if="watchItem.brand" class="truncate text-[11px] uppercase tracking-wide text-gray-500 sm:text-xs">
        {{ watchItem.brand }}
      </p>

      <p v-if="effectiveShowReference" class="truncate text-[11px] font-light text-gray-600 sm:text-sm">
        {{ t('watch.referenceShort', { reference: watchItem.reference }) }}
      </p>

      <!-- Caractéristiques : la place manque sur mobile, la ligne y garde nom, marque et prix. -->
      <ul
        v-if="specs.length > 0"
        class="hidden flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 sm:flex"
      >
        <li
          v-for="spec in specs"
          :key="spec.id"
          class="rounded bg-cream-200 px-2 py-0.5 text-black"
        >
          {{ spec.label }}
        </li>
      </ul>
    </div>

    <div class="flex shrink-0 flex-col items-end justify-center gap-1 pl-1 sm:pl-2">
      <span
        v-if="showPrice && watchItem.isOnPromotion"
        class="text-xs font-normal text-gray-400 line-through sm:text-base"
      >
        {{ formatPrice(watchItem.price) }}
      </span>
      <span
        v-if="showPrice"
        class="whitespace-nowrap text-base font-bold text-primary sm:text-xl lg:text-2xl"
      >
        {{ formatPrice(watchItem.effectivePrice ?? watchItem.price) }}
      </span>
      <span v-if="showListYear" class="text-xs font-medium text-gray-500 sm:text-sm">
        {{ watchItem.year }}
      </span>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

import { watchCardImageUrl, buildWatchCardSrcSet } from '@/utils/watchImageUrl.js'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { isWatchOutOfStock } from '@/site/watchCatalogDisplay.js'
import { formatPrice } from '@/utils/formatters.js'
import { formatCaseSizeDisplay, normalizeCaseSizeValue } from '@/utils/caseSize'
import { t } from '@/i18n'
import { getBraceletColorLabel, getBraceletMaterialLabel, translateSpec } from '@/i18n/watchSpecs'

/** La vignette est bien plus étroite qu'une carte de grille — un seul palier suffit. */
const WATCH_LIST_ROW_IMAGE_SIZES = '(max-width: 640px) 96px, 160px'

const site = getSiteConfig()
const catalogDisplay = site.watchCatalog.display

const props = defineProps({
  watch: {
    type: Object,
    required: true,
  },
  showReference: {
    type: Boolean,
    default: true,
  },
  showSoldBadge: {
    type: Boolean,
    default: true,
  },
  showNewBadge: {
    type: Boolean,
    default: false,
  },
  showPrice: {
    type: Boolean,
    default: true,
  },
  clickable: {
    type: Boolean,
    default: true,
  },
  imageLoading: {
    type: String,
    default: 'lazy',
    validator: (v) => v === 'lazy' || v === 'eager',
  },
  imageFetchPriority: {
    type: String,
    default: 'auto',
    validator: (v) => v === 'high' || v === 'low' || v === 'auto',
  },
})

const emit = defineEmits(['viewDetails'])

const watchItem = computed(() => props.watch)

const effectiveShowReference = computed(
  () => props.showReference && catalogDisplay.showReference,
)

const effectiveShowSoldBadge = computed(
  () => props.showSoldBadge && catalogDisplay.showSoldBadge,
)

const isOutOfStock = computed(() => isWatchOutOfStock(site, watchItem.value))

/** L'année ne concerne que les catalogues de revente, comme sur la carte. */
const showListYear = computed(
  () => catalogDisplay.showResaleFields && Boolean(watchItem.value.year),
)

const imageSrc = computed(() => {
  const first = watchItem.value.images?.[0]
  if (!first) return ''
  return watchCardImageUrl(first) ?? first
})

const imageSrcSet = computed(() => buildWatchCardSrcSet(watchItem.value.images?.[0] ?? ''))

/**
 * La place gagnée par rapport à la carte sert aux caractéristiques : c'est tout
 * l'intérêt du format liste, comparer sans ouvrir chaque fiche.
 */
const specs = computed(() => {
  const details = watchItem.value.details ?? {}
  const items = []

  const caseSize = normalizeCaseSizeValue(details.caseSize)
  if (caseSize) {
    items.push({ id: 'caseSize', label: formatCaseSizeDisplay(caseSize) })
  }

  for (const slug of details.braceletMaterials ?? []) {
    items.push({ id: `material:${slug}`, label: getBraceletMaterialLabel(slug) })
  }

  for (const slug of details.braceletColors ?? []) {
    items.push({ id: `color:${slug}`, label: getBraceletColorLabel(slug) })
  }

  const content = watchItem.value.contenu || details.content
  if (catalogDisplay.showResaleFields && content) {
    items.push({ id: 'content', label: translateSpec('content', content) })
  }

  return items
})

function handleRowClick() {
  if (props.clickable) {
    emit('viewDetails', props.watch)
  }
}
</script>
