<script setup>
import { computed } from 'vue'
import { formatGoogleRatingStars } from '@/utils/googleMapsLinks.js'

const props = defineProps({
  title: { type: String, default: '' },
  addressHtml: { type: String, default: '' },
  formattedAddress: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  logoAlt: { type: String, default: '' },
  rating: { type: Number, default: null },
  userRatingCount: { type: Number, default: null },
  profileUrl: { type: String, default: '' },
  directionsUrl: { type: String, default: '' },
  reviews: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const resolvedAddress = computed(() => {
  if (props.formattedAddress?.trim()) return props.formattedAddress.trim()
  return ''
})

const ratingLabel = computed(() => {
  if (typeof props.rating !== 'number' || !Number.isFinite(props.rating)) return ''
  return props.rating.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
})

const ratingStars = computed(() => formatGoogleRatingStars(props.rating))

const reviewCountLabel = computed(() => {
  if (typeof props.userRatingCount !== 'number' || props.userRatingCount <= 0) return ''
  const count = props.userRatingCount.toLocaleString('fr-FR')
  return props.userRatingCount === 1 ? `(${count} avis)` : `(${count} avis)`
})

const hasActions = computed(() => Boolean(props.profileUrl || props.directionsUrl))
const hasRating = computed(
  () => Boolean(ratingLabel.value || reviewCountLabel.value || props.reviews.length),
)
</script>

<template>
  <aside
    class="store-location-map-google-card pointer-events-auto absolute left-3 top-3 z-[1] w-[min(340px,calc(100%-1.5rem))] overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5"
    aria-label="Informations boutique sur Google Maps"
  >
    <div class="p-3.5">
      <div class="flex items-start gap-3">
        <img
          v-if="logoUrl"
          :src="logoUrl"
          :alt="logoAlt || title"
          width="48"
          height="48"
          class="h-12 w-12 shrink-0 rounded-md bg-gray-50 object-contain p-1"
        />

        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <h3 class="text-[15px] font-semibold leading-snug text-gray-900">
              {{ title }}
            </h3>

            <div v-if="hasActions" class="flex shrink-0 items-center gap-1">
              <a
                v-if="profileUrl"
                :href="profileUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100 hover:text-primary"
                aria-label="Voir la fiche Google"
                title="Voir sur Google Maps"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M14 5h5v5M10 14 19 5M15 19H5V9"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </a>
              <a
                v-if="directionsUrl"
                :href="directionsUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary transition hover:bg-blue-50"
                aria-label="Obtenir l'itinéraire"
                title="Itinéraire"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
                  />
                </svg>
              </a>
            </div>
          </div>

          <p
            v-if="resolvedAddress"
            class="mt-1 text-[13px] leading-snug text-gray-600"
          >
            {{ resolvedAddress }}
          </p>
          <div
            v-else-if="addressHtml"
            class="store-location-map-google-card__address mt-1 text-[13px] leading-snug text-gray-600"
            v-html="addressHtml"
          />

          <p v-if="loading" class="mt-2 text-xs text-gray-500">Chargement des avis Google…</p>

          <div v-else-if="hasRating" class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span
              v-if="ratingStars"
              class="tracking-tight text-amber-500"
              :aria-label="`Note ${ratingLabel} sur 5`"
            >
              {{ ratingStars }}
            </span>
            <span v-if="ratingLabel" class="font-medium text-gray-800">{{ ratingLabel }}</span>
            <a
              v-if="reviewCountLabel && profileUrl"
              :href="profileUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline"
            >
              {{ reviewCountLabel }}
            </a>
            <span v-else-if="reviewCountLabel" class="text-gray-600">{{ reviewCountLabel }}</span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="!loading && reviews.length"
      class="border-t border-gray-100 bg-gray-50/80 px-3.5 py-3"
    >
      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Avis Google</p>
      <ul class="space-y-3">
        <li v-for="(review, index) in reviews" :key="index" class="text-sm">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <a
              v-if="review.authorUri"
              :href="review.authorUri"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-gray-900 hover:text-primary hover:underline"
            >
              {{ review.authorName }}
            </a>
            <span v-else class="font-medium text-gray-900">{{ review.authorName }}</span>
            <span v-if="typeof review.rating === 'number'" class="text-xs text-amber-500">
              {{ formatGoogleRatingStars(review.rating) }}
            </span>
            <span v-if="review.relativeTime" class="text-xs text-gray-500">
              {{ review.relativeTime }}
            </span>
          </div>
          <p v-if="review.text" class="mt-1 line-clamp-3 text-[13px] leading-snug text-gray-700">
            {{ review.text }}
          </p>
        </li>
      </ul>
      <a
        v-if="profileUrl"
        :href="profileUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-3 inline-flex text-xs font-medium text-primary hover:underline"
      >
        Voir tous les avis sur Google Maps
      </a>
    </div>
  </aside>
</template>

<style scoped>
.store-location-map-google-card__address :deep(br) {
  display: block;
  content: '';
  margin-top: 0.125rem;
}
</style>
