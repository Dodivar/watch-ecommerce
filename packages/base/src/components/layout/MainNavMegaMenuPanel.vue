<script setup>
import { computed, watch } from 'vue'
import { slugifyBrand } from '@/utils/brandSlug'
import { useCatalogBrands, splitIntoColumns } from '@/composables/useCatalogBrands.js'

const props = defineProps({
  item: { type: Object, required: true },
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['mouseenter', 'mouseleave'])

const { brands, isLoading, error, load } = useCatalogBrands()

const hasBrandsColumn = computed(() =>
  props.item.columns?.some((column) => column.source === 'brands'),
)

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible && hasBrandsColumn.value) {
      load()
    }
  },
)

function brandColumns(column) {
  const count = column.columns ?? 1
  return splitIntoColumns(brands.value, count)
}

function brandRoute(brandName) {
  return { path: '/collection', query: { marque: slugifyBrand(brandName) } }
}
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
        <div class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-8 lg:gap-12">
          <template v-for="(column, columnIndex) in item.columns" :key="'col-' + columnIndex">
            <div v-if="column.source !== 'brands'" class="min-w-0">
              <p class="font-heading font-semibold uppercase tracking-wide text-text-main mb-4">
                {{ column.title }}
              </p>
              <ul class="space-y-2">
                <li v-for="(link, linkIndex) in column.items" :key="'link-' + linkIndex + '-' + link.to">
                  <RouterLink
                    :to="link.to"
                    class="text-sm text-gray-700 hover:text-primary transition-colors"
                  >
                    {{ link.label }}
                  </RouterLink>
                </li>
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

              <p v-else-if="error" class="text-sm text-gray-500">
                {{ error }}
              </p>

              <p v-else-if="brands.length === 0" class="text-sm text-gray-500">
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
                      class="text-sm text-gray-700 hover:text-primary transition-colors"
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
