<template>
  <!--
    Le squelette et la grille partagent `layout.containerClass` : c'est la seule
    façon de garantir qu'ils ne sautent pas l'un par rapport à l'autre.
  -->
  <div v-if="isLoading" :class="layout.containerClass">
    <template v-if="layout.variant === 'list'">
      <WatchListRowSkeleton v-for="n in skeletonItems" :key="`skeleton-${n}`" />
    </template>
    <template v-else>
      <WatchCardSkeleton
        v-for="n in skeletonItems"
        :key="`skeleton-${n}`"
        :show-reference="layout.cardProps.showReference !== false"
        :show-sold-badge="true"
        :show-price="true"
        :image-aspect-class="layout.imageAspectClass"
        :density="layout.cardProps.density || 'default'"
      />
    </template>
  </div>

  <div v-else :class="layout.containerClass">
    <template v-if="layout.variant === 'list'">
      <WatchListRow
        v-for="(item, index) in watches"
        :key="item.id"
        :watch="item"
        :show-new-badge="isNouvelle(item.id)"
        :image-loading="index < layout.eagerImageCount ? 'eager' : 'lazy'"
        :image-fetch-priority="index === 0 ? 'high' : 'auto'"
        class="animate-fade-in"
        @viewDetails="emit('viewDetails', $event)"
      />
    </template>
    <template v-else>
      <WatchCard
        v-for="(item, index) in watches"
        :key="item.id"
        v-bind="layout.cardProps"
        :watch="item"
        :image-aspect-class="layout.imageAspectClass"
        :show-new-badge="isNouvelle(item.id)"
        :image-loading="index < layout.eagerImageCount ? 'eager' : 'lazy'"
        :image-fetch-priority="index === 0 ? 'high' : 'auto'"
        class="animate-fade-in"
        @viewDetails="emit('viewDetails', $event)"
      />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

import WatchCard from './WatchCard.vue'
import WatchCardSkeleton from './WatchCardSkeleton.vue'
import WatchListRow from './WatchListRow.vue'
import WatchListRowSkeleton from './WatchListRowSkeleton.vue'
import { getWatchCollectionLayout } from '@/constants/watchCollectionLayouts.js'

const props = defineProps({
  /** Valeur résolue de `collection.displayMode`. */
  mode: {
    type: String,
    default: 'grid',
  },
  watches: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  /** Plafonné par la disposition : une rangée compacte en montre plus qu'une vitrine. */
  skeletonCount: {
    type: Number,
    default: 12,
  },
  isNouvelle: {
    type: Function,
    default: () => false,
  },
})

const emit = defineEmits(['viewDetails'])

const layout = computed(() => getWatchCollectionLayout(props.mode))

const skeletonItems = computed(() =>
  Math.max(1, Math.min(props.skeletonCount, layout.value.skeletonCap)),
)
</script>

<style scoped>
/*
 * Les keyframes vivaient dans WatchesCollection.vue : le CSS scopé n'atteignait
 * la racine des cartes que parce qu'elles y étaient écrites. Elles suivent donc
 * les cartes ici, sans quoi le fondu s'arrêterait sans rien casser de visible.
 */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}
</style>
