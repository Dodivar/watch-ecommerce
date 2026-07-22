<script setup>
import { ref } from 'vue'
import { requestAdminPasswordReset } from '@/services/admin/adminAuthService'
import logoNoir from '@site/assets/logos/Logos RVB (web)/Icône RVB/Icône SW verte RVB.png'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const loginLogoAlt = getSiteConfig().brand.loginLogoAlt

const email = ref('')
const error = ref('')
const successMessage = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
  error.value = ''
  isLoading.value = true
  try {
    const result = await requestAdminPasswordReset(email.value)
    if (result.success) {
      successMessage.value = result.message
    } else {
      error.value = result.error
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <div class="bg-white rounded-md shadow-xl p-8 md:p-12">
        <!-- Logo -->
        <div class="mb-8 text-center">
          <img :src="logoNoir" :alt="loginLogoAlt" class="mx-auto h-16 w-auto" />
        </div>

        <h1 class="text-3xl md:text-4xl font-bold text-text-main mb-2 text-center">
          Mot de passe oublié
        </h1>
        <p class="text-lg text-gray-600 mb-8 text-center">
          Saisissez votre email pour recevoir un lien de réinitialisation
        </p>

        <div
          v-if="successMessage"
          class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
        >
          {{ successMessage }}
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="votre-email@example.com"
              class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-primary focus:outline-none transition-colors text-text-main"
              :disabled="isLoading"
              required
              autocomplete="email"
            />
          </div>

          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-hover transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isLoading">Envoyer le lien</span>
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
              Envoi en cours...
            </span>
          </button>
        </form>

        <p class="mt-8 text-center">
          <RouterLink
            to="/admin/login"
            class="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
          >
            ← Retour à la connexion
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
