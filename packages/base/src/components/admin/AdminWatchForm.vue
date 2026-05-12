<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createWatch, updateWatch, uploadWatchImage, deleteWatchImage, reorderWatchImages, getWatchByIdForAdmin, duplicateWatch } from '@/services/admin/adminWatchService'
import { getWatchAudiencesForAdminForm } from '@/services/watchService'
import { DEFAULT_WATCH_AUDIENCE_SLUG, getStaticWatchAudienceAdminOptions } from '@/constants/watchAudiences'
import AdminHeader from './AdminHeader.vue'
import AdminWatchArticleSelector from './AdminWatchArticleSelector.vue'

const router = useRouter()
const route = useRoute()

const isEditMode = computed(() => !!route.params.id)
const watchId = computed(() => route.params.id)

// Form state
const formData = ref({
  adCode: '',
  name: '',
  brand: '',
  model: '',
  reference: '',
  price: '',
  year: '',
  condition: '',
  description: '',
  isAvailable: true,
  isSold: false,
  saleDate: null,
  audience: 'unisexe',
  details: {
    content: '',
    movement: '',
    caseMaterial: '',
    braceletMaterial: '',
    caseSize: '',
    thickness: '',
    dialColor: '',
    crystal: '',
    waterResistance: '',
    functions: '',
    powerReserve: '',
    frequency: '',
    caseCondition: '',
    dialCondition: '',
    braceletCondition: '',
    guarantee: '1 an de garantie',
    accessories: [],
  },
})

const images = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref(null)
const success = ref(null)
const initialIsSold = ref(false)

// Image upload
const imageInput = ref(null)
const isUploadingImage = ref(false)

// Accessory management
const newAccessoryName = ref('')
const newAccessoryIncluded = ref(false)

// Article selector modal
const showArticleSelector = ref(false)
const linkedArticles = ref([])

/** @type {import('vue').Ref<Array<{ value: string, label: string }>>} */
const audienceFormOptions = ref(getStaticWatchAudienceAdminOptions())

async function loadWatchAudienceOptions() {
  audienceFormOptions.value = await getWatchAudiencesForAdminForm()
}

// Methods
const loadWatch = async () => {
  if (!isEditMode.value) return

  try {
    isLoading.value = true
    error.value = null
    const watch = await getWatchByIdForAdmin(watchId.value)

    const isSoldValue = watch.isSold !== undefined ? watch.isSold : false
    initialIsSold.value = isSoldValue
    formData.value = {
      adCode: watch.adCode || '',
      name: watch.name || '',
      brand: watch.brand || '',
      model: watch.model || '',
      reference: watch.reference || '',
      price: watch.price?.toString() || '',
      year: watch.year?.toString() || '',
      condition: watch.condition || '',
      description: watch.description || '',
      isAvailable: watch.isAvailable !== undefined ? watch.isAvailable : true,
      isSold: isSoldValue,
      saleDate: watch.saleDate || null,
      audience: watch.audience || 'unisexe',
      details: {
        content: watch.details?.content || '',
        movement: watch.details?.movement || '',
        caseMaterial: watch.details?.caseMaterial || '',
        braceletMaterial: watch.details?.braceletMaterial || '',
        caseSize: watch.details?.caseSize || '',
        thickness: watch.details?.thickness || '',
        dialColor: watch.details?.dialColor || '',
        crystal: watch.details?.crystal || '',
        waterResistance: watch.details?.waterResistance || '',
        functions: watch.details?.functions || '',
        powerReserve: watch.details?.powerReserve || '',
        frequency: watch.details?.frequency || '',
        caseCondition: watch.details?.caseCondition || '',
        dialCondition: watch.details?.dialCondition || '',
        braceletCondition: watch.details?.braceletCondition || '',
        guarantee: watch.details?.guarantee || '',
        accessories: watch.details?.accessories || [],
      },
    }

    const audienceOk = audienceFormOptions.value.some((o) => o.value === formData.value.audience)
    if (!audienceOk) {
      formData.value.audience = DEFAULT_WATCH_AUDIENCE_SLUG
    }

    // Load images (getWatchByIdForAdmin retourne déjà les images avec leurs IDs)
    images.value = (watch.images || []).map((img) => ({
      id: img.id,
      url: img.url,
      order: img.order,
    })).sort((a, b) => a.order - b.order)

    // Load linked articles
    linkedArticles.value = watch.articles || []
  } catch (err) {
    console.error('Erreur lors du chargement de la montre:', err)
    error.value = err.message || 'Erreur lors du chargement de la montre'
  } finally {
    isLoading.value = false
  }
}

const addAccessory = () => {
  if (!newAccessoryName.value.trim()) return

  formData.value.details.accessories.push({
    name: newAccessoryName.value.trim(),
    included: newAccessoryIncluded.value,
  })

  newAccessoryName.value = ''
  newAccessoryIncluded.value = false
}

const removeAccessory = (index) => {
  formData.value.details.accessories.splice(index, 1)
}

const handleImageUpload = async (event) => {
  const files = Array.from(event.target.files)
  if (files.length === 0) return

  // Si on est en mode création, on stocke les fichiers temporairement
  if (!isEditMode.value) {
    for (const file of files) {
      const reader = new FileReader()
      reader.onload = (e) => {
        images.value.push({
          id: `temp-${Date.now()}-${Math.random()}`,
          url: e.target.result,
          file: file,
          order: images.value.length + 1,
        })
      }
      reader.readAsDataURL(file)
    }
    return
  }

  // En mode édition, upload immédiatement
  isUploadingImage.value = true
  try {
    for (const file of files) {
      const result = await uploadWatchImage(watchId.value, file)
      if (result.success) {
        images.value.push({
          id: result.data.id,
          url: result.data.image_url,
          order: result.data.image_order,
        })
      } else {
        error.value = result.error || "Erreur lors de l'upload de l'image"
      }
    }
  } catch (err) {
    error.value = "Erreur lors de l'upload de l'image"
    console.error(err)
  } finally {
    isUploadingImage.value = false
    if (imageInput.value) {
      imageInput.value.value = ''
    }
  }
}

const removeImage = async (imageIndex) => {
  const image = images.value[imageIndex]

  // Si c'est une image temporaire (mode création), juste la supprimer
  if (image.id.startsWith('temp-')) {
    images.value.splice(imageIndex, 1)
    return
  }

  // En mode édition, supprimer de la base de données
  try {
    const result = await deleteWatchImage(image.id)
    if (result.success) {
      images.value.splice(imageIndex, 1)
    } else {
      error.value = result.error || "Erreur lors de la suppression de l'image"
    }
  } catch (err) {
    error.value = "Erreur lors de la suppression de l'image"
    console.error(err)
  }
}

const moveImage = (index, direction) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= images.value.length) return

  const temp = images.value[index]
  images.value[index] = images.value[newIndex]
  images.value[newIndex] = temp

  // Mettre à jour les ordres
  images.value.forEach((img, idx) => {
    img.order = idx + 1
  })

  // En mode édition, sauvegarder l'ordre
  if (isEditMode.value) {
    const imageOrders = images.value.map((img) => ({
      id: img.id,
      order: img.order,
    }))
    reorderWatchImages(imageOrders).catch((err) => {
      console.error('Erreur lors de la réorganisation:', err)
    })
  }
}

const validateForm = () => {
  if (!formData.value.adCode.trim()) {
    return 'Le code annonce est requis'
  }
  if (!formData.value.name.trim()) {
    return 'Le nom est requis'
  }
  if (!formData.value.brand.trim()) {
    return 'La marque est requise'
  }
  if (!formData.value.model.trim()) {
    return 'Le modèle est requis'
  }
  if (!formData.value.reference.trim()) {
    return 'La référence est requise'
  }
  if (!formData.value.price || parseFloat(formData.value.price) <= 0) {
    return 'Le prix doit être supérieur à 0'
  }
  return null
}

const handleSubmit = async () => {
  error.value = null
  success.value = null

  const validationError = validateForm()
  if (validationError) {
    error.value = validationError
    return
  }

  // Si on décoche "vendue", s'assurer que "En vente / Disponible" est coché
  if (isEditMode.value && initialIsSold.value && !formData.value.isSold) {
    formData.value.isAvailable = true
  }

  await performSubmit()
}

const performSubmit = async () => {
  isSaving.value = true

  try {
    let result

    if (isEditMode.value) {
      result = await updateWatch(watchId.value, formData.value)
    } else {
      result = await createWatch(formData.value)
      if (result.success && result.data?.id) {
        // Upload les images temporaires
        const tempImages = images.value.filter((img) => img.id.startsWith('temp-'))
        for (const img of tempImages) {
          if (img.file) {
            await uploadWatchImage(result.data.id, img.file, img.order)
          }
        }
      }
    }

    if (result.success) {
      success.value = isEditMode.value ? 'Montre mise à jour avec succès' : 'Montre créée avec succès'
      setTimeout(() => {
        router.push('/admin')
      }, 1500)
    } else {
      error.value = result.error || 'Erreur lors de la sauvegarde'
    }
  } catch (err) {
    console.error('Erreur lors de la sauvegarde:', err)
    error.value = 'Une erreur est survenue lors de la sauvegarde'
  } finally {
    isSaving.value = false
  }
}


const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const handleDuplicate = async () => {
  if (!isEditMode.value) return

  try {
    error.value = null
    success.value = null
    const result = await duplicateWatch(watchId.value)
    if (result.success) {
      success.value = `Montre "${formData.value.name}" dupliquée avec succès. Redirection...`
      // Rediriger vers la liste après 1.5 secondes
      setTimeout(() => {
        router.push('/admin')
      }, 1500)
    } else {
      error.value = result.error || 'Erreur lors de la duplication'
    }
  } catch (err) {
    error.value = 'Une erreur est survenue lors de la duplication'
    console.error(err)
  }
}

// Watcher pour s'assurer que si on décoche "vendue", "En vente / Disponible" est coché
watch(() => formData.value.isSold, (newValue) => {
  if (isEditMode.value && initialIsSold.value && newValue === false) {
    // Remettre automatiquement en vente si on décoche "vendue"
    formData.value.isAvailable = true
  }
})

const handleArticlesSaved = () => {
  // Recharger la montre pour mettre à jour les articles liés
  if (isEditMode.value) {
    loadWatch()
  }
  success.value = 'Articles liés mis à jour avec succès'
  setTimeout(() => {
    success.value = null
  }, 3000)
}

onMounted(async () => {
  await loadWatchAudienceOptions()
  if (isEditMode.value) {
    await loadWatch()
  }
})
</script>

<template>
  <div class="min-h-screen bg-cream py-8">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <AdminHeader
        :title="isEditMode ? 'Modifier la montre' : 'Ajouter une montre'"
        :show-back-button="true"
        back-button-text="Retour à la liste"
        back-button-route="/admin"
      />

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-16">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p class="text-gray-600">Chargement...</p>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Error/Success Messages -->
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {{ error }}
        </div>
        <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {{ success }}
        </div>

        <!-- Basic Information -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Informations de base</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Code annonce <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.adCode"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nom <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Marque <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.brand"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Modèle <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.model"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Public</label>
              <select
                v-model="formData.audience"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              >
                <option v-for="opt in audienceFormOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Référence <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.reference"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Prix (€) <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.price"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Année</label>
              <input
                v-model="formData.year"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">État</label>
              <input
                v-model="formData.condition"
                type="text"
                placeholder="Ex: Excellent, Très bon, Bon"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="flex items-center">
                <input
                  v-model="formData.isAvailable"
                  type="checkbox"
                  class="mr-2 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span class="text-sm font-medium text-gray-700">En vente / Disponible</span>
              </label>
            </div>
            <div>
              <label class="flex items-center">
                <input
                  v-model="formData.isSold"
                  type="checkbox"
                  class="mr-2 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span class="text-sm font-medium text-gray-700">
                  Vendue
                </span>
              </label>
            </div>
            <div v-if="formData.isSold && formData.saleDate" class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Date de mise en vente</label>
              <div class="px-4 py-2 bg-cream border border-gray-300 rounded-lg text-sm text-gray-700">
                {{ formatDate(formData.saleDate) }}
              </div>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                v-model="formData.description"
                rows="4"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Technical Details -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Détails techniques</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Contenu</label>
              <input
                v-model="formData.details.content"
                type="text"
                placeholder="Ex: Full set"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Mouvement</label>
              <input
                v-model="formData.details.movement"
                type="text"
                placeholder="Ex: Remontage automatique"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Matériau boîtier</label>
              <input
                v-model="formData.details.caseMaterial"
                type="text"
                placeholder="Ex: Acier inoxydable"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Matériau bracelet</label>
              <input
                v-model="formData.details.braceletMaterial"
                type="text"
                placeholder="Ex: Acier inoxydable"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Taille boîtier</label>
              <input
                v-model="formData.details.caseSize"
                type="text"
                placeholder="Ex: 40 mm"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Épaisseur</label>
              <input
                v-model="formData.details.thickness"
                type="text"
                placeholder="Ex: 12.5 mm"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Couleur cadran</label>
              <input
                v-model="formData.details.dialColor"
                type="text"
                placeholder="Ex: Noir"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Verre</label>
              <input
                v-model="formData.details.crystal"
                type="text"
                placeholder="Ex: Saphir"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Résistance à l'eau</label>
              <input
                v-model="formData.details.waterResistance"
                type="text"
                placeholder="Ex: 300 m"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fonctions</label>
              <input
                v-model="formData.details.functions"
                type="text"
                placeholder="Ex: Heures, minutes, secondes, date"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Réserve de marche</label>
              <input
                v-model="formData.details.powerReserve"
                type="text"
                placeholder="Ex: 48 heures"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fréquence</label>
              <input
                v-model="formData.details.frequency"
                type="text"
                placeholder="Ex: 28800 alt/h"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">État boîtier</label>
              <input
                v-model="formData.details.caseCondition"
                type="text"
                placeholder="Ex: Excellent état"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">État cadran</label>
              <input
                v-model="formData.details.dialCondition"
                type="text"
                placeholder="Ex: Excellent état"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">État bracelet</label>
              <input
                v-model="formData.details.braceletCondition"
                type="text"
                placeholder="Ex: Excellent état"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Garantie</label>
              <input
                v-model="formData.details.guarantee"
                type="text"
                placeholder="Ex: 1 an de garantie"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <!-- Accessories -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Accessoires</h2>
          <div class="space-y-4">
            <div class="flex gap-4">
              <input
                v-model="newAccessoryName"
                type="text"
                placeholder="Nom de l'accessoire"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                @keyup.enter="addAccessory"
              />
              <label class="flex items-center">
                <input
                  v-model="newAccessoryIncluded"
                  type="checkbox"
                  class="mr-2 bg-primary text-white accent-primary"
                />
                Inclus
              </label>
              <button
                type="button"
                @click="addAccessory"
                class="px-4 py-2 bg-primary text-gray-700 rounded-lg text-white transition-colors"
              >
                Ajouter
              </button>
            </div>
            <div v-if="formData.details.accessories.length > 0" class="space-y-2">
              <div
                v-for="(accessory, index) in formData.details.accessories"
                :key="index"
                class="flex items-center justify-between p-3 bg-cream rounded-lg"
              >
                <div class="flex items-center">
                  <input
                    v-model="accessory.included"
                    type="checkbox"
                    class="mr-3"
                  />
                  <span>{{ accessory.name }}</span>
                </div>
                <button
                  type="button"
                  @click="removeAccessory(index)"
                  class="text-red-600 hover:text-red-800"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Linked Articles -->
        <div v-if="isEditMode" class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">Articles liés</h2>
              <p v-if="linkedArticles.length > 0" class="text-sm text-gray-600 mt-1">
                {{ linkedArticles.length }} article{{ linkedArticles.length > 1 ? 's' : '' }} lié{{ linkedArticles.length > 1 ? 's' : '' }}
              </p>
            </div>
            <button
              type="button"
              @click="showArticleSelector = true"
              class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              Gérer les articles liés
            </button>
          </div>
          <p class="text-sm text-gray-600">
            Sélectionnez les articles de blog à afficher sur la page de cette montre.
          </p>
        </div>

        <!-- Images -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Images</h2>
          <div class="space-y-4">
            <input
              ref="imageInput"
              type="file"
              accept="image/*"
              multiple
              @change="handleImageUpload"
              class="hidden"
            />
            <button
              type="button"
              @click="imageInput?.click()"
              :disabled="isUploadingImage"
              class="px-4 py-2 bg-primary text-gray-700 rounded-lg text-white transition-colors disabled:opacity-50"
            >
              {{ isUploadingImage ? 'Upload en cours...' : '+ Ajouter des images' }}
            </button>
            <div v-if="images.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                v-for="(image, index) in images"
                :key="image.id"
                class="relative group"
              >
                <img
                  :src="image.url"
                  :alt="`Image ${index + 1}`"
                  class="w-full h-32 object-cover rounded-lg"
                />
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center space-x-2">
                  <button
                    type="button"
                    @click="moveImage(index, -1)"
                    :disabled="index === 0"
                    class="opacity-0 group-hover:opacity-100 text-white disabled:opacity-30"
                    title="Déplacer vers la gauche"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    @click="removeImage(index)"
                    class="opacity-0 group-hover:opacity-100 text-red-500"
                    title="Supprimer"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    @click="moveImage(index, 1)"
                    :disabled="index === images.length - 1"
                    class="opacity-0 group-hover:opacity-100 text-white disabled:opacity-30"
                    title="Déplacer vers la droite"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div class="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {{ index + 1 }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit Buttons -->
        <div class="flex justify-end space-x-4">
          <button
            type="button"
            @click="router.push('/admin')"
            class="px-6 py-2 text-gray-700 rounded-lg bg-white transition-colors"
          >
            Annuler
          </button>
          <button
            v-if="isEditMode"
            type="button"
            @click="handleDuplicate"
            :disabled="isSaving"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Dupliquer
          </button>
          <button
            type="submit"
            :disabled="isSaving"
            class="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {{ isSaving ? 'Sauvegarde...' : isEditMode ? 'Mettre à jour' : 'Créer' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Article Selector Modal -->
    <AdminWatchArticleSelector
      v-if="isEditMode"
      :is-open="showArticleSelector"
      :watch-id="watchId"
      @close="showArticleSelector = false"
      @saved="handleArticlesSaved"
    />
  </div>
</template>

