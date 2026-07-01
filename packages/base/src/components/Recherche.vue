<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, watch } from 'vue'
import { scrollAnimation } from '@/animation'
import { handleFormSubmit, prepareSearchFormData } from '@/services/emailService'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import BudgetSlider from './BudgetSlider.vue'
import ContactCTA from './ContactCTA.vue'
import NewsletterOptInField from '@/components/NewsletterOptInField.vue'

defineOptions({ name: 'RechercheMontre' })

const router = useRouter()
const features = getSiteConfig().features
const isSubmitting = ref(false)
const errorMessage = ref('')
const budgetRange = ref([0, 15000])
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

async function submitSearchForm(event) {
  event.preventDefault()
  isSubmitting.value = true
  errorMessage.value = ''

  await handleFormSubmit(
    event.target,
    prepareSearchFormData,
    () => {
      ToMerci()
    },
    (error) => {
      errorMessage.value =
        "Une erreur s'est produite lors de l'envoi du formulaire. Veuillez réessayer."
      console.error('Erreur:', error)
    },
  ).finally(() => {
    isSubmitting.value = false
  })
}

function ToMerci() {
  router.push({ path: '/merci', query: { from: 'recherche' } })
}

onMounted(() => {
  scrollAnimation()
})
</script>

<template>
  <section class="py-10" name="RechercheMontre">
    <div class="max-w-4xl mx-auto px-4">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-text-main">Recherche personnalisée de montre</h1>
        <h2 class="text-2xl font-bold text-text-main mb-4">Trouvez la montre de vos rêves</h2>
        <p class="text-lg text-gray-600">
          Notre équipe spécialisée vous aide à trouver des montres rares, discontinuées ou très
          demandées. Grâce à notre réseau de confiance, nous sécurisons pour vous l'achat d'une
          pièce d'exception, au prix du marché et en toute sérénité.
        </p>
      </div>

      <div class="bg-white rounded-md shadow-xl p-8">
        <form class="space-y-6" @submit="submitSearchForm">
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-text-main mb-2" for="nickname"
                >Prénom *</label
              >
              <input
                type="text"
                name="nickname"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-main mb-2" for="name">Nom *</label>
              <input
                type="text"
                name="name"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-text-main mb-2" for="email"
                >Email *</label
              >
              <input
                name="email"
                type="email"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-main mb-2" for="tel"
                >Téléphone</label
              >
              <input
                name="tel"
                type="tel"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
          <!-- Choix du mode de recontact -->
          <div class="w-full">
            <label class="block text-sm font-medium text-text-main mb-2"
              >Comment souhaitez-vous être recontacté ?</label
            >
            <div class="flex flex-col md:flex-row gap-4 w-full">
              <label class="inline-flex items-center w-full">
                <input
                  type="checkbox"
                  class="form-checkbox accent-primary"
                  name="contact_mode[]"
                  value="pas de préférence"
                />
                <span class="ml-2">Pas de préférence</span>
              </label>
              <label class="inline-flex items-center w-full">
                <input
                  type="checkbox"
                  class="form-checkbox accent-primary"
                  name="contact_mode[]"
                  value="email"
                />
                <span class="ml-2">Email</span>
              </label>
              <label class="inline-flex items-center w-full">
                <input
                  type="checkbox"
                  class="form-checkbox accent-primary"
                  name="contact_mode[]"
                  value="whatsapp"
                />
                <span class="ml-2">WhatsApp</span>
              </label>
              <label class="inline-flex items-center w-full">
                <input
                  type="checkbox"
                  class="form-checkbox accent-primary"
                  name="contact_mode[]"
                  value="sms"
                />
                <span class="ml-2">SMS</span>
              </label>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-text-main mb-2" for="brand"
                >Marque souhaitée *</label
              >
              <input
                type="text"
                name="brand"
                required
                placeholder="Ex : Rolex, Patek Philippe..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-main mb-2" for="model"
                >Modèle spécifique (si connu)</label
              >
              <input
                type="text"
                name="model"
                placeholder="Ex : Daytona, Nautilus..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-main mb-10"
              >Budget approximatif (€)</label
            >
            <BudgetSlider v-model="budgetRange" />

            <input type="hidden" name="budget_min" :value="budgetRange[0]" />
            <input type="hidden" name="budget_max" :value="budgetRange[1]" />
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-text-main mb-2" for="condition"
                >État souhaité *</label
              >
              <select
                name="condition"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="Neuf">Neuf</option>
                <option value="Très bon état">Très bon état</option>
                <option value="Bon état">Bon état</option>
                <option value="Peu importe">Peu importe</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-text-main mb-2"
                >Délai souhaité pour l'acquisition</label
              >
              <input
                type="text"
                name="delai"
                placeholder="Ex : 1 mois, dès que possible..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-main mb-2" for="message"
              >Commentaires ou précisions supplémentaires</label
            >
            <textarea
              name="message"
              rows="4"
              placeholder="Boîte et papiers souhaités ? Préférence pour un vendeur local ?..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            ></textarea>
          </div>

          <p class="text-sm text-gray-600 mb-4 italic">
            * Les champs marqués d'un astérisque sont obligatoires
          </p>

          <NewsletterOptInField class="mb-4" />

          <div v-if="errorMessage" class="text-red-500 text-sm mb-4">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full bg-primary text-white py-4 px-8 rounded-lg font-semibold text-lg hover:bg-primary-hover transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? `Envoi en cours${loadingDots}` : 'Envoyer ma demande de recherche' }}
          </button>
        </form>
      </div>
    </div>
  </section>

  <!-- Section liens vers nos services -->
  <section v-if="features.collection || features.estimation" class="py-10 bg-cream">
    <div class="max-w-6xl mx-auto px-4">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-text-main mb-3">Nos autres services</h2>
        <p class="text-lg text-gray-600">
          Découvrez nos autres services spécialisés dans l'univers des montres
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        
        <!-- Lien vers la collection de montres -->
        <div
          v-if="features.collection"
          class="bg-white rounded-md shadow-lg p-8 hover:shadow-xl transition-all"
        >
          <div class="text-center">
            <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="inline-block w-8 h-8 text-white align-middle" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="2" fill="none"/>
              <rect x="9.5" y="1.5" width="5" height="3" rx="1" stroke="currentColor" stroke-width="2" fill="none"/>
              <rect x="9.5" y="19.5" width="5" height="3" rx="1" stroke="currentColor" stroke-width="2" fill="none"/>
              <path d="M12 8v4l2.5 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            </div>
            <h3 class="text-2xl font-bold text-text-main mb-3">Notre collection de montres</h3>
            <p class="text-gray-600 mb-4">
              Parcourez notre sélection de montres de prestige actuellement disponibles.
            </p>
            <RouterLink
              to="/collection"
              class="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-hover transition-all"
            >
              Découvrir la collection
              <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </RouterLink>
          </div>
        </div>
        
        <!-- Estimation de montre -->
        <div
          v-if="features.estimation"
          class="bg-white rounded-md shadow-lg p-8 hover:shadow-xl transition-all"
        >
          <div class="text-center">
            <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-text-main mb-3">Estimation de montre</h3>
            <p class="text-gray-600 mb-4">
              Obtenez une estimation précise et gratuite de votre montre. Notre expertise vous garantit une évaluation juste de la valeur de votre pièce.
            </p>
            <RouterLink
              to="/estimation"
              class="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-hover transition-all"
            >
              Estimer ma montre
              <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Call-to-action supplémentaire -->
      <ContactCTA />
    </div>
  </section>
</template>

<style scoped></style>
