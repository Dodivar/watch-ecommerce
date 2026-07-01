<template>
  <div class="min-h-screen">
    <section class="py-12">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">
            Estimation gratuite de votre montre
          </h1>
          <p class="text-xl text-gray-600 mb-3">
            Remplissez ce formulaire pour recevoir une estimation personnalisée
          </p>
          <RouterLink
            v-if="features.estimationProcess"
            to="/estimation/processus"
            class="inline-flex items-center text-primary hover:text-green-700 transition-colors text-sm font-medium underline"
          >
            <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Comment estimons-nous votre montre ?
          </RouterLink>
        </div>
        <div class="bg-white rounded-md shadow-2xl p-8">
          <form class="space-y-4" id="form-estimation" @submit="submitEstimationForm">
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-text-main mb-2" for="nickname"
                  >Prénom *</label
                >
                <input
                  name="nickname"
                  type="text"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-text-main mb-2" for="name">NOM *</label>
                <input
                  name="name"
                  type="text"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            <div class="grid md:grid-cols-2 gap-4">
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
            <div class="grid md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-text-main mb-2" for="brand"
                  >Marque *</label
                >
                <input
                  name="brand"
                  type="text"
                  placeholder="Ex: Rolex, Patek Philippe..."
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-text-main mb-2" for="model"
                  >Modèle</label
                >
                <input
                  name="model"
                  type="text"
                  placeholder="Ex: Submariner, Nautilus..."
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-text-main mb-2" for="year">Année</label>
                <input
                  name="year"
                  type="number"
                  min="1900"
                  max="2099"
                  step="1"
                  placeholder="2020"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <label
                  class="block text-sm font-medium text-text-main mb-2"
                  title="Le numéro de série sera examiné pour garantir l'authenticité de la montre"
                  for="serienumber"
                  >Numéro de série</label
                >
                <TooltipInfo
                  tooltip-text="Le numéro de série permet de garantir l'authenticité de la montre. Il se trouve généralement sur le boîtier ou les papiers d'origine."
                />
              </div>
              <input
                name="serienumber"
                type="text"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-main mb-2" for="possession"
                >État de possession *</label
              >
              <select
                name="possession"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="Full set (boîte + papiers)">Full set (boîte + papiers)</option>
                <option value="Papiers d'origine">Papiers d'origine</option>
                <option value="Boîte d'origine">Boîte d'origine</option>
                <option value="Montre seule">Montre seule</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-text-main mb-2" for="etat"
                >État général *</label
              >
              <select
                name="etat"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="Neuf/jamais portée">Neuf/jamais portée</option>
                <option value="Très bon état">Très bon état</option>
                <option value="Bon état">Bon état</option>
                <option value="Usage courant">Usage courant</option>
              </select>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <label class="block text-sm font-medium text-text-main mb-2"
                  >Photos de votre montre</label
                >
                <TooltipInfo
                  tooltip-text="Ajoutez des photos nettes de la montre (face, dos, bracelet, papiers, boîte, etc.). Cela aide à une estimation plus précise."
                />
              </div>
              <div
                class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors"
              >
                <input
                  name="attachments"
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  class="hidden"
                  id="attachments"
                />
                <label for="attachments" class="cursor-pointer">
                  <svg
                    class="mx-auto h-12 w-12 text-gray-400 mb-3"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span class="text-primary font-medium">Cliquez pour ajouter des photos</span>
                  <p class="text-gray-500 text-sm mt-1">PNG, JPG, PDF jusqu'à 10MB</p>
                </label>
              </div>
              <div
                class="w-full bg-green-50 border-l-4 border-primary text-primary font-semibold rounded-lg p-4 mt-4 text-center shadow-sm"
              >
                Merci d'ajouter <span class="underline">une photo de la preuve d'achat</span> de la
                montre (facture, reçu, etc.).
              </div>
              <div id="preview-attachments-container"></div>
            </div>
            <div>
              <label class="block text-sm font-medium text-text-main mb-2" for="message"
                >Message (optionnel)</label
              >
              <textarea
                name="message"
                rows="4"
                placeholder="Précisez si vous êtes le premier propriétaire de la montre, son histoire..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              ></textarea>
            </div>
            <p class="text-sm text-gray-600 mb-3 italic">
              * Les champs marqués d'un astérisque sont obligatoires
            </p>
            <NewsletterOptInField class="mb-3" />
            <div v-if="errorMessage" class="text-red-500 text-sm mb-3">
              {{ errorMessage }}
            </div>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full bg-primary text-white py-4 px-8 rounded-lg font-semibold text-lg hover:bg-primary-hover transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? `Envoi en cours${loadingDots}` : 'Faire estimer ma montre' }}
            </button>
          </form>
        </div>
      </div>
    </section>
    

  <!-- Section liens vers nos services -->
  <section v-if="features.collection || features.recherche" class="py-10 bg-cream">
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
            <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
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
        
        <!-- Recherche personnalisée de montre -->
        <div
          v-if="features.recherche"
          class="bg-white rounded-md shadow-lg p-8 hover:shadow-xl transition-all"
        >
          <div class="text-center">
            <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-text-main mb-3">Recherche personnalisée de montre</h3>
            <p class="text-gray-600 mb-4">
              Trouvez la montre de vos rêves grâce à notre service de recherche personnalisée. Notre équipe spécialisée vous aidera à trouver votre montre de rêve.
            </p>
            <RouterLink
              to="/recherche"
              class="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-hover transition-all"
            >
              Lancer ma recherche
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
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, watch } from 'vue'
import { handleFormSubmit, prepareEstimationFormData } from '@/services/emailService'
import NewsletterOptInField from '@/components/NewsletterOptInField.vue'
import { createPreviewElement } from '@/services/imagePreviewService'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import TooltipInfo from './TooltipInfo.vue'
import ContactCTA from './ContactCTA.vue'
const router = useRouter()
const features = getSiteConfig().features

const isSubmitting = ref(false)
const errorMessage = ref('')
const loadingDots = ref('')
let loadingInterval = null

async function submitEstimationForm(event) {
  event.preventDefault()
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await handleFormSubmit(
      event.target,
      prepareEstimationFormData,
      () => {
        ToMerci()
      },
      (error) => {
        errorMessage.value =
          error.message ||
          "Une erreur s'est produite lors de l'envoi du formulaire. Veuillez réessayer."
        console.error('Erreur détaillée:', error)
      },
    )
  } catch (error) {
    errorMessage.value =
      error.message ||
      "Une erreur s'est produite lors de l'envoi du formulaire. Veuillez réessayer."
    console.error('Erreur détaillée:', error)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  // Gestion des points de chargement
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

  // Preview photos files
  const fileInput = document.getElementById('attachments')
  const previewContainer = document.getElementById('preview-attachments-container')
  let selectedFiles = []

  function updatePreview() {
    previewContainer.innerHTML = ''
    // Trie : PDF d'abord, puis images
    const pdfFiles = selectedFiles.filter((f) => f.type === 'application/pdf')
    const imgFiles = selectedFiles.filter(
      (f) =>
        f.type.startsWith('image/') ||
        f.name.toLowerCase().endsWith('.heic') ||
        f.type === 'image/heic',
    )
    const allFiles = [...pdfFiles, ...imgFiles]
    allFiles.forEach(async (file) => {
      const previewEl = await createPreviewElement(file)
      // Ajout du bouton de suppression
      const removeBtn = document.createElement('button')
      removeBtn.type = 'button'
      removeBtn.innerHTML = '&times;'
      removeBtn.title = 'Supprimer'
      removeBtn.style.position = 'absolute'
      removeBtn.style.top = '4px'
      removeBtn.style.right = '4px'
      removeBtn.style.background = '#fff'
      removeBtn.style.color = '#22c55e'
      removeBtn.style.border = 'none'
      removeBtn.style.borderRadius = '50%'
      removeBtn.style.width = '24px'
      removeBtn.style.height = '24px'
      removeBtn.style.fontSize = '18px'
      removeBtn.style.cursor = 'pointer'
      removeBtn.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'
      removeBtn.addEventListener('click', () => {
        // Trouver l'index réel dans selectedFiles
        const realIdx = selectedFiles.findIndex((f) => f.name === file.name && f.size === file.size)
        if (realIdx !== -1) {
          selectedFiles.splice(realIdx, 1)
          updatePreview()
          updateInputFiles()
        }
      })
      previewEl.appendChild(removeBtn)
      previewContainer.appendChild(previewEl)
    })
  }

  function updateInputFiles() {
    // Crée un nouvel objet DataTransfer pour mettre à jour l'input file
    const dataTransfer = new DataTransfer()
    selectedFiles.forEach((f) => dataTransfer.items.add(f))
    fileInput.files = dataTransfer.files
  }

  fileInput.addEventListener('change', function () {
    const newFiles = Array.from(fileInput.files)
    // Ajoute les nouveaux fichiers sans doublons (par nom + taille)
    newFiles.forEach((f) => {
      if (!selectedFiles.some((sf) => sf.name === f.name && sf.size === f.size)) {
        selectedFiles.push(f)
      }
    })
    updatePreview()
    updateInputFiles()
  })

  // Initial preview si déjà des fichiers (rare mais possible)
  if (fileInput.files.length > 0) {
    selectedFiles = Array.from(fileInput.files)
    updatePreview()
  }
})

function ToMerci() {
  router.push({ path: '/merci', query: { from: 'estimation' } })
}
</script>

