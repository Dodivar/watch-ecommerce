<template>
  <Teleport to="body">
    <div
      v-if="open"
      ref="overlayRef"
      class="watch-lightbox fixed inset-0 z-[9999] flex items-center justify-center lg:p-6"
      :style="overlayStyle"
      role="dialog"
      aria-modal="true"
      :aria-label="`Photos : ${title}`"
      tabindex="-1"
      @click="requestClose"
      @touchstart="onDismissTouchStart"
      @touchmove="onDismissTouchMove"
      @touchend="onDismissTouchEnd"
      @touchcancel="onDismissTouchEnd"
    >
      <div class="lightbox-stage h-full w-full" :style="stageStyle" @click.stop>
        <WatchImageSwipeCarousel
          v-model="activeIndex"
          :images="images"
          :show-navigation="images.length > 1"
          :swipe-disabled="isZoomed"
          track-class="touch-none"
          navigation-button-class="hidden lg:inline-flex items-center justify-center bg-white/15 hover:bg-white/25 p-3 backdrop-blur-sm"
          prev-navigation-class="left-4"
          next-navigation-class="right-4"
        >
          <template #slide="{ image, index, isActive }">
            <WatchImageZoomable
              :src="image"
              :alt="`${title} - photo ${index + 1}`"
              :is-active="isActive"
              @update:zoomed="onSlideZoomChange(isActive, $event)"
            />
          </template>

          <template #prev-icon>
            <ChevronLeft class="h-6 w-6" :stroke-width="2" />
          </template>

          <template #next-icon>
            <ChevronRight class="h-6 w-6" :stroke-width="2" />
          </template>
        </WatchImageSwipeCarousel>
      </div>

      <!-- Chrome : réduit au minimum pour libérer la photo sur mobile -->
      <div class="pointer-events-none absolute inset-0" :style="chromeStyle">
        <button
          type="button"
          class="lightbox-close pointer-events-auto absolute rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
          title="Fermer"
          aria-label="Fermer les photos"
          @click.stop="requestClose"
        >
          <X class="h-5 w-5" :stroke-width="2" />
        </button>

        <div v-if="images.length > 1" class="lightbox-footer absolute inset-x-0 flex flex-col items-center gap-3">
          <div
            v-if="showDots"
            class="pointer-events-auto flex items-center justify-center gap-0.5"
          >
            <button
              v-for="(image, index) in images"
              :key="index"
              type="button"
              class="flex h-6 w-6 items-center justify-center"
              :aria-label="`Voir la photo ${index + 1}`"
              :aria-current="activeIndex === index"
              @click.stop="activeIndex = index"
            >
              <span
                class="block rounded-full transition-all duration-200"
                :class="
                  activeIndex === index ? 'h-2 w-2 bg-white' : 'h-1.5 w-1.5 bg-white/45'
                "
              />
            </button>
          </div>

          <span class="rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {{ activeIndex + 1 }} / {{ images.length }}
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, X } from '@lucide/vue'
import WatchImageSwipeCarousel from '@/components/watch/WatchImageSwipeCarousel.vue'
import WatchImageZoomable from '@/components/watch/WatchImageZoomable.vue'
import { canPreloadWatchImages } from '@/utils/watchImageUrl.js'

/** Au-delà, la rangée de pastilles devient illisible : le compteur suffit. */
const MAX_DOTS = 10

const DISMISS_AXIS_LOCK_PX = 10
const DISMISS_COMMIT_PX = 110
const DISMISS_COMMIT_VELOCITY = 0.5
const DISMISS_FADE_RANGE_PX = 320
const DISMISS_EXIT_MS = 180
const MIN_BACKDROP_OPACITY = 0.35

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  images: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: Number,
    default: 0,
  },
  title: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'close'])

const overlayRef = ref(null)
const isZoomed = ref(false)
const dismissOffset = ref(0)
const dismissTransitionMs = ref(0)

const activeIndex = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const showDots = computed(() => props.images.length > 1 && props.images.length <= MAX_DOTS)

const dismissProgress = computed(() =>
  Math.min(Math.abs(dismissOffset.value) / DISMISS_FADE_RANGE_PX, 1),
)

const overlayStyle = computed(() => ({
  backgroundColor: `rgba(0, 0, 0, ${(1 - dismissProgress.value * (1 - MIN_BACKDROP_OPACITY)).toFixed(3)})`,
}))

const stageStyle = computed(() => ({
  transform: `translate3d(0, ${dismissOffset.value}px, 0)`,
  transition: dismissTransitionMs.value > 0 ? `transform ${dismissTransitionMs.value}ms ease-out` : 'none',
}))

const chromeStyle = computed(() => ({
  opacity: 1 - dismissProgress.value,
}))

function requestClose() {
  emit('close')
}

function onSlideZoomChange(isActive, zoomed) {
  if (!isActive) return
  isZoomed.value = zoomed
}

/* ---------------------------------------------------------------- Dismiss */

let dismissStart = null
let dismissAxis = null
let lastDismissY = 0
let lastDismissTime = 0
let dismissVelocity = 0
let dismissTimeout = null

function resetDismiss({ animate = true } = {}) {
  if (dismissTimeout) {
    clearTimeout(dismissTimeout)
    dismissTimeout = null
  }
  dismissTransitionMs.value = animate ? 200 : 0
  dismissOffset.value = 0
  dismissStart = null
  dismissAxis = null
  dismissVelocity = 0
}

/** Laisse la photo finir sa sortie avant de démonter la visionneuse. */
function finishDismiss(direction) {
  dismissStart = null
  dismissAxis = null
  dismissTransitionMs.value = DISMISS_EXIT_MS
  dismissOffset.value = direction * (window.innerHeight || DISMISS_FADE_RANGE_PX)
  dismissTimeout = setTimeout(requestClose, DISMISS_EXIT_MS)
}

function onDismissTouchStart(event) {
  if (isZoomed.value || event.touches.length !== 1) return

  const touch = event.touches[0]
  dismissTransitionMs.value = 0
  dismissAxis = null
  dismissStart = { x: touch.clientX, y: touch.clientY }
  lastDismissY = touch.clientY
  lastDismissTime = performance.now()
  dismissVelocity = 0
}

function onDismissTouchMove(event) {
  if (!dismissStart || isZoomed.value || event.touches.length !== 1) return

  const touch = event.touches[0]
  const deltaX = touch.clientX - dismissStart.x
  const deltaY = touch.clientY - dismissStart.y

  if (dismissAxis === null) {
    if (Math.abs(deltaX) < DISMISS_AXIS_LOCK_PX && Math.abs(deltaY) < DISMISS_AXIS_LOCK_PX) return
    // Le carrousel garde la main sur l'horizontale pour changer de photo.
    dismissAxis = Math.abs(deltaY) > Math.abs(deltaX) ? 'vertical' : 'horizontal'
  }

  if (dismissAxis !== 'vertical') return

  const now = performance.now()
  const elapsed = now - lastDismissTime
  if (elapsed > 0) {
    dismissVelocity = (touch.clientY - lastDismissY) / elapsed
  }
  lastDismissY = touch.clientY
  lastDismissTime = now

  dismissOffset.value = deltaY
}

function onDismissTouchEnd() {
  if (!dismissStart) return

  if (dismissAxis !== 'vertical') {
    resetDismiss({ animate: false })
    return
  }

  const shouldClose =
    Math.abs(dismissOffset.value) > DISMISS_COMMIT_PX ||
    (Math.abs(dismissOffset.value) > 40 && Math.abs(dismissVelocity) > DISMISS_COMMIT_VELOCITY)

  if (shouldClose) {
    finishDismiss(Math.sign(dismissOffset.value) || 1)
    return
  }

  resetDismiss()
}

/* --------------------------------------------------- Bouton retour Android */

let hasHistoryEntry = false

function onPopState() {
  hasHistoryEntry = false
  window.removeEventListener('popstate', onPopState)
  requestClose()
}

function pushHistoryEntry() {
  if (typeof window === 'undefined' || hasHistoryEntry) return
  // Même URL : seule une entrée d'historique est ajoutée, pour que le bouton
  // retour referme la visionneuse au lieu de quitter la fiche produit.
  window.history.pushState({ ...window.history.state, watchLightbox: true }, '')
  hasHistoryEntry = true
  window.addEventListener('popstate', onPopState)
}

function releaseHistoryEntry() {
  if (typeof window === 'undefined') return
  window.removeEventListener('popstate', onPopState)
  if (hasHistoryEntry) {
    hasHistoryEntry = false
    window.history.back()
  }
}

/* ------------------------------------------------------------- Préchargement */

const preloaded = new Set()

function preloadNeighbours(index) {
  if (!canPreloadWatchImages() || props.images.length < 2) return

  for (const offset of [1, -1]) {
    const target = (index + offset + props.images.length) % props.images.length
    const url = props.images[target]
    if (!url || preloaded.has(url)) continue

    preloaded.add(url)
    const image = new Image()
    image.decoding = 'async'
    image.src = url
  }
}

/* --------------------------------------------------------------- Clavier */

function onKeyDown(event) {
  if (!props.open) return

  if (event.key === 'Escape') {
    requestClose()
    return
  }

  if (props.images.length < 2 || isZoomed.value) return

  if (event.key === 'ArrowRight') {
    activeIndex.value = (props.modelValue + 1) % props.images.length
  } else if (event.key === 'ArrowLeft') {
    activeIndex.value = (props.modelValue - 1 + props.images.length) % props.images.length
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      isZoomed.value = false
      resetDismiss({ animate: false })
      pushHistoryEntry()
      document.addEventListener('keydown', onKeyDown)
      preloadNeighbours(props.modelValue)
      await Promise.resolve()
      overlayRef.value?.focus()
      return
    }

    document.removeEventListener('keydown', onKeyDown)
    releaseHistoryEntry()
    isZoomed.value = false
    resetDismiss({ animate: false })
  },
)

watch(
  () => props.modelValue,
  (index) => {
    if (!props.open) return
    isZoomed.value = false
    preloadNeighbours(index)
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('popstate', onPopState)
  if (dismissTimeout) clearTimeout(dismissTimeout)
})
</script>

<style scoped>
.watch-lightbox {
  animation: lightboxFadeIn 0.25s ease-out;
  touch-action: none;
  overscroll-behavior: contain;
}

/* `dvh` suit la barre d'URL mobile, contrairement à `vh` qui se cale sur le
   viewport large et laisse le chrome passer sous les barres du navigateur. */
.lightbox-stage {
  height: 100dvh;
  width: 100dvw;
}

.lightbox-close {
  top: calc(env(safe-area-inset-top, 0px) + 0.75rem);
  right: calc(env(safe-area-inset-right, 0px) + 0.75rem);
  /* Pastille discrète de 36px, mais cible tactile ramenée à 44px. */
  padding: 0.5rem;
  margin: -0.25rem;
  border: 0.25rem solid transparent;
  background-clip: padding-box;
}

.lightbox-footer {
  bottom: calc(env(safe-area-inset-bottom, 0px) + 1rem);
}

@media (min-width: 1024px) {
  .lightbox-stage {
    height: 100%;
    width: 100%;
  }

  .lightbox-close {
    top: 1.25rem;
    right: 1.25rem;
  }
}

@keyframes lightboxFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .watch-lightbox {
    animation: none;
  }
}
</style>
