<template>
  <Teleport to="body">
    <div
      v-if="open && watch"
      class="matchmaking-lightbox fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 sm:items-center sm:p-6"
      @click="emit('close')"
    >
      <div
        ref="dialogRef"
        class="flex max-h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        :aria-label="t('matchmaking.lightbox.title', { title: watch.name })"
        tabindex="-1"
        @click.stop
        @keydown="onKeyDown"
      >
        <!-- En-tête -->
        <header
          class="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-5 py-4"
        >
          <div class="min-w-0">
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              {{ watch.brand }}
            </p>
            <h2 class="truncate text-lg font-semibold text-gray-900">
              {{ watch.model || watch.name }}
            </h2>
            <p v-if="showReference && watch.reference" class="text-sm text-gray-600">
              {{ t('watch.referenceShort', { reference: watch.reference }) }}
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-full p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            :aria-label="t('common.close')"
            @click="emit('close')"
          >
            <X class="h-5 w-5" :stroke-width="2" />
          </button>
        </header>

        <!-- Corps défilant -->
        <div class="min-h-0 flex-1 overflow-y-auto">
          <div class="relative aspect-[4/3] w-full bg-white sm:aspect-[3/2]">
            <WatchImageSwipeCarousel
              v-if="images.length"
              v-model="activeIndex"
              :images="images"
              :show-navigation="images.length > 1"
              :slide-alt-fn="(image, index) => `${watch.name} - ${index + 1}`"
            >
              <template #slide="{ image, index }">
                <img
                  :src="image"
                  :alt="`${watch.name} - ${index + 1}`"
                  :loading="index <= activeIndex + 1 ? 'eager' : 'lazy'"
                  decoding="async"
                  draggable="false"
                  class="h-full w-full object-contain object-center"
                />
              </template>
              <template #overlay="{ currentIndex, imageCount }">
                <span
                  v-if="imageCount > 1"
                  class="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white"
                >
                  {{ currentIndex + 1 }} / {{ imageCount }}
                </span>
              </template>
            </WatchImageSwipeCarousel>
            <div v-else class="flex h-full items-center justify-center text-gray-400">
              {{ t('watch.imageUnavailable') }}
            </div>
          </div>

          <div class="px-5 py-5">
            <div class="flex items-baseline gap-3">
              <span v-if="watch.isOnPromotion" class="text-base text-gray-400 line-through">
                {{ formatPrice(watch.price) }}
              </span>
              <span class="text-2xl font-bold text-primary">
                {{ formatPrice(watch.effectivePrice ?? watch.price) }}
              </span>
              <span
                v-if="watch.isOnPromotion"
                class="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white"
              >
                -{{ watch.displayDiscountPercent }} %
              </span>
            </div>

            <p
              v-if="watch.description"
              class="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-700"
            >
              {{ watch.description }}
            </p>

            <h3 class="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {{ t('matchmaking.lightbox.specs') }}
            </h3>
            <dl class="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <template v-for="spec in specs" :key="spec.label">
                <div class="flex justify-between gap-4 border-b border-gray-100 py-1.5">
                  <dt class="text-gray-500">{{ spec.label }}</dt>
                  <dd class="text-right font-medium text-gray-900">{{ spec.value }}</dd>
                </div>
              </template>
            </dl>

            <template v-if="includedAccessories.length">
              <h3 class="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {{ t('matchmaking.lightbox.accessories') }}
              </h3>
              <ul class="mt-2 flex flex-wrap gap-2">
                <li
                  v-for="item in includedAccessories"
                  :key="item"
                  class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                >
                  {{ item }}
                </li>
              </ul>
            </template>
          </div>
        </div>

        <!-- Décision. En pile, chacun sa case : « Coup de cœur », plus long que « Passer »,
             débordait de sa moitié et rendait les deux boutons inégaux. -->
        <footer
          class="matchmaking-lightbox-footer flex shrink-0 items-center gap-3 border-t border-gray-100 bg-white px-5 py-4"
        >
          <template v-if="mode === 'deck'">
            <button
              type="button"
              class="inline-flex flex-1 basis-0 items-center justify-center gap-2 rounded-lg border-2 border-red-500 bg-white py-3 text-sm font-semibold uppercase tracking-wide text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              @click="emit('pass', watch)"
            >
              <X class="h-5 w-5" :stroke-width="2.5" />
              {{ t('matchmaking.deck.pass') }}
            </button>
            <button
              type="button"
              class="inline-flex flex-1 basis-0 items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              @click="emit('like', watch)"
            >
              <Heart class="h-5 w-5" :stroke-width="2.5" />
              {{ t('matchmaking.deck.like') }}
            </button>
          </template>
          <!--
            Coup de cœur déjà donné : la décision est prise, ce qui reste à faire est d'aller
            acheter. La fiche complète prend donc toute la place — c'est de là que part l'achat
            — et « Retirer » se replie sur son icône. « Fermer » a quitté la barre : la croix de
            l'en-tête, l'appui hors du panneau et Échap ferment déjà, et le bouton disputait une
            moitié de barre au seul chemin qui mène quelque part.
          -->
          <template v-else>
            <button
              type="button"
              class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:border-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              :aria-label="
                t('matchmaking.shortlist.removeLabel', { name: watch.model || watch.name })
              "
              :title="t('matchmaking.shortlist.remove')"
              @click="emit('remove', watch)"
            >
              <Trash2 class="h-5 w-5" :stroke-width="2" />
            </button>
            <RouterLink
              v-if="watch.slug"
              :to="`/montre/${watch.slug}`"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {{ t('matchmaking.lightbox.fullPage') }}
              <ArrowRight class="h-5 w-5 shrink-0" :stroke-width="2" />
            </RouterLink>
            <!-- Montre sans fiche à ouvrir : la fermeture reprend la place du bouton. -->
            <button
              v-else
              type="button"
              class="inline-flex flex-1 items-center justify-center rounded-lg bg-primary py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              @click="emit('close')"
            >
              {{ t('common.close') }}
            </button>
          </template>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch as watchEffect } from 'vue'
import { ArrowRight, Heart, Trash2, X } from '@lucide/vue'

import { t } from '@/i18n'
import {
  formatWaterResistance,
  getBraceletColorLabel,
  getBraceletMaterialLabel,
  translateAccessory,
  translateDuration,
  translateGuarantee,
  translateSpec,
  translateSpecList,
} from '@/i18n/watchSpecs.js'
import { formatPrice } from '@/utils/formatters.js'
import { watchLightboxImageUrl } from '@/utils/watchImageUrl.js'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import WatchImageSwipeCarousel from '@/components/watch/WatchImageSwipeCarousel.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  watch: { type: Object, default: null },
  /** `deck` : aimer / passer ; `shortlist` : retirer / fermer. */
  mode: {
    type: String,
    default: 'deck',
    validator: (v) => ['deck', 'shortlist'].includes(v),
  },
})

const emit = defineEmits(['like', 'pass', 'remove', 'close'])

const dialogRef = ref(null)
const activeIndex = ref(0)

const showReference = computed(() => getSiteConfig().watchCatalog?.display?.showReference !== false)

const images = computed(() =>
  (props.watch?.images ?? []).map((url) => watchLightboxImageUrl(url)).filter(Boolean),
)

const FIELD_LABEL_KEYS = {
  year: 'watch.year',
  condition: 'watch.condition',
  movement: 'watch.movement',
  caseMaterial: 'watch.case',
  caseSize: 'watch.caseDiameter',
  braceletMaterials: 'watch.strapMaterial',
  braceletColors: 'watch.strapColor',
  dialColor: 'watch.dialColor',
  crystal: 'watch.crystal',
  waterResistance: 'watch.waterResistance',
  functions: 'watch.functions',
  powerReserve: 'watch.powerReserve',
  guarantee: 'watch.warranty',
  content: 'watch.content',
}

/** Caractéristiques présentes, traduites à l'affichage (repli brut si hors vocabulaire). */
const specs = computed(() => {
  const w = props.watch
  const d = w?.details ?? {}
  const rows = [
    ['year', w?.year ? String(w.year) : ''],
    ['condition', translateSpec('condition', w?.condition)],
    ['movement', translateSpec('movement', d.movement)],
    ['caseMaterial', translateSpecList('material', d.caseMaterial)],
    ['caseSize', d.caseSize ? `${d.caseSize} mm` : ''],
    ['braceletMaterials', (d.braceletMaterials ?? []).map(getBraceletMaterialLabel).join(', ')],
    ['braceletColors', (d.braceletColors ?? []).map(getBraceletColorLabel).join(', ')],
    ['dialColor', translateSpecList('color', d.dialColor)],
    ['crystal', translateSpec('crystal', d.crystal)],
    ['waterResistance', formatWaterResistance(d.waterResistance)],
    ['functions', translateSpecList('fn', d.functions)],
    ['powerReserve', translateDuration(d.powerReserve)],
    ['guarantee', translateGuarantee(d.guarantee)],
    ['content', translateSpec('content', d.content)],
  ]
  return rows
    .filter(([, value]) => value)
    .map(([field, value]) => ({ label: t(FIELD_LABEL_KEYS[field]), value }))
})

const includedAccessories = computed(() =>
  (props.watch?.details?.accessories ?? [])
    .filter((a) => a && a.included !== false && a.name)
    .map((a) => translateAccessory(a.name)),
)

/* ----------------------------------------------------- Clavier et focus */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Piège de focus minimal : `Tab` et `Maj+Tab` bouclent dans la modale. Aucun composant du
 * socle n'en propose ; celle-ci porte tout le parcours, on ne laisse pas le focus filer
 * derrière le voile.
 */
function onKeyDown(event) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('close')
    return
  }
  if (event.key !== 'Tab' || !dialogRef.value) return
  const focusables = [...dialogRef.value.querySelectorAll(FOCUSABLE)].filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  )
  if (!focusables.length) {
    event.preventDefault()
    return
  }
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

let previouslyFocused = null
let scrollLocked = false

function lockScroll() {
  if (scrollLocked || typeof document === 'undefined') return
  document.body.style.overflow = 'hidden'
  scrollLocked = true
}

function unlockScroll() {
  if (!scrollLocked || typeof document === 'undefined') return
  document.body.style.overflow = ''
  scrollLocked = false
}

watchEffect(
  () => props.open && Boolean(props.watch),
  async (isOpen) => {
    if (isOpen) {
      activeIndex.value = 0
      previouslyFocused = typeof document !== 'undefined' ? document.activeElement : null
      lockScroll()
      await nextTick()
      dialogRef.value?.focus()
      return
    }
    unlockScroll()
    previouslyFocused?.focus?.()
    previouslyFocused = null
  },
)

watchEffect(
  () => props.watch?.id,
  () => {
    activeIndex.value = 0
  },
)

onBeforeUnmount(unlockScroll)
</script>

<style scoped>
.matchmaking-lightbox {
  animation: matchmaking-lightbox-in 0.2s ease-out;
}

.matchmaking-lightbox-footer {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

@keyframes matchmaking-lightbox-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .matchmaking-lightbox {
    animation: none;
  }
}
</style>
