<template>
  <div class="min-h-screen bg-cream">
    <section class="py-10 lg:py-14">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10">
          <h1 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">{{ t('contact.title') }}</h1>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            {{ t('contact.lead') }}<span v-if="showStoreMap"> {{ t('contact.orVisitUs') }}</span>.
          </p>
        </div>

        <div class="grid gap-10 lg:grid-cols-2 lg:gap-12 items-start">
          <!-- Résumé coordonnées (aligné sur le footer) -->
          <div class="space-y-8">
            <div class="bg-primary text-white rounded-lg shadow-lg p-8">
              <h2 class="text-xl font-semibold mb-2">{{ brandDisplayName }}</h2>
              <p class="text-white/90 leading-relaxed mb-6">
                {{ site.copy.footerTagline }}
              </p>

              <h3 class="text-sm font-semibold uppercase tracking-wide text-white/80 mb-3">
                {{ t('contact.details') }}
              </h3>
              <ul class="space-y-3 text-white/90">
                <li v-if="WHATSAPP_NUMBER">
                  <a
                    :href="'https://wa.me/' + WHATSAPP_NUMBER"
                    class="inline-flex items-center gap-2 hover:text-white transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg class="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"
                      />
                    </svg>
                    <span>WhatsApp — {{ WHATSAPP_NUMBER }}</span>
                  </a>
                </li>
                <li v-if="site.contact?.phoneDisplay">
                  <a
                    :href="'tel:' + (site.contact.phoneE164 || site.contact.phoneDisplay)"
                    class="inline-flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Phone class="w-5 h-5 shrink-0" :stroke-width="2" />
                    <span>{{ site.contact.phoneDisplay }}</span>
                  </a>
                </li>
                <li v-if="EMAIL_CONTACT">
                  <a
                    :href="'mailto:' + EMAIL_CONTACT"
                    class="inline-flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Mail class="w-5 h-5 shrink-0" :stroke-width="2" />
                    <span>{{ EMAIL_CONTACT }}</span>
                  </a>
                </li>
                <li class="flex gap-2 items-start">
                  <MapPin class="w-5 h-5 shrink-0 mt-0.5" :stroke-width="2" />
                  <span v-html="site.contact.footerAddressHtml"></span>
                </li>
              </ul>

              <div v-if="hasSocialLinks" class="mt-6 pt-6 border-t border-white/20">
                <h3 class="text-sm font-semibold uppercase tracking-wide text-white/80 mb-3">
                  {{ t('contact.socialNetworks') }}
                </h3>
                <div class="flex flex-wrap gap-3">
                  <a
                    v-if="site.social.footerTiktokUrl"
                    :href="site.social.footerTiktokUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    aria-label="TikTok"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
                      />
                    </svg>
                  </a>
                  <a
                    v-if="suivezNous?.instagramUrl"
                    :href="suivezNous.instagramUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    :aria-label="suivezNous.instagramHandle ? `Instagram ${suivezNous.instagramHandle}` : 'Instagram'"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.254-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                      />
                    </svg>
                  </a>
                  <a
                    v-if="suivezNous?.facebookUrl"
                    :href="suivezNous.facebookUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    :aria-label="suivezNous.facebookHandle ? `Facebook ${suivezNous.facebookHandle}` : 'Facebook'"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <StoreLocationMap v-if="showStoreMap" class="rounded-lg shadow-md" />
          </div>

          <!-- Formulaire -->
          <div class="bg-white rounded-lg shadow-lg p-8 border border-cream-300">
            <h2 class="text-xl font-semibold text-text-main mb-2">{{ t('contact.sendMessage') }}</h2>
            <p class="text-gray-600 text-sm mb-6">
              {{ t('contact.formIntro', { brand: brandDisplayName }) }}
            </p>

            <form class="space-y-5" @submit="submitContactForm">
              <div>
                <label for="contact-name" class="block text-sm font-medium text-text-main mb-1"
                  >{{ t('form.fullName') }} *</label
                >
                <input
                  id="contact-name"
                  v-model.trim="form.name"
                  type="text"
                  name="name"
                  autocomplete="name"
                  required
                  maxlength="120"
                  class="w-full rounded-md border border-cream-300 px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label for="contact-email" class="block text-sm font-medium text-text-main mb-1"
                  >{{ t('form.email') }} *</label
                >
                <input
                  id="contact-email"
                  v-model.trim="form.email"
                  type="email"
                  name="email"
                  autocomplete="email"
                  required
                  maxlength="254"
                  class="w-full rounded-md border border-cream-300 px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label for="contact-tel" class="block text-sm font-medium text-text-main mb-1"
                  >{{ t('form.phone') }}</label
                >
                <input
                  id="contact-tel"
                  v-model.trim="form.tel"
                  type="tel"
                  name="tel"
                  autocomplete="tel"
                  maxlength="40"
                  class="w-full rounded-md border border-cream-300 px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label for="contact-message" class="block text-sm font-medium text-text-main mb-1"
                  >{{ t('form.message') }} *</label
                >
                <textarea
                  id="contact-message"
                  v-model.trim="form.message"
                  name="message"
                  required
                  rows="5"
                  maxlength="4000"
                  class="w-full rounded-md border border-cream-300 px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y min-h-[120px]"
                />
              </div>

              <p class="text-sm text-gray-600 italic">
                {{ t('common.requiredFields') }}
              </p>

              <NewsletterOptInField />

              <div v-if="errorMessage" class="text-red-500 text-sm">
                {{ errorMessage }}
              </div>

              <button
                type="submit"
                :disabled="isSubmitting"
                class="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 rounded-md bg-primary text-white font-semibold hover:bg-primaryHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isSubmitting ? `${t('form.sendingInProgress')}${loadingDots}` : t('contact.submit') }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Mail, MapPin, Phone } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { useHead } from '@vueuse/head'
import { EMAIL_CONTACT, WHATSAPP_NUMBER, CANONICAL_BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import StoreLocationMap from '@/components/StoreLocationMap.vue'
import NewsletterOptInField from '@/components/NewsletterOptInField.vue'
import { handleFormSubmit, prepareContactFormData } from '@/services/emailService'
import { t } from '@/i18n'

const router = useRouter()
const site = getSiteConfig()
const brandDisplayName = site.brand.displayName || site.brand.legalName
const storeMap = site.storeMap
const suivezNous = site.social?.suivezNous

const isSubmitting = ref(false)
const errorMessage = ref('')
const loadingDots = ref('')
let loadingInterval = null

watch(isSubmitting, (val) => {
  if (val) {
    let count = 0
    loadingInterval = setInterval(() => {
      count = (count + 1) % 4
      loadingDots.value = '.'.repeat(count)
    }, 400)
  } else {
    loadingDots.value = ''
    if (loadingInterval) clearInterval(loadingInterval)
  }
})

const hasSocialLinks = computed(
  () =>
    Boolean(site.social?.footerTiktokUrl) ||
    Boolean(suivezNous?.instagramUrl) ||
    Boolean(suivezNous?.facebookUrl) ||
    Boolean(WHATSAPP_NUMBER),
)

const showStoreMap = computed(() => {
  const center = storeMap?.center
  return (
    Boolean(storeMap?.enabled) &&
    center != null &&
    typeof center.lat === 'number' &&
    typeof center.lng === 'number'
  )
})

const form = reactive({
  name: '',
  email: '',
  tel: '',
  message: '',
})

const pageTitle = `${t('contact.title')} — ${brandDisplayName}`
const pageDescription = t('contact.metaDescription', { brand: brandDisplayName })

useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: pageDescription },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: pageDescription },
    { property: 'og:url', content: `${CANONICAL_BASE_URL}/contact` },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: pageTitle },
    { name: 'twitter:description', content: pageDescription },
  ],
})

async function submitContactForm(event) {
  event.preventDefault()
  isSubmitting.value = true
  errorMessage.value = ''

  await handleFormSubmit(
    event.target,
    prepareContactFormData,
    () => {
      router.push({ path: '/merci', query: { from: 'contact' } })
    },
    (error) => {
      errorMessage.value = t('form.submitError')
      console.error('Erreur:', error)
    },
  ).finally(() => {
    isSubmitting.value = false
  })
}
</script>
