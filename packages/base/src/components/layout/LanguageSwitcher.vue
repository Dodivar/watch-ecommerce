<script setup>
/**
 * Sélecteur de langue.
 *
 * Le changement de langue est une **navigation complète** et non une navigation SPA :
 * `getSiteConfig()` est un singleton capturé au montage par une soixantaine de composants,
 * et la base d'historique de vue-router est figée à la création du routeur. Un rechargement
 * par changement de langue — une action rare et explicite — évite de rendre tout le manifest
 * réactif. Le panier et le consentement survivent (`localStorage`).
 *
 * Ne rend rien si le site ne déclare qu'une langue : les sites monolingues sont intacts.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Check, Globe } from '@lucide/vue'

import { getActiveLocale, getI18nConfig, setStoredLocale } from '@/i18n/activeLocale.js'
import { LOCALE_LABELS, LOCALE_SHORT_LABELS } from '@/i18n/locales.js'
import { localizedUrl } from '@/config'
import { t } from '@/i18n'

defineProps({
  /** `menu` : liste dépliée, pour le menu mobile. `dropdown` : bouton + panneau, pour le header. */
  variant: { type: String, default: 'dropdown' },
})

const emit = defineEmits(['navigate'])

const route = useRoute()
const i18n = getI18nConfig()
const activeLocale = getActiveLocale()
const locales = i18n.locales

const open = ref(false)
const rootEl = ref(null)

const activeShortLabel = computed(() => LOCALE_SHORT_LABELS[activeLocale] ?? activeLocale)

function labelFor(locale) {
  return LOCALE_LABELS[locale] ?? locale
}

function toggle() {
  open.value = !open.value
  if (open.value) {
    document.addEventListener('click', onDocumentClick)
  } else {
    document.removeEventListener('click', onDocumentClick)
  }
}

function onDocumentClick(event) {
  if (!rootEl.value?.contains(event.target)) {
    open.value = false
    document.removeEventListener('click', onDocumentClick)
  }
}

onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))

/**
 * URL de la page courante dans une autre langue. `route.fullPath` est déjà dépréfixé par la
 * base d'historique : `localizedUrl` repose le bon préfixe.
 *
 * @param {string} locale
 */
function urlFor(locale) {
  return localizedUrl(route.fullPath, locale)
}

/**
 * Mémorise le choix — explicite, donc prioritaire sur `navigator.languages` aux visites
 * suivantes — puis laisse le navigateur suivre le lien.
 *
 * @param {string} locale
 */
function select(locale) {
  if (locale !== activeLocale) setStoredLocale(locale)
  open.value = false
  emit('navigate')
}
</script>

<template>
  <div v-if="locales.length > 1" ref="rootEl" class="relative">
    <!-- Menu mobile : les langues sont dépliées, pas de niveau supplémentaire à ouvrir. -->
    <ul v-if="variant === 'menu'" class="flex items-center gap-2">
      <li v-for="locale in locales" :key="locale">
        <a
          :href="urlFor(locale)"
          :hreflang="locale"
          :aria-current="locale === activeLocale ? 'true' : undefined"
          class="block rounded-full border px-3 py-1 text-sm font-semibold transition-colors"
          :class="
            locale === activeLocale
              ? 'border-current opacity-100'
              : 'border-transparent opacity-70 hover:opacity-100'
          "
          @click="select(locale)"
        >
          {{ LOCALE_SHORT_LABELS[locale] ?? locale }}
          <span class="sr-only">{{ labelFor(locale) }}</span>
        </a>
      </li>
    </ul>

    <template v-else>
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold transition-opacity hover:opacity-70"
        :aria-expanded="open"
        aria-haspopup="listbox"
        :aria-label="`${t('nav.language')} : ${labelFor(activeLocale)}`"
        @click.stop="toggle"
      >
        <Globe class="h-4 w-4" aria-hidden="true" />
        <span>{{ activeShortLabel }}</span>
      </button>

      <ul
        v-if="open"
        role="listbox"
        class="absolute right-0 z-50 mt-2 min-w-[10rem] overflow-hidden rounded-lg border border-black/10 bg-white py-1 shadow-lg"
      >
        <li v-for="locale in locales" :key="locale" role="none">
          <a
            :href="urlFor(locale)"
            :hreflang="locale"
            role="option"
            :aria-selected="locale === activeLocale"
            class="flex items-center justify-between gap-3 px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
            @click="select(locale)"
          >
            <span>{{ labelFor(locale) }}</span>
            <Check v-if="locale === activeLocale" class="h-4 w-4" aria-hidden="true" />
          </a>
        </li>
      </ul>
    </template>
  </div>
</template>
