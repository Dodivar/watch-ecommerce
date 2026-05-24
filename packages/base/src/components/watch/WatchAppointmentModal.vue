<script setup>
import { computed, reactive, ref, watch, onMounted, onUnmounted } from 'vue'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { buildGoogleMapsDirectionsUrl } from '@/utils/googleMapsLinks.js'
import { resolveStoreOpeningHours } from '@/utils/formatStoreOpeningHours.js'
import {
  handleFormSubmit,
  prepareAppointmentFormData,
} from '@/services/emailService.js'
import {
  getMinAppointmentDate,
  getAvailableAppointmentSlots,
  isAppointmentDateEligible,
  formatAppointmentDateLabel,
  SLOT_LABELS,
} from '@/composables/useRetailAppointmentSlots.js'

function formatDateISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const props = defineProps({
  open: { type: Boolean, default: false },
  watchContext: {
    type: Object,
    required: true,
    validator: (v) => Boolean(v?.id && v?.name),
  },
})

const emit = defineEmits(['close'])

const site = getSiteConfig()
const brandDisplayName = site.brand.displayName || site.brand.legalName
const storeMap = site.storeMap

const modalState = ref('form')
const isSubmitting = ref(false)
const errorMessage = ref('')
const submittedSummary = ref(null)
const formRef = ref(null)

const form = reactive({
  name: '',
  email: '',
  tel: '',
  date: '',
  time_slot: '',
})

const minDate = computed(() => formatDateISO(getMinAppointmentDate()))

const slotOptions = computed(() =>
  getAvailableAppointmentSlots(form.date).map((value) => ({
    value,
    label: SLOT_LABELS[value],
  })),
)

const directionsUrl = computed(() =>
  buildGoogleMapsDirectionsUrl({
    address: storeMap?.directionsAddress || site.legal?.address,
    placeId: storeMap?.googlePlaceId,
    lat: storeMap?.center?.lat,
    lng: storeMap?.center?.lng,
    query: storeMap?.googlePlaceQuery,
  }),
)

const storeOpeningHours = computed(() => resolveStoreOpeningHours(storeMap?.openingHours))

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetModal()
      form.date = minDate.value
      form.time_slot = slotOptions.value[0]?.value || ''
    }
  },
)

watch(
  () => form.date,
  () => {
    if (!form.time_slot || !slotOptions.value.some((s) => s.value === form.time_slot)) {
      form.time_slot = slotOptions.value[0]?.value || ''
    }
  },
)

watch(slotOptions, (options) => {
  if (form.time_slot && !options.some((s) => s.value === form.time_slot)) {
    form.time_slot = options[0]?.value || ''
  }
})

function resetModal() {
  modalState.value = 'form'
  errorMessage.value = ''
  submittedSummary.value = null
  isSubmitting.value = false
  form.name = ''
  form.email = ''
  form.tel = ''
  form.date = minDate.value
  form.time_slot = slotOptions.value[0]?.value || ''
}

function closeModal() {
  emit('close')
}

function onBackdropClick() {
  closeModal()
}

function onKeydown(event) {
  if (event.key === 'Escape' && props.open) {
    closeModal()
  }
}

function validateDateInput() {
  if (!isAppointmentDateEligible(form.date)) {
    form.date = minDate.value
  }
}

async function submitForm(event) {
  event.preventDefault()
  if (isSubmitting.value) return

  validateDateInput()
  if (!form.time_slot) {
    errorMessage.value = 'Veuillez sélectionner un créneau.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  const summary = {
    date: form.date,
    dateLabel: formatAppointmentDateLabel(form.date),
    timeSlot: form.time_slot,
    timeSlotLabel: SLOT_LABELS[form.time_slot],
  }

  try {
    await handleFormSubmit(
      formRef.value,
      (target) => prepareAppointmentFormData(target, props.watchContext),
      () => {
        submittedSummary.value = summary
        modalState.value = 'success'
      },
      (error) => {
        errorMessage.value =
          error.message || "Une erreur s'est produite lors de l'envoi de votre demande."
        modalState.value = 'error'
      },
    )
  } finally {
    isSubmitting.value = false
  }
}

function retrySubmit() {
  modalState.value = 'form'
  errorMessage.value = ''
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-show="open"
      class="fixed inset-0 z-[9990] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-modal-title"
    >
      <div
        class="absolute inset-0 bg-black/50"
        aria-hidden="true"
        @click="onBackdropClick"
      />

      <div
        class="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto bg-white rounded-t-xl sm:rounded-xl shadow-2xl"
        @click.stop
      >
        <div class="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-5 py-4 rounded-t-xl">
          <h2 id="appointment-modal-title" class="text-lg font-semibold text-text-main">
            <template v-if="modalState === 'success'">Demande envoyée</template>
            <template v-else-if="modalState === 'error'">Envoi impossible</template>
            <template v-else>Prendre rendez-vous</template>
          </h2>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Fermer"
            @click="closeModal"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="px-5 py-5 space-y-5">
          <!-- Success -->
          <div v-if="modalState === 'success'" class="text-center space-y-4 py-2">
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p class="text-text-main font-medium">
              Votre demande de rendez-vous a bien été envoyée.
            </p>
            <div v-if="submittedSummary" class="rounded-lg bg-cream p-4 text-left text-sm text-gray-700 space-y-1">
              <p><span class="font-semibold">Date :</span> {{ submittedSummary.dateLabel }}</p>
              <p><span class="font-semibold">Créneau :</span> {{ submittedSummary.timeSlotLabel }}</p>
              <p class="pt-1">
                <span class="font-semibold">Boutique :</span>
                <span v-html="site.contact.footerAddressHtml" />
              </p>
              <p v-if="storeOpeningHours.hasHours" class="pt-1">
                <span class="font-semibold">Horaires :</span>
                <span v-if="storeOpeningHours.daysLabel">{{ storeOpeningHours.daysLabel }}</span>
                <span v-if="storeOpeningHours.daysLabel && storeOpeningHours.hoursLabel"> · </span>
                <span v-if="storeOpeningHours.hoursLabel">{{ storeOpeningHours.hoursLabel }}</span>
              </p>
            </div>
            <p class="text-sm text-gray-600">
              Un email de confirmation vous a été envoyé. Notre équipe vous recontactera si nécessaire.
            </p>
            <button
              type="button"
              class="w-full inline-flex justify-center items-center px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-colors"
              @click="closeModal"
            >
              Fermer
            </button>
          </div>

          <!-- Error -->
          <div v-else-if="modalState === 'error'" class="text-center space-y-4 py-2">
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-text-main font-medium">Impossible d'envoyer votre demande</p>
            <p class="text-sm text-red-600">{{ errorMessage }}</p>
            <div class="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                class="flex-1 inline-flex justify-center items-center px-6 py-3 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/5 transition-colors"
                @click="retrySubmit"
              >
                Réessayer
              </button>
              <button
                type="button"
                class="flex-1 inline-flex justify-center items-center px-6 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
                @click="closeModal"
              >
                Fermer
              </button>
            </div>
          </div>

          <!-- Form -->
          <template v-else>
            <div class="rounded-lg border border-gray-100 bg-cream/60 p-4 space-y-3">
              <p class="text-sm font-semibold text-text-main">{{ brandDisplayName }}</p>
              <div class="flex gap-2 items-start text-sm text-gray-700">
                <svg class="w-5 h-5 shrink-0 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span v-html="site.contact.footerAddressHtml" />
              </div>
              <div
                v-if="storeOpeningHours.hasHours"
                class="flex gap-2 items-start text-sm text-gray-700"
              >
                <svg class="w-5 h-5 shrink-0 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p v-if="storeOpeningHours.daysLabel" class="font-medium text-text-main">
                    {{ storeOpeningHours.daysLabel }}
                  </p>
                  <p v-if="storeOpeningHours.hoursLabel" class="text-gray-600">
                    {{ storeOpeningHours.hoursLabel }}
                  </p>
                </div>
              </div>
              <a
                v-if="directionsUrl"
                :href="directionsUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Itinéraire GPS
              </a>
            </div>

            <form ref="formRef" class="space-y-4" @submit="submitForm">
              <div>
                <label for="appointment-name" class="block text-sm font-medium text-text-main mb-1">
                  Nom *
                </label>
                <input
                  id="appointment-name"
                  v-model.trim="form.name"
                  name="name"
                  type="text"
                  required
                  maxlength="80"
                  autocomplete="name"
                  class="w-full rounded-md border border-cream-300 px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label for="appointment-email" class="block text-sm font-medium text-text-main mb-1">
                  Email *
                </label>
                <input
                  id="appointment-email"
                  v-model.trim="form.email"
                  name="email"
                  type="email"
                  required
                  maxlength="120"
                  autocomplete="email"
                  class="w-full rounded-md border border-cream-300 px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label for="appointment-tel" class="block text-sm font-medium text-text-main mb-1">
                  Téléphone
                </label>
                <input
                  id="appointment-tel"
                  v-model.trim="form.tel"
                  name="tel"
                  type="tel"
                  maxlength="20"
                  autocomplete="tel"
                  class="w-full rounded-md border border-cream-300 px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label for="appointment-date" class="block text-sm font-medium text-text-main mb-1">
                  Date souhaitée *
                </label>
                <input
                  id="appointment-date"
                  v-model="form.date"
                  name="date"
                  type="date"
                  required
                  :min="minDate"
                  class="w-full rounded-md border border-cream-300 px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                  @change="validateDateInput"
                />
              </div>

              <fieldset>
                <legend class="block text-sm font-medium text-text-main mb-2">Créneau *</legend>
                <div class="flex flex-wrap gap-3">
                  <label
                    v-for="slot in slotOptions"
                    :key="slot.value"
                    class="inline-flex items-center gap-2 rounded-md border px-4 py-2 cursor-pointer transition-colors"
                    :class="
                      form.time_slot === slot.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-cream-300 text-gray-700 hover:border-primary/40'
                    "
                  >
                    <input
                      v-model="form.time_slot"
                      type="radio"
                      name="time_slot"
                      :value="slot.value"
                      class="sr-only"
                      required
                    />
                    {{ slot.label }}
                  </label>
                </div>
              </fieldset>

              <p v-if="errorMessage && modalState === 'form'" class="text-sm text-red-600">
                {{ errorMessage }}
              </p>

              <p class="text-xs text-gray-500 italic">* Champs obligatoires</p>

              <button
                type="submit"
                :disabled="isSubmitting || slotOptions.length === 0"
                class="w-full inline-flex justify-center items-center px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isSubmitting ? 'Envoi en cours…' : 'Confirmer le rendez-vous' }}
              </button>
            </form>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
