/**
 * Balises d'en-tête liées à la langue : `<html lang>`, alternates `hreflang` et `og:locale`.
 *
 * Appelé une seule fois depuis `App.vue` : les routes sont identiques dans les trois langues,
 * donc les alternates se déduisent du chemin courant sans que chaque page ait à les déclarer.
 *
 * Les routes dont le contenu vient de la base (fiches montre, articles de blog) n'émettent pas
 * d'alternates : leur version traduite n'habille qu'un texte resté français, et annoncer des
 * équivalents que Google verrait comme des quasi-doublons dessert le référencement. Leur
 * canonique pointe vers la langue par défaut (voir `WatchDetail.vue` et `BlogDetail.vue`).
 */

import { computed } from 'vue'
import { useHead } from '@vueuse/head'
import { useRoute } from 'vue-router'

import { getActiveLocale, getI18nConfig } from '@/i18n/activeLocale.js'
import { OG_LOCALES } from '@/i18n/locales.js'
import { localizedUrl } from '@/config'

/**
 * @param {string} path Chemin dépréfixé (`route.path`).
 * @param {{ untranslatedRoutes?: string[] }} i18n
 * @returns {boolean}
 */
export function isUntranslatedRoute(path, i18n) {
  const prefixes = i18n?.untranslatedRoutes
  if (!Array.isArray(prefixes)) return false
  return prefixes.some((prefix) => path.startsWith(prefix))
}

export function useLocaleHead() {
  const route = useRoute()
  const i18n = getI18nConfig()
  const locale = getActiveLocale()

  const head = computed(() => {
    const meta = [{ property: 'og:locale', content: OG_LOCALES[locale] ?? locale }]
    const link = []

    if (i18n.enabled && !isUntranslatedRoute(route.path, i18n)) {
      for (const code of i18n.locales) {
        if (code !== locale) {
          meta.push({ property: 'og:locale:alternate', content: OG_LOCALES[code] ?? code })
        }
        link.push({ rel: 'alternate', hreflang: code, href: localizedUrl(route.path, code) })
      }
      // `x-default` : la version servie à un visiteur dont la langue n'est pas proposée.
      link.push({
        rel: 'alternate',
        hreflang: 'x-default',
        href: localizedUrl(route.path, i18n.defaultLocale),
      })
    }

    return { htmlAttrs: { lang: locale }, meta, link }
  })

  useHead(head)
}
