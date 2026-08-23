<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'

import NewsletterOptInField from '@/components/NewsletterOptInField.vue'
import { handleFormSubmit, prepareRepairFormData } from '@/services/emailService'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { t } from '@/i18n'

/**
 * Demande de prise en charge atelier (réparation, pile, étanchéité, bracelet…).
 *
 * Le formulaire ne connaît aucune prestation : la liste vient de `servicesPage.repairRequest.services`
 * du manifest client, donc traduite comme le reste du manifest. Les demandes atterrissent dans les
 * mêmes `lead_submissions` que le contact et l'estimation (type `repair`), visibles en admin.
 */
const props = defineProps({
  /** Prestation pré-sélectionnée (page prestation) — doit figurer dans la liste du manifest. */
  defaultService: { type: String, default: '' },
  /** Page d'origine, conservée dans le lead : `services` ou le slug d'une page prestation. */
  source: { type: String, default: 'services' },
})

const MAX_FILES = 4
const MAX_FILE_BYTES = 10 * 1024 * 1024

const site = getSiteConfig()
const config = computed(() => site.servicesPage?.repairRequest || {})
const services = computed(() =>
  (config.value.services || []).map((entry) =>
    typeof entry === 'string' ? entry : String(entry?.label || ''),
  ).filter(Boolean),
)

const router = useRouter()
const selectedService = ref(
  services.value.includes(props.defaultService) ? props.defaultService : '',
)
const handling = ref('dropoff')
const files = ref([])
const previews = ref([])
const isSubmitting = ref(false)
const errorMessage = ref('')

/** Envoi postal : proposé seulement si le client l'accepte (`shippingEnabled`). */
const shippingEnabled = computed(() => config.value.shippingEnabled !== false)

function releasePreviews() {
  for (const url of previews.value) {
    if (url) URL.revokeObjectURL(url)
  }
}

function refreshPreviews() {
  releasePreviews()
  previews.value = files.value.map((file) =>
    file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
  )
}

function onFilesPicked(event) {
  const picked = Array.from(event.target.files || [])
  for (const file of picked) {
    if (files.value.length >= MAX_FILES) break
    if (file.size > MAX_FILE_BYTES) continue
    const already = files.value.some((f) => f.name === file.name && f.size === file.size)
    if (!already) files.value.push(file)
  }
  refreshPreviews()
  // L'input reste vidé : la liste de référence est `files`, ce qui rend la suppression possible.
  event.target.value = ''
}

function removeFile(index) {
  files.value.splice(index, 1)
  refreshPreviews()
}

onBeforeUnmount(releasePreviews)

async function submit(event) {
  event.preventDefault()
  errorMessage.value = ''

  if (!selectedService.value) {
    errorMessage.value = t('repair.serviceRequired')
    return
  }

  isSubmitting.value = true
  try {
    await handleFormSubmit(
      event.target,
      (form) => {
        const formData = prepareRepairFormData(form, { source: props.source })
        // Les fichiers sont pilotés par `files` et non par l'input : on les rattache à la main.
        formData.delete('attachments')
        for (const file of files.value) formData.append('attachments', file)
        return formData
      },
      () => router.push({ path: '/merci', query: { from: 'repair' } }),
      (error) => {
        errorMessage.value = error.message || t('form.submitError')
      },
    )
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section id="devis" class="scroll-mt-24 py-12 lg:py-16 bg-cream">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-8">
        <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">
          {{ config.title || t('repair.formTitle') }}
        </h2>
        <p class="text-lg text-gray-600">{{ config.lead || t('repair.formLead') }}</p>
      </div>

      <form
        class="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 p-6 lg:p-8 space-y-5"
        @submit="submit"
      >
        <div>
          <label for="repair-service" class="block text-sm font-medium text-text-main mb-2">
            {{ t('repair.service') }} *
          </label>
          <select
            id="repair-service"
            v-model="selectedService"
            name="service_type"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="" disabled>{{ t('repair.servicePlaceholder') }}</option>
            <option v-for="service in services" :key="service" :value="service">
              {{ service }}
            </option>
            <option :value="t('repair.serviceOther')">{{ t('repair.serviceOther') }}</option>
          </select>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label for="repair-brand" class="block text-sm font-medium text-text-main mb-2">
              {{ t('repair.brand') }} *
            </label>
            <input
              id="repair-brand"
              name="brand"
              type="text"
              required
              :placeholder="t('repair.brandPlaceholder')"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label for="repair-model" class="block text-sm font-medium text-text-main mb-2">
              {{ t('repair.model') }}
            </label>
            <input
              id="repair-model"
              name="model"
              type="text"
              :placeholder="t('repair.modelPlaceholder')"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label for="repair-message" class="block text-sm font-medium text-text-main mb-2">
            {{ t('repair.problem') }} *
          </label>
          <textarea
            id="repair-message"
            name="message"
            rows="4"
            required
            :placeholder="t('repair.problemPlaceholder')"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          ></textarea>
        </div>

        <fieldset>
          <legend class="block text-sm font-medium text-text-main mb-2">
            {{ t('repair.handling') }}
          </legend>
          <div class="grid gap-3" :class="shippingEnabled ? 'sm:grid-cols-3' : 'sm:grid-cols-2'">
            <label
              class="flex items-start gap-2 rounded-lg border px-4 py-3 cursor-pointer transition-colors"
              :class="handling === 'dropoff' ? 'border-primary bg-primary/5' : 'border-gray-300'"
            >
              <input
                v-model="handling"
                type="radio"
                name="handling"
                value="dropoff"
                class="mt-1 accent-primary"
              />
              <span class="text-sm text-text-main">{{ t('repair.handlingDropOff') }}</span>
            </label>
            <label
              v-if="shippingEnabled"
              class="flex items-start gap-2 rounded-lg border px-4 py-3 cursor-pointer transition-colors"
              :class="handling === 'shipping' ? 'border-primary bg-primary/5' : 'border-gray-300'"
            >
              <input
                v-model="handling"
                type="radio"
                name="handling"
                value="shipping"
                class="mt-1 accent-primary"
              />
              <span class="text-sm text-text-main">{{ t('repair.handlingShip') }}</span>
            </label>
            <label
              class="flex items-start gap-2 rounded-lg border px-4 py-3 cursor-pointer transition-colors"
              :class="handling === 'unsure' ? 'border-primary bg-primary/5' : 'border-gray-300'"
            >
              <input
                v-model="handling"
                type="radio"
                name="handling"
                value="unsure"
                class="mt-1 accent-primary"
              />
              <span class="text-sm text-text-main">{{ t('repair.handlingUnsure') }}</span>
            </label>
          </div>
        </fieldset>

        <div class="grid md:grid-cols-3 gap-4">
          <div>
            <label for="repair-name" class="block text-sm font-medium text-text-main mb-2">
              {{ t('form.lastName') }} *
            </label>
            <input
              id="repair-name"
              name="name"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label for="repair-email" class="block text-sm font-medium text-text-main mb-2">
              {{ t('form.email') }} *
            </label>
            <input
              id="repair-email"
              name="email"
              type="email"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label for="repair-tel" class="block text-sm font-medium text-text-main mb-2">
              {{ t('form.phone') }}
            </label>
            <input
              id="repair-tel"
              name="tel"
              type="tel"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-text-main mb-2" for="repair-attachments">
            {{ t('repair.photos') }}
          </label>
          <div
            class="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center hover:border-primary transition-colors"
          >
            <input
              id="repair-attachments"
              name="attachments"
              type="file"
              multiple
              accept="image/*"
              class="hidden"
              @change="onFilesPicked"
            />
            <label for="repair-attachments" class="cursor-pointer">
              <span class="text-primary font-medium">{{ t('repair.addPhotos') }}</span>
              <p class="text-gray-500 text-sm mt-1">{{ t('repair.photosHint') }}</p>
            </label>
          </div>
          <ul v-if="files.length" class="mt-3 flex flex-wrap gap-3">
            <li
              v-for="(file, index) in files"
              :key="`${file.name}-${file.size}`"
              class="relative flex items-center gap-2 rounded-lg border border-cream-200 bg-cream/60 px-3 py-2"
            >
              <img
                v-if="previews[index]"
                :src="previews[index]"
                :alt="file.name"
                class="h-10 w-10 rounded object-cover"
              />
              <span class="max-w-[10rem] truncate text-xs text-gray-600">{{ file.name }}</span>
              <button
                type="button"
                class="text-gray-400 hover:text-red-500 text-lg leading-none"
                :aria-label="t('repair.removePhoto')"
                @click="removeFile(index)"
              >
                &times;
              </button>
            </li>
          </ul>
        </div>

        <p class="text-sm text-gray-600 italic">{{ t('common.requiredFields') }}</p>

        <NewsletterOptInField />

        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full bg-primary text-white py-4 px-8 rounded-lg font-semibold text-lg hover:bg-primaryHover transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? t('form.sendingInProgress') : t('repair.submit') }}
        </button>

        <p class="text-center text-sm text-gray-500">
          {{ config.reassurance || t('repair.reassurance') }}
        </p>
      </form>
    </div>
  </section>
</template>
