<script setup>
import { computed, watch } from 'vue'
import { buildBrandCollectionPath } from '@/utils/collectionRoutes.js'
import { useCatalogBrands, splitIntoColumns } from '@/composables/useCatalogBrands.js'
import { useMenuCampaigns } from '@/composables/useMenuCampaigns.js'

const props = defineProps({
  item: { type: Object, required: true },
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['mouseenter', 'mouseleave'])

const { brands, isLoading, error, load } = useCatalogBrands()
const {
  links: campaignLinks,
  isLoading: campaignsLoading,
  error: campaignsError,
  load: loadCampaigns,
} = useMenuCampaigns()

const hasBrandsColumn = computed(() =>
  props.item.columns?.some((column) => column.source === 'brands'),
)

const hasCampaignsColumn = computed(() =>
  props.item.columns?.some((column) => column.dynamicCampaigns),
)

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible && hasBrandsColumn.value) {
      load()
    }
    if (isVisible && hasCampaignsColumn.value) {
      loadCampaigns()
    }
  },
)

function brandColumns(column) {
  const count = column.columns ?? 1
  return splitIntoColumns(brands.value, count)
}

function brandRoute(brandName) {
  return buildBrandCollectionPath(brandName)
}

const gridClass = computed(() => {
  const count = props.item.columns?.length ?? 2
  if (count >= 3) {
    return 'grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]'
  }
  return 'grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]'
})
</script>

<template>
  <Teleport to="#header">
    <div
      v-show="visible"
      class="absolute left-0 right-0 top-full w-full border-t border-cream-200 bg-white shadow-lg z-30"
      @mouseenter="emit('mouseenter')"
      @mouseleave="emit('mouseleave')"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid gap-8 lg:gap-12" :class="gridClass">
          <template v-for="(column, columnIndex) in item.columns" :key="'col-' + columnIndex">
            <div v-if="column.source !== 'brands'" class="min-w-0">
              <RouterLink
                v-if="column.titleLink"
                :to="column.titleLink"
                class="inline-block font-heading font-semibold uppercase tracking-wide text-text-main hover:text-primary transition-colors mb-4"
              >
                {{ column.title }}
              </RouterLink>
              <p
                v-else
                class="font-heading font-semibold uppercase tracking-wide text-text-main mb-4"
              >
                {{ column.title }}
              </p>
              <ul class="space-y-2">
                <li v-for="(link, linkIndex) in column.items" :key="'link-' + linkIndex + '-' + link.to">
                  <RouterLink
                    :to="link.to"
                    class="text-sm text-text-main/85 hover:text-primary transition-colors"
                  >
                    {{ link.label }}
                  </RouterLink>
                </li>
                <template v-if="column.dynamicCampaigns">
                  <li v-if="campaignsLoading" class="text-sm text-subtle">Chargement…</li>
                  <li v-else-if="campaignsError" class="text-sm text-subtle">{{ campaignsError }}</li>
                  <li
                    v-for="campaignLink in campaignLinks"
                    :key="'campaign-' + campaignLink.slug"
                  >
                    <RouterLink
                      :to="campaignLink.to"
                      class="text-sm text-text-main/85 hover:text-primary transition-colors"
                    >
                      {{ campaignLink.label }}
                    </RouterLink>
                  </li>
                </template>
              </ul>
            </div>

            <div v-else class="min-w-0 md:col-span-1">
              <p class="font-heading font-semibold uppercase tracking-wide text-text-main mb-4">
                {{ column.title }}
              </p>

              <div v-if="isLoading" class="grid grid-cols-2 gap-x-8 gap-y-2">
                <div
                  v-for="n in 8"
                  :key="'brand-sk-' + n"
                  class="h-4 rounded bg-cream-100 animate-pulse"
                />
              </div>

              <p v-else-if="error" class="text-sm text-subtle">
                {{ error }}
              </p>

              <p v-else-if="brands.length === 0" class="text-sm text-subtle">
                Aucune marque disponible pour le moment.
              </p>

              <div
                v-else
                class="grid gap-x-8 gap-y-2"
                :class="(column.columns ?? 1) > 1 ? 'grid-cols-2' : 'grid-cols-1'"
              >
                <ul
                  v-for="(brandList, brandColumnIndex) in brandColumns(column)"
                  :key="'brand-col-' + brandColumnIndex"
                  class="space-y-2 min-w-0"
                >
                  <li v-for="brandName in brandList" :key="brandName">
                    <RouterLink
                      :to="brandRoute(brandName)"
                      class="text-sm text-text-main/85 hover:text-primary transition-colors"
                    >
                      {{ brandName }}
                    </RouterLink>
                  </li>
                </ul>
              </div>

              <RouterLink
                v-if="column.footerLink"
                :to="column.footerLink.to"
                class="inline-block mt-4 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >
                {{ column.footerLink.label }}
              </RouterLink>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
