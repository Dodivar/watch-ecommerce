<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { checkMaintenancePassword, authenticate } from '@/services/maintenanceService'
import { EMAIL_CONTACT } from '@/config'
import logoNoir from '@site/assets/logos/Logos RVB (web)/Logos RVB horizontal/Logo SW vert horizontal RVB.png'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const loginLogoAlt = getSiteConfig().brand.loginLogoAlt

const router = useRouter()
const password = ref('')
const error = ref('')
const isLoading = ref(false)
const remember = ref(false)

const handleSubmit = async () => {
  error.value = ''
  isLoading.value = true

  try {
    const isValid = checkMaintenancePassword(password.value)
    if (isValid) {
      // Authentifier l'utilisateur
      authenticate(remember.value)
      // Rediriger vers la page d'accueil
      router.push('/')
    } else {
      error.value = 'Mot de passe incorrect'
    }
  } catch {
    error.value = 'Une erreur est survenue'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-2xl w-full">
      <div class="bg-white rounded-md shadow-xl p-8 md:p-12 text-center">
        <!-- Logo -->
        <div class="mb-8">
          <img
            :src="logoNoir"
            :alt="loginLogoAlt"
            class="mx-auto h-16 w-auto"
          />
        </div>

        <!-- Titre -->
        <h1 class="text-3xl md:text-4xl font-bold text-text-main mb-4">
          Site en construction
        </h1>
        <p class="text-xl text-gray-600 mb-8">
          Nous travaillons actuellement sur notre site web.
          <br />
          Revenez bientôt pour le découvrir !
        </p>

        <!-- Formulaire de mot de passe -->
        <div class="bg-white rounded-md p-6 mb-6 shadow-lg">
          <h2 class="text-lg font-semibold text-text-main mb-4">
            Accès réservé
          </h2>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <input
                v-model="password"
                type="password"
                placeholder="Entrez le mot de passe"
                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-primary focus:outline-none transition-colors text-text-main"
                :disabled="isLoading"
                required
              />
            </div>
            <div class="flex items-center">
              <input
                id="remember"
                v-model="remember"
                type="checkbox"
                class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                :disabled="isLoading"
              />
              <label for="remember" class="ml-2 text-sm text-gray-600">
                Se souvenir de moi (rester connecté)
              </label>
            </div>
            <div v-if="error" class="text-red-600 text-sm">
              {{ error }}
            </div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-hover transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="!isLoading">Accéder au site</span>
              <span v-else class="flex items-center justify-center">
                <svg
                  class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Vérification...
              </span>
            </button>
          </form>
        </div>

        <!-- Informations de contact -->
        <div class="text-gray-600 text-sm">
          <p class="mb-2">
            Pour toute question, contactez-nous :
          </p>
          <div class="flex justify-center items-center space-x-4">
            <a
              :href="'mailto:' + EMAIL_CONTACT"
              class="text-primary hover:underline flex items-center"
            >
              <svg
                class="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {{ EMAIL_CONTACT }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>

