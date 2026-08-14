import 'virtual:site-theme.css'
import './assets/main.css'
/* Doit rester après main.css : réécrit les utilitaires neutres pour le thème vert. */
import './assets/theme-dark.css'

import { createApp } from 'vue'
import { createHead } from '@vueuse/head'
import App from './App.vue'
import router from './router'
import { isAnalyticsAllowed } from '@/services/cookieConsent'
import { ensureGoogleAnalytics } from '@/services/googleAnalytics'

if (isAnalyticsAllowed()) {
  ensureGoogleAnalytics(import.meta.env.VITE_GA_ID)
}

const head = createHead()
const app = createApp(App)

app.use(router)
app.use(head)
app.mount('#app')

// Ecoute des changements de route pour GA (uniquement si consentement analytics encore valide)
router.afterEach((to) => {
  const gaId = import.meta.env.VITE_GA_ID
  if (gaId && window.gtag && isAnalyticsAllowed()) {
    window.gtag('config', gaId, { page_path: to.fullPath })
  }
})

// Écouter les changements de thème pour mettre à jour les favicons
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

function updateFavicon(e) {
  const isDark = e.matches
  const favicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')

  favicons.forEach((favicon) => {
    let href = favicon.getAttribute('href')
    if (!href) return

    if (isDark) {
      href = href
        .replace('/favicon.svg', '/favicon-dark.svg')
        .replace('/favicon.ico', '/favicon-dark.ico')
        .replace('/favicon-96x96.png', '/favicon-96x96-dark.png')
    } else {
      href = href
        .replace('/favicon-96x96-dark.png', '/favicon-96x96.png')
        .replace('/favicon-dark.svg', '/favicon.svg')
        .replace('/favicon-dark.ico', '/favicon.ico')
    }
    favicon.setAttribute('href', href)
  })
}

updateFavicon(mediaQuery)
mediaQuery.addEventListener('change', updateFavicon)
