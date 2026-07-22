<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import { markAdminAuthenticated } from '@/services/admin/adminAuthService'
import logoNoir from '@site/assets/logos/Logos RVB (web)/Icône RVB/Icône SW verte RVB.png'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const loginLogoAlt = getSiteConfig().brand.loginLogoAlt

const router = useRouter()
const password = ref('')
const passwordConfirm = ref('')
const error = ref('')
const linkError = ref('')
const isLoading = ref(false)
const sessionReady = ref(false)
const checkingSession = ref(true)

let authSubscription = null

// Le lien d'invitation Supabase arrive avec des jetons dans le hash ; le client
// (detectSessionInUrl) les transforme en session. Un lien expiré arrive avec
// #error=...&error_description=...
onMounted(async () => {
  const hash = window.location.hash || ''
  if (hash.includes('error=')) {
    const params = new URLSearchParams(hash.replace(/^#/, ''))
    linkError.value = params.get('error_description') || 'Lien invalide ou expiré'
    checkingSession.value = false
    return
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.user) {
    sessionReady.value = true
    checkingSession.value = false
    return
  }

  // La session du lien peut se créer juste après le mount : attendre l'événement.
  const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
    if (newSession?.user) {
      sessionReady.value = true
      checkingSession.value = false
    }
  })
  authSubscription = data.subscription

  setTimeout(() => {
    if (!sessionReady.value) {
      linkError.value = 'Lien invalide ou expiré'
      checkingSession.value = false
    }
  }, 3000)
})

onUnmounted(() => {
  authSubscription?.unsubscribe()
})

const handleSubmit = async () => {
  error.value = ''

  if (password.value.length < 8) {
    error.value = 'Le mot de passe doit contenir au moins 8 caractères'
    return
  }
  if (password.value !== passwordConfirm.value) {
    error.value = 'Les deux mots de passe ne correspondent pas'
    return
  }

  isLoading.value = true
  try {
    const { data, error: updateError } = await supabase.auth.updateUser({
      password: password.value,
    })
    if (updateError) {
      error.value = updateError.message || 'Impossible de définir le mot de passe'
      return
    }

    markAdminAuthenticated(data.user?.email || '', true)
    router.push('/admin')
  } catch (err) {
    console.error(err)
    error.value = 'Une erreur est survenue'
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
          Bienvenue
        </h1>
        <p class="text-lg text-gray-600 mb-8 text-center">
          Choisissez votre mot de passe pour accéder à l’administration
        </p>

        <div v-if="checkingSession" class="text-center text-gray-500 py-6">
          Vérification du lien d’invitation…
        </div>

        <div v-else-if="linkError">
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {{ linkError }}
          </div>
          <p class="text-sm text-gray-600 text-center">
            Demandez à un administrateur de renvoyer une invitation, ou
            <RouterLink to="/admin/login" class="font-medium text-primary hover:underline">
              connectez-vous
            </RouterLink>
            si vous avez déjà un mot de passe.
          </p>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-primary focus:outline-none transition-colors text-text-main"
              :disabled="isLoading"
              required
              minlength="8"
              autocomplete="new-password"
            />
            <p class="mt-1 text-xs text-gray-500">8 caractères minimum</p>
          </div>

          <div>
            <label for="passwordConfirm" class="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe
            </label>
            <input
              id="passwordConfirm"
              v-model="passwordConfirm"
              type="password"
              placeholder="••••••••"
              class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-primary focus:outline-none transition-colors text-text-main"
              :disabled="isLoading"
              required
              minlength="8"
              autocomplete="new-password"
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
            <span v-if="!isLoading">Définir le mot de passe</span>
            <span v-else>Enregistrement…</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
