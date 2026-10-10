<script setup>
/**
 * Bandeau « ce site est aussi disponible en … ».
 *
 * Remplace la détection automatique de la langue du navigateur : une URL sans préfixe sert
 * toujours la langue par défaut (indexable, conforme à sa canonique) et le visiteur choisit
 * lui-même de basculer. Le texte est rédigé dans la langue **proposée**.
 *
 * `data-nosnippet` : Googlebot rend les pages avec un navigateur anglais et verrait ce bandeau ;
 * sans cet attribut, il pourrait en tirer l'extrait affiché sous le résultat.
 */
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { X } from '@lucide/vue'

import { getActiveLocale, localizedPath, setStoredLocale } from '@/i18n/activeLocale.js'
import { createSuggestionTranslator, getSuggestedLocale } from '@/i18n/localeSuggestion.js'

const route = useRoute()
const activeLocale = getActiveLocale()

const suggestedLocale = ref(getSuggestedLocale(route.path))
const tx = suggestedLocale.value ? createSuggestionTranslator(suggestedLocale.value).t : null

/**
 * Lien relatif à l'hôte servi (même raison que `LanguageSwitcher.vue`) : une origine canonique
 * mal configurée ne doit pas envoyer le visiteur sur un autre domaine.
 */
function suggestedUrl() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}${localizedPath(route.fullPath, suggestedLocale.value)}`
}

/** Accepter est un choix explicite : le navigateur suit ensuite le lien. */
function accept() {
  setStoredLocale(suggestedLocale.value)
}

/** Écarter aussi : rester sur la langue actuelle, sans reposer la question. */
function dismiss() {
  setStoredLocale(activeLocale)
  suggestedLocale.value = null
}
</script>

<template>
  <div
    v-if="suggestedLocale"
    data-nosnippet
    role="region"
    :lang="suggestedLocale"
    class="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md rounded-lg bg-primary px-4 py-3 text-white shadow-lg sm:right-auto sm:mx-0"
  >
    <div class="flex items-center gap-3">
      <p class="flex-1 text-sm leading-snug">{{ tx('localeSuggestion.message') }}</p>
      <a
        :href="suggestedUrl()"
        :hreflang="suggestedLocale"
        class="inline-flex shrink-0 items-center rounded-md bg-white/15 px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        @click="accept"
      >
        {{ tx('localeSuggestion.accept') }}
      </a>
      <button
        type="button"
        class="shrink-0 rounded-md p-1 text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        :aria-label="tx('localeSuggestion.dismiss')"
        @click="dismiss"
      >
        <X class="h-4 w-4" :stroke-width="2" />
      </button>
    </div>
  </div>
</template>
