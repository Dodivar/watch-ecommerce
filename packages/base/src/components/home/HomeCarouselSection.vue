<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'

import { getSiteConfig } from '@/site/getSiteConfig.js'
import { getHomeCarouselSlidesPublic } from '@/services/admin/adminHomeCarouselService.js'
import { buildBrandCollectionPath } from '@/utils/collectionRoutes.js'
import { buildWatchPath } from '@/utils/watchSlug.js'
import { buildCampaignCollectionQuery } from '@/services/watchPromotionCampaignService.js'
import { resolveLiveCampaignStatus } from '@/utils/watchPromotionCampaign.js'

const AUTOPLAY_MS = 6000
const ALT_FALLBACK = 'Visuel promotionnel du carrousel d\'accueil'

const site = getSiteConfig()
const router = useRouter()

const slides = ref([])
const isLoading = ref(true)
const activeIndex = ref(0)
const prefersReducedMotion = ref(false)

let autoplayTimer = null
/** @type {MediaQueryList | null} */
let reducedMotionQuery = null

const hasSlides = computed(() => slides.value.length > 0)
const activeSlide = computed(() => slides.value[activeIndex.value] ?? null)
const slideCount = computed(() => slides.value.length)
const hasMultipleSlides = computed(() => slideCount.value > 1)

const activeSlideAlt = computed(() => {
  const alt = activeSlide.value?.alt_text?.trim()
  return alt || ALT_FALLBACK
})

const liveRegionMessage = computed(() => {
  if (!hasSlides.value || !activeSlide.value) return ''
  const position = hasMultipleSlides.value
    ? `Image ${activeIndex.value + 1} sur ${slideCount.value}. `
    : ''
  const link = slideLink(activeSlide.value)
  const action = link ? ` ${slideLinkDescription(activeSlide.value)}` : ''
  return `${position}${activeSlideAlt.value}${action}`
})

function slideLink(slide) {
  if (!site.features?.collection) return null

  const watchId = slide?.watch_id?.trim?.() || slide?.watch_id
  if (watchId) {
    if (slide.watch) return buildWatchPath(slide.watch)
    return `/watch/${watchId}`
  }

  const campaign = slide?.promotion_campaign
  if (campaign?.slug) {
    const liveStatus = resolveLiveCampaignStatus({
      status: campaign.status,
      startsAt: campaign.starts_at,
      endsAt: campaign.ends_at,
      starts_at: campaign.starts_at,
      ends_at: campaign.ends_at,
    })
    if (liveStatus === 'active') {
      return buildCampaignCollectionQuery(campaign.slug)
    }
    return null
  }

  const brand = slide?.brand_name?.trim()
  if (!brand) return null
  return buildBrandCollectionPath(brand)
}

function slideLinkDescription(slide) {
  if (slide?.watch_id) {
    const watch = slide.watch
    const label = watch?.brand && watch?.name ? `${watch.brand} ${watch.name}` : 'la fiche montre'
    return `Lien vers ${label}.`
  }
  if (slide?.promotion_campaign?.slug) {
    const name = slide.promotion_campaign.name || 'l\'événement promotionnel'
    return `Lien vers la collection ${name}.`
  }
  if (slide?.brand_name?.trim()) {
    return `Lien vers la collection ${slide.brand_name}.`
  }
  return ''
}

function slideLinkAriaLabel(slide) {
  if (!slideLink(slide)) return undefined
  const alt = slide?.alt_text?.trim() || ALT_FALLBACK
  if (slide?.watch_id) {
    const watch = slide.watch
    const label = watch?.brand && watch?.name ? `${watch.brand} ${watch.name}` : 'la fiche montre'
    return `${alt} — Voir ${label}`
  }
  if (slide?.promotion_campaign?.name) {
    return `${alt} — Voir ${slide.promotion_campaign.name}`
  }
  return `${alt} — Voir la collection ${slide.brand_name}`
}

function goToSlide(index) {
  if (!slides.value.length) return
  activeIndex.value = ((index % slides.value.length) + slides.value.length) % slides.value.length
}

function nextSlide() {
  goToSlide(activeIndex.value + 1)
}

function prevSlide() {
  goToSlide(activeIndex.value - 1)
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

function startAutoplay() {
  stopAutoplay()
  if (prefersReducedMotion.value || slides.value.length <= 1) return
  autoplayTimer = setInterval(nextSlide, AUTOPLAY_MS)
}

function handleReducedMotionChange(event) {
  prefersReducedMotion.value = event.matches
  if (event.matches) {
    stopAutoplay()
  } else {
    startAutoplay()
  }
}

function handleSlideClick(slide) {
  const to = slideLink(slide)
  if (to) router.push(to)
}

function slideControlLabel(index) {
  const alt = slides.value[index]?.alt_text?.trim()
  const position = `Image ${index + 1} sur ${slideCount.value}`
  return alt ? `${position} — ${alt}` : position
}

async function loadSlides() {
  try {
    isLoading.value = true
    slides.value = await getHomeCarouselSlidesPublic()
    activeIndex.value = 0
  } catch (err) {
    console.error('HomeCarouselSection:', err)
    slides.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = reducedMotionQuery.matches
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange)
  }

  await loadSlides()
  startAutoplay()
})

onUnmounted(() => {
  stopAutoplay()
  reducedMotionQuery?.removeEventListener('change', handleReducedMotionChange)
})

watch(
  () => slides.value.length,
  () => startAutoplay(),
)
</script>

<template>
  <section
    v-if="isLoading || hasSlides"
    id="home-carousel"
    class="home-carousel relative w-full overflow-hidden bg-cream"
    role="region"
    aria-roledescription="carrousel"
    :aria-label="
      hasMultipleSlides
        ? `Carrousel d'accueil, ${slideCount} images`
        : 'Carrousel d\'accueil'
    "
    @mouseenter="stopAutoplay"
    @mouseleave="startAutoplay"
    @focusin="stopAutoplay"
    @focusout="startAutoplay"
  >
    <p class="sr-only" aria-live="polite" aria-atomic="true">
      {{ liveRegionMessage }}
    </p>

    <div
      v-if="isLoading"
      class="aspect-[21/9] w-full max-h-[min(70vh,520px)] animate-pulse bg-cream-200 motion-reduce:animate-none"
      role="status"
      aria-label="Chargement du carrousel"
    />

    <template v-else-if="hasSlides">
      <div
        class="relative aspect-[21/9] w-full max-h-[min(70vh,520px)]"
        role="group"
        :aria-label="`Diapositive ${activeIndex + 1} sur ${slideCount}`"
        :aria-roledescription="hasMultipleSlides ? 'diapositive' : undefined"
      >
        <Transition name="carousel-fade" mode="out-in">
          <component
            v-if="activeSlide"
            :is="slideLink(activeSlide) ? 'button' : 'div'"
            :key="activeSlide.id"
            :type="slideLink(activeSlide) ? 'button' : undefined"
            class="absolute inset-0 block h-full w-full"
            :class="slideLink(activeSlide) ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2' : ''"
            :aria-label="slideLinkAriaLabel(activeSlide)"
            @click="handleSlideClick(activeSlide)"
          >
            <img
              :src="activeSlide.image_url"
              :alt="slideLink(activeSlide) ? '' : activeSlideAlt"
              :aria-hidden="slideLink(activeSlide) ? 'true' : undefined"
              class="h-full w-full object-cover"
              :fetchpriority="activeIndex === 0 ? 'high' : 'auto'"
              :loading="activeIndex === 0 ? 'eager' : 'lazy'"
              decoding="async"
              sizes="100vw"
            />
          </component>
        </Transition>

        <template v-if="hasMultipleSlides">
          <button
            type="button"
            class="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none sm:left-5"
            :aria-label="`Image précédente, ${slideControlLabel((activeIndex - 1 + slideCount) % slideCount)}`"
            @click="prevSlide"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            class="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none sm:right-5"
            :aria-label="`Image suivante, ${slideControlLabel((activeIndex + 1) % slideCount)}`"
            @click="nextSlide"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div
            class="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-4"
            role="tablist"
            aria-label="Choisir une image du carrousel"
          >
            <button
              v-for="(slide, index) in slides"
              :key="`dot-${slide.id}`"
              type="button"
              role="tab"
              class="h-2.5 w-2.5 rounded-full transition motion-reduce:transition-none"
              :class="index === activeIndex ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white/80'"
              :aria-selected="index === activeIndex"
              :aria-current="index === activeIndex ? 'true' : undefined"
              :aria-label="slideControlLabel(index)"
              :tabindex="index === activeIndex ? 0 : -1"
              @click="goToSlide(index)"
            />
          </div>
        </template>
      </div>

      <p v-if="prefersReducedMotion && hasMultipleSlides" class="sr-only">
        Défilement automatique désactivé car vous avez demandé moins d'animations.
      </p>
    </template>
  </section>
</template>

<style scoped>
.carousel-fade-enter-active,
.carousel-fade-leave-active {
  transition: opacity 0.6s ease;
}

.carousel-fade-enter-from,
.carousel-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .carousel-fade-enter-active,
  .carousel-fade-leave-active {
    transition: none;
  }

  .carousel-fade-enter-from,
  .carousel-fade-leave-to {
    opacity: 1;
  }
}
</style>
